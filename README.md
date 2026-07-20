# SB STOCKS - Virtual Stock Trading Simulation Platform

SB STOCKS is a full-stack, real-time paper trading simulation application built with Next.js (App Router), MongoDB (Mongoose ODM), Finnhub live stock quote integration, JWT role-based security, and a dual aesthetic system featuring an 80s Cyberpunk TRON Film theme toggleable to Clean Modern Financial Light Mode.

---

## 🌟 Key Features

1. **Virtual Fund Paper Trading**: Every user starts with $100,000 in simulated practice cash. Top up or reset funds anytime.
2. **Real-Time Live Quotes**: Integrated with Finnhub REST stock streams — real quotes only, no simulated data.
3. **Interactive Area Charts**: Responsive Recharts with time period selectors (1D, 1W, 1M, 1Y, ALL), built from real Finnhub quotes recorded over time (Finnhub's free tier blocks historical `/stock/candle` data, so history is built organically as the app is used instead of fabricated).
4. **Market & Limit Orders**: Place instant market orders or set automated target limit buy/sell orders with automatic execution triggers.
5. **Portfolio Analytics**: Track total net worth, unrealized PnL, position breakdown, and asset distribution pie charts.
6. **Watchlist & Ticker Bar**: Saved favorite stocks and a continuous live scrolling ticker bar.
7. **Admin Control Grid**: System master dashboard for managing stock catalog (add custom IPOs, override prices), managing user practice balances, publishing floor announcement alerts, and viewing trade metrics.
8. **Responsive Design**: Compatible with both Desktop PC and Smartphone viewports with a bottom mobile navigation bar.
9. **Documentation Hub**: Embedded in-app guides for GitHub, Postman API testing, Render/Vercel deployment, and Demo Video scripts.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js App Router, React 19, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti.
- **Backend API**: Next.js Serverless Route Handlers (`/api/*`), Node.js runtime.
- **Database**: MongoDB with Mongoose ODM (models in `src/db/models.ts`).
- **Security**: JWT (`jsonwebtoken`) cookie session management & `bcryptjs` password hashing.
- **Market Feed**: Finnhub API, real-time quotes only. Historical chart data is built from real quotes recorded to MongoDB over time (`PriceSnapshot` collection) since Finnhub's free tier does not permit historical candle requests.

---

## ⚙️ Environment Variables (`.env`)

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tronx
JWT_SECRET=sb-stocks-trading-secret-key-2026
FINNHUB_API_KEY=your_finnhub_key_here
```

---

## 🚀 Local Installation & Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/tronx-stock-trading.git
   cd tronx-stock-trading
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure `.env`** (see `.env.example`):
   ```bash
   cp .env.example .env
   # then fill in MONGODB_URI, JWT_SECRET, FINNHUB_API_KEY
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. Access `http://localhost:3000` in browser.

---

## 🔑 Quick Demo Credentials

- **Demo Trader**: `trader@sbstocks.com` / `trader123` (Role: User, $100,000 Cash)
- **System Admin**: `admin@sbstocks.com` / `admin123` (Role: Admin, Admin Panel Unlocked)

---

## 🧪 API Testing (Postman)

A full Postman collection covering every endpoint — auth, stocks, trading, portfolio, watchlist, limit orders, transaction history, alerts, and admin CRUD — lives in `/postman`:

- `postman/sb-stocks.postman_collection.json`
- `postman/sb-stocks.postman_environment.json`

**To use it:**
1. Import both files into Postman (File → Import).
2. Select the **SB STOCKS Local** environment in the top-right dropdown.
3. Run `npm run dev` so the app is live at `http://localhost:3000`.
4. Work through the folders top-to-bottom: **1. Auth** → **2. Stocks** → **3. Trading & Portfolio** → **4. Watchlist & Limit Orders** → **5. Admin** → **6. Alerts & Health**. Logging in via the Auth folder sets a session cookie that Postman carries automatically into every later request.
5. For the **5. Admin** folder, run "Login as Admin (seeded account)" first.

Each request has a description explaining what it does and any setup it needs (e.g. copying an `id` from a prior response into a collection variable).

---

## 🌐 Deployment (Vercel & Render)

### Deploying to Vercel
1. Push project to GitHub.
2. Import repo on Vercel.
3. Configure `MONGODB_URI`, `JWT_SECRET`, and `FINNHUB_API_KEY` in environment variables.
4. Deploy!

### Deploying to Render
1. Create a Web Service on Render.
2. Set Build Command: `npm install && npm run build`
3. Set Start Command: `npm run start`
4. Add `MONGODB_URI`, `JWT_SECRET`, and `FINNHUB_API_KEY` in Render Environment settings.
