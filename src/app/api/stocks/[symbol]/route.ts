import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Stock, Watchlist, Portfolio } from "@/db/models";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { fetchLiveStockQuote, recordPriceSnapshot } from "@/lib/finnhub";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeStock, fmt2, fmt4 } from "@/lib/serialize";

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

    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return NextResponse.json({ error: "Stock symbol not found" }, { status: 404 });
    }

    const liveQuote = await fetchLiveStockQuote(stock.symbol);
    if (liveQuote) {
      recordPriceSnapshot(stock.symbol, liveQuote); // fire-and-forget
    }

    // Check user watchlist & holding if logged in
    const user = await getAuthenticatedUser();
    let isWatchlisted = false;
    let userHolding = null;

    if (user) {
      const watchItem = await Watchlist.findOne({ userId: user.id, stockSymbol: symbol });
      isWatchlisted = !!watchItem;

      const holding = await Portfolio.findOne({ userId: user.id, stockSymbol: symbol });
      if (holding) {
        userHolding = {
          shares: fmt4(holding.shares),
          averageBuyPrice: fmt2(holding.averageBuyPrice),
          totalInvested: fmt2(holding.totalInvested),
        };
      }
    }

    const currentPriceNum = liveQuote ? liveQuote.currentPrice : stock.currentPrice;
    const prevCloseNum = liveQuote ? liveQuote.previousClose : stock.previousClose;
    const changePctNum = liveQuote ? liveQuote.changePercent : stock.changePercent;

    return NextResponse.json({
      success: true,
      stock: {
        ...serializeStock(stock),
        currentPrice: currentPriceNum.toFixed(2),
        previousClose: prevCloseNum.toFixed(2),
        high24h: liveQuote ? liveQuote.high24h.toFixed(2) : fmt2(stock.high24h),
        low24h: liveQuote ? liveQuote.low24h.toFixed(2) : fmt2(stock.low24h),
        changePercent: changePctNum.toFixed(2),
        isRealTime: !!liveQuote,
      },
      isWatchlisted,
      userHolding,
    });
  } catch (err: unknown) {
    console.error("Fetch single stock error:", err);
    return NextResponse.json({ error: "Failed to fetch stock detail" }, { status: 500 });
  }
}
