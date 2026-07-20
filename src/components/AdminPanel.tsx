"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Plus,
  Users,
  Database,
  Megaphone,
  BarChart,
  Edit2,
  Trash2,
  DollarSign,
  Flame,
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalStocks: number;
  totalTransactionsCount: number;
  totalHoldingsCount: number;
  totalCashInSystem: string;
  totalTransactionVolume: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  virtualBalance: string;
  createdAt: string;
}

export const AdminPanel = () => {
  const { user, triggerToast } = useApp();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<"catalog" | "users" | "alerts">("catalog");

  // Custom stock state
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Tech");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTrending, setNewTrending] = useState(false);

  // Alert state
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("ADMIN_NOTICE");

  const [loading, setLoading] = useState(false);

  const fetchStatsAndUsers = async () => {
    if (!user || user.role !== "admin") return;
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserList(usersData.users || []);
      }
    } catch (err) {
      console.error("Admin data load error:", err);
    }
  };

  useEffect(() => {
    fetchStatsAndUsers();
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="p-12 text-center bg-[#090f20] theme-light:bg-white rounded-2xl border border-cyan-500/20 max-w-lg mx-auto shadow-2xl">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white theme-light:text-slate-900 mb-2">
          ACCESS RESTRICTED: ADMIN LEVEL ONLY
        </h3>
        <p className="text-xs text-slate-400">
          Sign in using an administrator account (e.g. admin@tron.com / admin123) to access system controls.
        </p>
      </div>
    );
  }

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newName || !newPrice) {
      triggerToast("Symbol, name, and initial price are required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newSymbol,
          name: newName,
          category: newCategory,
          currentPrice: newPrice,
          description: newDesc,
          isTrending: newTrending,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Stock asset ${newSymbol.toUpperCase()} listed on exchange floor!`, "success");
        setNewSymbol("");
        setNewName("");
        setNewPrice("");
        setNewDesc("");
        fetchStatsAndUsers();
      } else {
        triggerToast(data.error || "Failed to create stock", "error");
      }
    } catch (err) {
      console.error("Create stock error:", err);
      triggerToast("Failed to create stock", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertMessage) {
      triggerToast("Alert title and message are required", "error");
      return;
    }

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: alertTitle, message: alertMessage, alertType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Alert broadcast published to system terminal!", "success");
        setAlertTitle("");
        setAlertMessage("");
      } else {
        triggerToast(data.error || "Failed to publish alert", "error");
      }
    } catch (err) {
      console.error("Alert error:", err);
      triggerToast("Failed to publish alert", "error");
    }
  };

  const handleUpdateUserBalance = async (userId: string, currentBal: string) => {
    const amount = prompt("Enter new virtual cash balance ($):", currentBal);
    if (!amount) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, virtualBalance: parseFloat(amount) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`User balance adjusted to $${parseFloat(amount).toLocaleString()}`, "success");
        fetchStatsAndUsers();
      } else {
        triggerToast(data.error || "Failed to update user", "error");
      }
    } catch (err) {
      console.error("Update user error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0d162d] via-[#121c38] to-[#1e0d29] rounded-3xl border border-cyan-500/40 glow-cyan">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wide">SYSTEM CONTROL GRID</h2>
            <p className="text-xs text-cyan-300 font-mono">ROLE-BASED MASTER ADMINISTRATION TERMINAL</p>
          </div>
        </div>
      </div>

      {/* Analytics Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            REGISTERED TRADERS
          </div>
          <div className="text-2xl font-black text-white theme-light:text-slate-900 font-mono">
            {stats ? stats.totalUsers : 0}
          </div>
        </div>

        <div className="p-4 bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            STOCK CATALOG SIZE
          </div>
          <div className="text-2xl font-black text-white theme-light:text-slate-900 font-mono">
            {stats ? stats.totalStocks : 0}
          </div>
        </div>

        <div className="p-4 bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            TOTAL SYSTEM VIRTUAL CASH
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${stats ? parseFloat(stats.totalCashInSystem).toLocaleString() : "0"}
          </div>
        </div>

        <div className="p-4 bg-[#090e1d] theme-light:bg-white border border-cyan-500/20 rounded-2xl">
          <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
            <BarChart className="w-3.5 h-3.5" />
            CUMULATIVE TRADE VOLUME
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            ${stats ? parseFloat(stats.totalTransactionVolume).toLocaleString() : "0"}
          </div>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex gap-2 p-1 bg-cyan-950/30 rounded-xl border border-cyan-500/20">
        <button
          onClick={() => setTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            tab === "catalog" ? "bg-cyan-500 text-black shadow glow-cyan" : "text-slate-400"
          }`}
        >
          CREATE & EDIT STOCKS
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            tab === "users" ? "bg-cyan-500 text-black shadow glow-cyan" : "text-slate-400"
          }`}
        >
          USER ACCOUNTS MANAGEMENT
        </button>
        <button
          onClick={() => setTab("alerts")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            tab === "alerts" ? "bg-cyan-500 text-black shadow glow-cyan" : "text-slate-400"
          }`}
        >
          BROADCAST MARKET ALERTS
        </button>
      </div>

      {/* Sub Tab Content */}
      {tab === "catalog" && (
        <div className="bg-[#090e1d] theme-light:bg-white p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-base font-bold text-white theme-light:text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            LIST NEW SYNTHETIC OR CUSTOM STOCK IPO
          </h3>

          <form onSubmit={handleCreateStock} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">SYMBOL (e.g. CYBER)</label>
              <input
                type="text"
                required
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="CYBER"
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ASSET / COMPANY NAME</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Cyberdyne Systems Corp"
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">INITIAL SPOT PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="150.00"
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="Tech">Tech</option>
                <option value="Crypto">Crypto</option>
                <option value="EV">EV</option>
                <option value="Retail">Retail</option>
                <option value="Finance">Finance</option>
                <option value="Indices">Indices</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">DESCRIPTION</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Brief summary of company operations..."
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="trendingCheck"
                checked={newTrending}
                onChange={(e) => setNewTrending(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
              />
              <label htmlFor="trendingCheck" className="text-xs text-slate-300 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-sky-400" /> Mark as Hot Trending Stock
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl shadow glow-cyan transition"
            >
              CREATE AND PUBLISH NEW STOCK
            </button>
          </form>
        </div>
      )}

      {tab === "users" && (
        <div className="bg-[#090e1d] theme-light:bg-white p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-base font-bold text-white theme-light:text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            TRADER USER ACCOUNTS REGISTRY
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-cyan-950/40 text-cyan-400 border-b border-cyan-500/20">
                <tr>
                  <th className="p-3">NAME</th>
                  <th className="p-3">EMAIL</th>
                  <th className="p-3">ROLE</th>
                  <th className="p-3">VIRTUAL CASH</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-cyan-950/20 transition">
                    <td className="p-3 font-bold text-white">{u.name}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      ${parseFloat(u.virtualBalance).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleUpdateUserBalance(u.id, u.virtualBalance)}
                        className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 text-[11px] font-bold rounded border border-cyan-500/30"
                      >
                        Adjust Cash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="bg-[#090e1d] theme-light:bg-white p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-base font-bold text-white theme-light:text-slate-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            BROADCAST FLOOR ANNOUNCEMENT
          </h3>

          <form onSubmit={handleBroadcastAlert} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ALERT TITLE</label>
              <input
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. BREAKING: Earnings Season Acceleration"
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ANNOUNCEMENT BODY</label>
              <textarea
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                rows={3}
                placeholder="Broadcast details sent to news feed..."
                className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs rounded-xl shadow glow-magenta transition"
            >
              PUBLISH BROADCAST ALERT
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
