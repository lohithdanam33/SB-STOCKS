import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const allUsers = await User.find().select("name email role virtualBalance createdAt").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        virtualBalance: u.virtualBalance.toFixed(2),
        createdAt: u.createdAt,
      })),
    });
  } catch (err: unknown) {
    console.error("Fetch admin users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { userId, role, virtualBalance } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (role && (role === "user" || role === "admin")) {
      updatePayload.role = role;
    }

    if (virtualBalance !== undefined) {
      const balanceNum = parseFloat(virtualBalance);
      if (isNaN(balanceNum) || balanceNum < 0) {
        return NextResponse.json({ error: "Invalid virtual balance" }, { status: 400 });
      }
      updatePayload.virtualBalance = balanceNum;
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updatePayload }, { new: true }).select(
      "name email role virtualBalance"
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updated.name} updated successfully`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        virtualBalance: updated.virtualBalance.toFixed(2),
      },
    });
  } catch (err: unknown) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
