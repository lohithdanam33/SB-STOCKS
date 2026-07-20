"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { X, ShieldAlert, User, Lock, Mail, Sparkles, UserCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { refreshUser, triggerToast } = useApp();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Logged in successfully!", "success");
        await refreshUser();
        onClose();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Logged in as ${data.user.name} (${data.user.role.toUpperCase()})`, "success");
        await refreshUser();
        onClose();
      } else {
        setError(data.error || "Demo login failed");
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0b1120] theme-light:bg-white border border-cyan-500/40 theme-light:border-slate-300 rounded-2xl shadow-2xl p-6 glow-cyan">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white theme-light:hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white theme-light:text-slate-900 tracking-tight">
            SB STOCKS ACCESS GRID
          </h2>
          <p className="text-xs text-cyan-300/80 theme-light:text-slate-600 mt-1">
            {mode === "login" ? "Sign in to access virtual trading terminal" : "Create new paper trading account with $100,000"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-cyan-950/40 theme-light:bg-slate-100 border border-cyan-500/20 rounded-xl mb-6">
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2 text-sm font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-cyan-500 text-black shadow-lg glow-cyan"
                : "text-slate-400 hover:text-white theme-light:text-slate-600"
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2 text-sm font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-cyan-500 text-black shadow-lg glow-cyan"
                : "text-slate-400 hover:text-white theme-light:text-slate-600"
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Demo buttons */}
        <div className="mb-6 p-3 bg-cyan-950/20 theme-light:bg-sky-50 border border-cyan-500/30 theme-light:border-sky-200 rounded-xl">
          <p className="text-xs font-semibold text-cyan-400 theme-light:text-sky-800 mb-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            1-CLICK DEMO ACCESS:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("trader@tron.com", "trader123")}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 theme-light:bg-sky-600 theme-light:hover:bg-sky-700 text-cyan-300 theme-light:text-white text-xs font-bold rounded-lg border border-cyan-500/30 transition"
            >
              Demo Trader
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin@tron.com", "admin123")}
              className="py-1.5 px-3 bg-sky-950/60 hover:bg-sky-900/60 theme-light:bg-sky-600 theme-light:hover:bg-sky-700 text-sky-300 theme-light:text-white text-xs font-bold rounded-lg border border-sky-500/40 transition"
            >
              System Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Flynn Rider"
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/80 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-lg text-sm text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@tron.com"
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-lg text-sm text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 theme-light:text-slate-700 mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 theme-light:bg-slate-50 border border-cyan-500/30 theme-light:border-slate-300 rounded-lg text-sm text-white theme-light:text-slate-900 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-sm rounded-xl transition shadow-lg glow-cyan disabled:opacity-50 mt-2"
          >
            {loading
              ? "AUTHENTICATING..."
              : mode === "login"
              ? "INITIALIZE SESSION"
              : "CREATE TRADER PROFILE ($100K)"}
          </button>
        </form>
      </div>
    </div>
  );
};
