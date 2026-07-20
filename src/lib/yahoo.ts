import { connectDB } from "@/db";
import { HistoricalCandle } from "@/db/models";

/**
 * Yahoo Finance's unofficial `v8/finance/chart` endpoint. No API key
 * required, and unlike Finnhub's free tier (which fully blocks historical
 * candles) or Stooq's CSV export (unofficial, flaky, and rate-limited),
 * this reliably returns real OHLCV history — including real intraday
 * 5-minute bars for "1D" — immediately, with no backfill wait needed.
 *
 * If Yahoo ever hiccups, callers fall back to the last known cached data
 * in MongoDB, and ultimately to live-recorded Finnhub snapshots — nothing
 * breaks, it just degrades gracefully.
 */

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface YahooChartResult {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

export interface RawCandle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string,
  revalidateSeconds: number
): Promise<RawCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol.toUpperCase()
  )}?range=${range}&interval=${interval}&includePrePost=false`;

  const res = await fetch(url, {
    headers: YAHOO_HEADERS,
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    console.warn(`Yahoo chart request failed for ${symbol} (${range}/${interval}): ${res.status}`);
    return [];
  }

  const data = await res.json();
  const result: YahooChartResult | undefined = data?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!timestamps || !quote) {
    return [];
  }

  const candles: RawCandle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    const volume = quote.volume?.[i];

    // Yahoo pads gaps (pre-market, halts, non-trading minutes) with nulls — skip those
    if (
      typeof open !== "number" ||
      typeof high !== "number" ||
      typeof low !== "number" ||
      typeof close !== "number"
    ) {
      continue;
    }

    candles.push({
      date: new Date(timestamps[i] * 1000),
      open,
      high,
      low,
      close,
      volume: typeof volume === "number" ? volume : 0,
    });
  }

  return candles;
}

/**
 * Real intraday candles for the "1D" period — 5-minute bars for the current
 * trading day, fetched live each time (not cached in Mongo, since intraday
 * data goes stale within minutes). Falls back to an empty array if Yahoo
 * is unreachable; callers should overlay/fall back to recorded Finnhub
 * snapshots in that case.
 */
export async function getIntradayCandles(symbol: string): Promise<RawCandle[]> {
  try {
    // revalidate every 60s — intraday bars change frequently
    return await fetchYahooChart(symbol, "1d", "5m", 60);
  } catch (err) {
    console.warn(`Yahoo intraday fetch failed for ${symbol}:`, err);
    return [];
  }
}

/**
 * Backfills real daily OHLCV history into MongoDB from Yahoo Finance.
 * Unlike the old Stooq backfill, this refreshes once a day (rather than
 * only ever running once) so the cached history stays current, since Yahoo
 * has no meaningful rate-limit concerns for this volume of traffic.
 */
export async function backfillHistoricalCandlesIfNeeded(symbol: string): Promise<void> {
  try {
    await connectDB();
    const symbolUpper = symbol.toUpperCase();

    const mostRecent = await HistoricalCandle.findOne({ symbol: symbolUpper }).sort({ date: -1 });
    const isFresh = mostRecent && Date.now() - mostRecent.date.getTime() < 20 * 60 * 60 * 1000; // < 20h old
    if (isFresh) return;

    // "5y" of daily bars is plenty for 1W/1M/1Y/ALL views and keeps payloads small
    const candles = await fetchYahooChart(symbol, "5y", "1d", 60 * 60 * 6);
    if (candles.length === 0) {
      console.warn(`Yahoo backfill for ${symbol}: no candles returned`);
      return;
    }

    const ops = candles.map((c) => ({
      updateOne: {
        filter: { symbol: symbolUpper, date: c.date },
        update: {
          $set: {
            symbol: symbolUpper,
            date: c.date,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          },
        },
        upsert: true,
      },
    }));

    await HistoricalCandle.bulkWrite(ops, { ordered: false });
    console.log(`Backfilled ${candles.length} real daily candles for ${symbolUpper} from Yahoo Finance`);
  } catch (err) {
    console.warn(`Yahoo backfill failed for ${symbol}:`, err);
  }
}

export interface DailyCandle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getHistoricalCandles(symbol: string, sinceDate: Date | null): Promise<DailyCandle[]> {
  await connectDB();
  const query: Record<string, unknown> = { symbol: symbol.toUpperCase() };
  if (sinceDate) {
    query.date = { $gte: sinceDate };
  }
  const docs = await HistoricalCandle.find(query).sort({ date: 1 }).lean();
  return docs.map((d) => ({
    date: d.date,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  }));
}
