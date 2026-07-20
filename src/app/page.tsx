"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { LiveTickerBar } from "@/components/LiveTickerBar";
import { Navbar } from "@/components/Navbar";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { MarketOverview } from "@/components/MarketOverview";
import { PortfolioView } from "@/components/PortfolioView";
import { WatchlistView } from "@/components/WatchlistView";
import { LimitOrdersView } from "@/components/LimitOrdersView";
import { TransactionsHistoryView } from "@/components/TransactionsHistoryView";
import { AdminPanel } from "@/components/AdminPanel";
import { LearnView } from "@/components/LearnView";
import { TradeExecutionModal } from "@/components/TradeExecutionModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Toast } from "@/components/Toast";

export default function HomePage() {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen tron-grid bg-[#070b14] theme-light:bg-slate-50 text-slate-100 theme-light:text-slate-900 pb-20 lg:pb-12">
      <LiveTickerBar />
      <Navbar />
      <BroadcastBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "markets" && <MarketOverview />}
        {activeTab === "portfolio" && <PortfolioView />}
        {activeTab === "watchlist" && <WatchlistView />}
        {activeTab === "orders" && <LimitOrdersView />}
        {activeTab === "history" && <TransactionsHistoryView />}
        {activeTab === "admin" && <AdminPanel />}
        {activeTab === "learn" && <LearnView />}
      </main>

      <TradeExecutionModal />
      <Toast />
      <MobileBottomNav />
    </div>
  );
}
