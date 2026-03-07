import { Manager, TeamStanding, Category, LOWER_IS_BETTER, isPitcher } from './types'

export function computeStandings(managers: Manager[]): TeamStanding[] {
  return managers.map(m => {
    let r=0,hr=0,rbi=0,sb=0,ab=0,h_=0,so_h=0
    let avg_n=0,obp_n=0
    let w=0,sv=0,hld=0,k=0,bb=0,l=0,ip=0,era_er=0,whip_bb=0,whip_h=0

    m.roster.forEach(entry => {
      const p = entry.player
      if (entry.rosterLevel !== 'major') return
      if (isPitcher(p)) {
        w   += p.w;  sv  += p.sv;  hld += p.hld
        k   += p.k;  bb  += p.bb;  l   += p.l
        ip  += p.ip
        era_er  += p.er * (p.ip / 9)   // ER = ERA × IP/9
        whip_bb += p.bb
        whip_h  += (p.wh * p.ip) - p.bb  // H = WHIP×IP − BB
      } else {
        r   += p.r;  hr  += p.hr;  rbi += p.rb;  sb  += p.sb
        ab  += p.ab; h_  += p.h;   so_h += p.so
        avg_n += p.av * p.ab
        obp_n += p.ob * p.ab
      }
    })

    const era  = ip > 0 ? (era_er / ip) * 9 : 0
    const whip = ip > 0 ? (whip_bb + whip_h) / ip : 0
    const avg  = ab > 0 ? avg_n / ab : 0
    const obp  = ab > 0 ? obp_n / ab : 0

    return { managerId: m.id, r, hr, rbi, sb, avg, obp, ab, h: h_, so_h, w, sv, hld, k, era, whip, ip, bb, l }
  })
}

export type CategoryRank = { managerId: string; rank: number; value: number }

export function rankByCategory(standings: TeamStanding[], cat: Category): CategoryRank[] {
  const getter = catGetter(cat)
  const values = standings.map(s => ({ managerId: s.managerId, value: getter(s) }))

  // For "lower is better" stats, push 0-values to the bottom (not drafted yet)
  const sorted = [...values].sort((a, b) => {
    if (LOWER_IS_BETTER.includes(cat)) {
      if (a.value === 0 && b.value === 0) return 0
      if (a.value === 0) return 1   // 0 ERA → rank last (no pitchers)
      if (b.value === 0) return -1
      return a.value - b.value
    }
    return b.value - a.value
  })

  return sorted.map((s, i) => ({ ...s, rank: i + 1 }))
}

function catGetter(cat: Category): (s: TeamStanding) => number {
  const map: Record<Category, (s: TeamStanding) => number> = {
    R: s=>s.r, HR: s=>s.hr, RBI: s=>s.rbi, SB: s=>s.sb,
    AVG: s=>s.avg, OBP: s=>s.obp,
    W: s=>s.w, SV: s=>s.sv, HLD: s=>s.hld, K: s=>s.k,
    ERA: s=>s.era, WHIP: s=>s.whip, BB: s=>s.bb, L: s=>s.l,
  }
  return map[cat] ?? (() => 0)
}

export function totalRankPoints(standings: TeamStanding[], managerId: string): number {
  const cats: Category[] = ['R','HR','RBI','SB','AVG','OBP','W','SV','HLD','K','ERA','WHIP','BB','L']
  let pts = 0
  for (const cat of cats) {
    const ranks = rankByCategory(standings, cat)
    const r = ranks.find(r => r.managerId === managerId)
    if (r) pts += r.rank
  }
  return pts
}
