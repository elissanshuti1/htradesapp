import { NextResponse } from "next/server";
import { scrapeForexFactory } from "@/lib/scrapers/forexfactory";
import { scrapeTradingView } from "@/lib/scrapers/tradingview";
import { scrapeYouTube } from "@/lib/scrapers/youtube";
import { scrapeTelegram } from "@/lib/scrapers/telegram";
import { saveSignals, getStats, expireOldSignals } from "@/lib/signals";
import { generateFallbackSignals, generateLocalSignals } from "@/lib/groq";

export const maxDuration = 60;

export async function POST() {
  try {
    console.log("[HTRADES] Starting scrape cycle...");

    const results = await Promise.allSettled([
      scrapeTelegram(),
      scrapeTradingView(),
      scrapeForexFactory(),
      scrapeYouTube(),
    ]);

    const allSignals: any[] = [];
    const errors: string[] = [];
    const sourceResults: { source: string; found: number; status: string }[] = [];

    results.forEach((r, i) => {
      const sourceNames = ["telegram", "tradingview", "forexfactory", "youtube"];
      if (r.status === "fulfilled") {
        allSignals.push(...r.value.signals);
        errors.push(...r.value.errors);
        sourceResults.push({
          source: r.value.source,
          found: r.value.signals.length,
          status: "ok",
        });
        console.log(`[HTRADES] ${sourceNames[i]}: ${r.value.signals.length} signals`);
      } else {
        errors.push(r.reason.message);
        sourceResults.push({
          source: sourceNames[i],
          found: 0,
          status: "failed",
        });
        console.error(`[HTRADES] ${sourceNames[i]} failed:`, r.reason);
      }
    });

    console.log(`[HTRADES] Total from scrapers: ${allSignals.length} signals`);

    let signalsAdded = 0;

    // Try Groq AI first
    try {
      const fallback = await generateFallbackSignals();
      if (fallback.length > 0) {
        const now = Date.now();
        allSignals.push(...fallback.map((s, i) => ({
          ...s,
          source: "ai_fallback" as const,
          sourceUrl: `ai-fallback://${now}-${i}`,
          sourceAuthor: "AI Analyst",
          rawText: `AI-generated signal for ${s.pair}`,
        })));
        signalsAdded = fallback.length;
        sourceResults.push({ source: "ai_fallback", found: fallback.length, status: "ok" });
        console.log(`[HTRADES] Groq AI generated ${fallback.length} signals`);
      }
    } catch (e) {
      console.error("[HTRADES] Groq AI failed:", e);
    }

    // If Groq returned nothing, use local generator (guaranteed to work)
    if (signalsAdded === 0) {
      console.log("[HTRADES] Groq returned 0, switching to local signal generator...");
      const local = generateLocalSignals();
      const now = Date.now();
      allSignals.push(...local.map((s, i) => ({
        ...s,
        source: "ai_fallback" as const,
        sourceUrl: `ai-fallback://${now}-${i}`,
        sourceAuthor: "AI Analyst",
        rawText: `Local analysis signal for ${s.pair}`,
      })));
      signalsAdded = local.length;
      sourceResults.push({ source: "local_ai", found: local.length, status: "ok" });
      console.log(`[HTRADES] Local generator created ${local.length} signals`);
    }

    // Remove signals older than 30 minutes
    const cleaned = await expireOldSignals();
    if (cleaned > 0) console.log(`[HTRADES] Removed ${cleaned} expired signals`);

    const saved = await saveSignals(allSignals);
    const stats = await getStats();

    console.log(`[HTRADES] Saved ${saved} new signals. Total: ${stats.total}, Active: ${stats.active}`);

    return NextResponse.json({
      sources: sourceResults,
      totalFound: allSignals.length,
      saved,
      errors,
      stats,
      fallbackUsed: true,
    });
  } catch (e) {
    console.error("[HTRADES] Scrape cycle fatal error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
