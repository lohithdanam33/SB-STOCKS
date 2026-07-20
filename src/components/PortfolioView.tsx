"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { StockDetailModal } from "./StockDetailModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Zap,
  RotateCcw,
  Plus,
  ArrowUpRight,
} from "lucide-react";

interface PortfolioHolding {
  id: string;
  stockSymbol: string;
  stockName: string;
  category: string;
  shares: string;
  averageBuyPrice: string;
  totalInvested: string;
  currentPrice: string;
  currentValue: string;
  unrealizedPnL: string;
  unrealizedPnLPct: string;
}

interface PortfolioSummary {
  cashBalance: string;
  portfolioValuation: string;
  totalNetWorth: string;
  totalInvestedCapital: string;
  totalPnL: string;
  totalPnLPct: string;
}

const COLORS = ["#00f3ff", "#ff007f", "#00ff66", "#ffbb28", "#8884d8", "#ff8042", "#a4de6c"];

export const PortfolioView = () => {
  const { user, setSelectedTradeStock, setIsTradeModalOpen } = useApp();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          setHoldings(data.holdings || []);
        }
      }
    } catch (err) {
      console.error("Fetch portfolio error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20 max-w-lg mx-auto shadow-2xl">
        <Wallet className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-white theme-light:text-slate-900 mb-2">
          PORTFOLIO TERMINAL LOCKED
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Please log in to track your simulated holdings, asset distribution, and real-time PnL.
        </p>
      </div>
    );
  }

  const chartData = holdings.map((h) => ({
    name: h.stockSymbol,
    value: parseFloat(h.currentValue),
  }));

  const isTotalPnLPositive = summary ? parseFloat(summary.totalPnL) >= 0 : true;

  return (
    <div className="space-y-6">
      {/* Portfolio Top Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Net Worth Card */}
        <div className="bg-[#090e1d] theme-light:bg-white p-5 rounded-2xl border border-cyan-500/30 theme-light:border-slate-200 shadow-xl relative overflow-hidden glow-cyan">
          <div className="text-[10px] font-mono text-cyan-400 theme-light:text-slate-500 mb-1">
            TOTAL NET WORTH
          </div>
          <div className="text-3xl font-black font-mono text-white theme-light:text-slate-900">
            ${summary ? parseFloat(summary.totalNetWorth).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <div className="mt-3 flex justify-between text-xs font-mono border-t border-cyan-500/20 pt-2 text-slate-400">
            <span>Cash: ${summary ? parseFloat(summary.cashBalance).toLocaleString() : "0.00"}</span>
            <span>Invested: ${summary ? parseFloat(summary.portfolioValuation).toLocaleString() : "0.00"}</span>
          </div>
        </div>

        {/* Unrealized Profit / Loss Card */}
        <div className="bg-[#090e1d] theme-light:bg-white p-5 rounded-2xl border border-cyan-500/30 theme-light:border-slate-200 shadow-xl">
          <div className="text-[10px] font-mono text-cyan-400 theme-light:text-slate-500 mb-1">
            TOTAL UNREALIZED P&L
          </div>
          <div
            className={`text-3xl font-black font-mono ${
              isTotalPnLPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isTotalPnLPositive ? "+" : ""}
            ${summary ? parseFloat(summary.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <div
            className={`mt-3 font-bold text-xs flex items-center ${
              isTotalPnLPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isTotalPnLPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {isTotalPnLPositive ? "+" : ""}
            {summary ? summary.totalPnLPct : "0.00"}% Overall Return
          </div>
        </div>

        {/* Positions Summary */}
        <div className="bg-[#090e1d] theme-light:bg-white p-5 rounded-2xl border border-cyan-500/30 theme-light:border-slate-200 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 theme-light:text-slate-500 mb-1">
              ACTIVE POSITIONS
            </div>
            <div className="text-3xl font-black font-mono text-white theme-light:text-slate-900">
              {holdings.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Diversified across {holdings.length} symbols</p>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PieIcon className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Asset Distribution Chart & Positions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart Card */}
        <div className="bg-[#090e1d] theme-light:bg-white p-5 rounded-2xl border border-cyan-500/20 theme-light:border-slate-200 shadow-xl flex flex-col items-center justify-center min-h-[280px]">
          <h4 className="text-xs font-bold text-cyan-400 theme-light:text-slate-700 mb-2 self-start flex items-center gap-1">
            <PieIcon className="w-4 h-4" />
            HOLDINGS ALLOCATION
          </h4>
          {holdings.length === 0 ? (
            <div className="text-xs text-slate-500 my-auto">No holdings in portfolio</div>
          ) : (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#030712",
                      borderColor: "#00f3ff",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, "Valuation"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Positions Table */}
        <div className="lg:col-span-2 bg-[#090e1d] theme-light:bg-white p-5 rounded-2xl border border-cyan-500/20 theme-light:border-slate-200 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-400 theme-light:text-slate-700 mb-4 flex items-center gap-1">
            <Wallet className="w-4 h-4" />
            CURRENT PORTFOLIO POSITIONS
          </h4>

          {loading ? (
            <div className="py-12 text-center text-cyan-400 font-mono text-xs">
              FETCHING PORTFOLIO DATA...
            </div>
          ) : holdings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm mb-3">Your trading portfolio is currently empty.</p>
              <p className="text-xs text-cyan-400">Navigate to Markets to place your first trade!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-cyan-950/40 theme-light:bg-slate-100 text-cyan-400 theme-light:text-slate-600 border-b border-cyan-500/20">
                  <tr>
                    <th className="p-3">ASSET</th>
                    <th className="p-3">SHARES</th>
                    <th className="p-3">AVG PRICE</th>
                    <th className="p-3">SPOT PRICE</th>
                    <th className="p-3">VALUE</th>
                    <th className="p-3">UNREALIZED P&L</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 theme-light:divide-slate-100">
                  {holdings.map((h) => {
                    const isGain = parseFloat(h.unrealizedPnL) >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-cyan-950/20 theme-light:hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-white theme-light:text-slate-900">
                          {h.stockSymbol}
                        </td>
                        <td className="p-3 text-slate-300 theme-light:text-slate-700">
                          {parseFloat(h.shares).toFixed(4)}
                        </td>
                        <td className="p-3 text-slate-300">
                          ${parseFloat(h.averageBuyPrice).toFixed(2)}
                        </td>
                        <td className="p-3 text-slate-300">
                          ${parseFloat(h.currentPrice).toFixed(2)}
                        </td>
                        <td className="p-3 font-bold text-white theme-light:text-slate-900">
                          ${parseFloat(h.currentValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 font-bold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                          {isGain ? "+" : ""}${parseFloat(h.unrealizedPnL).toFixed(2)} ({isGain ? "+" : ""}{h.unrealizedPnLPct}%)
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedTradeStock({
                                id: h.id,
                                symbol: h.stockSymbol,
                                name: h.stockName,
                                category: h.category,
                                currentPrice: h.currentPrice,
                                previousClose: h.currentPrice,
                                high24h: h.currentPrice,
                                low24h: h.currentPrice,
                                changePercent: "0.00",
                                volume: "1000000",
                              });
                              setIsTradeModalOpen(true);
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-bold text-[11px] rounded shadow glow-cyan"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
