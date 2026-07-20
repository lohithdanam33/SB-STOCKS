import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { connectDB } from "@/db";
import { Portfolio, Stock } from "@/db/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedDatabaseIfNeeded();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    await connectDB();

    // Calculate user's total active holdings valuation
    const userPortfolios = await Portfolio.find({ userId: user.id }).lean();
    const allStocks = await Stock.find().lean();

    const stockMap = new Map<string, number>();
    allStocks.forEach((s) => stockMap.set(s.symbol, s.currentPrice));

    let totalHoldingsValuation = 0;
    userPortfolios.forEach((p) => {
      const livePrice = stockMap.get(p.stockSymbol) ?? p.averageBuyPrice;
      totalHoldingsValuation += p.shares * livePrice;
    });

    const cashBalance = user.virtualBalance;
    const totalNetWorth = cashBalance + totalHoldingsValuation;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        virtualBalance: cashBalance.toFixed(2),
        avatarUrl: user.avatarUrl,
        totalHoldingsValuation: totalHoldingsValuation.toFixed(2),
        totalNetWorth: totalNetWorth.toFixed(2),
        holdingsCount: userPortfolios.length,
      },
    });
  } catch (err: unknown) {
    console.error("Auth me check error:", err);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
