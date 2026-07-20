import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Stock } from "@/db/models";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { fetchLiveStockQuote, recordPriceSnapshot, getChartData } from "@/lib/finnhub";
import { backfillHistoricalCandlesIfNeeded } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    await seedDatabaseIfNeeded();
    await connectDB();
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol.toUpperCase();
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "1D").toUpperCase() as "1D" | "1W" | "1M" | "1Y" | "ALL";

    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return NextResponse.json({ error: "Stock symbol not found" }, { status: 404 });
    }

    // Real multi-year daily history, backfilled from Yahoo Finance and refreshed
    // roughly daily. No-op if we already have fresh history for this symbol.
    await backfillHistoricalCandlesIfNeeded(symbol);

    // Opportunistically record a fresh real quote so the 1D intraday chart keeps growing
    const liveQuote = await fetchLiveStockQuote(symbol);
    if (liveQuote) {
      await recordPriceSnapshot(symbol, liveQuote);
    }

    // Real data only — daily history from Yahoo for 1W/1M/1Y/ALL, real intraday
    // Yahoo bars (plus a live Finnhub tail) for 1D. Never fabricated.
    const candles = await getChartData(symbol, period);

    return NextResponse.json({
      success: true,
      symbol,
      period,
      data: candles,
      isRealData: true,
    });
  } catch (err: unknown) {
    console.error("Fetch chart error:", err);
    return NextResponse.json({ error: "Failed to fetch chart history" }, { status: 500 });
  }
}
