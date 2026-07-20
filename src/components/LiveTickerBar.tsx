"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { StockItem, useApp } from "@/context/AppContext";

export const LiveTickerBar = () => {
  const [tickerStocks, setTickerStocks] = useState<StockItem[]>([]);
  const { setSelectedTradeStock, setIsTradeModalOpen } = useApp();

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/stocks?live=true");
        if (res.ok) {
          const data = await res.json();
          if (data.stocks) {
            setTickerStocks(data.stocks);
          }
        }
      } catch (err) {
        console.error("Ticker fetch error:", err);
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 20000);
    return () => clearInterval(interval);
  }, []);

  if (tickerStocks.length === 0) return null;

  return (
    <div className="w-full bg-[#03060d] theme-light:bg-slate-900 text-xs border-b border-cyan-500/20 theme-light:border-slate-800 py-1.5 overflow-hidden select-none">
      <div className="flex items-center">
        <div className="px-3 py-0.5 bg-cyan-500/20 theme-light:bg-sky-600/30 text-cyan-400 theme-light:text-sky-300 font-bold flex items-center gap-1 shrink-0 border-r border-cyan-500/30">
          <Zap className="w-3 h-3 animate-pulse text-cyan-400" />
          <span className="tracking-widest hidden sm:inline">LIVE GRID</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 relative">
          <div className="inline-flex animate-ticker items-center gap-6 pl-4">
            {[...tickerStocks, ...tickerStocks].map((stock, idx) => {
              const isUp = parseFloat(stock.changePercent) >= 0;
              return (
                <button
                  key={`${stock.symbol}-${idx}`}
                  onClick={() => {
                    setSelectedTradeStock(stock);
                    setIsTradeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 hover:bg-cyan-950/40 theme-light:hover:bg-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-200 theme-light:text-slate-100">
                    {stock.symbol}
                  </span>
                  <span className="font-mono text-slate-300">
                    ${parseFloat(stock.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`inline-flex items-center font-semibold ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                    )}
                    {isUp ? "+" : ""}
                    {stock.changePercent}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
