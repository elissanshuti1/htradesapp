import { type NextRequest, NextResponse } from "next/server";
import { scrapeForexFactory } from "@/lib/scrapers/forexfactory";
import { scrapeTradingView } from "@/lib/scrapers/tradingview";
import { scrapeYouTube } from "@/lib/scrapers/youtube";
import { scrapeTelegram } from "@/lib/scrapers/telegram";
import { saveSignals, getStats } from "@/lib/signals";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SCRAPE_SECRET || "htrades-scrape-2025";

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sources = body.sources || ["telegram", "tradingview", "forexfactory", "youtube"];

  const scrapeResults: { source: string; signals: any[]; errors: string[] }[] = [];
  const errors: string[] = [];

  if (sources.includes("telegram")) {
    const r = await scrapeTelegram();
    scrapeResults.push({ source: "telegram", signals: r.signals, errors: r.errors });
    errors.push(...r.errors);
  }

  if (sources.includes("tradingview")) {
    const r = await scrapeTradingView();
    scrapeResults.push({ source: "tradingview", signals: r.signals, errors: r.errors });
    errors.push(...r.errors);
  }

  if (sources.includes("forexfactory")) {
    const r = await scrapeForexFactory();
    scrapeResults.push({ source: "forexfactory", signals: r.signals, errors: r.errors });
    errors.push(...r.errors);
  }

  if (sources.includes("youtube")) {
    const r = await scrapeYouTube();
    scrapeResults.push({ source: "youtube", signals: r.signals, errors: r.errors });
    errors.push(...r.errors);
  }

  const allSignals = scrapeResults.flatMap(r => r.signals);
  const saved = await saveSignals(allSignals);
  const stats = await getStats();

  const sourceSummary = scrapeResults.map(r => ({
    source: r.source,
    found: r.signals.length,
    errors: r.errors,
  }));

  return NextResponse.json({
    sources: sourceSummary,
    totalSignals: allSignals.length,
    saved,
    errors,
    stats,
  });
}

export async function GET() {
  const stats = await getStats();
  return NextResponse.json({ stats });
}
