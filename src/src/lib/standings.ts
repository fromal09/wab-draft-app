import { Manager, TeamStanding, Category, LOWER_IS_BETTER, isPitcher } from './types'

export function computeStandings(managers: Manager[]): TeamStanding[] {
  return managers.map(m => {
    let r=0, d2=0, d3=0, hr=0, rbi=0, sbn=0, so_h=0, ab=0
    let avg_n=0, obp_n=0
    let w=0, l=0, sv=0, hld=0, bb=0, k=0, qa3=0, ip=0
    let era_er=0, whip_bb=0, whip_h=0

    m.roster.forEach(entry => {
      const p = entry.player
      if (entry.rosterLevel !== 'major') return
      if (isPitcher(p)) {
        w   += p.w;  l   += p.l;  sv  += p.sv;  hld += p.hld
        bb  += p.bb; k   += p.k;  qa3 += p.qa3
        ip  += p.ip
        era_er  += p.er * (p.ip / 9)      // ER = ERA × IP/9
        whip_bb += p.bb
        whip_h  += (p.wh * p.ip) - p.bb   // H = WHIP×IP − BB
      } else {
        r   += p.r;  d2  += p.d2; d3  += p.d3
        hr  += p.hr; rbi += p.rb; sbn += p.sbn
        so_h += p.so
        ab  += p.ab
        avg_n += p.av * p.ab
        obp_n += p.ob * p.ab
      }
    })

    const era  = ip > 0 ? (era_er / ip) * 9 : 0
    const whip = ip > 0 ? (whip_bb + whip_h) / ip : 0
    const avg  = ab > 0 ? avg_n / ab : 0
    const obp  = ab > 0 ? obp_n / ab : 0

    return { managerId: m.id, r, d2, d3, hr, rbi, sbn, so_h, avg, obp, ab, w, l, sv, hld, era, whip, bb, k, qa3, ip }
  })
}

export type CategoryRank = { managerId: string; rank: number; value: number }

export function rankByCategory(standings: TeamStanding[], cat: Category): CategoryRank[] {
  const getter = catGetter(cat)
  const values = standings.map(s => ({ managerId: s.managerId, value: getter(s) }))

  const sorted = [...values].sort((a, b) => {
    if (LOWER_IS_BETTER.includes(cat)) {
      // Push zeros to last (no players drafted yet)
      if (a.value === 0 && b.value === 0) return 0
      if (a.value === 0) return 1
      if (b.value === 0) return -1
      return a.value - b.value
    }
    return b.value - a.value
  })

  return sorted.map((s, i) => ({ ...s, rank: i + 1 }))
}

function catGetter(cat: Category): (s: TeamStanding) => number {
  const map: Record<Category, (s: TeamStanding) => number> = {
    // Hitting
    R:   s => s.r,
    '2B': s => s.d2,
    '3B': s => s.d3,
    HR:  s => s.hr,
    RBI: s => s.rbi,
    SBN: s => s.sbn,
    SO:  s => s.so_h,
    AVG: s => s.avg,
    OBP: s => s.obp,
    // Pitching
    W:    s => s.w,
    L:    s => s.l,
    SV:   s => s.sv,
    HLD:  s => s.hld,
    ERA:  s => s.era,
    WHIP: s => s.whip,
    BB:   s => s.bb,
    K:    s => s.k,
    QA3:  s => s.qa3,
  }
  return map[cat] ?? (() => 0)
}

export function totalRankPoints(standings: TeamStanding[], managerId: string): number {
  const cats: Category[] = ['R','2B','3B','HR','RBI','SBN','SO','AVG','OBP','W','L','SV','HLD','ERA','WHIP','BB','K','QA3']
  let pts = 0
  for (const cat of cats) {
    const ranks = rankByCategory(standings, cat)
    const r = ranks.find(r => r.managerId === managerId)
    if (r) pts += r.rank
  }
  return pts
}
