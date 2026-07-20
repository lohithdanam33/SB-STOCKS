import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { LimitOrder } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const order = await LimitOrder.findOne({ _id: id, userId: user.id });

    if (!order) {
      return NextResponse.json({ error: "Limit order not found" }, { status: 404 });
    }

    await LimitOrder.updateOne({ _id: id }, { $set: { status: "CANCELLED" } });

    return NextResponse.json({
      success: true,
      message: "Limit order cancelled successfully",
    });
  } catch (err: unknown) {
    console.error("Cancel limit order error:", err);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
