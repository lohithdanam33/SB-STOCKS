"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  BarChart3,
  ShieldAlert,
  Layers,
  BookOpen,
  Target,
  AlertTriangle,
  ChevronDown,
  LineChart,
  Wallet,
  Scale,
  Sparkles,
} from "lucide-react";

interface LearnSection {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
}

/**
 * Expandable "Go Deeper" block. Keeps the default view short and simple,
 * while letting anyone who wants more detail expand real, sourced context
 * (SEC / FINRA / Investor.gov, not generic filler) without cluttering the
 * quick read for everyone else.
 */
const GoDeeper = ({ source, children }: { source: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 pt-4 border-t border-cyan-500/10 theme-light:border-slate-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400 theme-light:text-sky-700 hover:text-sky-300 transition"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {open ? "Hide deep dive" : "Go deeper"}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 bg-sky-950/20 theme-light:bg-sky-50 border border-sky-500/10 theme-light:border-sky-200 rounded-xl p-4">
          {children}
          <p className="text-[10px] text-slate-500 theme-light:text-slate-400 font-mono pt-1 border-t border-sky-500/10 theme-light:border-sky-200">
            Source: {source}
          </p>
        </div>
      )}
    </div>
  );
};

export const LearnView = () => {
  const [openId, setOpenId] = useState<string>("basics");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? "" : id));

  const sections: LearnSection[] = [
    {
      id: "basics",
      title: "1. Stock Market Basics",
      icon: BookOpen,
      summary: "What a stock actually is, and how buying and selling works",
      content: (
        <div className="space-y-3">
          <p>
            A <b>stock</b> (or share) represents a small piece of ownership in a company. When you buy a share of a
            company, you own a fraction of that business — its profits, its losses, and (for some companies) a vote
            on major decisions.
          </p>
          <p>
            Companies list their shares on <b>exchanges</b> — like the NYSE or NASDAQ in the US — so investors can
            buy and sell them. Every listed stock has a <b>ticker symbol</b>, a short code used to identify it (e.g.
            <code className="mx-1 px-1.5 py-0.5 bg-cyan-500/10 rounded text-cyan-300">AAPL</code> for Apple,
            <code className="mx-1 px-1.5 py-0.5 bg-cyan-500/10 rounded text-cyan-300">TSLA</code> for Tesla).
          </p>
          <p>
            Prices move constantly during market hours based on <b>supply and demand</b>: if more people want to buy
            a stock than sell it, the price rises; if more want to sell than buy, it falls. That buying/selling
            pressure is driven by company earnings, news, interest rates, investor sentiment, and countless other
            factors — which is why prices are hard to predict.
          </p>
          <GoDeeper source="U.S. SEC — Investor.gov, 'How Stock Markets Work' & 'Role of the SEC'">
            <p>
              A stock exchange works like a continuous auction: every completed trade pairs exactly one buyer with
              one seller, so shares don&apos;t appear or disappear — they just change hands. When a company first
              sells shares to the public (an IPO), that&apos;s the <b>primary market</b>. Almost everything you trade
              day-to-day afterward happens in the <b>secondary market</b>, where investors trade existing shares
              among themselves.
            </p>
            <p>
              Owning a share that&apos;s gone up only gives you a paper profit — an <b>unrealized gain</b> — while
              you hold it. It doesn&apos;t become real money until you actually sell and lock it in.
            </p>
            <p>
              The rulebook behind all of this dates to the aftermath of the 1929 crash: Congress passed the
              Securities Act of 1933 and the Securities Exchange Act of 1934, creating the U.S. Securities and
              Exchange Commission (SEC) specifically to protect investors and keep markets fair, orderly, and
              transparent.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "quote",
      title: "2. Reading a Stock Quote",
      icon: BarChart3,
      summary: "Price, change %, volume, high/low — what each number means",
      content: (
        <div className="space-y-3">
          <p>Every stock card or ticker on this platform shows a handful of core numbers:</p>
          <ul className="space-y-2 list-disc list-inside marker:text-cyan-400">
            <li><b>Current Price</b> — the price of the most recent trade.</li>
            <li><b>Change %</b> — how much the price has moved since the previous session's close, shown as a percentage.</li>
            <li><b>Previous Close</b> — the final price from the prior trading session, used as the baseline for change %.</li>
            <li><b>Day High / Day Low</b> — the highest and lowest prices the stock has traded at during the current session.</li>
            <li><b>Volume</b> — the number of shares traded. High volume usually means high interest/liquidity; low volume can mean a price move is less reliable.</li>
            <li><b>Market Cap</b> — share price × total shares outstanding. It's a rough measure of how big a company is (e.g. "large-cap" vs "small-cap").</li>
          </ul>
          <GoDeeper source="U.S. SEC — Investor.gov, 'Stocks — FAQs'">
            <p>
              Behind every quoted price sits a <b>bid</b> (the highest price a buyer is currently offering) and an{" "}
              <b>ask</b> (the lowest price a seller will currently accept). The gap between them — the{" "}
              <b>bid-ask spread</b> — tends to be narrow on high-volume, liquid stocks and wider on thinly-traded
              ones, since there are fewer buyers and sellers to match up.
            </p>
            <p>
              Most quote pages also show a <b>52-week high/low</b> alongside the day&apos;s range, giving you a
              longer-term frame of reference. Market cap splits companies into rough tiers — large-cap, mid-cap,
              small-cap, and the smallest micro-cap names. Regulators specifically flag very low-priced,
              least-established shares (often called <b>penny stocks</b>) as highly speculative, since they
              frequently have little or no earnings behind them and don&apos;t pay dividends.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "orders",
      title: "3. Order Types: Market vs Limit",
      icon: Layers,
      summary: "The two order types available on this platform, explained",
      content: (
        <div className="space-y-3">
          <p>
            <b>Market Order</b> — executes immediately at the current market price. You're prioritizing speed of
            execution over price precision. This is what happens when you use the quick Buy/Sell trade panel here.
          </p>
          <p>
            <b>Limit Order</b> — you set a target price, and the order only executes once the market reaches it. A
            limit <i>buy</i> order fills at or below your target price; a limit <i>sell</i> order fills at or above
            it. This gives you price control, but there's no guarantee the market ever reaches your target — the
            order can sit pending indefinitely (or you can cancel it).
          </p>
          <p className="text-slate-400 theme-light:text-slate-600">
            Try both from the Markets tab — the Limit Orders tab shows any that are still pending and lets you
            cancel them.
          </p>
          <GoDeeper source="U.S. SEC — Investor.gov, 'Types of Orders' & FINRA, 'Order Types'">
            <p>
              Real brokers typically offer more order types than this platform simulates. A <b>stop order</b>{" "}
              (or stop-loss order) sits dormant until the stock trades at your chosen stop price, at which point it
              automatically converts into a market order — useful because you don&apos;t have to watch the market
              constantly, though the eventual fill price can drift from the stop price during a fast-moving session.
            </p>
            <p>
              A <b>stop-limit order</b> fixes that gap: once triggered, it becomes a limit order instead of a market
              order, restoring price control at the cost of a small chance it never fills at all. A{" "}
              <b>trailing stop</b> automatically resets its trigger price as the stock moves in your favor, aiming
              to lock in gains while still leaving room for further upside.
            </p>
            <p>
              Orders also carry time conditions: a <b>day order</b> expires automatically at the close if it hasn&apos;t
              filled, while a <b>good-til-canceled (GTC)</b> order stays live until it either fills or you cancel it
              yourself.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "charts",
      title: "4. Reading Stock Charts",
      icon: LineChart,
      summary: "Trends, timeframes, and what price history can (and can't) tell you",
      content: (
        <div className="space-y-3">
          <p>
            A stock chart plots price over time. Zooming out (1M, 1Y, ALL) shows the long-term <b>trend</b> — is the
            stock generally climbing, falling, or moving sideways? Zooming in (1D) shows short-term volatility and
            intraday swings.
          </p>
          <p>
            Two patterns worth knowing: <b>support</b> is a price level a stock tends to bounce off of when falling
            (buyers step in); <b>resistance</b> is a level it struggles to break above (sellers step in). Neither is
            guaranteed — they're just historical tendencies, not rules.
          </p>
          <p className="text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            Important: past price movement does not predict future performance. Charts describe what happened, not
            what will happen next.
          </p>
          <GoDeeper source="Standard SEC/FINRA investor-disclosure language; general charting conventions">
            <p>
              A common chart companion is the <b>moving average</b> — the average closing price over a set window,
              like 50 or 200 days — which smooths out day-to-day noise so the underlying trend is easier to read at
              a glance. Many traders also use <b>candlestick charts</b>, where each "candle" encodes a period&apos;s
              open, close, high, and low in one shape, giving more information per glance than a simple line
              connecting closing prices.
            </p>
            <p>
              None of these tools predict what comes next — they describe what already happened. It&apos;s why
              virtually every brokerage disclosure and regulator warning repeats some version of the same line:
              past performance does not guarantee future results.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "metrics",
      title: "5. Key Metrics & Ratios",
      icon: Scale,
      summary: "P/E ratio, EPS, dividend yield, and other fundamentals",
      content: (
        <div className="space-y-3">
          <ul className="space-y-2 list-disc list-inside marker:text-cyan-400">
            <li><b>EPS (Earnings Per Share)</b> — a company's profit divided by its number of shares. Higher generally signals stronger profitability.</li>
            <li><b>P/E Ratio (Price-to-Earnings)</b> — share price ÷ EPS. A rough gauge of whether a stock is "expensive" relative to its earnings. A high P/E can mean investors expect strong future growth — or that the stock is overvalued.</li>
            <li><b>Dividend Yield</b> — annual dividend payments ÷ share price. Shows how much cash income a stock pays out relative to its cost, expressed as a percentage.</li>
            <li><b>Beta / Volatility</b> — how much a stock's price swings relative to the overall market. A beta above 1 means it tends to move more sharply than the market; below 1 means it's calmer.</li>
          </ul>
          <GoDeeper source="Standard financial-statement definitions used across SEC filings and brokerages">
            <p>
              EPS is technically <b>(net income − preferred dividends) ÷ weighted average shares outstanding</b> —
              a per-share slice of what the company actually earned in a period. P/E ratio comes in two common
              flavors worth knowing apart: <b>trailing P/E</b> uses the last twelve months of actual reported
              earnings, while <b>forward P/E</b> uses analysts&apos; estimated future earnings — the same stock can
              look very differently priced depending on which one is quoted.
            </p>
            <p>
              Dividend yield only measures cash income, not total return — a stock can pay a 0% yield (many growth
              companies reinvest every dollar of profit instead of paying it out) and still be a strong long-term
              holding. Beta is always measured relative to a benchmark, most commonly the S&amp;P 500.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "risk",
      title: "6. Risk Management",
      icon: ShieldAlert,
      summary: "Diversification, position sizing, and protecting your capital",
      content: (
        <div className="space-y-3">
          <p>
            <b>Diversification</b> means spreading money across multiple stocks, sectors, or asset types instead of
            concentrating it in one bet — so a single bad outcome doesn't wipe you out.
          </p>
          <p>
            <b>Position sizing</b> is deciding how much of your total capital to put into any one trade. Many
            experienced investors avoid putting a large share of their portfolio into a single stock, precisely
            because any individual company can drop sharply on bad news.
          </p>
          <p>
            <b>Stop-loss</b> is a predefined price at which you'd exit a losing position to cap further downside —
            a discipline tool to prevent a small loss from becoming a large one.
          </p>
          <p>
            The most consistent rule across investing styles: <b>only risk money you can afford to lose</b>, and
            know why you're buying something before you buy it.
          </p>
          <GoDeeper source="U.S. SEC — Investor.gov & FINRA, 'Asset Allocation and Diversification'">
            <p>
              Asset allocation and diversification are related but distinct ideas. <b>Asset allocation</b> is how
              you split money across broad categories — stocks, bonds, cash. <b>Diversification</b> is spreading
              further within each category — different sectors, company sizes, and geographies — so a downturn in
              any one corner doesn&apos;t sink the whole portfolio. Regulators sum it up with the same old adage:
              don&apos;t put all your eggs in one basket.
            </p>
            <p>
              The right mix depends heavily on two personal factors: your <b>time horizon</b> (how long until you
              actually need the money) and your <b>risk tolerance</b> (how much short-term volatility you can
              stomach without abandoning the plan). That's why there's no single "correct" portfolio — it's
              genuinely personal.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "styles",
      title: "7. Common Trading & Investing Styles",
      icon: Target,
      summary: "Long-term investing, swing trading, and day trading compared",
      content: (
        <div className="space-y-3">
          <ul className="space-y-2 list-disc list-inside marker:text-cyan-400">
            <li><b>Long-term investing</b> — buying and holding for years, often based on a company's fundamentals and growth prospects. Lower time commitment, historically the more common approach for retail investors.</li>
            <li><b>Swing trading</b> — holding positions for days to weeks, aiming to capture medium-term price moves.</li>
            <li><b>Day trading</b> — opening and closing positions within the same day. Requires constant attention and carries higher risk and higher costs (fees, taxes on short-term gains in many jurisdictions).</li>
          </ul>
          <p className="text-slate-400 theme-light:text-slate-600">
            None of these is inherently "correct" — they suit different goals, time availability, and risk
            tolerance. This platform lets you practice all three with virtual money before ever risking real capital.
          </p>
          <GoDeeper source="U.S. SEC/FINRA rule filing (2026) & Investor.gov, 'Pattern Day Trader'">
            <p>
              Frequent short-term trading in the U.S. has long run into an extra regulatory layer. FINRA&apos;s{" "}
              <b>pattern day trader (PDT)</b> rule flagged any margin-account customer who made four or more day
              trades within five business days (where those trades were more than 6% of total trading activity),
              and required at least $25,000 in account equity to keep day trading — a rule in place since 2001.
            </p>
            <p>
              That changed recently: the SEC approved removing the $25,000 minimum in April 2026, with FINRA
              replacing the old framework with a different intraday-margin system. It&apos;s a useful reminder that
              the rules governing a real brokerage account can and do change over time — unlike this practice
              environment, which has no such restrictions.
            </p>
          </GoDeeper>
        </div>
      ),
    },
    {
      id: "glossary",
      title: "8. Glossary of Common Terms",
      icon: GraduationCap,
      summary: "Bull/bear market, liquidity, volatility, and more",
      content: (
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["Bull Market", "A sustained period of rising prices and investor optimism."],
            ["Bear Market", "A sustained period of falling prices, typically a 20%+ decline from recent highs."],
            ["Liquidity", "How easily an asset can be bought or sold without moving its price. High-volume stocks are generally liquid."],
            ["Volatility", "How sharply and frequently a price moves. High volatility means bigger swings in both directions."],
            ["Portfolio", "The full collection of assets (stocks, cash, etc.) an investor holds."],
            ["Diversification", "Spreading investments across different assets to reduce risk."],
            ["Blue-chip Stock", "Shares of a large, well-established, financially sound company."],
            ["IPO", "Initial Public Offering — the first time a company sells shares to the public."],
          ].map(([term, def]) => (
            <div key={term} className="p-3 bg-cyan-950/20 theme-light:bg-slate-50 border border-cyan-500/10 theme-light:border-slate-200 rounded-xl">
              <div className="text-cyan-300 theme-light:text-sky-700 font-bold text-xs mb-1">{term}</div>
              <div className="text-slate-400 theme-light:text-slate-600 text-xs leading-relaxed">{def}</div>
            </div>
          ))}
          <div className="sm:col-span-2">
            <GoDeeper source="U.S. SEC — Investor.gov Glossary & FINRA.org">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Bid / Ask", "The bid is the highest price a buyer currently offers; the ask is the lowest price a seller will accept. The gap between them is the spread."],
                  ["Margin", "Borrowing money from a broker to buy securities, using your existing holdings as collateral. It magnifies both gains and losses."],
                  ["Short Selling", "Borrowing shares to sell them now, hoping to buy them back later at a lower price. Losses are theoretically unlimited if the price rises instead."],
                  ["ETF (Exchange-Traded Fund)", "A fund holding a basket of securities that trades on an exchange like a single stock, often used to get instant diversification."],
                  ["Circuit Breaker", "An exchange-wide trading halt triggered automatically when a major index falls sharply, meant to curb panic selling."],
                  ["Ex-Dividend Date", "The cutoff date after which a new buyer of the stock will not receive the next declared dividend payment."],
                  ["Good-Til-Canceled (GTC)", "An order that stays active until it either executes or the investor manually cancels it, instead of expiring at the end of the day."],
                  ["Pattern Day Trader", "A FINRA classification for margin-account customers who make frequent day trades within a short window, historically tied to extra account requirements."],
                ].map(([term, def]) => (
                  <div key={term} className="p-3 bg-sky-950/10 theme-light:bg-white border border-sky-500/10 theme-light:border-sky-200 rounded-xl">
                    <div className="text-sky-300 theme-light:text-sky-700 font-bold text-xs mb-1">{term}</div>
                    <div className="text-slate-400 theme-light:text-slate-600 text-xs leading-relaxed">{def}</div>
                  </div>
                ))}
              </div>
            </GoDeeper>
          </div>
        </div>
      ),
    },
    {
      id: "platform",
      title: "9. How Practicing Here Maps to Real Trading",
      icon: Wallet,
      summary: "What's simulated here, and what carries over to real investing",
      content: (
        <div className="space-y-3">
          <p>
            You start with <b>$100,000 in virtual cash</b>. Prices you see are real, live quotes pulled from the
            Finnhub market data API — not simulated numbers — so the practice reps genuinely reflect what's
            happening in the market right now.
          </p>
          <p>
            Every buy, sell, and limit order here works mechanically the same way it would with a real broker: it
            checks your available balance, updates your holdings, and logs a transaction. The skills — reading
            quotes, sizing positions, using limit orders, tracking a portfolio's P&L — transfer directly to a real
            brokerage account.
          </p>
          <p>
            What's different: no real money is ever at risk, there are no brokerage fees or slippage modeled, and
            trades execute instantly regardless of real-world liquidity.
          </p>
          <GoDeeper source="SIPC.org, 'What SIPC Protects'">
            <p>
              A real brokerage account carries protections this simulator doesn&apos;t need to model. In the U.S.,
              the Securities Investor Protection Corporation (SIPC) covers up to <b>$500,000 in securities and
              cash per customer</b> (with a $250,000 sub-limit specifically for cash) if a SIPC-member brokerage
              itself fails and customer assets go missing.
            </p>
            <p>
              Crucially, SIPC does <b>not</b> protect against a stock simply losing value — it only steps in when a
              broker-dealer collapses and can&apos;t return what you&apos;re owed. That distinction — protection
              against firm failure, not against market risk — is worth understanding before you ever fund a real
              account.
            </p>
          </GoDeeper>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#090e1d] theme-light:bg-white rounded-3xl border border-cyan-500/30 theme-light:border-slate-200 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white theme-light:text-slate-900 tracking-wide">
              LEARN TO TRADE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              STOCK MARKET FUNDAMENTALS, FROM TICKER SYMBOLS TO RISK MANAGEMENT
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          This content is for general education only and is not financial advice. Nothing here is a recommendation
          to buy or sell any specific security. Always do your own research, and consider talking to a licensed
          financial advisor before making real investment decisions.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openId === section.id;
          return (
            <div
              key={section.id}
              className="bg-[#090e1d] theme-light:bg-white rounded-2xl border border-cyan-500/20 theme-light:border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-cyan-500/5 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white theme-light:text-slate-900">{section.title}</div>
                    <div className="text-xs text-slate-400 theme-light:text-slate-500 truncate">{section.summary}</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 pt-1 text-xs text-slate-300 theme-light:text-slate-700 leading-relaxed border-t border-cyan-500/10">
                  <div className="pt-4">{section.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
