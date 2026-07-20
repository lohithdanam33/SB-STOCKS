import mongoose, { Schema, model, models } from "mongoose";

// ---------- Users ----------
export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  virtualBalance: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // "user" | "admin"
    virtualBalance: { type: Number, default: 100000 },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

// ---------- Stocks ----------
export interface IStock {
  _id: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
  previousClose: number;
  high24h: number;
  low24h: number;
  changePercent: number;
  volume: number;
  description?: string;
  logoUrl?: string;
  isCustomAdmin: boolean;
  isTrending: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    category: { type: String, default: "Tech" }, // Tech, Crypto, EV, Retail, Finance, Indices
    currentPrice: { type: Number, required: true },
    previousClose: { type: Number, required: true },
    high24h: { type: Number, required: true },
    low24h: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    volume: { type: Number, default: 1000000 },
    description: { type: String },
    logoUrl: { type: String },
    isCustomAdmin: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ---------- Portfolio holdings ----------
export interface IPortfolio {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stockSymbol: string;
  shares: number;
  averageBuyPrice: number;
  totalInvested: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stockSymbol: { type: String, required: true },
    shares: { type: Number, required: true },
    averageBuyPrice: { type: Number, required: true },
    totalInvested: { type: Number, required: true },
  },
  { timestamps: true }
);

// ---------- Transactions ----------
export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stockSymbol: string;
  stockName: string;
  type: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stockSymbol: { type: String, required: true },
    stockName: { type: String, required: true },
    type: { type: String, required: true },
    orderType: { type: String, default: "MARKET" },
    quantity: { type: Number, required: true },
    pricePerShare: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "COMPLETED" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------- Watchlist ----------
export interface IWatchlist {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stockSymbol: string;
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stockSymbol: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------- Limit Orders ----------
export interface ILimitOrder {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stockSymbol: string;
  type: "BUY" | "SELL";
  targetPrice: number;
  quantity: number;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  createdAt: Date;
}

const LimitOrderSchema = new Schema<ILimitOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stockSymbol: { type: String, required: true },
    type: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    status: { type: String, default: "PENDING" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------- System Alerts ----------
export interface ISystemAlert {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  alertType: "MARKET_NEWS" | "ADMIN_NOTICE" | "BREAKING";
  createdBy: string;
  createdAt: Date;
}

const SystemAlertSchema = new Schema<ISystemAlert>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    alertType: { type: String, default: "MARKET_NEWS" },
    createdBy: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ---------- Price Snapshots (real recorded Finnhub quotes, used to build real chart history) ----------
export interface IPriceSnapshot {
  _id: mongoose.Types.ObjectId;
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  recordedAt: Date;
}

const PriceSnapshotSchema = new Schema<IPriceSnapshot>({
  symbol: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  volume: { type: Number, default: 0 },
  recordedAt: { type: Date, default: Date.now, index: true },
});

// ---------- Historical Daily Candles (real data backfilled per symbol from Yahoo Finance) ----------
export interface IHistoricalCandle {
  _id: mongoose.Types.ObjectId;
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const HistoricalCandleSchema = new Schema<IHistoricalCandle>({
  symbol: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, default: 0 },
});
HistoricalCandleSchema.index({ symbol: 1, date: 1 }, { unique: true });

// Reuse compiled models across Next.js hot-reloads / serverless invocations
export const User = models.User || model<IUser>("User", UserSchema);
export const Stock = models.Stock || model<IStock>("Stock", StockSchema);
export const Portfolio = models.Portfolio || model<IPortfolio>("Portfolio", PortfolioSchema);
export const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
export const Watchlist = models.Watchlist || model<IWatchlist>("Watchlist", WatchlistSchema);
export const LimitOrder = models.LimitOrder || model<ILimitOrder>("LimitOrder", LimitOrderSchema);
export const SystemAlert = models.SystemAlert || model<ISystemAlert>("SystemAlert", SystemAlertSchema);
export const PriceSnapshot = models.PriceSnapshot || model<IPriceSnapshot>("PriceSnapshot", PriceSnapshotSchema);
export const HistoricalCandle = models.HistoricalCandle || model<IHistoricalCandle>("HistoricalCandle", HistoricalCandleSchema);
