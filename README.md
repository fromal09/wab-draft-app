# WAB 2025 Draft Command Center

A full-featured live auction draft tool for Westminster Auction Baseball. Built with Next.js 14, deployable to Vercel in minutes.

## Features

- **Big Board** — All 1,669 projected players, searchable, sortable by any stat, filterable, with price badges calibrated to 4 years of WAB historical auction data
- **Player Cards** — Full detail view with projected stats, ADP, age, score, and hometown discount indicator
- **Auction Console** — Live bidding timer: 15s → Going Once (8s) → Going Twice (4s) → SOLD. Space bar = register bid. Manager budget panel always visible.
- **Roster Tracker** — All 10 team rosters, major/minor league splits, draft type logging (auction/keeper/QO), undo support, full draft log
- **Projected Standings** — Live 14-category standings as players are drafted, color-coded rankings, sortable by any category
- **Settings** — Configure manager names, budgets (default $450), and hometown discount players

## Pricing Model

Prices derived from a 60/40 blend of 2025 actual auction prices + 3-year historical average (2022–2024), smoothed with 5-rank rolling window. SP/RP scaled at 88% of hitter curve. Negative values = below-replacement players.

## Setup

### Prerequisites
- Node.js 18+
- A GitHub account
- A Vercel account (free)

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import from GitHub
4. Leave all defaults — Vercel auto-detects Next.js
5. Click Deploy

That's it. No environment variables needed.

### Or deploy via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

## Pre-Draft Setup

1. Open the app → click **⚙ Setup** in the header
2. Enter all 10 manager names
3. Adjust budgets if anyone has penalties/trades (default $450)
4. Under **★ Hometown Discounts**, enter player names (one per line) for each manager who has HTD eligibility

## Hometown Discount (WAB Rules §6.2)

If an owner did not designate a player with a Qualifying Offer, and then drafts that player at auction, their price is reduced by 20% (max $5). When a player has a hometown discount, their card shows a ★ HTD badge, and the Auction Console shows a one-click apply button.

## During the Draft

1. Find a player on the Big Board → click **⚡ NOM** to send to Auction Console
2. Hit **▶ Start Bidding** to launch the 15-second timer
3. Press **🙋 BID!** (or spacebar) whenever someone bids — resets to 15 seconds
4. Timer auto-advances: 15s → Going Once → Going Twice → SOLD
5. Hit **🔨 Log Draft →** to record price, manager, draft type, and roster level
6. Player is marked DRAFTED on all boards and removed from available pool

## Draft State

All draft data is saved to `localStorage` — refresh-safe, persists through the draft. Hit **↺ Reset** to clear everything (asks for confirmation).

## League Categories (14 scored)

**Hitting:** R, HR, RBI, SB, AVG, OBP  
**Pitching:** W, SV, HLD, K, ERA, WHIP, BB, L
