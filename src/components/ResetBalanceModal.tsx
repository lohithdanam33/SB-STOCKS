"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { X, RotateCcw, DollarSign, Sparkles } from "lucide-react";

interface ResetBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetBalanceModal: React.FC<ResetBalanceModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, triggerToast } = useApp();
  const [customAmount, setCustomAmount] = useState("100000");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleReset = async (amount: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/reset-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Virtual capital updated to $${amount.toLocaleString()}`, "success");
        await refreshUser();
        onClose();
      } else {
        triggerToast(data.error || "Failed to reset funds", "error");
      }
    } catch (err) {
      console.error("Reset funds error:", err);
      triggerToast("Failed to reset funds", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#0b1120] theme-light:bg-white border border-cyan-500/40 theme-light:border-slate-300 rounded-2xl shadow-2xl p-6 glow-cyan">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white theme-light:hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <RotateCcw className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-black text-white theme-light:text-slate-900 tracking-tight">
            RECHARGE VIRTUAL CAPITAL
          </h2>
          <p className="text-xs text-cyan-300/80 theme-light:text-slate-600 mt-1">
            Top up or reset your practice account virtual funds
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-slate-300 theme-light:text-slate-700">
            PRESET CAPITAL PACKAGES:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleReset(100000)}
              disabled={loading}
              className="py-2.5 px-3 bg-cyan-950/40 hover:bg-cyan-900/60 theme-light:bg-sky-50 theme-light:hover:bg-sky-100 border border-cyan-500/30 text-cyan-300 theme-light:text-sky-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              $100,000 (Standard)
            </button>
            <button
              onClick={() => handleReset(500000)}
              disabled={loading}
              className="py-2.5 px-3 bg-sky-950/40 hover:bg-sky-900/60 theme-light:bg-sky-50 theme-light:hover:bg-sky-100 border border-sky-500/30 text-sky-300 theme-light:text-sky-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              $500,000 (Whale)
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
              CUSTOM AMOUNT ($)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="250000"
                className="flex-1 px-3 py-2 bg-slate-900 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-xl text-sm text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleReset(parseFloat(customAmount) || 100000)}
                disabled={loading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow glow-cyan transition"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
