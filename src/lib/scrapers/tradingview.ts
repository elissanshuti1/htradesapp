import type { ScrapeResult } from "../types";
import { parseSignals } from "../groq";

const PAIRS = [
  { tv: "EURUSD", display: "EUR/USD" },
  { tv: "GBPUSD", display: "GBP/USD" },
  { tv: "USDJPY", display: "USD/JPY" },
  { tv: "XAUUSD", display: "XAU/USD" },
  { tv: "AUDUSD", display: "AUD/USD" },
  { tv: "USDCAD", display: "USD/CAD" },
  { tv: "USDCHF", display: "USD/CHF" },
  { tv: "NZDUSD", display: "NZD/USD" },
];

export async function scrapeTradingView(): Promise<ScrapeResult> {
  const result: ScrapeResult = { source: "tradingview", signals: [], errors: [] };

  try {
    const res = await fetch("https://www.tradingview.com/api/v1/ideas/?symbol=&lang=en&limit=30", {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.tradingview.com/",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const items = data.results || data.items || [];

      for (const item of items.slice(0, 20)) {
        const title = item.title || "";
        const desc = item.description || item.text || "";
        const symbol = item.symbol || item.pair || "";
        const text = `${title} ${desc} ${symbol}`;

        if (text.length < 40) continue;

        const parsed = await parseSignals(text, "tradingview");
        for (const sig of parsed) {
          result.signals.push(buildSignal("tradingview", sig, {
            url: item.url || `https://www.tradingview.com/symbols/${symbol}/`,
            author: item.user?.username || item.user?.first_name || item.author || "TradingView",
            text,
          }));
        }
      }
    }
  } catch (e) {
    result.errors.push(`TradingView API: ${(e as Error).message}`);
  }

  for (const pair of PAIRS.slice(0, 3)) {
    try {
      const res = await fetch(`https://www.tradingview.com/symbols/${pair.tv}/ideas/`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });

      if (res.ok) {
        const html = await res.text();
        const ideas = parseIdeasFromHTML(html, pair.display);

        for (const idea of ideas.slice(0, 3)) {
          const parsed = await parseSignals(idea.text, "tradingview");
          for (const sig of parsed) {
            result.signals.push(buildSignal("tradingview", sig, idea));
          }
        }
      }
    } catch (e) {
      result.errors.push(`TradingView ${pair.display}: ${(e as Error).message}`);
    }
  }

  return result;
}

function parseIdeasFromHTML(html: string, pair: string): Array<{ text: string; url: string; author: string }> {
  const ideas: Array<{ text: string; url: string; author: string }> = [];
  const titleMatches = [...html.matchAll(/"title"\s*:\s*"([^"]{10,})"/g)];
  const descMatches = [...html.matchAll(/"description"\s*:\s*"([^"]{10,})"/g)];
  const idMatches = [...html.matchAll(/"id"\s*:\s*(\d+)/g)];
  const userMatches = [...html.matchAll(/"username"\s*:\s*"([^"]+)"/g)];

  const count = Math.min(titleMatches.length, 8);
  for (let i = 0; i < count; i++) {
    const title = titleMatches[i][1].replace(/\\u003c[^>]*>/g, "").replace(/\\u2019/g, "'");
    const desc = descMatches[i]?.[1]?.replace(/\\u003c[^>]*>/g, "").replace(/\\u2019/g, "'") || "";
    const id = idMatches[i]?.[1];
    const author = userMatches[i]?.[1] || "TradingView User";
    const text = `${title} ${desc}`;

    if (text.length > 50) {
      ideas.push({
        text,
        url: id ? `https://www.tradingview.com/chart/${pair.replace("/", "")}/${id}/` : "",
        author,
      });
    }
  }

  return ideas;
}

function buildSignal(source: string, sig: any, meta: { url: string; author: string; text: string }) {
  const rr = calcRR(sig.entry, sig.stopLoss, sig.takeProfit, sig.direction);
  return {
    source: "tradingview" as const,
    pair: sig.pair,
    direction: sig.direction,
    entry: sig.entry,
    stopLoss: sig.stopLoss,
    takeProfit: sig.takeProfit,
    slPips: sig.slPips || 0,
    tpPips: sig.tpPips || 0,
    riskReward: rr,
    confidence: sig.confidence,
    reasoning: sig.reasoning,
    sourceUrl: meta.url,
    sourceAuthor: meta.author,
    rawText: meta.text.slice(0, 500),
    createdAt: new Date(),
  };
}

function calcRR(entry: number, sl: number, tp: number, direction: string): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Math.round((reward / risk) * 10) / 10;
}
