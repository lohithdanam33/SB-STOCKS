import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Stock } from "@/db/models";
import { seedDatabaseIfNeeded } from "@/lib/seed";
import { fetchLiveStockQuote, recordPriceSnapshot, searchFinnhubSymbols } from "@/lib/finnhub";
import { serializeStock } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const FALLBACK_LOGO = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&auto=format&fit=crop&q=80";

// Every stock in the catalog gets live-polled (see the `live=true` branch below),
// so an unbounded catalog means unbounded Finnhub call volume. Cap total size —
// once we hit this, new search discoveries stop being persisted to the catalog
// (existing local matches still return normally).
const MAX_CATALOG_SIZE = 150;

export async function GET(req: Request) {
  try {
    await seedDatabaseIfNeeded();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("query") || "").trim();
    const category = searchParams.get("category") || "";
    const isLive = searchParams.get("live") === "true";

    let dbStocks;
    if (rawQuery) {
      // Escape regex special characters so a literal search term (e.g. "AT&T", "3M")
      // can't accidentally break the pattern or silently match nothing.
      const escaped = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      dbStocks = await Stock.find({
        $or: [
          { symbol: { $regex: escaped, $options: "i" } },
          { name: { $regex: escaped, $options: "i" } },
        ],
      });

      // Also search Finnhub's full symbol universe (thousands of real tickers),
      // not just what we've pre-seeded, and auto-add anything new we find. This
      // is what makes the catalog feel unlimited instead of a fixed small list.
      const existingSymbols = new Set(dbStocks.map((s) => s.symbol));
      const finnhubMatches = await searchFinnhubSymbols(rawQuery);
      const newMatches = finnhubMatches.filter((m) => !existingSymbols.has(m.symbol));

      if (newMatches.length > 0) {
        const totalCatalogSize = await Stock.countDocuments();
        const remainingCapacity = Math.max(0, MAX_CATALOG_SIZE - totalCatalogSize);
        const matchesToProvision = newMatches.slice(0, remainingCapacity);

        if (matchesToProvision.length < newMatches.length) {
          console.log(
            `Catalog at ${totalCatalogSize}/${MAX_CATALOG_SIZE} — only auto-adding ${matchesToProvision.length} of ${newMatches.length} new search matches`
          );
        }

        const provisioned = await Promise.all(
          matchesToProvision.map(async (m) => {
            const quote = await fetchLiveStockQuote(m.symbol);
            if (!quote) return null; // skip symbols Finnhub can't actually quote (real data only, no guessing)

            try {
              const created = await Stock.create({
                symbol: m.symbol,
                name: m.description,
                category: "Market",
                currentPrice: quote.currentPrice,
                previousClose: quote.previousClose,
                high24h: quote.high24h,
                low24h: quote.low24h,
                changePercent: quote.changePercent,
                volume: quote.volume || 1000000,
                description: `${m.description} — discovered via search`,
                logoUrl: FALLBACK_LOGO,
                isCustomAdmin: false,
                isTrending: false,
              });
              recordPriceSnapshot(m.symbol, quote); // fire-and-forget, seeds the first real chart point
              return created;
            } catch {
              // Race: another concurrent request already created this symbol — just fetch it.
              return Stock.findOne({ symbol: m.symbol });
            }
          })
        );
        dbStocks = [...dbStocks, ...provisioned.filter((s): s is NonNullable<typeof s> => !!s)];
      }

      console.log(`Stock search "${rawQuery}" matched ${dbStocks.length} result(s) (local + Finnhub)`);
    } else if (category && category !== "All") {
      dbStocks = await Stock.find({ category });
    } else {
      dbStocks = await Stock.find();
    }

    // Optionally attach real-time Finnhub quotes and persist them as chart history
    const resultStocks = await Promise.all(
      dbStocks.map(async (stock) => {
        if (isLive) {
          const liveQuote = await fetchLiveStockQuote(stock.symbol);
          if (liveQuote) {
            recordPriceSnapshot(stock.symbol, liveQuote); // fire-and-forget
            return {
              ...serializeStock(stock),
              currentPrice: liveQuote.currentPrice.toFixed(2),
              previousClose: liveQuote.previousClose.toFixed(2),
              high24h: liveQuote.high24h.toFixed(2),
              low24h: liveQuote.low24h.toFixed(2),
              changePercent: liveQuote.changePercent.toFixed(2),
              isRealTime: true,
            };
          }
          return { ...serializeStock(stock), isRealTime: false };
        }
        return serializeStock(stock);
      })
    );

    return NextResponse.json({
      success: true,
      count: resultStocks.length,
      stocks: resultStocks,
    });
  } catch (err: unknown) {
    console.error("Fetch stocks error:", err);
    return NextResponse.json({ error: "Failed to fetch stock catalog" }, { status: 500 });
  }
}
