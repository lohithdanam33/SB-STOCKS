import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Stock } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { serializeStock } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// POST: Add new stock
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { symbol, name, category, currentPrice, description, logoUrl, isTrending } = body;

    if (!symbol || !name || !currentPrice) {
      return NextResponse.json({ error: "Symbol, name, and current price are required" }, { status: 400 });
    }

    const symbolUpper = symbol.toUpperCase().trim();
    const priceNum = parseFloat(currentPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "Invalid stock price" }, { status: 400 });
    }

    const existing = await Stock.findOne({ symbol: symbolUpper });
    if (existing) {
      return NextResponse.json({ error: "Stock symbol already exists in database" }, { status: 400 });
    }

    const newStock = await Stock.create({
      symbol: symbolUpper,
      name,
      category: category || "Tech",
      currentPrice: priceNum,
      previousClose: priceNum,
      high24h: Number((priceNum * 1.05).toFixed(2)),
      low24h: Number((priceNum * 0.95).toFixed(2)),
      changePercent: 0,
      description: description || "Custom stock added by System Admin",
      logoUrl: logoUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
      isCustomAdmin: true,
      isTrending: !!isTrending,
    });

    return NextResponse.json({
      success: true,
      message: `Stock ${symbolUpper} created successfully`,
      stock: serializeStock(newStock),
    });
  } catch (err: unknown) {
    console.error("Admin create stock error:", err);
    return NextResponse.json({ error: "Failed to create stock" }, { status: 500 });
  }
}

// PUT: Update stock price / info
export async function PUT(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { id, currentPrice, name, category, description, isTrending } = body;

    if (!id) {
      return NextResponse.json({ error: "Stock ID required" }, { status: 400 });
    }

    const existing = await Stock.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (currentPrice) {
      const newPrice = parseFloat(currentPrice);
      const oldPrice = existing.currentPrice;
      const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

      updatePayload.previousClose = existing.currentPrice;
      updatePayload.currentPrice = newPrice;
      updatePayload.changePercent = Number(changePct.toFixed(2));
      if (newPrice > existing.high24h) updatePayload.high24h = newPrice;
      if (newPrice < existing.low24h) updatePayload.low24h = newPrice;
    }

    if (name) updatePayload.name = name;
    if (category) updatePayload.category = category;
    if (description !== undefined) updatePayload.description = description;
    if (isTrending !== undefined) updatePayload.isTrending = isTrending;

    const updated = await Stock.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Stock ${updated.symbol} updated successfully`,
      stock: serializeStock(updated),
    });
  } catch (err: unknown) {
    console.error("Admin update stock error:", err);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

// DELETE: Delete stock
export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Stock ID required" }, { status: 400 });
    }

    await Stock.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: "Stock deleted from catalog",
    });
  } catch (err: unknown) {
    console.error("Admin delete stock error:", err);
    return NextResponse.json({ error: "Failed to delete stock" }, { status: 500 });
  }
}
