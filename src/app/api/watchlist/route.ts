import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Watchlist, Stock } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchLiveStockQuote, recordPriceSnapshot } from "@/lib/finnhub";
import { fmt2 } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const items = await Watchlist.find({ userId: user.id });
    const allStocks = await Stock.find();
    const stockMap = new Map<string, (typeof allStocks)[number]>();
    allStocks.forEach((s) => stockMap.set(s.symbol, s));

    const watchlistWithPrices = await Promise.all(
      items.map(async (item) => {
        const stockInfo = stockMap.get(item.stockSymbol);
        if (!stockInfo) return null;

        const liveQuote = await fetchLiveStockQuote(item.stockSymbol);
        if (liveQuote) recordPriceSnapshot(item.stockSymbol, liveQuote); // fire-and-forget

        return {
          id: item.id,
          symbol: stockInfo.symbol,
          name: stockInfo.name,
          category: stockInfo.category,
          logoUrl: stockInfo.logoUrl,
          currentPrice: liveQuote ? liveQuote.currentPrice.toFixed(2) : fmt2(stockInfo.currentPrice),
          changePercent: liveQuote ? liveQuote.changePercent.toFixed(2) : fmt2(stockInfo.changePercent),
          previousClose: liveQuote ? liveQuote.previousClose.toFixed(2) : fmt2(stockInfo.previousClose),
          high24h: liveQuote ? liveQuote.high24h.toFixed(2) : fmt2(stockInfo.high24h),
          low24h: liveQuote ? liveQuote.low24h.toFixed(2) : fmt2(stockInfo.low24h),
          addedAt: item.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      watchlist: watchlistWithPrices.filter(Boolean),
    });
  } catch (err: unknown) {
    console.error("Fetch watchlist error:", err);
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { stockSymbol } = body;

    if (!stockSymbol) {
      return NextResponse.json({ error: "Stock symbol is required" }, { status: 400 });
    }

    const symbolUpper = stockSymbol.toUpperCase();
    const existing = await Watchlist.findOne({ userId: user.id, stockSymbol: symbolUpper });

    if (existing) {
      // Remove from watchlist (toggle behavior)
      await Watchlist.deleteOne({ _id: existing._id });
      return NextResponse.json({
        success: true,
        isWatchlisted: false,
        message: `${symbolUpper} removed from watchlist`,
      });
    } else {
      // Add to watchlist
      await Watchlist.create({
        userId: user.id,
        stockSymbol: symbolUpper,
      });
      return NextResponse.json({
        success: true,
        isWatchlisted: true,
        message: `${symbolUpper} added to watchlist`,
      });
    }
  } catch (err: unknown) {
    console.error("Update watchlist error:", err);
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 500 });
  }
}
