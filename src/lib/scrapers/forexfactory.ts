import * as cheerio from "cheerio";
import type { ScrapeResult } from "../types";
import { parseSignals } from "../groq";

export async function scrapeForexFactory(): Promise<ScrapeResult> {
  const result: ScrapeResult = { source: "forexfactory", signals: [], errors: [] };

  try {
    const pages = [
      "https://www.forexfactory.com/forum/trading-systems",
      "https://www.forexfactory.com/forum/trading-systems/price-action",
      "https://www.forexfactory.com/forum/trading-systems/automated-trading",
    ];

    for (const pageUrl of pages) {
      try {
        const res = await fetch(pageUrl, {
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });
        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);

        const threads = $("tr.thread");
        for (let i = 0; i < Math.min(threads.length, 8); i++) {
          const thread = threads.eq(i);
          const title = thread.find("td.threadtitle a").text().trim();
          const author = thread.find("td.threadstarter a").text().trim() || "FF User";
          const link = thread.find("td.threadtitle a").attr("href") || "";
          const preview = thread.find("td.threadsnippet").text().trim().slice(0, 300);

          if (!title || title.length < 10) continue;

          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes("signal") || lowerTitle.includes("trade") || lowerTitle.includes("setup") || lowerTitle.includes("entry") || lowerTitle.includes("buy") || lowerTitle.includes("sell") || lowerTitle.includes("eur") || lowerTitle.includes("gold") || lowerTitle.includes("xau") || lowerTitle.includes("gbp") || lowerTitle.includes("usd")) {
            const fullText = await fetchThreadContent(link);
            const textToParse = fullText || `${title} ${preview}`;

            if (textToParse.length > 30) {
              const parsed = await parseSignals(textToParse, "forexfactory");
              for (const sig of parsed) {
                result.signals.push({
                  source: "forexfactory",
                  pair: sig.pair,
                  direction: sig.direction,
                  entry: sig.entry,
                  stopLoss: sig.stopLoss,
                  takeProfit: sig.takeProfit,
                  riskReward: calcRR(sig.entry, sig.stopLoss, sig.takeProfit),
                  slPips: sig.slPips || 0,
                  tpPips: sig.tpPips || 0,
                  confidence: sig.confidence,
                  reasoning: sig.reasoning,
                  sourceUrl: fullUrl(link),
                  sourceAuthor: author,
                  rawText: textToParse.slice(0, 500),
                  createdAt: new Date(),
                });
              }
            }
          }
        }
      } catch (e) {
        result.errors.push(`Forex Factory ${pageUrl}: ${(e as Error).message}`);
      }
    }

    const calendarRes = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.xml", {
      signal: AbortSignal.timeout(5000),
    });
    if (calendarRes.ok) {
      const xml = await calendarRes.text();
      const $cal = cheerio.load(xml, { xmlMode: true });
      $cal("event").each((_, el) => {
        const title = $cal(el).find("title").text();
        const desc = $cal(el).find("description").text();
        if (title && desc && title.length > 5) {
          const text = `${title} ${desc}`;
          result.calendarItems = result.calendarItems || [];
          result.calendarItems.push(text.slice(0, 200));
        }
      });
    }
  } catch (e) {
    result.errors.push(`Forex Factory scrape failed: ${(e as Error).message}`);
  }

  return result;
}

async function fetchThreadContent(link: string): Promise<string> {
  try {
    const url = fullUrl(link);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return "";

    const html = await res.text();
    const $ = cheerio.load(html);
    const posts = $(".postcontent, .content");
    let text = "";
    posts.each((_, el) => {
      const post = $(el).text().trim();
      if (post.length > 50) text += " " + post;
    });
    return text.trim().slice(0, 3000);
  } catch {
    return "";
  }
}

function fullUrl(link: string): string {
  if (!link) return "";
  if (link.startsWith("http")) return link;
  return `https://www.forexfactory.com${link}`;
}

function calcRR(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Math.round((reward / risk) * 10) / 10;
}
