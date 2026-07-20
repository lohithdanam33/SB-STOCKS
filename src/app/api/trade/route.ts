import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { User, Stock, Portfolio, Transaction, LimitOrder } from "@/db/models";
import { getAuthenticatedUser } from "@/lib/auth";
import { fetchLiveStockQuote, recordPriceSnapshot } from "@/lib/finnhub";
import { serializeTransaction, serializeLimitOrder } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to trade." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { stockSymbol, type, orderType = "MARKET", quantity: rawQuantity, targetPrice: rawTargetPrice } = body;

    if (!stockSymbol || !type || !rawQuantity) {
      return NextResponse.json({ error: "Stock symbol, order type, and quantity are required" }, { status: 400 });
    }

    const quantity = parseFloat(rawQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }

    const symbolUpper = stockSymbol.toUpperCase();
    const stock = await Stock.findOne({ symbol: symbolUpper });
    if (!stock) {
      return NextResponse.json({ error: "Stock symbol not found" }, { status: 404 });
    }

    // Get a real live quote — fall back to the last known DB price only if Finnhub is unavailable
    const liveQuote = await fetchLiveStockQuote(stock.symbol);
    if (liveQuote) recordPriceSnapshot(stock.symbol, liveQuote); // fire-and-forget
    const currentMarketPrice = liveQuote ? liveQuote.currentPrice : stock.currentPrice;

    if (orderType === "LIMIT") {
      const targetPrice = parseFloat(rawTargetPrice);
      if (isNaN(targetPrice) || targetPrice <= 0) {
        return NextResponse.json({ error: "Valid target price is required for limit orders" }, { status: 400 });
      }

      // Record limit order
      const newLimitOrder = await LimitOrder.create({
        userId: user.id,
        stockSymbol: symbolUpper,
        type: type.toUpperCase(),
        targetPrice,
        quantity,
        status: "PENDING",
      });

      return NextResponse.json({
        success: true,
        message: `Limit ${type.toUpperCase()} order placed for ${quantity} shares of ${symbolUpper} at $${targetPrice.toFixed(2)}`,
        limitOrder: serializeLimitOrder(newLimitOrder),
      });
    }

    // MARKET ORDER EXECUTION
    const executionPrice = currentMarketPrice;
    const totalCost = Number((quantity * executionPrice).toFixed(2));
    const currentBalance = user.virtualBalance;

    if (type.toUpperCase() === "BUY") {
      if (currentBalance < totalCost) {
        return NextResponse.json({
          error: `Insufficient virtual cash. Required: $${totalCost.toLocaleString()}, Available: $${currentBalance.toLocaleString()}`,
        }, { status: 400 });
      }

      const newBalance = Number((currentBalance - totalCost).toFixed(2));

      // Update User Balance
      await User.updateOne({ _id: user.id }, { $set: { virtualBalance: newBalance } });

      // Update Portfolio Holding
      const existingPortfolio = await Portfolio.findOne({ userId: user.id, stockSymbol: symbolUpper });

      if (existingPortfolio) {
        const updatedShares = existingPortfolio.shares + quantity;
        const updatedInvested = existingPortfolio.totalInvested + totalCost;
        const updatedAvgPrice = updatedInvested / updatedShares;

        await Portfolio.updateOne(
          { _id: existingPortfolio._id },
          {
            $set: {
              shares: updatedShares,
              averageBuyPrice: Number(updatedAvgPrice.toFixed(2)),
              totalInvested: Number(updatedInvested.toFixed(2)),
            },
          }
        );
      } else {
        await Portfolio.create({
          userId: user.id,
          stockSymbol: symbolUpper,
          shares: quantity,
          averageBuyPrice: executionPrice,
          totalInvested: totalCost,
        });
      }

      // Record Transaction Audit
      const trx = await Transaction.create({
        userId: user.id,
        stockSymbol: symbolUpper,
        stockName: stock.name,
        type: "BUY",
        orderType: "MARKET",
        quantity,
        pricePerShare: executionPrice,
        totalAmount: totalCost,
        status: "COMPLETED",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully BOUGHT ${quantity} shares of ${symbolUpper} at $${executionPrice.toFixed(2)}/share`,
        newBalance: newBalance.toFixed(2),
        transaction: serializeTransaction(trx),
      });

    } else if (type.toUpperCase() === "SELL") {
      // Check portfolio holding
      const existingPortfolio = await Portfolio.findOne({ userId: user.id, stockSymbol: symbolUpper });

      if (!existingPortfolio || existingPortfolio.shares < quantity) {
        const owned = existingPortfolio ? existingPortfolio.shares : 0;
        return NextResponse.json({
          error: `Insufficient shares. You hold ${owned} shares of ${symbolUpper}, but tried selling ${quantity}`,
        }, { status: 400 });
      }

      const newShares = existingPortfolio.shares - quantity;
      const newBalance = Number((currentBalance + totalCost).toFixed(2));

      // Credit User Balance
      await User.updateOne({ _id: user.id }, { $set: { virtualBalance: newBalance } });

      if (newShares <= 0.00001) {
        // Remove holding entirely
        await Portfolio.deleteOne({ _id: existingPortfolio._id });
      } else {
        const avgPrice = existingPortfolio.averageBuyPrice;
        const newInvested = newShares * avgPrice;

        await Portfolio.updateOne(
          { _id: existingPortfolio._id },
          { $set: { shares: newShares, totalInvested: Number(newInvested.toFixed(2)) } }
        );
      }

      // Record Transaction Audit
      const trx = await Transaction.create({
        userId: user.id,
        stockSymbol: symbolUpper,
        stockName: stock.name,
        type: "SELL",
        orderType: "MARKET",
        quantity,
        pricePerShare: executionPrice,
        totalAmount: totalCost,
        status: "COMPLETED",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully SOLD ${quantity} shares of ${symbolUpper} at $${executionPrice.toFixed(2)}/share`,
        newBalance: newBalance.toFixed(2),
        transaction: serializeTransaction(trx),
      });
    }

    return NextResponse.json({ error: "Invalid trade type. Use BUY or SELL" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Execute trade error:", err);
    return NextResponse.json({ error: "Transaction execution failed" }, { status: 500 });
  }
}
