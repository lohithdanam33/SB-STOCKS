import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, Stock, Transaction, Portfolio } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    await connectDB();
    const [allUsers, totalStocks, allTransactions, totalHoldingsCount] = await Promise.all([
      User.find(),
      Stock.countDocuments(),
      Transaction.find(),
      Portfolio.countDocuments(),
    ]);

    let totalCashInSystem = 0;
    allUsers.forEach((u) => {
      totalCashInSystem += u.virtualBalance;
    });

    let totalTransactionVolume = 0;
    allTransactions.forEach((t) => {
      totalTransactionVolume += t.totalAmount;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: allUsers.length,
        totalStocks,
        totalTransactionsCount: allTransactions.length,
        totalHoldingsCount,
        totalCashInSystem: totalCashInSystem.toFixed(2),
        totalTransactionVolume: totalTransactionVolume.toFixed(2),
      },
    });
  } catch (err: unknown) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to fetch admin statistics" }, { status: 500 });
  }
}
