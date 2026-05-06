import { type NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const PRICE_RANGES: Record<string, { low: number; high: number; dec: number }> = {
  "XAU/USD": { low: 4650, high: 4750, dec: 1 },
  "EUR/USD": { low: 1.17, high: 1.18, dec: 4 },
  "GBP/USD": { low: 1.35, high: 1.37, dec: 4 },
  "USD/JPY": { low: 155, high: 157, dec: 2 },
  "AUD/USD": { low: 0.72, high: 0.73, dec: 4 },
  "USD/CAD": { low: 1.35, high: 1.36, dec: 4 },
  "USD/CHF": { low: 0.77, high: 0.78, dec: 4 },
  "NZD/USD": { low: 0.59, high: 0.60, dec: 4 },
};

function generateFallbackAnalysis(pair: string) {
  const range = PRICE_RANGES[pair] || PRICE_RANGES["XAU/USD"];
  const mid = (range.low + range.high) / 2;
  const span = range.high - range.low;
  const isJPY = pair.includes("JPY");
  const isGold = pair === "XAU/USD";
  const dec = range.dec;

  const support1 = (mid - span * 0.15).toFixed(dec);
  const support2 = (mid - span * 0.3).toFixed(dec);
  const resist1 = (mid + span * 0.15).toFixed(dec);
  const resist2 = (mid + span * 0.3).toFixed(dec);
  const fvgLow = (mid - span * 0.05).toFixed(dec);
  const fvgHigh = (mid + span * 0.02).toFixed(dec);
  const obPrice = (mid - span * 0.2).toFixed(dec);
  const obLow = (mid - span * 0.22).toFixed(dec);
  const obHigh = (mid - span * 0.18).toFixed(dec);
  const chochPrice = (mid - span * 0.08).toFixed(dec);
  const bosPrice = (mid + span * 0.06).toFixed(dec);
  const entry = mid.toFixed(dec);
  const sl = (isGold ? mid - 5 : isJPY ? mid - 0.8 : mid - span * 0.03).toFixed(dec);
  const tp = (isGold ? mid + 18 : isJPY ? mid + 2.5 : mid + span * 0.25).toFixed(dec);
  const demandLow = (mid - span * 0.12).toFixed(dec);
  const demandHigh = (mid - span * 0.02).toFixed(dec);
  const supplyLow = (mid + span * 0.08).toFixed(dec);
  const supplyHigh = (mid + span * 0.18).toFixed(dec);

  return {
    pair,
    structure: `Price swept ${support2} liquidity pool → CHoCH at ${chochPrice} → BOS confirmed at ${bosPrice}. Currently retesting the FVG ${fvgLow}-${fvgHigh} as entry zone. Bullish 4H OB at ${obLow}-${obHigh} holding strong. Demand zone at ${demandLow}-${demandHigh} vs Supply at ${supplyLow}-${supplyHigh}.`,
    bias: "BULLISH" as const,
    keyLevels: [
      { label: "4H Order Block", price: `${obLow}-${obHigh}`, type: "ob" as const },
      { label: "FVG", price: `${fvgLow}-${fvgHigh}`, type: "fvg" as const },
      { label: "Demand Zone", price: `${demandLow}-${demandHigh}`, type: "demand" as const },
      { label: "Supply Zone", price: `${supplyLow}-${supplyHigh}`, type: "supply" as const },
      { label: "CHoCH", price: chochPrice, type: "choch" as const },
      { label: "BOS", price: bosPrice, type: "bos" as const },
      { label: "Support", price: support1, type: "support" as const },
      { label: "Resistance", price: resist1, type: "resistance" as const },
    ],
    reasoning: `${pair} swept the ${support2} liquidity pool causing a CHoCH at ${chochPrice}, confirming reversal. BOS followed at ${bosPrice} breaking previous swing high. Price now retesting the FVG ${fvgLow}-${fvgHigh} which aligns with the 4H order block at ${obLow}-${obHigh}. Demand zone ${demandLow}-${demandHigh} is absorbing sell pressure. Entry at ${entry} on retest. Tight SL below ${sl}. Target ${tp} liquidity pool. R:R 1:${isGold ? "3.6" : isJPY ? "3.1" : "2.5"}.`,
    setup: { direction: "BUY" as const, entry, sl, tp, rr: isGold ? "3.6" : isJPY ? "3.1" : "2.5" },
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair") || "XAU/USD";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a professional forex technical analyst. Analyze the current market structure for ${pair}.

Use real approximate price levels for May 2026:
${Object.entries(PRICE_RANGES).map(([p, r]) => `- ${p}: ~${r.low}-${r.high} range`).join("\n")}

Return ONLY JSON in this exact format:
{
  "pair": "${pair}",
  "structure": "Short summary using BOS, CHoCH, FVG, OB, liquidity sweep",
  "bias": "BULLISH" or "BEARISH" or "NEUTRAL",
  "keyLevels": [
    {"label": "FVG", "price": "123.4-123.8", "type": "fvg"},
    {"label": "4H Order Block", "price": "120.5-121.0", "type": "ob"},
    {"label": "Demand Zone", "price": "122.0-122.5", "type": "demand"},
    {"label": "Supply Zone", "price": "125.0-125.5", "type": "supply"},
    {"label": "CHoCH", "price": "123.5", "type": "choch"},
    {"label": "BOS", "price": "124.2", "type": "bos"},
    {"label": "Support", "price": "121.0", "type": "support"},
    {"label": "Resistance", "price": "126.0", "type": "resistance"}
  ],
  "reasoning": "Detailed TA reasoning",
  "setup": {"direction": "BUY" or "SELL" or null, "entry": "price", "sl": "price", "tp": "price", "rr": "ratio"}
}

MUST include: 1 FVG (as range), 1 OB (as range), 1 Demand zone, 1 Supply zone, CHoCH level, BOS level, support, resistance. At least 8 levels. Price ranges use format "low-high".`,
        },
        {
          role: "user",
          content: `Analyze ${pair}. Give exact price levels for FVG, OB, demand/supply zones, CHoCH, BOS, support, resistance.`
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    clearTimeout(timeoutId);

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json({ analysis });
  } catch (e) {
    const fallback = generateFallbackAnalysis(pair);
    return NextResponse.json({ analysis: fallback, fallback: true });
  }
}
