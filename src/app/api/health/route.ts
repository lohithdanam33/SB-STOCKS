import { connectDB } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasFinnhubKey = !!process.env.FINNHUB_API_KEY;
  try {
    const mongoose = await connectDB();
    const state = mongoose.connection.readyState; // 1 = connected
    if (state !== 1) throw new Error("MongoDB not connected");
    return Response.json({ ok: true, mongoConnected: true, hasFinnhubKey });
  } catch {
    return Response.json({ ok: false, mongoConnected: false, hasFinnhubKey }, { status: 500 });
  }
}
