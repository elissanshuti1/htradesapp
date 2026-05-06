import * as cheerio from "cheerio";
import type { ScrapeResult } from "../types";
import { parseSignals } from "../groq";

const TELEGRAM_CHANNELS = [
  "fxprivatesignals",
  "forex_signals_gold",
  "gold_signall",
  "FreeSignalXAUUSD",
  "eurusd_forex_signals",
  "forexsignalchannel",
  "TradingViewSignals",
  "xauusd_gold_signal",
  "pipsking",
  "GoldSignals",
  "forexmasterclass",
  "fx_leader_signals",
  "PremiumForexSignals1",
  "forex_gold_signals_free",
  "usdjpy_signals",
];

export async function scrapeTelegram(): Promise<ScrapeResult> {
  const result: ScrapeResult = { source: "telegram", signals: [], errors: [] };

  const promises = TELEGRAM_CHANNELS.slice(0, 10).map(async (channel) => {
    try {
      const res = await fetch(`https://t.me/s/${channel}`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return null;

      const html = await res.text();
      const $ = cheerio.load(html);
      const messages: Array<{ text: string; date: string; url: string }> = [];

      $(".tgme_widget_message").each((_, el) => {
        const text = $(el).find(".tgme_widget_message_text").text().trim();
        const dateEl = $(el).find(".tgme_widget_message_date time");
        const date = dateEl.attr("datetime") || "";
        const link = $(el).find(".tgme_widget_message_date").attr("href") || "";

        if (text && text.length > 20) {
          messages.push({ text, date, url: link });
        }
      });

      const recentMessages = messages.slice(0, 5);
      return { channel, messages: recentMessages };
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(promises);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      for (const msg of r.value.messages) {
        const text = msg.text.replace(/<[^>]*>/g, "").replace(/[#@]/g, " ");

        const lower = text.toLowerCase();
        const hasPair = ["eurusd", "gbpusd", "usdjpy", "xauusd", "gold", "audusd", "usdcad", "usdchf", "nzdusd", "eur/usd", "gbp/usd", "usd/jpy", "xau/usd", "aud/usd", "usd/cad", "usd/chf", "nzd/usd"].some(p => lower.includes(p));

        if (!hasPair) continue;

        const parsed = await parseSignals(text, "telegram");
        for (const sig of parsed) {
          result.signals.push({
            source: "telegram",
            pair: sig.pair,
            direction: sig.direction,
            entry: sig.entry,
            stopLoss: sig.stopLoss,
            takeProfit: sig.takeProfit,
            slPips: sig.slPips,
            tpPips: sig.tpPips,
            riskReward: sig.riskReward,
            confidence: sig.confidence,
            reasoning: sig.reasoning,
            sourceUrl: msg.url,
            sourceAuthor: r.value.channel,
            rawText: text.slice(0, 500),
            createdAt: new Date(),
          });
        }
      }
    }
  }

  return result;
}
