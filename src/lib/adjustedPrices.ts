import { Player, Manager, isPitcher } from './types'

export const TOTAL_SLOTS_PER_TEAM   = 43
export const PITCHER_SLOTS_PER_TEAM = 12
export const HITTER_SLOTS_PER_TEAM  = 19

// ─── Live Price Adjustment ────────────────────────────────────────────────────
//
//   adj = p.pr × ratio
//   ratio = actualRemaining / expectedRemaining
//
// expectedRemaining = what would be left if everyone had paid exactly pr so far
//                   = totalBudgets - sum(pr of drafted players) - spotsRemaining
// actualRemaining   = totalBudgets - sum(price paid) - spotsRemaining
//
// At draft start: no one drafted → expected == actual → ratio == 1.0 → adj == pr → nothing shows.
// After a steal ($64 player for $1): actual drops by $1, expected drops by $64
//   → actual > expected → ratio > 1 → remaining prices tick UP. ✓
// After an overpay: actual < expected → ratio < 1 → prices tick DOWN. ✓
// One pick has marginal effect because it moves both terms by ~1/430 of the pool. ✓

export function computeAdjustedPrices(
  allPlayers: Player[],
  draftedIds: Set<string>,
  managers: Manager[]
): Map<string, number> {
  const key = (p: Player) => p.id + '|' + p.n

  const totalFilled    = managers.reduce((s, m) => s + m.roster.length, 0)
  const spotsRemaining = managers.length * TOTAL_SLOTS_PER_TEAM - totalFilled

  const totalBudget     = managers.reduce((s, m) => s + m.budget, 0)
  const totalSpent      = managers.reduce((s, m) => s + m.spent, 0)

  // What would be left if everyone paid exactly projected price
  const expectedSpentSoFar = managers.reduce((s, m) =>
    s + m.roster.reduce((rs, e) => rs + e.player.pr, 0), 0)

  const actualRemaining   = Math.max(0, totalBudget - totalSpent    - spotsRemaining)
  const expectedRemaining = Math.max(1, totalBudget - expectedSpentSoFar - spotsRemaining)

  // Market drift ratio — 1.0 at draft start, drifts as over/underpaying accumulates
  const ratio = actualRemaining / expectedRemaining

  // Only bother computing if drift is meaningful (>2% off baseline)
  if (Math.abs(ratio - 1) < 0.02) return new Map()

  const undrafted = allPlayers.filter(p => !draftedIds.has(key(p)) && p.pr > 0)

  const result = new Map<string, number>()
  for (const p of undrafted) {
    const adj = Math.max(1, Math.round(p.pr * ratio))
    result.set(key(p), adj)
  }
  return result
}
