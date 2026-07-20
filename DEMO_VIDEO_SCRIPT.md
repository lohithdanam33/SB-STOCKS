# Demo Video Script — SB STOCKS (Target: ~4 minutes)

Record with the app deployed live (Vercel/Render URL) so the LIVE data badges are visible —
much more convincing than localhost. Have two browser tabs ready: one logged in as a normal
user, one as admin.

---

### 0:00 – 0:30 | Intro
"This is SB STOCKS — a full-stack paper trading platform built with Next.js, MongoDB, and
real-time Finnhub market data. Every user starts with $100,000 in virtual cash to practice
trading real stocks with zero real-world risk."

*[Show the landing/login screen, toggle dark/light theme once to show the dual aesthetic.]*

### 0:30 – 1:00 | Registration & Live Market Data
"Let's create an account." *[Register a new user, land on the Markets tab.]*
"Every price you see here is a live quote pulled from Finnhub — not simulated. Notice the green
LIVE badge on each card confirming real-time data." *[Point at the badge. Refresh once to show
a price tick.]*

### 1:00 – 1:45 | Search, Filter, Stock Detail
"You can search or filter by category." *[Type a search, switch a category filter.]*
"Clicking into a stock shows a live price chart." *[Open a stock detail modal.]*
"This chart is built from real recorded Finnhub quotes over time — not fabricated data — which
is why it may look sparse on a fresh install and fill in the more the app is used."

### 1:45 – 2:30 | Trading — Market & Limit Orders
"Let's place a market buy." *[Buy a few shares, show the balance deduct instantly and the
confetti confirmation.]*
"Now a limit order — I'll set a target price below the current price." *[Place a limit buy,
switch to the Limit Orders tab, show it sitting PENDING.]*
"It'll auto-execute once the market price reaches that target."

### 2:30 – 3:00 | Portfolio, Watchlist, History
*[Switch to Portfolio tab.]* "Here's my holding, current value, and unrealized P&L, updating
with live prices."
*[Switch to Watchlist tab.]* "I can star stocks to track without holding them."
*[Switch to History tab.]* "Every transaction is logged here for a full audit trail."

### 3:00 – 3:30 | Learn Tab
*[Switch to Learn tab, expand 2-3 sections.]* "For anyone new to investing, there's a built-in
learning hub covering market basics, order types, chart reading, and risk management — so this
isn't just a trading simulator, it's a teaching tool too."

### 3:30 – 4:00 | Admin Panel
*[Switch to the admin-logged-in tab.]* "Admins get a control panel to manage the stock catalog,
adjust user balances, and broadcast platform-wide alerts." *[Show creating/editing a stock,
then broadcasting an alert.]* "That alert now shows up live for every user."

### 4:00 | Close
"That's SB STOCKS — full CRUD across users, stocks, portfolios, watchlists, and transactions,
role-based JWT authentication, and real-time market data end to end. Thanks for watching."

---

**Recording tips:**
- Screen-record at 1080p+, keep mouse movements deliberate (viewers need to track what you click).
- Mute notification sounds beforehand.
- If a live price doesn't move during recording, that's normal for a short clip — the LIVE badge
  itself is the proof it's real, not the price changing on camera.
