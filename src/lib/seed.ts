import { connectDB } from "@/db";
import { User, Stock } from "@/db/models";
import { hashPassword } from "./auth";

// Initial tradable symbol catalog. These starting prices are only bootstrap
// placeholders — they get overwritten by real Finnhub quotes the moment the
// app fetches live data for each symbol.
const DEFAULT_STOCKS = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    category: "Tech",
    currentPrice: 138.25,
    previousClose: 135.50,
    high24h: 140.10,
    low24h: 134.80,
    changePercent: 2.03,
    volume: 48200000,
    description: "Dominant designer of graphics processing units (GPUs) for AI, gaming, and high-performance computing.",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
    isTrending: true,
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "Tech",
    currentPrice: 232.10,
    previousClose: 229.80,
    high24h: 233.50,
    low24h: 228.90,
    changePercent: 1.00,
    volume: 35400000,
    description: "Global consumer electronics leader behind iPhone, Mac, Vision Pro, and digital services ecosystem.",
    logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=120&auto=format&fit=crop&q=80",
    isTrending: true,
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    category: "EV",
    currentPrice: 248.50,
    previousClose: 258.00,
    high24h: 260.40,
    low24h: 245.10,
    changePercent: -3.68,
    volume: 62100000,
    description: "Electric vehicle pioneer, energy storage manufacturing, autonomous driving AI networks.",
    logoUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=120&auto=format&fit=crop&q=80",
    isTrending: true,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    category: "Retail",
    currentPrice: 186.40,
    previousClose: 184.20,
    high24h: 187.90,
    low24h: 183.50,
    changePercent: 1.19,
    volume: 29800000,
    description: "E-commerce giant, AWS cloud infrastructure platform, digital streaming and AI assistant technology.",
    logoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=120&auto=format&fit=crop&q=80",
    isTrending: false,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    category: "Tech",
    currentPrice: 428.90,
    previousClose: 425.10,
    high24h: 431.20,
    low24h: 423.80,
    changePercent: 0.89,
    volume: 21500000,
    description: "Global software leader, Azure enterprise cloud, Windows OS, Copilot AI, and Xbox gaming.",
    logoUrl: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=120&auto=format&fit=crop&q=80",
    isTrending: true,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    category: "Tech",
    currentPrice: 165.80,
    previousClose: 167.20,
    high24h: 168.50,
    low24h: 164.90,
    changePercent: -0.84,
    volume: 22300000,
    description: "Google search engine ecosystem, Gemini AI models, YouTube streaming platform, and Android OS.",
    logoUrl: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80",
    isTrending: false,
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    category: "Tech",
    currentPrice: 43.75,
    previousClose: 41.20,
    high24h: 44.80,
    low24h: 40.90,
    changePercent: 6.19,
    volume: 51200000,
    description: "Big data analytics and AI operating systems provider for commercial enterprises and government agencies.",
    logoUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80",
    isTrending: true,
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    category: "Tech",
    currentPrice: 154.30,
    previousClose: 151.80,
    high24h: 156.00,
    low24h: 150.50,
    changePercent: 1.65,
    volume: 31000000,
    description: "Semiconductor leader in x86 CPUs, Instinct AI accelerators, and Radeon gaming graphics.",
    logoUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=120&auto=format&fit=crop&q=80",
    isTrending: false,
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    category: "Tech",
    currentPrice: 582.40,
    previousClose: 576.90,
    high24h: 588.00,
    low24h: 574.10,
    changePercent: 0.95,
    volume: 18900000,
    description: "Social media conglomerate operating Facebook, Instagram, WhatsApp, Threads, and Quest VR.",
    logoUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=80",
    isTrending: false,
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    category: "Indices",
    currentPrice: 578.90,
    previousClose: 576.20,
    high24h: 580.10,
    low24h: 575.40,
    changePercent: 0.47,
    volume: 42000000,
    description: "Exchange-traded fund tracking the benchmark S&P 500 index of America's largest public companies.",
    logoUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&auto=format&fit=crop&q=80",
    isTrending: false,
  },

  // ---------- Tech ----------
  { symbol: "CRM", name: "Salesforce, Inc.", category: "Tech", currentPrice: 312.40, previousClose: 309.10, high24h: 315.00, low24h: 307.50, changePercent: 1.07, volume: 5200000, description: "Cloud-based customer relationship management (CRM) software and enterprise AI platform.", isTrending: false },
  { symbol: "ORCL", name: "Oracle Corporation", category: "Tech", currentPrice: 168.20, previousClose: 165.90, high24h: 170.10, low24h: 164.80, changePercent: 1.39, volume: 8900000, description: "Enterprise database software, cloud infrastructure (OCI), and business applications provider.", isTrending: false },
  { symbol: "ADBE", name: "Adobe Inc.", category: "Tech", currentPrice: 486.70, previousClose: 481.30, high24h: 490.20, low24h: 479.10, changePercent: 1.12, volume: 3100000, description: "Creative software leader behind Photoshop, Premiere, and the Firefly generative AI suite.", isTrending: false },
  { symbol: "INTC", name: "Intel Corporation", category: "Tech", currentPrice: 24.85, previousClose: 25.10, high24h: 25.40, low24h: 24.30, changePercent: -1.00, volume: 45000000, description: "Legacy semiconductor giant rebuilding its foundry business and x86 CPU lineup.", isTrending: false },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", category: "Tech", currentPrice: 58.40, previousClose: 57.90, high24h: 58.90, low24h: 57.60, changePercent: 0.86, volume: 15200000, description: "Networking hardware and enterprise infrastructure provider powering the internet's backbone.", isTrending: false },
  { symbol: "AVGO", name: "Broadcom Inc.", category: "Tech", currentPrice: 232.90, previousClose: 228.40, high24h: 236.10, low24h: 227.00, changePercent: 1.97, volume: 18700000, description: "Semiconductor and enterprise software company powering AI networking chips and VMware.", isTrending: true },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", category: "Tech", currentPrice: 165.30, previousClose: 163.10, high24h: 167.00, low24h: 162.50, changePercent: 1.35, volume: 7800000, description: "Mobile chipset leader behind Snapdragon processors and wireless technology licensing.", isTrending: false },
  { symbol: "IBM", name: "International Business Machines", category: "Tech", currentPrice: 228.10, previousClose: 226.40, high24h: 230.00, low24h: 225.90, changePercent: 0.75, volume: 4100000, description: "Legacy enterprise IT giant pivoting toward hybrid cloud and watsonx AI consulting.", isTrending: false },
  { symbol: "NOW", name: "ServiceNow, Inc.", category: "Tech", currentPrice: 1024.50, previousClose: 1009.80, high24h: 1032.00, low24h: 1005.20, changePercent: 1.46, volume: 890000, description: "Cloud workflow automation platform for enterprise IT, HR, and customer service operations.", isTrending: false },
  { symbol: "SNOW", name: "Snowflake Inc.", category: "Tech", currentPrice: 172.60, previousClose: 168.90, high24h: 175.30, low24h: 167.40, changePercent: 2.19, volume: 6200000, description: "Cloud-native data warehousing and analytics platform used for large-scale enterprise data.", isTrending: true },
  { symbol: "UBER", name: "Uber Technologies, Inc.", category: "Tech", currentPrice: 74.90, previousClose: 73.50, high24h: 75.80, low24h: 73.10, changePercent: 1.90, volume: 14500000, description: "Ride-hailing, food delivery, and freight logistics platform operating in hundreds of cities.", isTrending: false },
  { symbol: "SHOP", name: "Shopify Inc.", category: "Tech", currentPrice: 108.40, previousClose: 105.70, high24h: 110.20, low24h: 104.90, changePercent: 2.55, volume: 9300000, description: "E-commerce platform powering online storefronts for millions of merchants worldwide.", isTrending: false },

  // ---------- EV ----------
  { symbol: "RIVN", name: "Rivian Automotive, Inc.", category: "EV", currentPrice: 13.20, previousClose: 12.85, high24h: 13.60, low24h: 12.60, changePercent: 2.72, volume: 32000000, description: "Electric truck and SUV manufacturer with a growing commercial delivery van fleet.", isTrending: false },
  { symbol: "LCID", name: "Lucid Group, Inc.", category: "EV", currentPrice: 3.10, previousClose: 3.05, high24h: 3.20, low24h: 2.98, changePercent: 1.64, volume: 41000000, description: "Luxury electric vehicle maker known for long-range Air sedans and Gravity SUVs.", isTrending: false },
  { symbol: "NIO", name: "NIO Inc.", category: "EV", currentPrice: 5.40, previousClose: 5.55, high24h: 5.65, low24h: 5.30, changePercent: -2.70, volume: 28000000, description: "Chinese premium EV maker known for battery-swap technology and smart driving features.", isTrending: false },
  { symbol: "F", name: "Ford Motor Company", category: "EV", currentPrice: 11.35, previousClose: 11.20, high24h: 11.50, low24h: 11.05, changePercent: 1.34, volume: 52000000, description: "Legacy automaker expanding its EV lineup (Mustang Mach-E, F-150 Lightning) alongside gas models.", isTrending: false },
  { symbol: "GM", name: "General Motors Company", category: "EV", currentPrice: 52.60, previousClose: 51.90, high24h: 53.20, low24h: 51.50, changePercent: 1.35, volume: 12800000, description: "Detroit automaker investing heavily in EV platforms (Ultium) and autonomous driving via Cruise.", isTrending: false },
  { symbol: "XPEV", name: "XPeng Inc.", category: "EV", currentPrice: 14.80, previousClose: 14.40, high24h: 15.10, low24h: 14.20, changePercent: 2.78, volume: 18500000, description: "Chinese smart EV maker focused on autonomous driving software and advanced flying-car ventures.", isTrending: false },

  // ---------- Retail ----------
  { symbol: "WMT", name: "Walmart Inc.", category: "Retail", currentPrice: 92.40, previousClose: 91.60, high24h: 93.10, low24h: 91.20, changePercent: 0.87, volume: 13400000, description: "World's largest retailer by revenue, spanning big-box stores, e-commerce, and grocery.", isTrending: false },
  { symbol: "COST", name: "Costco Wholesale Corporation", category: "Retail", currentPrice: 912.30, previousClose: 905.80, high24h: 918.00, low24h: 903.40, changePercent: 0.72, volume: 1900000, description: "Membership-based warehouse club retailer known for bulk goods and customer loyalty.", isTrending: false },
  { symbol: "TGT", name: "Target Corporation", category: "Retail", currentPrice: 132.70, previousClose: 130.90, high24h: 134.20, low24h: 130.10, changePercent: 1.37, volume: 6700000, description: "General merchandise retailer combining big-box stores with a growing digital fulfillment network.", isTrending: false },
  { symbol: "HD", name: "The Home Depot, Inc.", category: "Retail", currentPrice: 398.60, previousClose: 394.20, high24h: 401.50, low24h: 392.80, changePercent: 1.12, volume: 3200000, description: "Largest home improvement retailer, serving both DIY consumers and professional contractors.", isTrending: false },
  { symbol: "NKE", name: "NIKE, Inc.", category: "Retail", currentPrice: 76.90, previousClose: 75.40, high24h: 78.10, low24h: 75.00, changePercent: 1.99, volume: 8900000, description: "Global athletic apparel and footwear brand with a rapidly growing direct-to-consumer business.", isTrending: false },
  { symbol: "SBUX", name: "Starbucks Corporation", category: "Retail", currentPrice: 94.20, previousClose: 92.80, high24h: 95.30, low24h: 92.40, changePercent: 1.51, volume: 7100000, description: "Global coffeehouse chain and one of the world's most recognized consumer retail brands.", isTrending: false },

  // ---------- Finance ----------
  { symbol: "JPM", name: "JPMorgan Chase & Co.", category: "Finance", currentPrice: 248.30, previousClose: 245.90, high24h: 250.10, low24h: 244.80, changePercent: 0.98, volume: 8200000, description: "Largest U.S. bank by assets, spanning consumer banking, investment banking, and asset management.", isTrending: false },
  { symbol: "BAC", name: "Bank of America Corporation", category: "Finance", currentPrice: 45.80, previousClose: 45.10, high24h: 46.30, low24h: 44.90, changePercent: 1.55, volume: 32000000, description: "Major U.S. bank offering consumer, commercial, and investment banking services nationwide.", isTrending: false },
  { symbol: "GS", name: "The Goldman Sachs Group, Inc.", category: "Finance", currentPrice: 612.40, previousClose: 605.90, high24h: 618.20, low24h: 604.10, changePercent: 1.07, volume: 1800000, description: "Global investment bank specializing in trading, M&A advisory, and asset management.", isTrending: false },
  { symbol: "MA", name: "Mastercard Incorporated", category: "Finance", currentPrice: 524.70, previousClose: 519.30, high24h: 528.90, low24h: 517.60, changePercent: 1.04, volume: 2100000, description: "Global payments technology network processing card transactions across 200+ countries.", isTrending: false },
  { symbol: "V", name: "Visa Inc.", category: "Finance", currentPrice: 318.60, previousClose: 314.90, high24h: 321.20, low24h: 313.50, changePercent: 1.17, volume: 4900000, description: "World's largest payments network, connecting consumers, merchants, and banks globally.", isTrending: false },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", category: "Finance", currentPrice: 68.90, previousClose: 67.40, high24h: 70.10, low24h: 67.00, changePercent: 2.22, volume: 11200000, description: "Digital payments platform including PayPal, Venmo, and merchant checkout services.", isTrending: false },
  { symbol: "AXP", name: "American Express Company", category: "Finance", currentPrice: 296.80, previousClose: 293.20, high24h: 299.50, low24h: 292.10, changePercent: 1.23, volume: 2600000, description: "Premium credit card issuer and closed-loop payments network with a global merchant base.", isTrending: false },

  // ---------- Indices ----------
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "Indices", currentPrice: 502.30, previousClose: 498.60, high24h: 505.10, low24h: 497.20, changePercent: 0.74, volume: 38000000, description: "Exchange-traded fund tracking the tech-heavy Nasdaq-100 index of leading growth companies.", isTrending: false },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", category: "Indices", currentPrice: 428.90, previousClose: 426.40, high24h: 430.50, low24h: 425.90, changePercent: 0.59, volume: 3100000, description: "Exchange-traded fund tracking the 30-company Dow Jones Industrial Average blue-chip index.", isTrending: false },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", category: "Indices", currentPrice: 218.40, previousClose: 216.10, high24h: 220.30, low24h: 215.60, changePercent: 1.06, volume: 22000000, description: "Exchange-traded fund tracking the Russell 2000 index of U.S. small-cap companies.", isTrending: false },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", category: "Indices", currentPrice: 292.60, previousClose: 290.10, high24h: 294.20, low24h: 289.40, changePercent: 0.86, volume: 4200000, description: "Broad-market ETF holding nearly the entire investable U.S. stock market in a single fund.", isTrending: false },

  // ---------- Crypto-exposure equities ----------
  { symbol: "COIN", name: "Coinbase Global, Inc.", category: "Crypto", currentPrice: 248.70, previousClose: 240.90, high24h: 254.10, low24h: 238.50, changePercent: 3.24, volume: 9800000, description: "Largest U.S. cryptocurrency exchange offering retail and institutional trading services.", isTrending: true },
  { symbol: "MSTR", name: "MicroStrategy Incorporated", category: "Crypto", currentPrice: 342.10, previousClose: 328.60, high24h: 352.40, low24h: 325.10, changePercent: 4.11, volume: 8900000, description: "Enterprise software company known for holding a massive corporate Bitcoin treasury.", isTrending: true },
  { symbol: "MARA", name: "MARA Holdings, Inc.", category: "Crypto", currentPrice: 18.40, previousClose: 17.60, high24h: 19.10, low24h: 17.30, changePercent: 4.55, volume: 34000000, description: "Large-scale Bitcoin mining company operating industrial mining data centers.", isTrending: false },
  { symbol: "RIOT", name: "Riot Platforms, Inc.", category: "Crypto", currentPrice: 11.20, previousClose: 10.80, high24h: 11.60, low24h: 10.60, changePercent: 3.70, volume: 29000000, description: "Bitcoin mining and data center infrastructure company based in Texas.", isTrending: false },
  { symbol: "HOOD", name: "Robinhood Markets, Inc.", category: "Crypto", currentPrice: 46.30, previousClose: 44.80, high24h: 47.50, low24h: 44.40, changePercent: 3.35, volume: 16700000, description: "Retail trading app offering commission-free stock, options, and cryptocurrency trading.", isTrending: true },
  { symbol: "SQ", name: "Block, Inc.", category: "Crypto", currentPrice: 78.90, previousClose: 76.40, high24h: 80.20, low24h: 75.90, changePercent: 3.27, volume: 10200000, description: "Fintech company behind Square, Cash App, and Bitcoin-focused payments initiatives.", isTrending: false },

  // ---------- Market (general) ----------
  { symbol: "DIS", name: "The Walt Disney Company", category: "Market", currentPrice: 112.40, previousClose: 111.20, high24h: 113.60, low24h: 110.80, changePercent: 1.08, volume: 8900000, description: "Global media and entertainment conglomerate spanning film studios, theme parks, and streaming.", isTrending: false },
  { symbol: "NFLX", name: "Netflix, Inc.", category: "Market", currentPrice: 942.30, previousClose: 930.80, high24h: 950.10, low24h: 928.40, changePercent: 1.24, volume: 2400000, description: "Leading video streaming service with a growing slate of original films and series.", isTrending: false },
  { symbol: "BA", name: "The Boeing Company", category: "Market", currentPrice: 178.60, previousClose: 176.90, high24h: 180.40, low24h: 175.80, changePercent: 0.96, volume: 6100000, description: "Major aerospace manufacturer producing commercial jets, defense systems, and space vehicles.", isTrending: false },
  { symbol: "XOM", name: "Exxon Mobil Corporation", category: "Market", currentPrice: 118.90, previousClose: 117.60, high24h: 119.80, low24h: 117.10, changePercent: 1.11, volume: 14200000, description: "Integrated oil and gas major involved in exploration, refining, and chemical production.", isTrending: false },
  { symbol: "CVX", name: "Chevron Corporation", category: "Market", currentPrice: 158.40, previousClose: 156.90, high24h: 159.70, low24h: 156.20, changePercent: 0.96, volume: 7800000, description: "Global energy corporation engaged in oil and gas exploration, production, and refining.", isTrending: false },
  { symbol: "PFE", name: "Pfizer Inc.", category: "Market", currentPrice: 26.40, previousClose: 26.10, high24h: 26.70, low24h: 25.90, changePercent: 1.15, volume: 22000000, description: "Global pharmaceutical company developing vaccines and treatments across major disease areas.", isTrending: false },
  { symbol: "JNJ", name: "Johnson & Johnson", category: "Market", currentPrice: 156.80, previousClose: 155.40, high24h: 157.90, low24h: 154.90, changePercent: 0.90, volume: 5900000, description: "Diversified healthcare company spanning pharmaceuticals and medical devices.", isTrending: false },
  { symbol: "KO", name: "The Coca-Cola Company", category: "Market", currentPrice: 68.90, previousClose: 68.10, high24h: 69.50, low24h: 67.80, changePercent: 1.17, volume: 12100000, description: "World's largest beverage company, best known for its flagship cola and broad drink portfolio.", isTrending: false },
  { symbol: "PEP", name: "PepsiCo, Inc.", category: "Market", currentPrice: 148.60, previousClose: 147.20, high24h: 149.80, low24h: 146.90, changePercent: 0.95, volume: 4300000, description: "Global food and beverage company behind Pepsi, Lay's, Gatorade, and Quaker brands.", isTrending: false },
  { symbol: "MCD", name: "McDonald's Corporation", category: "Market", currentPrice: 296.70, previousClose: 293.80, high24h: 299.10, low24h: 292.90, changePercent: 0.99, volume: 3400000, description: "World's largest fast-food chain, operating and franchising restaurants in over 100 countries.", isTrending: false },
];

let seedCheckDone = false;

export async function seedDatabaseIfNeeded() {
  if (seedCheckDone) return; // avoid hammering the DB with existence checks on every request

  try {
    await connectDB();

    const existingStocksCount = await Stock.countDocuments();
    if (existingStocksCount === 0) {
      console.log("Seeding initial stock catalog...");
      await Stock.insertMany(
        DEFAULT_STOCKS.map((s) => ({ ...s, isCustomAdmin: false })),
        { ordered: false }
      ).catch(() => {
        // ignore duplicate key races between concurrent cold starts
      });
    } else {
      // The catalog already has data from a previous deploy, but DEFAULT_STOCKS
      // may have grown since then (e.g. a bigger default catalog shipped later).
      // Insert only the symbols that are genuinely missing — never touch or
      // overwrite existing stocks (live prices, admin edits, etc. are preserved).
      const existingSymbols = new Set((await Stock.find({}, "symbol").lean()).map((s) => s.symbol));
      const missing = DEFAULT_STOCKS.filter((s) => !existingSymbols.has(s.symbol));
      if (missing.length > 0) {
        console.log(`Backfilling ${missing.length} new default-catalog symbol(s) into existing DB...`);
        await Stock.insertMany(
          missing.map((s) => ({ ...s, isCustomAdmin: false })),
          { ordered: false }
        ).catch((err) => {
          console.warn("Error backfilling missing default stocks:", err);
        });
      }
    }

    const existingTrader = await User.findOne({ email: "trader@sbstocks.com" });
    if (!existingTrader) {
      const traderPassword = await hashPassword("trader123");
      await User.create({
        name: "Sam Blake",
        email: "trader@sbstocks.com",
        password: traderPassword,
        role: "user",
        virtualBalance: 100000,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      });
    }

    const existingAdmin = await User.findOne({ email: "admin@sbstocks.com" });
    if (!existingAdmin) {
      const adminPassword = await hashPassword("admin123");
      await User.create({
        name: "Grid System Master",
        email: "admin@sbstocks.com",
        password: adminPassword,
        role: "admin",
        virtualBalance: 250000,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      });
    }

    seedCheckDone = true;
  } catch (error) {
    console.error("Error during database seed:", error);
  }
}
