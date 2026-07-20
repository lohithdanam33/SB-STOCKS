# Deployment Guide — SB STOCKS

## 1. Push to GitHub

```bash
cd sb-stocks              # the unzipped project folder
git init
git add .
git status                # sanity check: .env should NOT be listed here.
                           # If it is, STOP — .gitignore isn't working, do not commit.
git commit -m "Initial commit: SB STOCKS full-stack MERN-style trading platform"
```

Create a new empty repo on GitHub (no README/gitignore/license — you already have those), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sb-stocks.git
git branch -M main
git push -u origin main
```

If prompted for a password, GitHub no longer accepts your account password over HTTPS — use a
[Personal Access Token](https://github.com/settings/tokens) instead, or push via SSH.

**Double-check after pushing:** open the repo on github.com and confirm there is no `.env` file
in the file list. Only `.env.example` (with placeholder values) should be there.

> If you already ran `git add .` before adding `.gitignore` and your real `.env` got committed
> in an earlier commit, `.gitignore` alone won't remove it from history. Rotate your MongoDB
> password and Finnhub key immediately, then either start a fresh repo or use
> `git filter-repo` / GitHub's secret-scanning removal guide to scrub it from history.

---

## 2. Deploy to Vercel (recommended for Next.js)

Vercel is built by the Next.js team and is the simplest path for this project.

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
2. Vercel auto-detects Next.js — leave build settings as default
   (`npm run build`, output handled automatically).
3. Under **Environment Variables**, add all three:
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | your long random secret |
   | `FINNHUB_API_KEY` | your Finnhub key |
4. Click **Deploy**. First build takes ~1-2 minutes.
5. Once live, visit the `*.vercel.app` URL Vercel gives you and confirm the login page loads.

To add a custom domain later: Project → Settings → Domains.

---

## 3. Deploy to Render (alternative)

1. Go to [render.com](https://render.com) → **New** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Environment**: Node
3. Under **Environment**, add the same three variables as above
   (`MONGODB_URI`, `JWT_SECRET`, `FINNHUB_API_KEY`).
4. Create Web Service. Render will build and deploy — first build can take a few minutes on the
   free tier, and free-tier services spin down after inactivity (expect a ~30s cold start on the
   first request after idling).

---

## 4. After either deployment — checklist

- [ ] MongoDB Atlas → Network Access → `0.0.0.0/0` is allowed (required — see note above)
- [ ] Visit `/api/health` on your deployed URL — should return `{"ok": true}`
- [ ] Register a new account on the live URL
- [ ] Confirm a stock card shows the green **LIVE** badge (not DELAYED) — confirms Finnhub key works in production
- [ ] Place a test trade, confirm balance updates
- [ ] Log in as the seeded admin (`admin@sbstocks.com` / `admin123`) and confirm the Admin tab works
- [ ] **Change the seeded demo account passwords** (or delete those accounts) before sharing the link widely, since the credentials are public in this README

## 5. Rotating your keys (do this once you're done testing with the credentials shared in chat)

- **MongoDB**: Atlas → Database Access → edit the `lohithdanam3696_db_user` user → Edit Password → generate a new one → update `MONGODB_URI` everywhere it's used (local `.env`, Vercel/Render env vars).
- **Finnhub**: [finnhub.io/dashboard](https://finnhub.io/dashboard) → regenerate your API key → update `FINNHUB_API_KEY` everywhere.
- **JWT_SECRET**: generate a fresh random string (e.g. `openssl rand -hex 32`) — rotating this logs out all existing sessions, which is fine.
