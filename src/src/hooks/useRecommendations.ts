import { useMemo } from 'react'
import { Player, Manager, isPitcher, LOWER_IS_BETTER, Category } from '@/lib/types'
import { computeStandings, rankByCategory } from '@/lib/standings'

const ADAM_ID = 'm1'
const ALL_CATS: Category[] = ['R','2B','3B','HR','RBI','SBN','SO','AVG','OBP','W','L','SV','HLD','ERA','WHIP','BB','K','QA3']

function playerContribution(p: Player): Partial<Record<Category, number>> {
  if (isPitcher(p)) {
    return {
      W: p.w, L: p.l, SV: p.sv, HLD: p.hld,
      BB: p.bb, K: p.k, QA3: p.qa3,
      ERA:  p.ip > 0 ? p.er * (p.ip / 9) : 0,
      WHIP: p.ip > 0 ? p.bb + (p.wh * p.ip - p.bb) : 0,
    }
  } else {
    return {
      R: p.r, '2B': p.d2, '3B': p.d3, HR: p.hr,
      RBI: p.rb, SBN: p.sbn, SO: p.so,
      AVG: p.av, OBP: p.ob,
    }
  }
}

export interface Recommendation {
  player: Player
  score: number
  topCats: { cat: Category; gain: number }[]
  needRank: number
}

export interface RecommendationTiers {
  topEnd: Recommendation[]
  midTier: Recommendation[]
  sneaky: Recommendation[]
}

export function useRecommendations(
  managers: Manager[],
  draftedIds: Set<string>,
  allPlayers: Player[],
  maxResults = 30
): RecommendationTiers {
  return useMemo(() => {
    const adam = managers.find(m => m.id === ADAM_ID)
    if (!adam) return { topEnd: [] as Recommendation[], midTier: [] as Recommendation[], sneaky: [] as Recommendation[] }

    const standings = computeStandings(managers)
    const adamStanding = standings.find(s => s.managerId === ADAM_ID)
    if (!adamStanding) return { topEnd: [] as Recommendation[], midTier: [] as Recommendation[], sneaky: [] as Recommendation[] }

    const adamRanks: Partial<Record<Category, number>> = {}
    for (const cat of ALL_CATS) {
      const ranks = rankByCategory(standings, cat)
      const r = ranks.find(r => r.managerId === ADAM_ID)
      adamRanks[cat] = r?.rank ?? 10
    }

    const needWeight = (cat: Category): number => {
      const rank = adamRanks[cat] ?? 5
      return rank / 10
    }

    const majorRoster = adam.roster.filter(e => e.rosterLevel === 'major')
    const pitcherCount = majorRoster.filter(e => isPitcher(e.player)).length
    const hitterCount  = majorRoster.filter(e => !isPitcher(e.player)).length
    const PITCHER_MAX = 12
    const HITTER_MAX  = 19

    const recs: Recommendation[] = []

    for (const p of allPlayers) {
      if (draftedIds.has(p.id + '|' + p.n)) continue

      const isPit = isPitcher(p)
      if (isPit  && pitcherCount >= PITCHER_MAX) continue
      if (!isPit && hitterCount  >= HITTER_MAX)  continue

      const contrib = playerContribution(p)
      let totalScore = 0
      const catGains: { cat: Category; gain: number }[] = []

      for (const cat of ALL_CATS) {
        const raw = contrib[cat]
        if (raw === undefined || raw === 0) continue

        const weight = needWeight(cat)
        let gain: number

        if (cat === 'ERA' || cat === 'WHIP') {
          const currentIP = adamStanding.ip
          const addedIP = isPitcher(p) ? p.ip : 0
          if (addedIP === 0) continue
          const totalIP = currentIP + addedIP
          if (cat === 'ERA') {
            const currentER = adamStanding.era * currentIP / 9
            const newERA = ((currentER + raw) / totalIP) * 9
            gain = adamStanding.era > 0 ? (adamStanding.era - newERA) * weight * 10 : 0
          } else {
            const currentBBH = adamStanding.whip * currentIP
            const newWHIP = (currentBBH + raw) / totalIP
            gain = adamStanding.whip > 0 ? (adamStanding.whip - newWHIP) * weight * 20 : 0
          }
          if (gain > 0) { totalScore += gain; catGains.push({ cat, gain }) }
        } else if (cat === 'AVG' || cat === 'OBP') {
          const currentAB = adamStanding.ab
          const addedAB = !isPitcher(p) ? p.ab : 0
          if (addedAB === 0) continue
          const totalAB = currentAB + addedAB
          const currentVal = cat === 'AVG' ? adamStanding.avg : adamStanding.obp
          const newVal = (currentVal * currentAB + raw * addedAB) / totalAB
          gain = (newVal - currentVal) * weight * 500
          if (gain !== 0) { totalScore += gain; catGains.push({ cat, gain }) }
        } else if (LOWER_IS_BETTER.includes(cat)) {
          const inversWeight = (11 - (adamRanks[cat] ?? 5)) / 10
          gain = -raw * inversWeight * 0.3
          totalScore += gain
          catGains.push({ cat, gain })
        } else {
          gain = raw * weight
          totalScore += gain
          catGains.push({ cat, gain })
        }
      }

      const priceAdj = Math.max(1, p.pr)
      const finalScore = (totalScore / priceAdj) * 10

      const topCats = catGains
        .filter(c => c.gain > 0)
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 3)

      const needRank = ALL_CATS.reduce((sum, c) => sum + (adamRanks[c] ?? 5), 0)
      recs.push({ player: p, score: finalScore, topCats, needRank })
    }

    const availablePrices = allPlayers
      .filter(p => !draftedIds.has(p.id + '|' + p.n) && p.pr > 0)
      .map(p => p.pr)
      .sort((a, b) => b - a)
    const top20Threshold = availablePrices[Math.floor(availablePrices.length * 0.20)] ?? 20
    const top50Threshold = availablePrices[Math.floor(availablePrices.length * 0.50)] ?? 5
    const sorted = recs.sort((a, b) => b.score - a.score)
    return {
      topEnd:  sorted.filter(r => r.player.pr >= top20Threshold).slice(0, maxResults),
      midTier: sorted.filter(r => r.player.pr < top20Threshold && r.player.pr >= top50Threshold).slice(0, maxResults),
      sneaky:  sorted.filter(r => r.player.pr < top50Threshold && r.player.pr > 0).slice(0, maxResults),
    }
  }, [managers, draftedIds, allPlayers])
}
