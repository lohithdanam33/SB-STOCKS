"use client";

import React, { useState, useEffect } from "react";
import { StockItem, useApp } from "@/context/AppContext";
import { Star, TrendingUp, TrendingDown, Trash2, Zap } from "lucide-react";

export const WatchlistView = () => {
  const { user, toggleWatchlist, setSelectedTradeStock, setIsTradeModalOpen } = useApp();
  const [watchlist, setWatchlist] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        if (data.watchlist) {
          setWatchlist(data.watchlist);
        }
      }
    } catch (err) {
      console.error("Fetch watchlist error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20 max-w-lg mx-auto shadow-2xl">
        <Star className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white theme-light:text-slate-900 mb-2">
          WATCHLIST TERMINAL
        </h3>
        <p className="text-xs text-slate-400">Please sign in to keep track of your favorite stocks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white theme-light:text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          SAVED WATCHLIST ({watchlist.length})
        </h3>
      </div>

      {loading ? (
        <div className="p-12 text-center text-cyan-400 font-mono text-xs">
          LOADING WATCHLIST STREAM...
        </div>
      ) : watchlist.length === 0 ? (
        <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20">
          <Star className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No stocks added to your watchlist yet.</p>
          <p className="text-xs text-cyan-400 mt-1">Click the star icon on any stock card to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchlist.map((item) => {
            const isUp = parseFloat(item.changePercent) >= 0;
            return (
              <div
                key={item.symbol}
                className="bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 theme-light:border-slate-200 rounded-2xl p-5 shadow-xl hover:border-cyan-400/60 transition glow-cyan"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white theme-light:text-slate-900 text-base">
                      {item.symbol}
                    </h4>
                    <div className="text-xs text-slate-400 truncate max-w-[140px]">{item.name}</div>
                  </div>
                  <button
                    onClick={async () => {
                      await toggleWatchlist(item.symbol);
                      fetchWatchlist();
                    }}
                    className="text-amber-400 hover:text-rose-400 transition p-1"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-black font-mono text-white theme-light:text-slate-900">
                    ${parseFloat(item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`inline-flex items-center text-xs font-bold mt-1 ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                    {isUp ? "+" : ""}{item.changePercent}%
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTradeStock({
                      id: item.id || item.symbol,
                      symbol: item.symbol,
                      name: item.name,
                      category: item.category || "Tech",
                      currentPrice: item.currentPrice,
                      previousClose: item.currentPrice,
                      high24h: item.currentPrice,
                      low24h: item.currentPrice,
                      changePercent: item.changePercent,
                      volume: "1000000",
                    });
                    setIsTradeModalOpen(true);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-black text-xs rounded-xl shadow glow-cyan transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  QUICK TRADE
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
