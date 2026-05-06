import type { ScrapeResult } from "../types";
import { parseSignals } from "../groq";

const PAIRS_SEARCH = [
  "forex trading signal EUR USD entry stop loss",
  "gold XAUUSD signal today entry take profit",
  "GBP USD forex signal buy sell setup",
  "USD JPY trading signal today levels",
];

export async function scrapeYouTube(): Promise<ScrapeResult> {
  const result: ScrapeResult = { source: "youtube", signals: [], errors: [] };

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    for (const query of PAIRS_SEARCH.slice(0, 3)) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}&order=date`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;

        const data = await res.json();
        const items = data.items || [];

        for (const item of items) {
          const snippet = item.snippet || {};
          const title = snippet.title || "";
          const desc = snippet.description || "";
          const channel = snippet.channelTitle || "YouTube";
          const videoId = item.id?.videoId || "";

          if (!videoId || title.length < 10) continue;

          const text = `${title} ${desc}`;
          if (text.length < 30) continue;

          const parsed = await parseSignals(text, "youtube");
          for (const sig of parsed) {
            result.signals.push({
              source: "youtube",
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
              sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
              sourceAuthor: channel,
              rawText: text.slice(0, 500),
              createdAt: new Date(),
            });
          }
        }
      } catch (e) {
        result.errors.push(`YouTube API ${query}: ${(e as Error).message}`);
      }
    }
  }

  try {
    const query = "forex signal entry stop loss take profit";
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const ytInitialData = html.match(/var ytInitialData\s*=\s*({.+?});/);

      if (ytInitialData) {
        const data = JSON.parse(ytInitialData[1]);
        const videos = extractVideos(data);

        for (const video of videos.slice(0, 5)) {
          const text = `${video.title} ${video.description}`;
          if (text.length < 40) continue;

          const parsed = await parseSignals(text, "youtube");
          for (const sig of parsed) {
            result.signals.push({
              source: "youtube",
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
              sourceUrl: video.url,
              sourceAuthor: video.channel,
              rawText: text.slice(0, 500),
              createdAt: new Date(),
            });
          }
        }
      }
    }
  } catch (e) {
    result.errors.push(`YouTube scrape: ${(e as Error).message}`);
  }

  return result;
}

function extractVideos(data: any): Array<{ title: string; description: string; url: string; channel: string }> {
  const videos: Array<{ title: string; description: string; url: string; channel: string }> = [];

  function walk(obj: any) {
    if (!obj || typeof obj !== "object") return;

    if (obj.videoId) {
      const title = typeof obj.title === "string" ? obj.title : obj.title?.simpleText || "";
      const channel = obj.longBylineText?.runs?.[0]?.text || obj.shortBylineText?.runs?.[0]?.text || obj.channelName || "YouTube";
      const desc = obj.descriptionSnippet?.runs?.map((r: any) => r.text).join("") || obj.description?.simpleText || "";

      if (title && title.length > 10) {
        videos.push({ title, description: desc, url: `https://www.youtube.com/watch?v=${obj.videoId}`, channel });
      }
    }

    for (const key of Object.keys(obj)) {
      walk(obj[key]);
    }
  }

  walk(data);

  const seen = new Set<string>();
  return videos.filter(v => {
    if (seen.has(v.url)) return false;
    seen.add(v.url);
    return true;
  });
}

function calcRR(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Math.round((reward / risk) * 10) / 10;
}
