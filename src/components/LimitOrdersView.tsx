"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Clock, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface LimitOrder {
  id: string;
  stockSymbol: string;
  type: "BUY" | "SELL";
  targetPrice: string;
  quantity: string;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  createdAt: string;
}

export const LimitOrdersView = () => {
  const { user, triggerToast } = useApp();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/limit-orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.error("Fetch limit orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/limit-orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Limit order cancelled", "info");
        fetchOrders();
      } else {
        triggerToast(data.error || "Failed to cancel order", "error");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      triggerToast("Failed to cancel order", "error");
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20 max-w-lg mx-auto">
        <Clock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white theme-light:text-slate-900 mb-2">
          LIMIT ORDERS MANAGER
        </h3>
        <p className="text-xs text-slate-400">Log in to view and manage pending automated limit buy/sell orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-white theme-light:text-slate-900 flex items-center gap-2">
        <Clock className="w-5 h-5 text-sky-400" />
        PENDING & AUTOMATED LIMIT ORDERS
      </h3>

      {loading ? (
        <div className="p-12 text-center text-cyan-400 font-mono text-xs">
          CHECKING LIMIT ORDER TRIGGER ENGINE...
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No limit orders placed yet.</p>
        </div>
      ) : (
        <div className="bg-[#090e1d] theme-light:bg-white rounded-2xl border border-cyan-500/20 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-cyan-950/40 theme-light:bg-slate-100 text-cyan-400 theme-light:text-slate-600 border-b border-cyan-500/20">
              <tr>
                <th className="p-3">ASSET</th>
                <th className="p-3">TYPE</th>
                <th className="p-3">TARGET PRICE</th>
                <th className="p-3">QUANTITY</th>
                <th className="p-3">EST. AMOUNT</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10 theme-light:divide-slate-100">
              {orders.map((o) => {
                const total = parseFloat(o.targetPrice) * parseFloat(o.quantity);
                return (
                  <tr key={o.id} className="hover:bg-cyan-950/20 theme-light:hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-white theme-light:text-slate-900">
                      {o.stockSymbol}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          o.type === "BUY"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {o.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white theme-light:text-slate-900">
                      ${parseFloat(o.targetPrice).toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-300">{parseFloat(o.quantity).toFixed(4)}</td>
                    <td className="p-3 font-mono text-cyan-300">${total.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          o.status === "PENDING"
                            ? "text-amber-400"
                            : o.status === "EXECUTED"
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded text-[11px] font-bold border border-rose-500/30"
                        >
                          Cancel
                        </button>
                      )}
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
