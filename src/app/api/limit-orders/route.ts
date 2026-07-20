import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { LimitOrder, Stock, User, Portfolio, Transaction } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchLiveStockQuote, recordPriceSnapshot } from "@/lib/finnhub";
import { serializeLimitOrder } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const pendingOrders = await LimitOrder.find({ userId: user.id, status: "PENDING" });

    // Auto-trigger evaluation loop
    const allStocks = await Stock.find();
    const stockBySymbol = new Map<string, (typeof allStocks)[number]>();
    allStocks.forEach((s) => stockBySymbol.set(s.symbol, s));

    const executedOrders: string[] = [];

    for (const order of pendingOrders) {
      const stock = stockBySymbol.get(order.stockSymbol);
      if (!stock) continue;

      const liveQuote = await fetchLiveStockQuote(order.stockSymbol);
      if (liveQuote) recordPriceSnapshot(order.stockSymbol, liveQuote); // fire-and-forget
      const marketPrice = liveQuote ? liveQuote.currentPrice : stock.currentPrice;
      const targetPrice = order.targetPrice;
      const quantity = order.quantity;

      let shouldExecute = false;
      if (order.type === "BUY" && marketPrice <= targetPrice) {
        shouldExecute = true;
      } else if (order.type === "SELL" && marketPrice >= targetPrice) {
        shouldExecute = true;
      }

      if (!shouldExecute) continue;

      const totalCost = Number((quantity * marketPrice).toFixed(2));
      const freshUser = await User.findById(user.id);
      if (!freshUser) continue;
      const currentBalance = freshUser.virtualBalance;

      if (order.type === "BUY" && currentBalance >= totalCost) {
        await User.updateOne({ _id: user.id }, { $set: { virtualBalance: Number((currentBalance - totalCost).toFixed(2)) } });

        const existingPortfolio = await Portfolio.findOne({ userId: user.id, stockSymbol: order.stockSymbol });

        if (existingPortfolio) {
          const updatedShares = existingPortfolio.shares + quantity;
          const updatedInvested = existingPortfolio.totalInvested + totalCost;
          await Portfolio.updateOne(
            { _id: existingPortfolio._id },
            {
              $set: {
                shares: updatedShares,
                averageBuyPrice: Number((updatedInvested / updatedShares).toFixed(2)),
                totalInvested: Number(updatedInvested.toFixed(2)),
              },
            }
          );
        } else {
          await Portfolio.create({
            userId: user.id,
            stockSymbol: order.stockSymbol,
            shares: quantity,
            averageBuyPrice: marketPrice,
            totalInvested: totalCost,
          });
        }

        await LimitOrder.updateOne({ _id: order._id }, { $set: { status: "EXECUTED" } });
        await Transaction.create({
          userId: user.id,
          stockSymbol: order.stockSymbol,
          stockName: stock.name,
          type: "BUY",
          orderType: "LIMIT",
          quantity,
          pricePerShare: marketPrice,
          totalAmount: totalCost,
          status: "COMPLETED",
        });

        executedOrders.push(order.id);
      } else if (order.type === "SELL") {
        const existingPortfolio = await Portfolio.findOne({ userId: user.id, stockSymbol: order.stockSymbol });

        if (existingPortfolio && existingPortfolio.shares >= quantity) {
          const newShares = existingPortfolio.shares - quantity;
          await User.updateOne({ _id: user.id }, { $set: { virtualBalance: Number((currentBalance + totalCost).toFixed(2)) } });

          if (newShares <= 0.0001) {
            await Portfolio.deleteOne({ _id: existingPortfolio._id });
          } else {
            const avgPrice = existingPortfolio.averageBuyPrice;
            await Portfolio.updateOne(
              { _id: existingPortfolio._id },
              { $set: { shares: newShares, totalInvested: Number((newShares * avgPrice).toFixed(2)) } }
            );
          }

          await LimitOrder.updateOne({ _id: order._id }, { $set: { status: "EXECUTED" } });
          await Transaction.create({
            userId: user.id,
            stockSymbol: order.stockSymbol,
            stockName: stock.name,
            type: "SELL",
            orderType: "LIMIT",
            quantity,
            pricePerShare: marketPrice,
            totalAmount: totalCost,
            status: "COMPLETED",
          });

          executedOrders.push(order.id);
        }
      }
    }

    const currentOrders = await LimitOrder.find({ userId: user.id });

    return NextResponse.json({
      success: true,
      orders: currentOrders.map(serializeLimitOrder),
      autoExecutedCount: executedOrders.length,
    });
  } catch (err: unknown) {
    console.error("Fetch limit orders error:", err);
    return NextResponse.json({ error: "Failed to fetch limit orders" }, { status: 500 });
  }
}
