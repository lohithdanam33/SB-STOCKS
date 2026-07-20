import { connectDB } from "@/db";
import { PriceSnapshot } from "@/db/models";
import { getHistoricalCandles, getIntradayCandles } from "@/lib/yahoo";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  high24h: number;
  low24h: number;
  changePercent: number;
  volume: number;
  isRealTime: true;
}

/**
 * Fetches a real, live quote from Finnhub. Returns null if Finnhub has no
 * data for the symbol, the request fails, or no API key is configured.
 * There is intentionally no simulated/random fallback here — if we can't
 * get a real quote, callers fall back to the last known price stored in
 * MongoDB rather than making one up.
 */
export async function fetchLiveStockQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn("FINNHUB_API_KEY is not set — cannot fetch real quotes.");
    return null;
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${apiKey}`,
      // Widened from 20s: with a ~56+ symbol catalog now in play, polling every
      // stock every 20s could exceed Finnhub's free 60-calls/minute limit.
      // 60s keeps per-symbol Finnhub calls to roughly (catalog size)/60 per
      // minute, comfortably under the limit even at "All" category volume,
      // while still refreshing quotes about once a minute.
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      console.warn(`Finnhub quote request failed for ${symbol}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    // c: current, pc: previous close, h: high, l: low, v: volume (not always present)
    if (!data || typeof data.c !== "number" || data.c <= 0) {
      return null;
    }

    const current = data.c;
    const prevClose = typeof data.pc === "number" && data.pc > 0 ? data.pc : current;
    const changePct = prevClose > 0 ? ((current - prevClose) / prevClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: Number(current.toFixed(2)),
      previousClose: Number(prevClose.toFixed(2)),
      high24h: Number((typeof data.h === "number" && data.h > 0 ? data.h : current).toFixed(2)),
      low24h: Number((typeof data.l === "number" && data.l > 0 ? data.l : current).toFixed(2)),
      changePercent: Number(changePct.toFixed(2)),
      volume: typeof data.v === "number" && data.v > 0 ? Math.round(data.v) : 0,
      isRealTime: true,
    };
  } catch (err) {
    console.warn(`Finnhub fetch error for ${symbol}:`, err);
    return null;
  }
}

const SNAPSHOT_MIN_GAP_MS = 4 * 60 * 1000; // don't log more than once every ~4 minutes per symbol

/**
 * Persists a real Finnhub quote as a chart data point. This is how chart
 * history is built on a free Finnhub key (which blocks the historical
 * /stock/candle endpoint): every real quote fetched while the app is used
 * gets recorded, so the chart is always built from genuine market data,
 * never a fabricated series. History naturally grows richer over time.
 */
export async function recordPriceSnapshot(symbol: string, quote: StockQuote): Promise<void> {
  try {
    await connectDB();
    const symbolUpper = symbol.toUpperCase();
    const last = await PriceSnapshot.findOne({ symbol: symbolUpper }).sort({ recordedAt: -1 });

    if (last && Date.now() - last.recordedAt.getTime() < SNAPSHOT_MIN_GAP_MS) {
      return;
    }

    await PriceSnapshot.create({
      symbol: symbolUpper,
      price: quote.currentPrice,
      high: quote.high24h,
      low: quote.low24h,
      volume: quote.volume,
      recordedAt: new Date(),
    });
  } catch (err) {
    console.warn(`Failed to record price snapshot for ${symbol}:`, err);
  }
}

export interface ChartPoint {
  timestamp: string;
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

const PERIOD_WINDOW_DAYS: Record<string, number | null> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
  ALL: null,
};

function formatTimeLabel(date: Date, period: string): string {
  if (period === "1D") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (period === "1W" || period === "1M") {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString([], { month: "short", year: "2-digit" });
}

/**
 * Builds chart candles from real data only, combining two genuine sources:
 *  - For "1D": real Yahoo Finance 5-minute intraday bars for the current
 *    trading day. Any Finnhub quotes recorded to MongoDB more recently than
 *    Yahoo's last bar are appended as a live "tail" so the chart reflects
 *    the very latest price even between Yahoo's own refresh cycles. If
 *    Yahoo has no intraday data yet (e.g. pre-market), falls back entirely
 *    to recorded Finnhub snapshots.
 *  - For "1W"/"1M"/"1Y"/"ALL": real daily historical data backfilled from
 *    Yahoo Finance (see yahoo.ts), which gives genuine multi-year history
 *    immediately. Any same-day recorded Finnhub snapshots newer than the
 *    last daily candle are appended so the chart stays current intraday.
 * Never fabricates a single data point — if nothing real is available yet,
 * this returns an empty array and the caller should say so.
 */
export async function getChartData(symbol: string, period: "1D" | "1W" | "1M" | "1Y" | "ALL"): Promise<ChartPoint[]> {
  await connectDB();
  const symbolUpper = symbol.toUpperCase();

  if (period === "1D") {
    const intraday = await getIntradayCandles(symbolUpper);

    const points: ChartPoint[] = intraday.map((c) => ({
      timestamp: c.date.toISOString(),
      time: formatTimeLabel(c.date, period),
      price: Number(c.close.toFixed(2)),
      open: Number(c.open.toFixed(2)),
      high: Number(c.high.toFixed(2)),
      low: Number(c.low.toFixed(2)),
      volume: c.volume,
    }));

    // Append any Finnhub snapshots recorded more recently than Yahoo's last bar,
    // so the chart's tail reflects the very latest quote.
    const lastBarDate = intraday.length > 0 ? intraday[intraday.length - 1].date : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tailSnapshots = await PriceSnapshot.find({
      symbol: symbolUpper,
      recordedAt: { $gt: lastBarDate },
    })
      .sort({ recordedAt: 1 })
      .lean();

    let prevPrice = points.length > 0 ? points[points.length - 1].price : null;
    for (const snap of tailSnapshots) {
      const open = prevPrice ?? snap.price;
      prevPrice = snap.price;
      points.push({
        timestamp: snap.recordedAt.toISOString(),
        time: formatTimeLabel(snap.recordedAt, period),
        price: Number(snap.price.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(snap.high.toFixed(2)),
        low: Number(snap.low.toFixed(2)),
        volume: snap.volume,
      });
    }

    // Yahoo down / no intraday data at all yet (e.g. brand new symbol) — fall
    // back entirely to whatever real Finnhub quotes we've recorded ourselves.
    if (points.length === 0) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const snapshots = await PriceSnapshot.find({ symbol: symbolUpper, recordedAt: { $gte: since } })
        .sort({ recordedAt: 1 })
        .lean();

      let fallbackPrev: number | null = null;
      return snapshots.map((snap) => {
        const open = fallbackPrev ?? snap.price;
        fallbackPrev = snap.price;
        return {
          timestamp: snap.recordedAt.toISOString(),
          time: formatTimeLabel(snap.recordedAt, period),
          price: Number(snap.price.toFixed(2)),
          open: Number(open.toFixed(2)),
          high: Number(snap.high.toFixed(2)),
          low: Number(snap.low.toFixed(2)),
          volume: snap.volume,
        };
      });
    }

    return points;
  }

  // 1W / 1M / 1Y / ALL: real Yahoo daily history + today's recorded snapshots as a tail
  const windowDays = PERIOD_WINDOW_DAYS[period];
  const sinceDate = windowDays ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) : null;

  const dailyCandles = await getHistoricalCandles(symbolUpper, sinceDate);

  const points: ChartPoint[] = dailyCandles.map((c) => ({
    timestamp: c.date.toISOString(),
    time: formatTimeLabel(c.date, period),
    price: Number(c.close.toFixed(2)),
    open: Number(c.open.toFixed(2)),
    high: Number(c.high.toFixed(2)),
    low: Number(c.low.toFixed(2)),
    volume: c.volume,
  }));

  // Append any real Finnhub snapshots recorded more recently than the last Yahoo candle,
  // so the chart reflects today's actual price even before Yahoo's next daily update.
  const lastCandleDate = dailyCandles.length > 0 ? dailyCandles[dailyCandles.length - 1].date : sinceDate;
  const recentSnapshotQuery: Record<string, unknown> = { symbol: symbolUpper };
  if (lastCandleDate) {
    recentSnapshotQuery.recordedAt = { $gt: lastCandleDate };
  }
  const recentSnapshots = await PriceSnapshot.find(recentSnapshotQuery).sort({ recordedAt: 1 }).lean();

  let prevPrice = points.length > 0 ? points[points.length - 1].price : null;
  for (const snap of recentSnapshots) {
    const open = prevPrice ?? snap.price;
    prevPrice = snap.price;
    points.push({
      timestamp: snap.recordedAt.toISOString(),
      time: formatTimeLabel(snap.recordedAt, period),
      price: Number(snap.price.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number(snap.high.toFixed(2)),
      low: Number(snap.low.toFixed(2)),
      volume: snap.volume,
    });
  }

  return points;
}

export interface FinnhubSymbolMatch {
  symbol: string;
  description: string;
  type: string;
}

/**
 * Searches Finnhub's full symbol database (thousands of real US-listed
 * stocks/ETFs), not just whatever we've seeded locally. This is what makes
 * the app's stock catalog feel unlimited instead of a fixed list of ~10 —
 * any real ticker or company name you search for can be found and added.
 */
export async function searchFinnhubSymbols(query: string): Promise<FinnhubSymbolMatch[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey || !query.trim()) return [];

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query.trim())}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      console.warn(
        `Finnhub symbol search failed for "${query}": ${res.status} ${res.statusText} — ${bodyText.slice(0, 200)}`
      );
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data?.result)) return [];

    return data.result
      .filter(
        (r: { symbol?: string; description?: string }) =>
          // Keep plain tickers on the main US exchanges — filters out options,
          // warrants, and foreign-exchange-suffixed duplicates (e.g. "AAPL.MX").
          r.symbol && r.description && !r.symbol.includes(".") && !r.symbol.includes(" ")
      )
      .slice(0, 8)
      .map((r: { symbol: string; description: string; type?: string }) => ({
        symbol: r.symbol.toUpperCase(),
        description: r.description,
        type: r.type || "Common Stock",
      }));
  } catch (err) {
    console.warn(`Finnhub symbol search error for "${query}":`, err);
    return [];
  }
}
