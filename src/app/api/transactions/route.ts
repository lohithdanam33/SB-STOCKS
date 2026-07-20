import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Transaction } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeTransaction } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userTransactions = await Transaction.find({ userId: user.id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: userTransactions.length,
      transactions: userTransactions.map(serializeTransaction),
    });
  } catch (err: unknown) {
    console.error("Fetch transactions error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions history" }, { status: 500 });
  }
}
