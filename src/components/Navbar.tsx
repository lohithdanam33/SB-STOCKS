"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AuthModal } from "./AuthModal";
import { ResetBalanceModal } from "./ResetBalanceModal";
import {
  TrendingUp,
  Wallet,
  Star,
  Clock,
  History,
  ShieldCheck,
  GraduationCap,
  Sun,
  Moon,
  RotateCcw,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

// Masks an email like "leo@example.com" -> "l•••@e••••••.com"
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••••••";
  const domainParts = domain.split(".");
  const domainName = domainParts[0] ?? "";
  const tld = domainParts.slice(1).join(".");
  const maskedLocal = local.length <= 1 ? "•" : local[0] + "•".repeat(Math.max(local.length - 1, 3));
  const maskedDomain = domainName.length <= 1 ? "•" : domainName[0] + "•".repeat(Math.max(domainName.length - 1, 3));
  return `${maskedLocal}@${maskedDomain}${tld ? "." + tld : ""}`;
}

export const Navbar = () => {
  const { user, theme, toggleTheme, logoutUser, activeTab, setActiveTab } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside click or Escape
  useEffect(() => {
    if (!isProfileOpen) return;

    const closeDropdown = () => {
      setIsProfileOpen(false);
      setIsEmailRevealed(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  const navItems = [
    { id: "markets", label: "MARKETS", icon: TrendingUp },
    { id: "portfolio", label: "PORTFOLIO", icon: Wallet },
    { id: "watchlist", label: "WATCHLIST", icon: Star },
    { id: "orders", label: "LIMIT ORDERS", icon: Clock },
    { id: "history", label: "HISTORY", icon: History },
    ...(user?.role === "admin"
      ? [{ id: "admin", label: "ADMIN GRID", icon: ShieldCheck }]
      : []),
    { id: "learn", label: "LEARN", icon: GraduationCap },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#060a14]/90 theme-light:bg-white/90 backdrop-blur-md border-b border-cyan-500/20 theme-light:border-slate-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("markets")}
                className="flex items-center gap-2 group text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-sky-500 p-0.5 glow-cyan transition-transform group-hover:scale-105">
                  <div className="w-full h-full bg-[#070b14] theme-light:bg-white rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-400 theme-light:text-sky-600" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black tracking-widest bg-gradient-to-r from-cyan-400 via-sky-300 to-sky-400 theme-light:from-sky-700 theme-light:to-blue-800 bg-clip-text text-transparent">
                    SB<span className="font-light"> STOCKS</span>
                  </div>
                  <div className="text-[9px] font-mono tracking-wider text-cyan-400/80 theme-light:text-slate-500 -mt-1">
                    80S SYNTH TRADING
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop Nav Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-cyan-950/20 theme-light:bg-slate-100/80 p-1 rounded-xl border border-cyan-500/20 theme-light:border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan theme-light:bg-sky-600 theme-light:text-white theme-light:border-sky-600"
                        : "text-slate-400 hover:text-slate-200 theme-light:text-slate-600 theme-light:hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Status Control Pill */}
            <div className="flex items-center gap-3">
              {/* User Balance Banner */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-cyan-950/30 theme-light:bg-slate-100 border border-cyan-500/30 theme-light:border-slate-300 rounded-xl">
                  <div className="text-right">
                    <div className="text-[10px] text-cyan-400 theme-light:text-slate-500 font-mono">
                      PAPER CASH
                    </div>
                    <div className="text-xs font-mono font-bold text-cyan-300 theme-light:text-slate-900">
                      ${parseFloat(user.virtualBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsResetOpen(true)}
                    title="Reset Virtual Practice Funds"
                    className="p-1 rounded-lg text-cyan-400 hover:bg-cyan-500/20 theme-light:text-slate-600 theme-light:hover:bg-slate-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-cyan-950/30 theme-light:bg-slate-100 border border-cyan-500/30 theme-light:border-slate-300 text-cyan-400 theme-light:text-slate-700 hover:scale-105 transition"
                title={theme === "dark" ? "Switch to Clean Light Theme" : "Switch to Cyber Dark 80s Theme"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* User Pill or Auth Trigger */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() =>
                      setIsProfileOpen((v) => {
                        if (v) setIsEmailRevealed(false); // closing — re-mask for next time
                        return !v;
                      })
                    }
                    aria-haspopup="true"
                    aria-expanded={isProfileOpen}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 theme-light:bg-sky-50 border border-cyan-500/40 theme-light:border-sky-300 rounded-xl text-xs font-bold text-cyan-300 theme-light:text-sky-900 glow-cyan"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400 theme-light:text-sky-600" />
                    <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.name}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0b1120] theme-light:bg-white border border-cyan-500/30 theme-light:border-slate-200 rounded-xl shadow-2xl p-2 z-50">
                      <div className="px-3 py-2 border-b border-cyan-500/20 theme-light:border-slate-100 mb-1">
                        <div className="text-xs font-bold text-white theme-light:text-slate-900">{user.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 theme-light:text-slate-500 truncate font-mono">
                            {isEmailRevealed ? user.email : maskEmail(user.email)}
                          </span>
                          <button
                            onClick={() => setIsEmailRevealed((v) => !v)}
                            title={isEmailRevealed ? "Hide email" : "Reveal email"}
                            className="p-0.5 rounded text-slate-400 hover:text-cyan-300 theme-light:hover:text-sky-600 shrink-0"
                          >
                            {isEmailRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="mt-1 inline-block px-1.5 py-0.5 bg-sky-500/20 text-sky-300 text-[9px] font-bold rounded">
                          {user.role.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logoutUser();
                          setIsProfileOpen(false);
                          setIsEmailRevealed(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 theme-light:hover:bg-rose-50 rounded-lg transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>End Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-black font-black text-xs rounded-xl transition shadow-lg glow-cyan"
                >
                  SIGN IN
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-cyan-950/30 theme-light:bg-slate-100 border border-cyan-500/30 text-cyan-400 theme-light:text-slate-700"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-cyan-500/20 theme-light:border-slate-200 bg-[#070b14] theme-light:bg-white px-4 py-3 space-y-2">
            {user && (
              <div className="p-3 bg-cyan-950/30 theme-light:bg-slate-100 rounded-xl border border-cyan-500/30 mb-2 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-cyan-400 theme-light:text-slate-500">PAPER CASH BALANCE</div>
                  <div className="text-sm font-mono font-bold text-cyan-300 theme-light:text-slate-900">
                    ${parseFloat(user.virtualBalance).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsResetOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30"
                >
                  Reset $100K
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold border transition ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 theme-light:bg-sky-600 theme-light:text-white"
                        : "bg-slate-900/40 text-slate-300 border-slate-800 theme-light:bg-slate-50 theme-light:text-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ResetBalanceModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
    </>
  );
};
