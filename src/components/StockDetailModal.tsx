"use client";

import React, { useState, useEffect } from "react";
import { StockItem, useApp } from "@/context/AppContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  X,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  DollarSign,
  Info,
  Zap,
} from "lucide-react";

interface StockDetailModalProps {
  stock: StockItem | null;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose }) => {
  const { toggleWatchlist, watchlistSymbols, setSelectedTradeStock, setIsTradeModalOpen } = useApp();
  const [period, setPeriod] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("1D");
  const [chartData, setChartData] = useState<Array<{ time: string; price: number; high: number; low: number; volume: number }>>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    if (!stock) return;

    setLoadingChart(true);
    fetch(`/api/stocks/${stock.symbol}/chart?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setChartData(data.data);
        }
      })
      .catch((err) => console.error("Chart load error:", err))
      .finally(() => setLoadingChart(false));
  }, [stock, period]);

  if (!stock) return null;

  const isUp = parseFloat(stock.changePercent) >= 0;
  const isStarred = watchlistSymbols.has(stock.symbol);
  const strokeColor = isUp ? "#00ff66" : "#ff3366";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#080d1a] theme-light:bg-white border border-cyan-500/40 theme-light:border-slate-300 rounded-3xl shadow-2xl p-6 glow-cyan">
        {/* Top Header Controls */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-cyan-500/20 theme-light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 theme-light:bg-slate-100 border border-cyan-500/30 flex items-center justify-center text-lg font-black text-cyan-400 theme-light:text-sky-700">
              {stock.symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white theme-light:text-slate-900">
                  {stock.name}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {stock.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                NASDAQ / CYBER GRID SYNTH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWatchlist(stock.symbol)}
              className={`p-2 rounded-xl border transition ${
                isStarred
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
              title="Toggle Watchlist"
            >
              <Star className={`w-5 h-5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white theme-light:hover:text-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Price & 24h Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-cyan-950/20 theme-light:bg-slate-50 border border-cyan-500/20 theme-light:border-slate-200 rounded-2xl">
          <div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              {stock.isRealTime === false ? (
                <span className="text-amber-400/80">DELAYED PRICE</span>
              ) : (
                <>
                  LIVE SPOT PRICE
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              )}
            </div>
            <div className="text-2xl font-black font-mono text-white theme-light:text-slate-900">
              ${parseFloat(stock.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div
              className={`text-xs font-bold flex items-center mt-0.5 ${
                isUp ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {isUp ? "+" : ""}
              {stock.changePercent}%
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono">24H HIGH</div>
            <div className="text-base font-bold font-mono text-slate-200 theme-light:text-slate-800">
              ${parseFloat(stock.high24h).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono">24H LOW</div>
            <div className="text-base font-bold font-mono text-slate-200 theme-light:text-slate-800">
              ${parseFloat(stock.low24h).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono">VOLUME</div>
            <div className="text-base font-bold font-mono text-slate-200 theme-light:text-slate-800">
              {parseInt(stock.volume).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Interactive Chart Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-cyan-400 theme-light:text-slate-700 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              PRICE STREAM PERFORMANCE
            </div>
            <div className="flex gap-1 bg-cyan-950/40 theme-light:bg-slate-100 p-1 rounded-xl border border-cyan-500/20">
              {(["1D", "1W", "1M", "1Y", "ALL"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    period === p
                      ? "bg-cyan-500 text-black shadow glow-cyan"
                      : "text-slate-400 hover:text-white theme-light:text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-80 w-full bg-slate-950/60 theme-light:bg-slate-900 rounded-2xl p-2 border border-cyan-500/20 relative">
            {loadingChart && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 text-cyan-400 text-xs font-mono">
                LOADING REAL MARKET DATA...
              </div>
            )}
            {!loadingChart && chartData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 text-slate-400 theme-light:text-slate-500 text-xs font-mono text-center px-6">
                Collecting real Finnhub price history for this period — check back shortly as more real quotes come in.
              </div>
            )}
            {!loadingChart && chartData.length > 0 && chartData.length < 3 && (
              <div className="absolute top-2 left-2 right-2 z-10 text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-[10px] font-mono text-center">
                Only {chartData.length} real data point{chartData.length > 1 ? "s" : ""} recorded so far for this period — the line will fill in as more real quotes arrive.
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#030712",
                    borderColor: "#00f3ff",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`$${val}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Description & Trade Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-cyan-950/30 theme-light:bg-slate-100 border border-cyan-500/30 rounded-2xl">
          <p className="text-xs text-slate-300 theme-light:text-slate-700 flex-1 leading-relaxed">
            {stock.description || "Leading constituent asset in fullstack practice trading environment."}
          </p>

          <button
            onClick={() => {
              setSelectedTradeStock(stock);
              setIsTradeModalOpen(true);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-black font-black text-sm rounded-xl shadow-lg glow-cyan transition shrink-0 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-black" />
            TRADE {stock.symbol} NOW
          </button>
        </div>
      </div>
    </div>
  );
};
