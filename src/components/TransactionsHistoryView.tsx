"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { History, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

interface TransactionItem {
  id: string;
  stockSymbol: string;
  stockName: string;
  type: "BUY" | "SELL";
  orderType: string;
  quantity: string;
  pricePerShare: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

export const TransactionsHistoryView = () => {
  const { user } = useApp();
  const [trxs, setTrxs] = useState<TransactionItem[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTrxs(data.transactions);
        }
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20 max-w-lg mx-auto">
        <History className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white theme-light:text-slate-900 mb-2">
          AUDIT LOG HISTORY
        </h3>
        <p className="text-xs text-slate-400">Please sign in to inspect your order transaction audit log.</p>
      </div>
    );
  }

  const filteredTrxs = trxs.filter(
    (t) =>
      t.stockSymbol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.stockName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-black text-white theme-light:text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          TRADE TRANSACTION HISTORY AUDIT LOG ({trxs.length})
        </h3>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by symbol, type..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 theme-light:bg-white border border-cyan-500/30 theme-light:border-slate-300 rounded-xl text-xs text-white theme-light:text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-cyan-400 font-mono text-xs">
          FETCHING TRANSACTION AUDIT RECORDS...
        </div>
      ) : filteredTrxs.length === 0 ? (
        <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20">
          <p className="text-slate-400 text-sm">No transaction records match your filter.</p>
        </div>
      ) : (
        <div className="bg-[#090e1d] theme-light:bg-white rounded-2xl border border-cyan-500/20 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cyan-950/40 theme-light:bg-slate-100 text-cyan-400 theme-light:text-slate-600 border-b border-cyan-500/20">
              <tr>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">SYMBOL</th>
                <th className="p-3">SIDE</th>
                <th className="p-3">ORDER TYPE</th>
                <th className="p-3">QTY</th>
                <th className="p-3">EXECUTION PRICE</th>
                <th className="p-3">TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10 theme-light:divide-slate-100">
              {filteredTrxs.map((t) => {
                const isBuy = t.type === "BUY";
                return (
                  <tr key={t.id} className="hover:bg-cyan-950/20 theme-light:hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-400">
                      {new Date(t.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 font-bold text-white theme-light:text-slate-900">
                      {t.stockSymbol}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          isBuy ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{t.orderType}</td>
                    <td className="p-3 text-slate-300">{parseFloat(t.quantity).toFixed(4)}</td>
                    <td className="p-3 text-slate-300">${parseFloat(t.pricePerShare).toFixed(2)}</td>
                    <td className="p-3 font-bold text-white theme-light:text-slate-900">
                      ${parseFloat(t.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
