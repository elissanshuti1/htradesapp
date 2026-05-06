import { type NextRequest, NextResponse } from "next/server";
import { getAllSetups } from "@/lib/signals";

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
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "200");
    const setups = await getAllSetups(limit);
    const normalized = setups.map((s: any) =>
      normalizeDates({ ...s, direction: normalizeDirection(s.direction) })
    );

    return NextResponse.json({ setups: normalized, count: normalized.length });
  } catch (e) {
    return NextResponse.json({ setups: [], count: 0, error: (e as Error).message });
  }
}
