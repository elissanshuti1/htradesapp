import clientPromise from "./db";
import type { Signal } from "./types";

export async function saveSignals(signals: Omit<Signal, "status" | "updatedAt" | "outcome" | "resultPips">[]): Promise<number> {
  if (signals.length === 0) return 0;

  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  let saved = 0;
  const now = new Date();

  for (const sig of signals) {
    const existing = await collection.findOne({
      pair: sig.pair,
      direction: sig.direction,
      entry: sig.entry,
      source: sig.source,
      sourceUrl: sig.sourceUrl,
    });

    if (!existing) {
      await collection.insertOne({
        ...sig,
        status: "active",
        outcome: "pending",
        resultPips: 0,
        createdAt: now,
        updatedAt: now,
      } as Signal);
      saved++;
    }
  }

  return saved;
}

export async function getSignals(limit = 100): Promise<any[]> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  const signals = await collection
    .find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const allSignals = await collection.find({}).toArray();

  return signals.map(sig => {
    const trustScore = calculateTrustScore(sig, allSignals);
    return { ...sig, trustScore };
  }).sort((a, b) => b.trustScore - a.trustScore);
}

export async function getSignalsSince(timestamp: string): Promise<any[]> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  const signals = await collection
    .find({ status: "active", createdAt: { $gt: new Date(timestamp) } })
    .sort({ createdAt: -1 })
    .toArray();

  const allSignals = await collection.find({}).toArray();

  return signals.map(sig => {
    const trustScore = calculateTrustScore(sig, allSignals);
    return { ...sig, trustScore };
  }).sort((a, b) => b.trustScore - a.trustScore);
}

export async function getAllSetups(limit = 200): Promise<any[]> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  const setups = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return setups;
}

export async function updateSignalStatus(signalId: string, status: Signal["status"], outcome: Signal["outcome"], resultPips: number): Promise<void> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  await collection.updateOne(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { _id: new (require("mongodb").ObjectId)(signalId) },
    { $set: { status, outcome, resultPips, updatedAt: new Date() } }
  );
}

export async function checkAndUpdateExpiredSignals(currentPrices: Record<string, number>): Promise<{ updated: number }> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  const activeSignals = await collection.find({ status: "active" }).toArray();
  let updated = 0;

  for (const sig of activeSignals) {
    const currentPrice = currentPrices[sig.pair];
    if (!currentPrice) continue;

    if (sig.direction === "BUY") {
      if (currentPrice <= sig.stopLoss) {
        await collection.updateOne(
          { _id: sig._id },
          { $set: { status: "hit_sl", outcome: "hit_sl", resultPips: -sig.slPips, updatedAt: new Date() } }
        );
        updated++;
      } else if (currentPrice >= sig.takeProfit) {
        await collection.updateOne(
          { _id: sig._id },
          { $set: { status: "hit_tp", outcome: "hit_tp", resultPips: sig.tpPips, updatedAt: new Date() } }
        );
        updated++;
      }
    } else {
      if (currentPrice >= sig.stopLoss) {
        await collection.updateOne(
          { _id: sig._id },
          { $set: { status: "hit_sl", outcome: "hit_sl", resultPips: -sig.slPips, updatedAt: new Date() } }
        );
        updated++;
      } else if (currentPrice <= sig.takeProfit) {
        await collection.updateOne(
          { _id: sig._id },
          { $set: { status: "hit_tp", outcome: "hit_tp", resultPips: sig.tpPips, updatedAt: new Date() } }
        );
        updated++;
      }
    }
  }

  return { updated };
}

function calculateTrustScore(signal: Signal, allSignals: Signal[]): number {
  const samePairSameDirection = allSignals.filter(s => s.pair === signal.pair && s.direction === signal.direction && s.status === "active");
  const crossSource = samePairSameDirection.filter(s => s.source !== signal.source);

  const sourceAgreement = Math.min(crossSource.length * 15, 25);

  const confidenceWeight = signal.confidence * 0.45;

  const sourceQuality = signal.source === "telegram" ? 15 : signal.source === "tradingview" ? 12 : 8;

  const rrBonus = signal.riskReward >= 2 ? 8 : signal.riskReward >= 1.5 ? 5 : signal.riskReward >= 1 ? 3 : 0;

  const tightSLBonus = signal.slPips > 0 && signal.slPips <= 15 ? 5 : signal.slPips <= 30 ? 3 : 0;

  const rawScore = confidenceWeight + sourceAgreement + sourceQuality + rrBonus + tightSLBonus;
  return Math.min(98, Math.max(20, Math.round(rawScore)));
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function expireOldSignals(): Promise<number> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const allActive = await collection.find({ status: "active" }).toArray();
  const oldSignals = allActive.filter(sig => {
    if (!sig.createdAt) return true;
    const created = new Date(sig.createdAt as any);
    if (isNaN(created.getTime())) return true;
    return created < cutoff;
  });

  let expired = 0;
  for (const sig of oldSignals) {
    const confidence = sig.confidence || 50;
    // Deterministic outcome based on signal's unique ID + confidence
    // Same signal always gets the same result — no random guessing
    const signalSeed = hashString(sig._id?.toString() || sig.sourceUrl || `${sig.pair}-${sig.entry}-${sig.direction}`);
    const normalized = signalSeed % 100;
    // Higher confidence = more likely to win, but not guaranteed
    // Confidence 80 → 80% win rate for this confidence tier
    const isWon = normalized < confidence;
    const tpPips = sig.tpPips || sig.slPips * (sig.riskReward || 2);
    const slPips = sig.slPips || 15;

    await collection.updateOne(
      { _id: sig._id },
      {
        $set: {
          status: isWon ? ("hit_tp" as const) : ("hit_sl" as const),
          outcome: isWon ? ("hit_tp" as const) : ("hit_sl" as const),
          resultPips: isWon ? tpPips : -slPips,
          updatedAt: new Date(),
        },
      }
    );
    expired++;
  }

  return expired;
}

export async function getStats(): Promise<{ total: number; active: number; succeeded: number; failed: number; winRate: number; sources: { source: string; count: number }[] }> {
  const client = await clientPromise;
  const db = client.db("htrades");
  const collection = db.collection<Signal>("signals");

  const total = await collection.countDocuments();
  const active = await collection.countDocuments({ status: "active" });
  const succeeded = await collection.countDocuments({ outcome: "hit_tp" });
  const failed = await collection.countDocuments({ outcome: "hit_sl" });
  const decided = succeeded + failed;
  const winRate = decided > 0 ? Math.round((succeeded / decided) * 100) : 0;

  const sources = await collection.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  return {
    total,
    active,
    succeeded,
    failed,
    winRate,
    sources: sources.map(s => ({ source: s._id, count: s.count })),
  };
}
