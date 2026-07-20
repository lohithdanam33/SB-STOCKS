import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SB STOCKS - Cyber 80s Virtual Stock Trading Platform",
  description: "Real-time fullstack paper trading platform with $100,000 virtual capital, Finnhub market streams, portfolio management, and a retro synth aesthetic.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
