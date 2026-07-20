import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const newAmount = body.amount ? parseFloat(body.amount) : 100000.00;

    if (isNaN(newAmount) || newAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount specified" }, { status: 400 });
    }

    const formattedAmount = Number(newAmount.toFixed(2));
    await User.updateOne({ _id: user.id }, { $set: { virtualBalance: formattedAmount } });

    return NextResponse.json({
      success: true,
      message: `Virtual balance reset to $${formattedAmount.toLocaleString()}`,
      virtualBalance: formattedAmount.toFixed(2),
    });
  } catch (err: unknown) {
    console.error("Reset balance error:", err);
    return NextResponse.json({ error: "Failed to reset balance" }, { status: 500 });
  }
}
