import type { Types } from "mongoose";

export function fmt2(n: number | string | undefined | null): string {
  return Number(n ?? 0).toFixed(2);
}

export function fmt4(n: number | string | undefined | null): string {
  return Number(n ?? 0).toFixed(4);
}

export function oid(id: Types.ObjectId | string | undefined | null): string {
  return id ? id.toString() : "";
}

interface StockLike {
  _id: Types.ObjectId;
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

export function serializeStock(s: StockLike) {
  return {
    id: oid(s._id),
    symbol: s.symbol,
    name: s.name,
    category: s.category,
    currentPrice: fmt2(s.currentPrice),
    previousClose: fmt2(s.previousClose),
    high24h: fmt2(s.high24h),
    low24h: fmt2(s.low24h),
    changePercent: fmt2(s.changePercent),
    volume: String(Math.round(s.volume ?? 0)),
    description: s.description,
    logoUrl: s.logoUrl,
    isCustomAdmin: s.isCustomAdmin,
    isTrending: s.isTrending,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

interface TransactionLike {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  stockSymbol: string;
  stockName: string;
  type: string;
  orderType: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export function serializeTransaction(t: TransactionLike) {
  return {
    id: oid(t._id),
    userId: oid(t.userId),
    stockSymbol: t.stockSymbol,
    stockName: t.stockName,
    type: t.type,
    orderType: t.orderType,
    quantity: fmt4(t.quantity),
    pricePerShare: fmt2(t.pricePerShare),
    totalAmount: fmt2(t.totalAmount),
    status: t.status,
    createdAt: t.createdAt,
  };
}

interface LimitOrderLike {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  stockSymbol: string;
  type: string;
  targetPrice: number;
  quantity: number;
  status: string;
  createdAt: Date;
}

export function serializeLimitOrder(o: LimitOrderLike) {
  return {
    id: oid(o._id),
    userId: oid(o.userId),
    stockSymbol: o.stockSymbol,
    type: o.type,
    targetPrice: fmt2(o.targetPrice),
    quantity: fmt4(o.quantity),
    status: o.status,
    createdAt: o.createdAt,
  };
}

interface AlertLike {
  _id: Types.ObjectId;
  title: string;
  message: string;
  alertType: string;
  createdBy: string;
  createdAt: Date;
}

export function serializeAlert(a: AlertLike) {
  return {
    id: oid(a._id),
    title: a.title,
    message: a.message,
    alertType: a.alertType,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
  };
}

interface UserLike {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  virtualBalance: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function serializeUser(u: UserLike) {
  return {
    id: oid(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    virtualBalance: fmt2(u.virtualBalance),
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
