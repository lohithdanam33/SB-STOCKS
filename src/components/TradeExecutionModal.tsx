"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import confetti from "canvas-confetti";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  ShieldCheck,
  Percent,
  CheckCircle2,
} from "lucide-react";

export const TradeExecutionModal = () => {
  const {
    selectedTradeStock,
    isTradeModalOpen,
    setIsTradeModalOpen,
    user,
    refreshUser,
    triggerToast,
  } = useApp();

  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("1");
  const [targetPrice, setTargetPrice] = useState("");
  const [userHoldingShares, setUserHoldingShares] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTradeStock) {
      setTargetPrice(selectedTradeStock.currentPrice);
    }
  }, [selectedTradeStock]);

  // Fetch holding for current stock if user logged in
  useEffect(() => {
    if (selectedTradeStock && user) {
      fetch(`/api/stocks/${selectedTradeStock.symbol}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.userHolding) {
            setUserHoldingShares(parseFloat(data.userHolding.shares));
          } else {
            setUserHoldingShares(0);
          }
        })
        .catch(() => setUserHoldingShares(0));
    }
  }, [selectedTradeStock, user]);

  if (!isTradeModalOpen || !selectedTradeStock) return null;

  const currentPriceNum = parseFloat(selectedTradeStock.currentPrice);
  const qtyNum = parseFloat(quantity) || 0;
  const execPriceNum = orderType === "LIMIT" ? parseFloat(targetPrice) || currentPriceNum : currentPriceNum;
  const totalCost = qtyNum * execPriceNum;
  const userCash = user ? parseFloat(user.virtualBalance) : 0;

  const handleQuickAllocation = (pct: number) => {
    if (tradeType === "BUY") {
      const allocatedCash = userCash * (pct / 100);
      const calculatedQty = allocatedCash / execPriceNum;
      setQuantity(calculatedQty > 0.0001 ? calculatedQty.toFixed(4) : "1");
    } else {
      const calculatedQty = userHoldingShares * (pct / 100);
      setQuantity(calculatedQty > 0.0001 ? calculatedQty.toFixed(4) : "0");
    }
  };

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Please log in to trade virtual stocks", "error");
      return;
    }

    if (qtyNum <= 0) {
      triggerToast("Please enter a valid quantity greater than 0", "error");
      return;
    }

    if (tradeType === "BUY" && orderType === "MARKET" && totalCost > userCash) {
      triggerToast("Insufficient virtual cash for this purchase", "error");
      return;
    }

    if (tradeType === "SELL" && qtyNum > userHoldingShares) {
      triggerToast(`You only own ${userHoldingShares} shares of ${selectedTradeStock.symbol}`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockSymbol: selectedTradeStock.symbol,
          type: tradeType,
          orderType,
          quantity: qtyNum,
          targetPrice: orderType === "LIMIT" ? parseFloat(targetPrice) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message, "success");
        await refreshUser();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#00f3ff", "#ff007f", "#00ff66"],
        });
        setIsTradeModalOpen(false);
      } else {
        triggerToast(data.error || "Trade execution failed", "error");
      }
    } catch (err) {
      console.error("Trade execution error:", err);
      triggerToast("Network error during transaction", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0a0f1d] theme-light:bg-white border border-cyan-500/40 theme-light:border-slate-300 rounded-2xl shadow-2xl p-6 glow-cyan">
        <button
          onClick={() => setIsTradeModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white theme-light:hover:text-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stock Info Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-cyan-500/20 theme-light:border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 theme-light:bg-slate-100 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 theme-light:text-sky-700 text-sm shrink-0">
            {selectedTradeStock.symbol}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-white theme-light:text-slate-900 leading-tight">
              {selectedTradeStock.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-mono">
                ${currentPriceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-bold ${
                  parseFloat(selectedTradeStock.changePercent) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {parseFloat(selectedTradeStock.changePercent) >= 0 ? "+" : ""}
                {selectedTradeStock.changePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Trade BUY / SELL Tabs */}
        <div className="grid grid-cols-2 p-1 bg-cyan-950/40 theme-light:bg-slate-100 rounded-xl mb-4 border border-cyan-500/20">
          <button
            type="button"
            onClick={() => setTradeType("BUY")}
            className={`py-2 text-sm font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              tradeType === "BUY"
                ? "bg-emerald-500 text-black shadow-lg glow-green"
                : "text-slate-400 hover:text-white theme-light:text-slate-600"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            BUY SHARES
          </button>
          <button
            type="button"
            onClick={() => setTradeType("SELL")}
            className={`py-2 text-sm font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
              tradeType === "SELL"
                ? "bg-rose-500 text-black shadow-lg glow-red"
                : "text-slate-400 hover:text-white theme-light:text-slate-600"
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            SELL SHARES
          </button>
        </div>

        {/* Order Type: MARKET vs LIMIT */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setOrderType("MARKET")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
              orderType === "MARKET"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 theme-light:bg-sky-600 theme-light:text-white"
                : "bg-slate-900/40 text-slate-400 border-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            MARKET ORDER
          </button>
          <button
            type="button"
            onClick={() => setOrderType("LIMIT")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
              orderType === "LIMIT"
                ? "bg-sky-500/20 text-sky-300 border-sky-500/50 theme-light:bg-sky-600 theme-light:text-white"
                : "bg-slate-900/40 text-slate-400 border-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            LIMIT ORDER
          </button>
        </div>

        <form onSubmit={handleExecuteTrade} className="space-y-4">
          {orderType === "LIMIT" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
                TARGET LIMIT PRICE ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={selectedTradeStock.currentPrice}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/80 theme-light:bg-slate-50 border border-sky-500/40 theme-light:border-slate-300 rounded-xl text-sm font-mono text-white theme-light:text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
              <span>QUANTITY (SHARES)</span>
              {tradeType === "SELL" && (
                <span className="text-cyan-400">Holdings: {userHoldingShares} shares</span>
              )}
            </div>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2.5 bg-slate-900/80 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-xl text-sm font-mono text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Quick Portfolio Percentage Calculator */}
          <div>
            <div className="text-[10px] font-bold text-cyan-400 theme-light:text-slate-500 mb-1 flex items-center gap-1">
              <Percent className="w-3 h-3" />
              QUICK ALLOCATION:
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAllocation(pct)}
                  className="py-1 bg-cyan-950/40 hover:bg-cyan-900/60 theme-light:bg-slate-100 theme-light:hover:bg-slate-200 border border-cyan-500/30 text-cyan-300 theme-light:text-slate-800 text-xs font-bold rounded-lg transition"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Trade Cost Summary Card */}
          <div className="p-3.5 bg-cyan-950/20 theme-light:bg-slate-50 border border-cyan-500/20 theme-light:border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estimated Price:</span>
              <span className="font-mono font-bold text-white theme-light:text-slate-900">
                ${execPriceNum.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Available Virtual Cash:</span>
              <span className="font-mono font-bold text-cyan-300 theme-light:text-sky-800">
                ${userCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-2 border-t border-cyan-500/20 flex justify-between text-sm font-bold">
              <span className="text-slate-200 theme-light:text-slate-800">TOTAL COST:</span>
              <span className="font-mono text-emerald-400 theme-light:text-emerald-700">
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 font-black text-sm rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
              tradeType === "BUY"
                ? "bg-emerald-500 hover:bg-emerald-400 text-black glow-green"
                : "bg-rose-500 hover:bg-rose-400 text-black glow-red"
            }`}
          >
            {submitting ? (
              "EXECUTING ORDER..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                EXECUTE {tradeType} {orderType} ORDER
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
