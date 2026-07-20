import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { SystemAlert } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeAlert } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const alerts = await SystemAlert.find().sort({ createdAt: -1 }).limit(10);

    // Default seed alerts if empty
    if (alerts.length === 0) {
      const defaultAlerts = [
        {
          title: "SYSTEM INITIALIZED: Welcome to SB STOCKS",
          message: "All virtual accounts credited with $100,000.00 initial simulated trading capital. Finnhub market stream synchronized.",
          alertType: "BREAKING",
          createdBy: "Grid Control System",
        },
        {
          title: "FED MONETARY POLICY UPDATE",
          message: "Global central banks hint at rate adjustments. AI & Tech sector experiencing increased trading volatility.",
          alertType: "MARKET_NEWS",
          createdBy: "Market Intelligence",
        },
        {
          title: "NEW LEARNING HUB AVAILABLE",
          message: "Head to the Learn tab for a full walkthrough of stock market fundamentals, order types, and risk management.",
          alertType: "ADMIN_NOTICE",
          createdBy: "Grid System Master",
        },
      ];

      await SystemAlert.insertMany(defaultAlerts);
      const freshlyInserted = await SystemAlert.find().sort({ createdAt: -1 }).limit(10);
      return NextResponse.json({ success: true, alerts: freshlyInserted.map(serializeAlert) });
    }

    return NextResponse.json({ success: true, alerts: alerts.map(serializeAlert) });
  } catch (err: unknown) {
    console.error("Fetch alerts error:", err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { title, message, alertType = "ADMIN_NOTICE" } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const newAlert = await SystemAlert.create({
      title,
      message,
      alertType,
      createdBy: user.name,
    });

    return NextResponse.json({
      success: true,
      message: "Broadcast announcement published to trading floor",
      alert: serializeAlert(newAlert),
    });
  } catch (err: unknown) {
    console.error("Create alert error:", err);
    return NextResponse.json({ error: "Failed to broadcast alert" }, { status: 500 });
  }
}
