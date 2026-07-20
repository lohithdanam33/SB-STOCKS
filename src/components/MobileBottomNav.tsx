"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { TrendingUp, Wallet, Star, GraduationCap, ShieldCheck } from "lucide-react";

export const MobileBottomNav = () => {
  const { activeTab, setActiveTab, user } = useApp();

  const tabs = [
    { id: "markets", label: "Markets", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: Wallet },
    { id: "watchlist", label: "Watchlist", icon: Star },
    ...(user?.role === "admin"
      ? [{ id: "admin", label: "Admin", icon: ShieldCheck }]
      : []),
    { id: "learn", label: "Learn", icon: GraduationCap },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060a14]/95 theme-light:bg-white/95 backdrop-blur-lg border-t border-cyan-500/20 theme-light:border-slate-200 px-2 py-1.5 flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive
                ? "text-cyan-400 theme-light:text-sky-600 font-bold scale-105"
                : "text-slate-400 theme-light:text-slate-500"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
