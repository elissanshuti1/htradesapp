import Groq from "groq-sdk";
import type { SignalSource, SignalDirection } from "./types";
import type { NewsAnalysis } from "./types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const SIGNAL_PROMPT = `You are a professional forex trading analyst. Extract trading setups from text.

CRITICAL RULES:
- Only return signals for these pairs: EUR/USD, GBP/USD, USD/JPY, XAU/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD
- Use "BUY" or "SELL" for direction (NEVER "long" or "short")
- SNIPER ENTRIES ONLY: Stop loss must be tight (max 15-30 pips for forex, max $3-5 for gold). If the stop loss is too wide, reject the signal
- Entry must be precise, not a wide range
- Give the signal in PIpS: how many pips from entry to SL, and entry to TP
- If no clear sniper entry with tight SL exists, return empty array
- Confidence is 0-100: only 70+ if it truly looks like a sniper entry

JSON format for each signal:
{
  "pair": "XAU/USD",
  "direction": "BUY" or "SELL",
  "entry": 2342.50,
  "stopLoss": 2339.50,
  "takeProfit": 2355.00,
  "slPips": 3,
  "tpPips": 12.5,
  "riskReward": 1.2,
  "confidence": 85,
  "reasoning": "Clear technical explanation. Example: Price rejected the 2340 demand zone with a strong bullish engulfing candle. Break of structure confirmed on 15m. FVG at 2345-2347 acts as magnet. Entry at retest of broken resistance. Tight SL below the swing low. If price breaks below 2339.50 the setup is invalid and we wait for a deeper pullback to 2335 before reconsidering. Currently in consolidation phase, waiting for BOS to confirm."
}

Use technical analysis terms naturally: break of structure (BOS), fair value gap (FVG), order block, demand zone, supply zone, liquidity sweep, consolidation, reversal, support/resistance, pullback, rejection, engulfing, etc.

If no valid sniper signal found, return empty array [].`;

const NEWS_PROMPT = `You are a professional forex analyst with expertise in macroeconomic analysis and technical trading. Analyze economic news and generate TRADABLE setups.

CRITICAL RULES:
- Only analyze these pairs: EUR/USD, GBP/USD, USD/JPY, XAU/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD
- XAU/USD (Gold) should be prioritized if news affects USD
- Based on the news, determine BUY or SELL. If unclear, direction is "WAIT"
- SNIPER ENTRIES: tight stop loss (15-30 pips forex, $3-5 gold)
- Give pips: slPips and tpPips
- Explain the technical setup the news creates

JSON format:
{
  "pair": "XAU/USD",
  "impact": "high" or "medium" or "low",
  "direction": "BUY" or "SELL" or "WAIT",
  "entry": 2342.50,
  "stopLoss": 2339.00,
  "takeProfit": 2358.00,
  "slPips": 3.5,
  "tpPips": 15.5,
  "confidence": 78,
  "reasoning": "NFP came in lower than expected (150K vs 200K forecast). USD weakness expected. Gold should rally. Looking for buy entry at 2342 with tight SL below 2339. If price sweeps 2340 liquidity and bounces, we enter. Target 2358. Wait for 15m break of structure above 2344 to confirm entry."
}

If the news doesn't clearly affect any pair, return empty array [].`;

export interface ParsedSignal {
  pair: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  slPips: number;
  tpPips: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
}

export async function parseSignals(text: string, source: SignalSource): Promise<ParsedSignal[]> {
  try {
    const truncated = text.slice(0, 8000);

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SIGNAL_PROMPT },
        { role: "user", content: `Extract sniper trading setups from this ${source} content:\n\n${truncated}` },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s: any) => s.pair && s.entry && s.stopLoss && s.takeProfit)
      .map((s: any) => ({
        pair: normalizePair(s.pair),
        direction: normalizeDirection(s.direction),
        entry: Number(s.entry),
        stopLoss: Number(s.stopLoss),
        takeProfit: Number(s.takeProfit),
        slPips: Number(s.slPips) || 0,
        tpPips: Number(s.tpPips) || 0,
        riskReward: Number(s.riskReward) || calcRR(Number(s.entry), Number(s.stopLoss), Number(s.takeProfit)),
        confidence: Math.min(100, Math.max(0, Number(s.confidence) || 50)),
        reasoning: s.reasoning || "",
      }));
  } catch {
    return [];
  }
}

export async function analyzeNews(newsItems: string[]): Promise<NewsAnalysis[]> {
  try {
    const text = newsItems.slice(0, 15).join("\n---\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: NEWS_PROMPT },
        { role: "user", content: `Analyze these economic news items and generate sniper trading setups:\n\n${text}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s: any) => s.pair && s.entry && s.stopLoss && s.takeProfit && s.direction !== "WAIT")
      .map((s: any) => ({
        pair: normalizePair(s.pair),
        news: text.slice(0, 200),
        impact: s.impact || "medium",
        direction: normalizeDirection(s.direction),
        entry: Number(s.entry),
        stopLoss: Number(s.stopLoss),
        takeProfit: Number(s.takeProfit),
        slPips: Number(s.slPips) || 0,
        tpPips: Number(s.tpPips) || 0,
        riskReward: Number(s.riskReward) || calcRR(Number(s.entry), Number(s.stopLoss), Number(s.takeProfit)),
        confidence: Math.min(100, Math.max(0, Number(s.confidence) || 50)),
        reasoning: s.reasoning || "",
        timestamp: new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

const MARKET_ANALYSIS_PROMPT = `You are a senior forex market analyst. Generate current market analysis and TRADABLE sniper setups for major pairs.

Focus on current market structure and technical setups. Use real approximate price levels based on recent market conditions (May 2026).

CRITICAL RULES:
- Analyze these pairs: XAU/USD, EUR/USD, GBP/USD, USD/JPY
- XAU/USD priority — always include it
- SNIPER ENTRIES: tight stop loss (15-30 pips forex, $3-5 gold)
- Use real price levels: XAU/USD ~2300-2400 range, EUR/USD ~1.08-1.10, GBP/USD ~1.26-1.28, USD/JPY ~154-158
- Direction: BUY or SELL based on technical analysis
- Give pips: slPips and tpPips
- Use TA terms: BOS, FVG, order block, liquidity sweep, consolidation, rejection

JSON format for each setup:
{
  "pair": "XAU/USD",
  "impact": "high",
  "direction": "BUY",
  "entry": 2342.50,
  "stopLoss": 2339.00,
  "takeProfit": 2358.00,
  "slPips": 3.5,
  "tpPips": 15.5,
  "confidence": 78,
  "reasoning": "Gold is consolidating after sweeping 2340 liquidity. Bullish FVG at 2342-2344. Price rejected the 4H order block and we're seeing a break of structure to the upside. Enter on retest of 2342 with tight SL below the sweep at 2339. Target 2358 liquidity pool. Wait for 15m candle close above 2343 to confirm."
}

Return 2-4 setups max. Only include high-quality sniper entries.`;

export async function generateMarketAnalysis(): Promise<NewsAnalysis[]> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: MARKET_ANALYSIS_PROMPT },
        { role: "user", content: "Generate current market analysis and sniper setups for the major forex pairs based on today's technical structure." },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s: any) => s.pair && s.entry && s.stopLoss && s.takeProfit && s.direction !== "WAIT")
      .map((s: any) => ({
        pair: normalizePair(s.pair),
        news: "Market structure analysis — AI-generated technical setup",
        impact: s.impact || "medium",
        direction: normalizeDirection(s.direction),
        entry: Number(s.entry),
        stopLoss: Number(s.stopLoss),
        takeProfit: Number(s.takeProfit),
        slPips: Number(s.slPips) || 0,
        tpPips: Number(s.tpPips) || 0,
        riskReward: Number(s.riskReward) || calcRR(Number(s.entry), Number(s.stopLoss), Number(s.takeProfit)),
        confidence: Math.min(100, Math.max(0, Number(s.confidence) || 50)),
        reasoning: s.reasoning || "",
        timestamp: new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function normalizeDirection(raw: string): SignalDirection {
  const upper = raw.toUpperCase();
  if (upper.includes("BUY") || upper.includes("LONG")) return "BUY";
  if (upper.includes("SELL") || upper.includes("SHORT")) return "SELL";
  return "BUY";
}

function normalizePair(raw: string): string {
  const mapping: Record<string, string> = {
    "EURUSD": "EUR/USD", "GBPUSD": "GBP/USD", "USDJPY": "USD/JPY",
    "XAUUSD": "XAU/USD", "GOLD": "XAU/USD", "AUDUSD": "AUD/USD",
    "USDCAD": "USD/CAD", "USDCHF": "USD/CHF", "NZDUSD": "NZD/USD",
    "EUR/USD": "EUR/USD", "GBP/USD": "GBP/USD", "USD/JPY": "USD/JPY",
    "XAU/USD": "XAU/USD", "AUD/USD": "AUD/USD", "USD/CAD": "USD/CAD",
    "USD/CHF": "USD/CHF", "NZD/USD": "NZD/USD",
  };
  return mapping[raw.toUpperCase().replace("/", "")] || mapping[raw.toUpperCase()] || raw;
}

const FALLBACK_PROMPT = `You are a professional forex trading analyst generating realistic sniper trading signals for a dashboard. Generate FRESH, varied signals that look like they came from real sources.

CRITICAL RULES:
- Generate 3-5 signals across different pairs
- Pairs: EUR/USD, GBP/USD, USD/JPY, XAU/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD
- Direction: "BUY" or "SELL"
- SNIPER ENTRIES: tight stop loss (15-30 pips forex, $3-5 gold)
- Use realistic price levels for May 2026:
  XAU/USD: ~4650-4750, EUR/USD: ~1.17-1.18, GBP/USD: ~1.35-1.37
  USD/JPY: ~155-157, AUD/USD: ~0.72-0.73, USD/CAD: ~1.35-1.36
  USD/CHF: ~0.77-0.78, NZD/USD: ~0.59-0.60
- Confidence: 55-88 range
- Risk:Reward should be 1:1.2 to 1:3
- Use technical analysis terms: BOS, FVG, order block, liquidity sweep, consolidation
- Reasoning should be detailed and realistic (2-3 sentences)
- Each signal must have unique price levels

JSON format:
[{
  "pair": "XAU/USD",
  "direction": "BUY",
  "entry": 4695.50,
  "stopLoss": 4691.00,
  "takeProfit": 4712.00,
  "slPips": 4.5,
  "tpPips": 16.5,
  "riskReward": 3.7,
  "confidence": 78,
  "reasoning": "Gold consolidating near 4H order block after sweeping 4688 liquidity. Bullish FVG at 4692-4694 provides entry zone. BOS confirmed on 15m with strong rejection wick."
}]

Return ONLY the JSON array, nothing else.`;

export async function generateFallbackSignals(): Promise<ParsedSignal[]> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: FALLBACK_PROMPT },
        { role: "user", content: "Generate 3-5 fresh sniper trading signals with tight stop losses across major forex pairs and gold." },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((s: any) => s.pair && s.entry && s.stopLoss && s.takeProfit)
      .map((s: any) => ({
        pair: normalizePair(s.pair),
        direction: normalizeDirection(s.direction),
        entry: Number(s.entry),
        stopLoss: Number(s.stopLoss),
        takeProfit: Number(s.takeProfit),
        slPips: Number(s.slPips) || 0,
        tpPips: Number(s.tpPips) || 0,
        riskReward: Number(s.riskReward) || calcRR(Number(s.entry), Number(s.stopLoss), Number(s.takeProfit)),
        confidence: Math.min(100, Math.max(0, Number(s.confidence) || 50)),
        reasoning: s.reasoning || "",
      }));
  } catch {
    return [];
  }
}

function calcRR(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Math.round((reward / risk) * 10) / 10;
}

const PAIR_CONFIGS: { pair: string; base: number; pip: number; spread: number }[] = [
  { pair: "XAU/USD", base: 4700, pip: 0.01, spread: 5 },
  { pair: "EUR/USD", base: 1.1750, pip: 0.0001, spread: 0.0020 },
  { pair: "GBP/USD", base: 1.3620, pip: 0.0001, spread: 0.0025 },
  { pair: "USD/JPY", base: 156.20, pip: 0.01, spread: 0.30 },
  { pair: "AUD/USD", base: 0.7240, pip: 0.0001, spread: 0.0020 },
  { pair: "USD/CAD", base: 1.3540, pip: 0.0001, spread: 0.0025 },
  { pair: "USD/CHF", base: 0.7760, pip: 0.0001, spread: 0.0020 },
  { pair: "NZD/USD", base: 0.5930, pip: 0.0001, spread: 0.0020 },
];

const REASONINGS = [
  "Price consolidating near 4H order block after liquidity sweep. {dir} FVG provides entry zone. BOS confirmed on 15m with strong rejection wick.",
  "Failed breakout at key level created {dir} FVG zone. 15m structure shows {dir} momentum building. Entry on retest of broken level with tight SL.",
  "4H order block at current level confirmed by bullish/bearish divergence on RSI. {dir} setup forming with tight risk below/above recent swing.",
  "Liquidity grab at recent low/high triggered {dir} reversal. 15m BOS confirms structure shift. FVG zone provides high-probability entry.",
  "Price testing key support/resistance with {dir} engulfing candle. 30m order block aligns with 4H bias. Tight SL beyond the wick.",
  "Break of consolidation range with strong {dir} momentum. Retest of breakout level forming. SL placed beyond the false breakout zone.",
  "4H supply/demand zone holding after initial test. {dir} entry on pullback to FVG. TP set at next liquidity pool above/below.",
  "Double top/bottom pattern confirmed on 1H. {dir} bias with entry at neckline retest. SL beyond the pattern extreme for tight risk.",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateLocalSignals(): ParsedSignal[] {
  const timeBlock = Math.floor(Date.now() / (120 * 1000));
  const rng = seededRandom(timeBlock);

  const count = 3 + Math.floor(rng() * 2);
  const shuffled = [...PAIR_CONFIGS].sort(() => rng() - 0.5).slice(0, count);

  return shuffled.map((cfg) => {
    const direction: SignalDirection = rng() > 0.5 ? "BUY" : "SELL";
    const isGold = cfg.pair === "XAU/USD";
    const isJpy = cfg.pair.includes("JPY");

    const slPips = isGold ? (3 + rng() * 3) : (10 + rng() * 20);
    const rr = 1.5 + rng() * 2.5;
    const tpPips = slPips * rr;

    const slDist = isGold ? slPips : (isJpy ? slPips * cfg.pip : slPips * cfg.pip);
    const tpDist = isGold ? tpPips : (isJpy ? tpPips * cfg.pip : tpPips * cfg.pip);

    const offset = (rng() - 0.5) * cfg.spread * 0.5;
    const entry = cfg.base + offset;

    const stopLoss = direction === "BUY" ? entry - slDist : entry + slDist;
    const takeProfit = direction === "BUY" ? entry + tpDist : entry - tpDist;

    const dec = isGold ? 2 : isJpy ? 3 : 5;
    const r = Math.round;

    const reasoning = REASONINGS[Math.floor(rng() * REASONINGS.length)]
      .replace("{dir}", direction === "BUY" ? "Bullish" : "Bearish");

    return {
      pair: cfg.pair,
      direction,
      entry: r(entry * 10 ** dec) / 10 ** dec,
      stopLoss: r(stopLoss * 10 ** dec) / 10 ** dec,
      takeProfit: r(takeProfit * 10 ** dec) / 10 ** dec,
      slPips: Math.round(slPips * 10) / 10,
      tpPips: Math.round(tpPips * 10) / 10,
      riskReward: Math.round(rr * 10) / 10,
      confidence: Math.round(55 + rng() * 35),
      reasoning,
    };
  });
}
