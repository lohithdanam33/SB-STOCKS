"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, X, Zap } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  message: string;
  alertType: string;
  createdBy: string;
  createdAt: string;
}

export const BroadcastBanner = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
      })
      .catch((err) => console.error("Alerts fetch error:", err));
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % alerts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [alerts]);

  if (dismissed || alerts.length === 0) return null;

  const alert = alerts[currentIdx];

  return (
    <div className="w-full bg-gradient-to-r from-sky-950/60 via-[#101935] to-cyan-950/60 theme-light:from-sky-100 theme-light:to-indigo-100 border-b border-sky-500/30 theme-light:border-sky-300 py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 theme-light:bg-sky-600 theme-light:text-white font-black text-[10px] rounded shrink-0 uppercase tracking-wider flex items-center gap-1">
            <Megaphone className="w-3 h-3" />
            {alert.alertType.replace("_", " ")}
          </span>
          <div className="truncate text-slate-200 theme-light:text-slate-900 font-medium">
            <span className="font-bold text-white theme-light:text-sky-900 mr-2">{alert.title}:</span>
            <span className="opacity-90">{alert.message}</span>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white theme-light:hover:text-slate-900 shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
