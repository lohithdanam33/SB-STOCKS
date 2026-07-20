"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  virtualBalance: string;
  avatarUrl?: string;
  totalHoldingsValuation?: string;
  totalNetWorth?: string;
  holdingsCount?: number;
}

export interface StockItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
  currentPrice: string;
  previousClose: string;
  high24h: string;
  low24h: string;
  changePercent: string;
  volume: string;
  description?: string;
  logoUrl?: string;
  isCustomAdmin?: boolean;
  isTrending?: boolean;
  isRealTime?: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  loadingUser: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
  refreshUser: () => Promise<void>;
  logoutUser: () => Promise<void>;
  selectedTradeStock: StockItem | null;
  setSelectedTradeStock: (stock: StockItem | null) => void;
  isTradeModalOpen: boolean;
  setIsTradeModalOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  watchlistSymbols: Set<string>;
  toggleWatchlist: (symbol: string) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
  toast: { msg: string; type: "success" | "error" | "info" } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedTradeStock, setSelectedTradeStock] = useState<StockItem | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("markets"); // "markets", "portfolio", "watchlist", "orders", "history", "admin", "learn"
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const refreshWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlistSymbols(new Set());
      return;
    }
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        if (data.watchlist) {
          const syms = new Set<string>(data.watchlist.map((w: { symbol: string }) => w.symbol));
          setWatchlistSymbols(syms);
        }
      }
    } catch (err) {
      console.error("Failed to refresh watchlist:", err);
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      refreshWatchlist();
    }
  }, [user, refreshWatchlist]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const logoutUser = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setWatchlistSymbols(new Set());
      triggerToast("Logged out successfully", "info");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const toggleWatchlist = async (symbol: string): Promise<boolean> => {
    if (!user) {
      triggerToast("Please log in to add items to your watchlist", "error");
      return false;
    }
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockSymbol: symbol }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message, data.isWatchlisted ? "success" : "info");
        setWatchlistSymbols(prev => {
          const updated = new Set(prev);
          if (data.isWatchlisted) {
            updated.add(symbol);
          } else {
            updated.delete(symbol);
          }
          return updated;
        });
        return data.isWatchlisted;
      } else {
        triggerToast(data.error || "Failed to update watchlist", "error");
        return false;
      }
    } catch (err) {
      console.error("Watchlist toggle error:", err);
      triggerToast("Failed to toggle watchlist", "error");
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        theme,
        toggleTheme,
        refreshUser,
        logoutUser,
        selectedTradeStock,
        setSelectedTradeStock,
        isTradeModalOpen,
        setIsTradeModalOpen,
        activeTab,
        setActiveTab,
        watchlistSymbols,
        toggleWatchlist,
        refreshWatchlist,
        triggerToast,
        toast,
      }}
    >
      <div className={theme === "light" ? "theme-light" : "theme-dark"}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};
