import { type NextRequest, NextResponse } from "next/server";
import { getSignals, getSignalsSince } from "@/lib/signals";

function normalizeDirection(d: string): string {
  const upper = d.toUpperCase();
  if (upper === "LONG") return "BUY";
  if (upper === "SHORT") return "SELL";
  return upper;
}

function normalizeDates(s: any): any {
  return {
    ...s,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const signals = since
      ? await getSignalsSince(since)
      : await getSignals(limit);

    const normalized = signals.map((s: any) =>
      normalizeDates({ ...s, direction: normalizeDirection(s.direction) })
    );

    return NextResponse.json({ signals: normalized, count: normalized.length });
  } catch (e) {
    return NextResponse.json({ signals: [], count: 0, error: (e as Error).message });
  }
}
