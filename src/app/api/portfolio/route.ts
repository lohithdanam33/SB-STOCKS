import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Portfolio, Stock } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchLiveStockQuote, recordPriceSnapshot } from "@/lib/finnhub";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userHoldings = await Portfolio.find({ userId: user.id });
    const allStocks = await Stock.find();
    const stockMap = new Map<string, (typeof allStocks)[number]>();
    allStocks.forEach((s) => stockMap.set(s.symbol, s));

    let totalPortfolioValuation = 0;
    let totalInvestedCapital = 0;

    const holdingsWithRealtime = await Promise.all(
      userHoldings.map(async (h) => {
        const stockInfo = stockMap.get(h.stockSymbol);
        const fallbackPrice = stockInfo ? stockInfo.currentPrice : h.averageBuyPrice;
        const liveQuote = stockInfo ? await fetchLiveStockQuote(h.stockSymbol) : null;
        if (liveQuote) recordPriceSnapshot(h.stockSymbol, liveQuote); // fire-and-forget

        const currentPrice = liveQuote ? liveQuote.currentPrice : fallbackPrice;
        const shares = h.shares;
        const avgBuyPrice = h.averageBuyPrice;
        const totalInvested = h.totalInvested;
        const currentValue = shares * currentPrice;
        const unrealizedPnL = currentValue - totalInvested;
        const unrealizedPnLPct = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

        totalPortfolioValuation += currentValue;
        totalInvestedCapital += totalInvested;

        return {
          id: h.id,
          stockSymbol: h.stockSymbol,
          stockName: stockInfo ? stockInfo.name : h.stockSymbol,
          category: stockInfo ? stockInfo.category : "Stock",
          logoUrl: stockInfo?.logoUrl,
          shares: shares.toFixed(4),
          averageBuyPrice: avgBuyPrice.toFixed(2),
          totalInvested: totalInvested.toFixed(2),
          currentPrice: currentPrice.toFixed(2),
          currentValue: currentValue.toFixed(2),
          unrealizedPnL: unrealizedPnL.toFixed(2),
          unrealizedPnLPct: unrealizedPnLPct.toFixed(2),
        };
      })
    );

    const totalPnL = totalPortfolioValuation - totalInvestedCapital;
    const totalPnLPct = totalInvestedCapital > 0 ? (totalPnL / totalInvestedCapital) * 100 : 0;
    const cashBalance = user.virtualBalance;
    const totalNetWorth = cashBalance + totalPortfolioValuation;

    return NextResponse.json({
      success: true,
      summary: {
        cashBalance: cashBalance.toFixed(2),
        portfolioValuation: totalPortfolioValuation.toFixed(2),
        totalNetWorth: totalNetWorth.toFixed(2),
        totalInvestedCapital: totalInvestedCapital.toFixed(2),
        totalPnL: totalPnL.toFixed(2),
        totalPnLPct: totalPnLPct.toFixed(2),
      },
      holdings: holdingsWithRealtime,
    });
  } catch (err: unknown) {
    console.error("Fetch portfolio error:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
