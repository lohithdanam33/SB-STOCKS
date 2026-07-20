"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 animate-bounce">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${
          isSuccess
            ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 glow-green"
            : isError
            ? "bg-rose-950/90 text-rose-300 border-rose-500/50 glow-red"
            : "bg-cyan-950/90 text-cyan-300 border-cyan-500/50 glow-cyan"
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
        <span className="text-sm font-medium">{toast.msg}</span>
      </div>
    </div>
  );
};
