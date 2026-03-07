'use client'
import { useState } from 'react'
import { Manager, TeamStanding, Category } from '@/lib/types'
import { rankByCategory, totalRankPoints } from '@/lib/standings'

interface Props {
  managers: Manager[]
  standings: TeamStanding[]
}

const HITTING_CATS: Category[] = ['R','HR','RBI','SB','AVG','OBP']
const PITCHING_CATS: Category[] = ['W','SV','HLD','K','ERA','WHIP','BB','L']

function fmtCat(cat: Category, val: number): string {
  if (!val && val !== 0) return '—'
  if (val === 0) return '—'
  if (cat === 'AVG' || cat === 'OBP') return val.toFixed(3).replace(/^0/, '')
  if (cat === 'ERA') return val.toFixed(2)
  if (cat === 'WHIP') return val.toFixed(2)
  return String(Math.round(val))
}

function rankColor(rank: number, total: number): string {
  const pct = total <= 1 ? 0.5 : (rank - 1) / (total - 1)
  if (pct <= 0.2) return '#22c55e'
  if (pct <= 0.4) return '#86efac'
  if (pct <= 0.6) return 'var(--text2)'
  if (pct <= 0.8) return '#fca5a5'
  return '#ef4444'
}

export default function StandingsView({ managers, standings }: Props) {
  const [sortCat, setSortCat] = useState<Category | 'total'>('total')
  const n = managers.length

  const ranksByCat: Record<Category, ReturnType<typeof rankByCategory>> = {} as any
  for (const cat of [...HITTING_CATS, ...PITCHING_CATS]) {
    ranksByCat[cat] = rankByCategory(standings, cat)
  }

  const totalPts = managers.map(m => ({
    managerId: m.id,
    pts: totalRankPoints(standings, m.id),
  }))

  const sorted = [...managers].sort((a, b) => {
    if (sortCat === 'total') {
      return (totalPts.find(x => x.managerId === a.id)?.pts ?? 999) -
             (totalPts.find(x => x.managerId === b.id)?.pts ?? 999)
    }
    const ra = ranksByCat[sortCat]?.find(r => r.managerId === a.id)?.rank ?? n
    const rb = ranksByCat[sortCat]?.find(r => r.managerId === b.id)?.rank ?? n
    return ra - rb
  })

  const anyData = standings.some(s => s.r > 0 || s.w > 0 || s.k > 0)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 800 }}>Projected Standings</h2>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Live as players are drafted · Major league roster only · Click column to sort</span>
      </div>

      {!anyData && (
        <div style={{ padding: 20, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginBottom: 16 }}>
          Draft players to see projected standings populate here.
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 960, width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border2)' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 400, width: 160, position: 'sticky', left: 0, background: 'var(--bg)' }}>
                Manager
              </th>
              <th onClick={() => setSortCat('total')} style={{ padding: '6px 8px', textAlign: 'center', cursor: 'pointer', color: sortCat === 'total' ? 'var(--gold)' : 'var(--text3)', fontWeight: sortCat === 'total' ? 700 : 400, whiteSpace: 'nowrap' }}>
                TOTAL ▴
              </th>
              {/* Hitting divider */}
              <th style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--cyan)', fontSize: 9, letterSpacing: '0.1em', borderLeft: '2px solid var(--border2)', fontWeight: 400 }}>
                HITTING →
              </th>
              {HITTING_CATS.map(cat => (
                <th key={cat} onClick={() => setSortCat(cat)} style={{ padding: '6px 8px', textAlign: 'center', cursor: 'pointer', color: sortCat === cat ? 'var(--cyan)' : 'var(--text3)', fontWeight: sortCat === cat ? 700 : 400 }}>
                  {cat}
                </th>
              ))}
              {/* Pitching divider */}
              <th style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--purple)', fontSize: 9, letterSpacing: '0.1em', borderLeft: '2px solid var(--border2)', fontWeight: 400 }}>
                PITCHING →
              </th>
              {PITCHING_CATS.map(cat => (
                <th key={cat} onClick={() => setSortCat(cat)} style={{ padding: '6px 8px', textAlign: 'center', cursor: 'pointer', color: sortCat === cat ? 'var(--purple)' : 'var(--text3)', fontWeight: sortCat === cat ? 700 : 400 }}>
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((mgr, idx) => {
              const stand = standings.find(s => s.managerId === mgr.id)
              const pts = totalPts.find(x => x.managerId === mgr.id)?.pts ?? 0
              if (!stand) return null
              return (
                <tr key={mgr.id} style={{ borderTop: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--bg1)' : 'var(--bg)' }}>
                  <td style={{ padding: '7px 10px', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'var(--bg1)' : 'var(--bg)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: rankColor(idx + 1, n), fontWeight: 800, fontSize: 13, minWidth: 18 }}>{idx + 1}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{mgr.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)' }}>{mgr.roster.length} players · ${mgr.budget - mgr.spent} left</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '7px 8px' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: rankColor(idx + 1, n) }}>{pts}</span>
                  </td>
                  <td style={{ borderLeft: '2px solid var(--border2)' }} />
                  {HITTING_CATS.map(cat => {
                    const r = ranksByCat[cat]?.find(x => x.managerId === mgr.id)
                    return (
                      <td key={cat} style={{ textAlign: 'center', padding: '7px 6px' }}>
                        <div style={{ color: rankColor(r?.rank ?? n, n), fontWeight: 600, fontSize: 12 }}>{fmtCat(cat, r?.value ?? 0)}</div>
                        {anyData && <div style={{ fontSize: 9, color: 'var(--text3)' }}>#{r?.rank ?? n}</div>}
                      </td>
                    )
                  })}
                  <td style={{ borderLeft: '2px solid var(--border2)' }} />
                  {PITCHING_CATS.map(cat => {
                    const r = ranksByCat[cat]?.find(x => x.managerId === mgr.id)
                    return (
                      <td key={cat} style={{ textAlign: 'center', padding: '7px 6px' }}>
                        <div style={{ color: rankColor(r?.rank ?? n, n), fontWeight: 600, fontSize: 12 }}>{fmtCat(cat, r?.value ?? 0)}</div>
                        {anyData && <div style={{ fontSize: 9, color: 'var(--text3)' }}>#{r?.rank ?? n}</div>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
