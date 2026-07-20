"use client";

import React, { useState, useEffect } from "react";
import { StockItem, useApp } from "@/context/AppContext";
import { StockDetailModal } from "./StockDetailModal";
import {
  Search,
  Filter,
  Star,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  RefreshCw,
  Zap,
  Sparkles,
  Flame,
} from "lucide-react";

export const MarketOverview = () => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [activeDetailStock, setActiveDetailStock] = useState<StockItem | null>(null);

  const {
    watchlistSymbols,
    toggleWatchlist,
    setSelectedTradeStock,
    setIsTradeModalOpen,
  } = useApp();

  const categories = ["All", "Tech", "EV", "Crypto", "Retail", "Finance", "Indices", "Market"];

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Debounce the raw input so we don't fire a request (and, for new queries,
  // a Finnhub symbol search) on every single keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const url = `/api/stocks?query=${encodeURIComponent(debouncedQuery)}&category=${encodeURIComponent(
        selectedCategory
      )}&live=true`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.stocks) {
        setStocks(data.stocks);
        setFetchError(null);
      } else {
        setStocks([]);
        setFetchError(data?.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Fetch stocks error:", err);
      setStocks([]);
      setFetchError("Network error — could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const timer = setInterval(fetchStocks, 20000);
    return () => clearInterval(timer);
  }, [debouncedQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#090f20] theme-light:bg-white p-4 rounded-2xl border border-cyan-500/20 theme-light:border-slate-200 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400 theme-light:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock by symbol or name (e.g. AAPL, NVDA, TSLA)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-xl text-sm text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-cyan-500 text-black shadow glow-cyan"
                  : "bg-cyan-950/30 theme-light:bg-slate-100 text-slate-400 theme-light:text-slate-600 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid vs Table Toggle */}
        <div className="flex items-center gap-1 border-l border-cyan-500/20 pl-4 hidden sm:flex">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition ${
              viewMode === "grid"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "text-slate-500 border-transparent hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg border transition ${
              viewMode === "table"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "text-slate-500 border-transparent hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={fetchStocks}
            className="p-2 text-slate-400 hover:text-cyan-300 transition"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stock Items Display */}
      {loading && stocks.length === 0 ? (
        <div className="p-12 text-center text-cyan-400 font-mono text-sm">
          INITIALIZING STOCK EXCHANGE STREAM...
        </div>
      ) : fetchError ? (
        <div className="p-12 text-center bg-red-500/10 theme-light:bg-red-50 rounded-2xl border border-red-500/30">
          <p className="text-red-400 text-sm font-mono">REQUEST FAILED: {fetchError}</p>
          <p className="text-slate-400 text-xs mt-2">Check your server console/logs for details, or click refresh.</p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="p-12 text-center bg-[#090f20] theme-light:bg-slate-50 rounded-2xl border border-cyan-500/20">
          <p className="text-slate-400 text-sm">No stock quotes matched your query filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stocks.map((stock) => {
            const isUp = parseFloat(stock.changePercent) >= 0;
            const isStarred = watchlistSymbols.has(stock.symbol);
            return (
              <div
                key={stock.id}
                className="group relative bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 theme-light:border-slate-200 hover:border-cyan-400/60 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 glow-cyan"
              >
                {stock.isTrending && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[10px] font-bold rounded-full">
                    <Flame className="w-3 h-3 text-sky-400 fill-sky-400" />
                    TRENDING
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 theme-light:bg-slate-100 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 theme-light:text-sky-700 text-sm">
                      {stock.symbol}
                    </div>
                    <div>
                      <h4 className="font-bold text-white theme-light:text-slate-900 text-sm truncate max-w-[130px]">
                        {stock.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                        {stock.category}
                        {stock.isRealTime === true && (
                          <span className="inline-flex items-center gap-1 text-emerald-400" title="Live quote from Finnhub">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                        {stock.isRealTime === false && (
                          <span className="text-amber-400/80" title="Finnhub quote unavailable right now — showing last known price">
                            DELAYED
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWatchlist(stock.symbol)}
                    className="text-slate-500 hover:text-amber-400 transition p-1"
                  >
                    <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>

                {/* Price & Delta */}
                <div className="mb-4">
                  <div className="text-2xl font-black font-mono text-white theme-light:text-slate-900">
                    ${parseFloat(stock.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`inline-flex items-center text-xs font-bold mt-1 ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 mr-1" />
                    )}
                    {isUp ? "+" : ""}
                    {stock.changePercent}%
                  </div>
                </div>

                {/* Action Controls */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-cyan-500/20 theme-light:border-slate-100">
                  <button
                    onClick={() => setActiveDetailStock(stock)}
                    className="py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 theme-light:bg-slate-100 theme-light:hover:bg-slate-200 text-cyan-300 theme-light:text-slate-800 text-xs font-bold rounded-lg border border-cyan-500/20 transition"
                  >
                    Chart & Specs
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTradeStock(stock);
                      setIsTradeModalOpen(true);
                    }}
                    className="py-1.5 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-black font-black text-xs rounded-lg shadow transition flex items-center justify-center gap-1 glow-cyan"
                  >
                    <Zap className="w-3 h-3 fill-black" />
                    Trade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#090e1d] theme-light:bg-white rounded-2xl border border-cyan-500/20 theme-light:border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cyan-950/40 theme-light:bg-slate-100 text-cyan-400 theme-light:text-slate-600 border-b border-cyan-500/20">
              <tr>
                <th className="p-3">ASSET</th>
                <th className="p-3">PRICE</th>
                <th className="p-3">24H CHANGE</th>
                <th className="p-3">HIGH / LOW</th>
                <th className="p-3">VOLUME</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10 theme-light:divide-slate-100">
              {stocks.map((stock) => {
                const isUp = parseFloat(stock.changePercent) >= 0;
                const isStarred = watchlistSymbols.has(stock.symbol);
                return (
                  <tr key={stock.id} className="hover:bg-cyan-950/20 theme-light:hover:bg-slate-50 transition">
                    <td className="p-3 flex items-center gap-2">
                      <button onClick={() => toggleWatchlist(stock.symbol)}>
                        <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                      </button>
                      <div>
                        <div className="font-bold text-white theme-light:text-slate-900 flex items-center gap-1.5">
                          {stock.symbol}
                          {stock.isRealTime === true && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live quote from Finnhub" />
                          )}
                          {stock.isRealTime === false && (
                            <span className="text-[9px] text-amber-400/80 font-mono" title="Finnhub quote unavailable right now — showing last known price">
                              DELAYED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">{stock.name}</div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-white theme-light:text-slate-900">
                      ${parseFloat(stock.currentPrice).toFixed(2)}
                    </td>
                    <td className={`p-3 font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                      {isUp ? "+" : ""}{stock.changePercent}%
                    </td>
                    <td className="p-3 text-slate-300 theme-light:text-slate-700">
                      ${stock.high24h} / ${stock.low24h}
                    </td>
                    <td className="p-3 text-slate-400">
                      {parseInt(stock.volume).toLocaleString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setActiveDetailStock(stock)}
                        className="px-2.5 py-1 bg-slate-800 text-cyan-300 rounded text-[11px] font-bold"
                      >
                        Chart
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTradeStock(stock);
                          setIsTradeModalOpen(true);
                        }}
                        className="px-3 py-1 bg-cyan-500 text-black font-black rounded text-[11px] shadow glow-cyan"
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

      {/* Interactive Chart Modal */}
      <StockDetailModal stock={activeDetailStock} onClose={() => setActiveDetailStock(null)} />
    </div>
  );
};
