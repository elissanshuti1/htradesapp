import { type NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const MODEL = "qwen/qwen3.6-27b";

const SHARED_RULES = `You are an elite institutional trading analyst. A user has uploaded a screenshot of a live trading chart (from TradingView or similar).

TASK
Study the chart image carefully and produce a complete, disciplined trade plan.

RULES
- Read the instrument (pair/symbol), timeframe, and the PRICE AXIS numbers from the image. Base every price level on what is actually visible.
- If the price axis is unreadable, estimate levels from the visible candle structure and clearly state in "summary" that levels are approximate.
- Do NOT invent prices wildly. Keep numbers consistent with the chart scale on screen.
- direction must be "BUY" or "SELL".
- sniperEntry: the ultra-precise limit price where a sniper would place the entry (a tight zone). 
- entry: the practical activation price used to calculate the trade.
- stopLoss: place just beyond the invalidation point so risk stays tight.
- takeProfit: place at the next meaningful target (liquidity pool, key level, or measured move).
- riskReward MUST equal Math.round(Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss) * 10) / 10.
- confidence: 0-100. Only give 75+ for a truly clean sniper setup. If there is no clean setup, prefer a "WAIT"-style low-confidence entry (confidence under 50) and explain why.
- reasoning: 3-6 short bullet steps that follow {METHODOLOGY} logic.
- keyLevels: 3-8 key levels with label, price, and type.
- Type values for keyLevels: "liquidity", "orderblock", "fvg", "breaker", "support", "resistance", "supply", "demand", "ote", "premium", "discount", "bpr", "level".

OUTPUT FORMAT (JSON only):
{
  "instrument": "XAU/USD",
  "timeframe": "H1",
  "direction": "BUY",
  "sniperEntry": 2342.5,
  "entry": 2344.0,
  "stopLoss": 2338.0,
  "takeProfit": 2368.0,
  "riskReward": 4.0,
  "confidence": 82,
  "invalidation": "Close below 2338.0 invalidates the setup.",
  "summary": "Two sentence plain-English summary.",
  "reasoning": ["...", "...", "..."],
  "keyLevels": [{"label": "Sell-side liquidity", "price": "2335.0", "type": "liquidity"}]
}`;

const SMC_RULES = `Apply SMART MONEY CONCEPTS (SMC) analysis strictly. Use this vocabulary and logic:
- Market structure: Identify the current trend, Break of Structure (BOS) and Change of Character (CHoCH / market structure shift).
- Order Blocks (OB): the last opposing candle before a strong move; mark the exact zone.
- Fair Value Gaps (FVG) / Imbalances: the 3-candle gap left by displacement.
- Liquidity: mark the obvious buyside (above highs) and sellside (below lows) liquidity pools. Note any recent liquidity sweep / stop hunt.
- Displacement & induction: strong directional candles that confirm intent.
- Supply & demand zones at the edges of consolidation.
- Premium / discount relative to the visible range midpoint.
- Manipulation → accumulation → distribution narrative: describe where smart money likely accumulated and where they distribute.
- The entry should sit at a valid OB / FVG / demand retest in discount (for buys) or premium (for sells), after a sweep of opposing liquidity.`;

const ICT_RULES = `Apply INNER CIRCLE TRADER (ICT) concepts strictly. Use this vocabulary and logic:
- Liquidity: identify buy-side liquidity above highs and sell-side liquidity below lows; look for turtle soup / liquidity raids.
- PD Array (in order of precedence): Order Blocks, Fair Value Gaps (1.5x body gap), Breaker Blocks, Mitigation Blocks, Optimal Trade Entry (OTE 62%-79% fib), Balanced Price Range (BPR).
- Market structure shift (MSS) / CHoCH to confirm the reversal before entry.
- Kill zones: mention which session applies if visible (Asia, London, New York) from the chart clock.
- Power of Three: accumulation → manipulation → distribution narrative if structure supports it.
- Premium / discount: price in discount favors buys, premium favors sells.
- Judas swing: the fake move that takes liquidity before the real move.
- Entry should be at the first PD array of the new direction after the MSS, in discount (buys) or premium (sells).`;

const INSTRUMENT_CONFIGS: Record<
  string,
  { pip: number; usdPerPipPerLot: number; usdPerPriceUnitPerLot: number; label: string; contract: string }
> = {
  "XAU/USD": { pip: 0.01, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 100, label: "Gold", contract: "100 oz per lot" },
  "EUR/USD": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "EUR/USD", contract: "100,000 units per lot" },
  "GBP/USD": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "GBP/USD", contract: "100,000 units per lot" },
  "USD/JPY": { pip: 0.01, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "USD/JPY", contract: "100,000 units per lot (approx $10/pip)" },
  "AUD/USD": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "AUD/USD", contract: "100,000 units per lot" },
  "USD/CAD": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "USD/CAD", contract: "100,000 units per lot (approx)" },
  "USD/CHF": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "USD/CHF", contract: "100,000 units per lot (approx)" },
  "NZD/USD": { pip: 0.0001, usdPerPipPerLot: 10, usdPerPriceUnitPerLot: 0, label: "NZD/USD", contract: "100,000 units per lot" },
};

function normalizeInstrument(raw: string): string {
  const upper = (raw || "").toUpperCase().replace(/[\s/\\-]/g, "");
  const map: Record<string, string> = {
    XAUUSD: "XAU/USD", GOLD: "XAU/USD", GC: "XAU/USD", XAU: "XAU/USD",
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY",
    AUDUSD: "AUD/USD",
    USDCAD: "USD/CAD",
    USDCHF: "USD/CHF",
    NZDUSD: "NZD/USD",
  };
  return map[upper] || upper || "XAU/USD";
}

function extractJson(raw: string): any {
  let text = raw || "";
  const thinkMatch = text.match(/<\/think>\s*([\s\S]*)$/i);
  if (thinkMatch) text = thinkMatch[1];
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(text.slice(first, last + 1));
}

interface PositionSize {
  supported: boolean;
  instrument: string;
  lots: number;
  riskAmount: number;
  riskPercent: number;
  actualLoss: number;
  actualPercent: number;
  pipLabel: string;
  note: string;
}

function computePositionSize(
  rawInstrument: string,
  entry: number,
  stopLoss: number,
  balance: number,
  riskPercent: number
): PositionSize {
  const instrument = normalizeInstrument(rawInstrument);
  const riskAmount = (balance * riskPercent) / 100;
  const stopDistance = Math.abs(entry - stopLoss);
  const config = INSTRUMENT_CONFIGS[instrument];

  if (!config || !stopDistance || !balance || balance <= 0) {
    return {
      supported: false,
      instrument,
      lots: 0,
      riskAmount,
      riskPercent,
      actualLoss: 0,
      actualPercent: 0,
      pipLabel: `${stopDistance.toFixed(4)} price units`,
      note: "Manual sizing: do not risk more than the budget below. Enter a smaller lot size than the worst case.",
    };
  }

  const stopInPips = stopDistance / config.pip;
  const riskPerLot = config.usdPerPriceUnitPerLot
    ? stopDistance * config.usdPerPriceUnitPerLot
    : stopInPips * config.usdPerPipPerLot;

  let lots = riskPerLot > 0 ? riskAmount / riskPerLot : 0;
  lots = Math.max(0.01, Math.floor(lots * 100) / 100);

  const actualLoss = lots * riskPerLot;
  const actualPercent = (actualLoss / balance) * 100;

  return {
    supported: true,
    instrument,
    lots,
    riskAmount,
    riskPercent,
    actualLoss,
    actualPercent,
    pipLabel: config.usdPerPriceUnitPerLot ? `${stopDistance.toFixed(2)} price units` : `${stopInPips.toFixed(1)} pips`,
    note: config.usdPerPriceUnitPerLot
      ? `${config.contract}. A $1 move = $${config.usdPerPriceUnitPerLot} per standard lot.`
      : `${config.contract}. 1 pip ≈ $${config.usdPerPipPerLot} per standard lot.`,
  };
}

function buildDemoAnalysis(methodology: string, balance: number, riskPercent: number, riskCapApplied = false) {
  const instrument = "XAU/USD";
  const isSMC = methodology === "smc";
  const entry = 2342.5;
  const stopLoss = 2338.0;
  const takeProfit = 2368.0;
  const positionSize = computePositionSize(instrument, entry, stopLoss, balance, riskPercent);
  return {
    instrument,
    timeframe: "H1",
    methodology,
    riskCapApplied,
    direction: "BUY",
    sniperEntry: 2342.5,
    entry,
    stopLoss,
    takeProfit,
    riskReward: 4.0,
    confidence: 82,
    invalidation: "Close below 2338.0 invalidates the setup.",
    summary: "DEMO ANALYSIS — live AI was unreachable. Gold swept sell-side liquidity at 2338 then displaced higher, leaving an FVG at 2341-2343 that aligns with a fresh order block.",
    reasoning: isSMC
      ? [
          "Price took out sell-side liquidity at 2338 (stop hunt) and closed back inside the range.",
          "Strong displacement candle confirmed a CHoCH / market structure shift to the upside.",
          "Retest of the 2341-2343 FVG sits in discount relative to the visible range midpoint.",
          "Sniper entry at 2342.5 with stop just below the sweep at 2338 keeps risk tight.",
          "Take profit targets the buy-side liquidity pool at 2368.",
        ]
      : [
          "Sell-side liquidity below 2338 was raided (Judas swing) before price reversed.",
          "MSS confirmed on the H1 with displacement back through the range midpoint.",
          "Price is now at the first PD array (FVG 2341-2343) in discount for the new direction.",
          "Sniper entry at 2342.5, OTE/OB confluence keeps the stop tight at 2338.",
          "Take profit at the buy-side liquidity pool near 2368.",
        ],
    keyLevels: [
      { label: "Sell-side liquidity", price: "2338.0", type: "liquidity" },
      { label: "Bullish FVG", price: "2341.0-2343.0", type: "fvg" },
      { label: "Order block", price: "2340.0-2342.0", type: "orderblock" },
      { label: "Buy-side liquidity", price: "2368.0", type: "liquidity" },
      { label: "Discount / range mid", price: "2345.0", type: "discount" },
    ],
    positionSize,
    demo: true,
  };
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, methodology, accountBalance, riskPercent } = body || {};
  const method = methodology === "ict" ? "ict" : "smc";

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "A chart image is required. Upload a TradingView screenshot." }, { status: 400 });
  }

  if (image.length > 30_000_000) {
    return NextResponse.json({ error: "Image is too large. Please upload a smaller screenshot." }, { status: 413 });
  }

  const balance = Math.max(0, Number(accountBalance) || 0);
  const cappedRisk = Math.min(20, Math.max(0, Number(riskPercent) || 2));
  const wasCapped = Number(riskPercent) > 20;

  const methodologyRules = method === "smc" ? SMC_RULES : ICT_RULES;
  const systemPrompt = SHARED_RULES.replace("{METHODOLOGY}", method === "smc" ? "Smart Money Concepts" : "ICT") + "\n\n" + methodologyRules;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await groq.chat.completions.create(
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this trading chart using ${method === "smc" ? "Smart Money Concepts (SMC)" : "Inner Circle Trader (ICT)"} methodology.\n\n${systemPrompt}\n\nIMPORTANT: Output ONLY the JSON object. No markdown, no code fences, no commentary before or after.`,
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1600,
        reasoning_effort: "none",
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const raw = response.choices[0]?.message?.content?.trim() || "{}";
    let parsed: any = {};
    try {
      parsed = extractJson(raw);
    } catch {
      parsed = {};
    }

    const entry = Number(parsed.entry);
    const stopLoss = Number(parsed.stopLoss);
    const takeProfit = Number(parsed.takeProfit);

    if (!parsed.direction || !entry || !stopLoss || !takeProfit) {
      return NextResponse.json(
        { error: "The AI could not read a clean setup from this chart. Try a clearer screenshot with visible price levels." },
        { status: 422 }
      );
    }

    const riskDistance = Math.abs(entry - stopLoss);
    const rewardDistance = Math.abs(takeProfit - entry);
    const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 0;

    const reasoning = Array.isArray(parsed.reasoning)
      ? parsed.reasoning.map((r: any) => String(r))
      : String(parsed.reasoning || "").split("\n").filter(Boolean);

    const keyLevels = Array.isArray(parsed.keyLevels)
      ? parsed.keyLevels.slice(0, 8).map((l: any) => ({
          label: String(l.label || l.type || "Level"),
          price: String(l.price || "—"),
          type: String(l.type || "level"),
        }))
      : [];

    const analysis = {
      instrument: normalizeInstrument(parsed.instrument),
      timeframe: String(parsed.timeframe || "H1"),
      direction: String(parsed.direction).toUpperCase().includes("SELL") ? ("SELL" as const) : ("BUY" as const),
      sniperEntry: Number(parsed.sniperEntry) || entry,
      entry,
      stopLoss,
      takeProfit,
      riskReward: Number(parsed.riskReward) || rr || 0,
      confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 50))),
      invalidation: String(parsed.invalidation || ""),
      summary: String(parsed.summary || ""),
      reasoning,
      keyLevels,
      positionSize: computePositionSize(parsed.instrument, entry, stopLoss, balance, cappedRisk),
      riskCapApplied: wasCapped,
      methodology: method,
    };

    return NextResponse.json({ analysis });
  } catch (e: any) {
    clearTimeout(timeout);
    console.error("[analyze-chart] Groq error:", e?.message || e);
    return NextResponse.json(
      {
        error: e?.status === 413 ? "Image too large for the model." : "Analysis service unavailable. Please try again.",
        analysis: buildDemoAnalysis(method, balance, cappedRisk, wasCapped),
      },
      { status: 200 }
    );
  }
}
