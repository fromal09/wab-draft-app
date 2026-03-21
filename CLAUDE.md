# WAB 2025 Draft Command Center — Claude Context

## Project
Fantasy baseball auction draft tool for the Westminster league (18-cat H2H).  
**Repo:** github.com/fromal09/wab-draft-app  
**Live:** wab-draft-app.vercel.app  
**Local:** ~/wab-draft-app  
**Stack:** Next.js 14, TypeScript, Tailwind, Vercel (auto-deploy from main)

---

## Key Files
```
src/
  app/
    api/
      player-news/route.ts       # Google News RSS proxy (Rotoworld filter)
      meta-description/route.ts  # Fetches real meta desc from article URLs
    globals.css
    layout.tsx / page.tsx
  components/
    DraftApp.tsx                 # Root component, wires everything together
    BigBoard.tsx                 # Main player list with tabs, sort, badges
    PlayerCard.tsx               # Detailed player modal (big board + auction)
    AuctionConsole.tsx           # Live auction panel with search + timer
    SettingsModal.tsx            # Managers/budgets, hometown, timer, nomination order
    CategoryRadar.tsx
    PlayerStatGrid.tsx
    PositionViz.tsx
    PriceBadge.tsx
    RecommendationsPanel.tsx
    RollingXwOBA.tsx
    RosterView.tsx
    SavantBars.tsx
    StandingsView.tsx
    TargetFinder.tsx
  hooks/
    useDraftState.ts             # Single source of truth (localStorage: wab_draft_state_2025)
    useAuctionTimer.ts           # Timer with going_once/twice/sold + Daniel voice (en-GB)
    usePlayerTags.ts             # avoid/target/star tags (separate from draft state)
    useRecommendations.ts
  lib/
    adjustedPrices.ts
    standings.ts
    types.ts
  data/
    players_raw.json
```

---

## Architecture Notes
- **State:** `useDraftState` owns all draft state, persisted to `localStorage` key `wab_draft_state_2025`
- **Player key format:** `player.id + '|' + player.n`
- **Diacritic normalization:** `normName()` helper in both BigBoard.tsx and PlayerCard.tsx — strips NFD combining chars, lowercases
- **Shared helpers in BigBoard + PlayerCard:** `normName()`, `plRank()`, `injuryInfo()`, `INJURY_MAP`, `PL_HLD_RANKS`, `PL_SV_RANKS`, `PL_SP_RANKS`

---

## Features Built (as of Mar 20 2026)
| Feature | Files |
|---|---|
| Nomination order tracker | useDraftState, DraftApp, SettingsModal, AuctionConsole |
| Player notes (per player, persisted) | useDraftState, PlayerCard, BigBoard, AuctionConsole |
| Auction timer (phase chain + Daniel voice) | useAuctionTimer |
| PL HLD / SV / SP rank badges + sort columns | BigBoard, PlayerCard |
| Injury badges inline (DTD / Out / IL + return date) | BigBoard |
| Injury section on player cards | PlayerCard |
| Recent news (Google News RSS, Rotoworld filter) | PlayerCard, /api/player-news |
| Expandable meta descriptions on news items | PlayerCard, /api/meta-description |

---

## League Format (Westminster)
18-category H2H most-categories. Key quirks:
- **Negative batter SO** (strikeouts hurt)
- **SBN** = net steals (SB - CS)
- **SV+HLD** tracked separately
- **OBP** instead of AVG
- **3B** as a category

## Adam's Team: Waiting for Promotions
Kept SPs: Skubal, Peralta, Sanchez, Valdez, Snell, Chandler  
Kept 0 relievers, has 1B surplus

---

## Common Patterns
- Use Python heredoc for surgical TSX patches (more reliable than sed)
- Always `cd ~/wab-draft-app` before npm/git commands
- `git add -A && git commit -m "..." && git push` triggers auto-deploy
- If Vercel shows "Staged" instead of deploying, go to dashboard → Promote to Production
- The `<` character in Python heredocs strips JSX tags — use `str.replace()` instead for JSX

