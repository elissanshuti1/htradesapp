import { NextResponse } from "next/server";
import { checkAndUpdateExpiredSignals } from "@/lib/signals";
import clientPromise from "@/lib/db";

const PAIR_API_MAP: Record<string, string> = {
  "XAU/USD": "XAUUSD",
  "EUR/USD": "EURUSD",
  "GBP/USD": "GBPUSD",
  "USD/JPY": "USDJPY",
  "AUD/USD": "AUDUSD",
  "USD/CAD": "USDCAD",
  "USD/CHF": "USDCHF",
  "NZD/USD": "NZDUSD",
};

export async function GET() {
  const prices: Record<string, number> = {};

  for (const [pair, symbol] of Object.entries(PAIR_API_MAP)) {
    try {
      const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=demo`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const price = parseFloat(data.price);
        if (!isNaN(price)) prices[pair] = price;
      }
    } catch {
      continue;
    }
  }

  let updated = 0;
  try {
    const result = await checkAndUpdateExpiredSignals(prices);
    updated = result.updated;
  } catch (e) {
    console.error("[HTRADES] check-prices: checkAndUpdateExpiredSignals failed:", e);
  }

  return NextResponse.json({ prices, checked: updated });
}
