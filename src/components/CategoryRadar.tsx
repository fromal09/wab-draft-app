'use client'
import { useState, useMemo } from 'react'
import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, POSITION_TABS } from '@/lib/types'

const ALL_PLAYERS = playersRaw as Record<string, Player[]>

const HITTER_CATS = [
  { key: 'r',    label: 'R',    lob: false },
  { key: 'd2',   label: '2B',   lob: false },
  { key: 'd3',   label: '3B',   lob: false },
  { key: 'hr',   label: 'HR',   lob: false },
  { key: 'rb',   label: 'RBI',  lob: false },
  { key: 'sbn',  label: 'SBN',  lob: false },
  { key: 'kpct', label: 'K%',   lob: true  },
  { key: 'av',   label: 'AVG',  lob: false },
  { key: 'ob',   label: 'OBP',  lob: false },
] as const

const PITCHER_CATS = [
  { key: 'w',   label: 'W',    lob: false },
  { key: 'l',   label: 'L',    lob: true  },
  { key: 'sv',  label: 'SV',   lob: false },
  { key: 'hld', label: 'HLD',  lob: false },
  { key: 'er',  label: 'ERA',  lob: true  },
  { key: 'wh',  label: 'WHIP', lob: true  },
  { key: 'bb',  label: 'BB',   lob: true  },
  { key: 'k',   label: 'K',    lob: false },
  { key: 'qa3', label: 'QA3',  lob: false },
] as const

type CatDef = { key: string; label: string; lob: boolean }

function buildPctMap(players: Player[], stat: string, derive?: (p: Player) => number | null): Map<string, number> {
  const vals = players
    .map(p => {
      const val = derive ? derive(p) : (p as any)[stat] as number
      return typeof val === 'number' && isFinite(val) ? { key: p.n + '|' + p.t, val } : null
    })
    .filter((x): x is { key: string; val: number } => x !== null)
  const sorted = [...vals].sort((a, b) => a.val - b.val)
  const n = sorted.length
  const map = new Map<string, number>()
  sorted.forEach((item, i) => map.set(item.key, n <= 1 ? 50 : Math.round((i / (n - 1)) * 100)))
  return map
}

// K% = SO / AB  (higher = worse for hitter, lob: true)
function deriveKPct(p: Player): number | null {
  const so = (p as any).so
  const ab = (p as any).ab
  if (typeof so !== 'number' || typeof ab !== 'number' || ab === 0) return null
  return so / ab
}

const POSITION_PCTS: Record<string, Record<string, Map<string, number>>> = {}
for (const tab of POSITION_TABS) {
  const players = ALL_PLAYERS[tab] ?? []
  POSITION_PCTS[tab] = {}
  const cats = (tab === 'SP' || tab === 'RP') ? PITCHER_CATS : HITTER_CATS
  for (const cat of cats) {
    POSITION_PCTS[tab][cat.key] = cat.key === 'kpct'
      ? buildPctMap(players, 'kpct', deriveKPct)
      : buildPctMap(players, cat.key)
  }
}

const allHitters = POSITION_TABS
  .filter(t => t !== 'SP' && t !== 'RP' && t !== 'PROS')
  .flatMap(t => ALL_PLAYERS[t] ?? [])
  .filter((p, i, arr) => arr.findIndex(x => x.n === p.n && x.t === p.t) === i)
const allPitchers = ['SP', 'RP']
  .flatMap(t => ALL_PLAYERS[t] ?? [])
  .filter((p, i, arr) => arr.findIndex(x => x.n === p.n && x.t === p.t) === i)

const POOL_PCTS = {
  hitter:  Object.fromEntries(HITTER_CATS.map(c  => [c.key, c.key === 'kpct' ? buildPctMap(allHitters, 'kpct', deriveKPct) : buildPctMap(allHitters,  c.key)])),
  pitcher: Object.fromEntries(PITCHER_CATS.map(c => [c.key, buildPctMap(allPitchers, c.key)])),
}

// ── Radar geometry ────────────────────────────────────────────────────────────

const CX = 160, CY = 155, R = 115

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function pctToRadius(pct: number) {
  return (pct / 100) * R
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function scoreColor(avg: number) {
  if (avg >= 75) return '#4ade80'
  if (avg >= 55) return '#a3e635'
  if (avg >= 40) return '#facc15'
  if (avg >= 25) return '#fb923c'
  return '#f87171'
}

export default function CategoryRadar({ player }: { player: Player }) {
  const pit = isPitcher(player)
  const allCats: readonly CatDef[] = pit ? PITCHER_CATS : HITTER_CATS

  // Smart defaults: exclude QA3 always; exclude SV/HLD if player projects 0
  const defaultActive = new Set(
    allCats
      .filter(c => {
        if (c.key === 'qa3') return false
        if (c.key === 'sv'  && ((player as any).sv  ?? 0) === 0) return false
        if (c.key === 'hld' && ((player as any).hld ?? 0) === 0) return false
        return true
      })
      .map(c => c.key)
  )

  const [active, setActive] = useState<Set<string>>(defaultActive)
  const [scope, setScope] = useState<'position' | 'pool'>('position')
  const pkey = player.n + '|' + player.t

  // Get percentile for each cat
  const pcts = useMemo<Record<string, number>>(() => {
    const positions = player.ps.split(',').map(p => p.trim())
    const result: Record<string, number> = {}
    for (const cat of allCats) {
      let found: number | undefined
      if (scope === 'position') {
        // Try each listed position until we find one that has this player
        for (const pos of positions) {
          const val = POSITION_PCTS[pos]?.[cat.key]?.get(pkey)
          if (val !== undefined) { found = val; break }
        }
        // Pitcher fallback: SP → RP
        if (found === undefined && pit) {
          found = POSITION_PCTS['SP']?.[cat.key]?.get(pkey)
            ?? POSITION_PCTS['RP']?.[cat.key]?.get(pkey)
        }
      }
      // Always fall back to pool if position lookup missed
      if (found === undefined) {
        const poolMap = pit ? POOL_PCTS.pitcher[cat.key] : POOL_PCTS.hitter[cat.key]
        found = poolMap?.get(pkey)
      }
      result[cat.key] = found ?? 50
    }
    return result
  }, [scope, allCats, pit, player.ps, pkey])

  // Only the toggled cats
  const visibleCats = allCats.filter(c => active.has(c.key))
  const n = visibleCats.length

  // Compute adjusted pct (flip lob)
  function adjPct(cat: CatDef) {
    return cat.lob ? 100 - pcts[cat.key] : pcts[cat.key]
  }

  // Average score across active cats
  const avgScore = n > 0
    ? visibleCats.reduce((sum, c) => sum + adjPct(c), 0) / n
    : 0

  // Build polygon points
  const polygonPoints = visibleCats.map((cat, i) => {
    const angle = (360 / n) * i
    const r = pctToRadius(adjPct(cat))
    return polarToXY(angle, r)
  })

  // Axis endpoints
  const axisPoints = visibleCats.map((cat, i) => {
    const angle = (360 / n) * i
    return { ...polarToXY(angle, R), cat, angle, adj: adjPct(cat) }
  })

  const polyStr = polygonPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Ring labels (25, 50, 75, 100)
  const rings = [25, 50, 75, 100]

  const accentColor = scoreColor(avgScore)

  function toggleCat(key: string) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 2) next.delete(key) // keep at least 2 visible
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', borderRadius: 6, padding: 2 }}>
          {(['position', 'pool'] as const).map(s => (
            <button key={s} onClick={() => setScope(s)} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer', borderRadius: 5,
              background: scope === s ? 'var(--border2)' : 'transparent',
              color: scope === s ? 'var(--text)' : 'var(--text3)',
              fontSize: 10, fontFamily: 'inherit', fontWeight: scope === s ? 700 : 400,
            }}>
              {s === 'position' ? `vs ${player.ps.split(',')[0].trim()}` : 'vs Pool'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>
          Avg: <span style={{ color: accentColor, fontWeight: 700 }}>{Math.round(avgScore)}th %ile</span>
        </div>
      </div>

      {/* Category toggle pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {allCats.map(cat => {
          const on = active.has(cat.key)
          const adj = adjPct(cat)
          const col = scoreColor(adj)
          return (
            <button
              key={cat.key}
              onClick={() => toggleCat(cat.key)}
              style={{
                padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${on ? col : 'var(--border)'}`,
                background: on ? col + '22' : 'var(--bg3)',
                color: on ? col : 'var(--text3)',
                fontSize: 10, fontFamily: 'inherit', fontWeight: on ? 700 : 400,
                transition: 'all 0.15s',
                opacity: on ? 1 : 0.5,
              }}
            >
              {cat.label}
              {on && <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.7 }}>{Math.round(adj)}</span>}
            </button>
          )
        })}
        <button
          onClick={() => setActive(new Set(allCats.map(c => c.key)))}
          style={{
            padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text3)', fontSize: 10, fontFamily: 'inherit',
          }}
        >
          All
        </button>
      </div>

      {/* SVG Radar */}
      {n >= 3 ? (
        <div style={{ width: '100%', height: 280, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${CX * 2} ${CY * 2 + 10}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
          {/* Ring grid lines */}
          {rings.map(ring => {
            const pts = visibleCats.map((_, i) => {
              const angle = (360 / n) * i
              return polarToXY(angle, (ring / 100) * R)
            })
            return (
              <polygon
                key={ring}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="var(--border)"
                strokeWidth={ring === 50 ? 1 : 0.5}
                strokeDasharray={ring === 50 ? '3,3' : undefined}
                opacity={0.5}
              />
            )
          })}

          {/* Axis lines */}
          {axisPoints.map(({ x, y, cat }) => (
            <line
              key={cat.key}
              x1={CX} y1={CY} x2={x} y2={y}
              stroke="var(--border2)" strokeWidth={0.5} opacity={0.6}
            />
          ))}

          {/* Filled polygon */}
          {polygonPoints.length >= 3 && (
            <>
              <polygon
                points={polyStr}
                fill={accentColor}
                fillOpacity={0.15}
                stroke={accentColor}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Vertex dots */}
              {polygonPoints.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={accentColor} />
              ))}
            </>
          )}

          {/* Axis labels */}
          {axisPoints.map(({ cat, angle, adj }) => {
            const labelR = R + 20
            const pos = polarToXY(angle, labelR)
            const col = scoreColor(adj)
            const anchor = pos.x < CX - 5 ? 'end' : pos.x > CX + 5 ? 'start' : 'middle'
            return (
              <g key={cat.key}>
                <text
                  x={pos.x} y={pos.y - 3}
                  textAnchor={anchor}
                  fill={col}
                  fontSize={9}
                  fontWeight={700}
                  fontFamily="inherit"
                >
                  {cat.label}
                </text>
                <text
                  x={pos.x} y={pos.y + 9}
                  textAnchor={anchor}
                  fill="var(--text3)"
                  fontSize={8}
                  fontFamily="Space Mono, monospace"
                >
                  {Math.round(adj)}%
                </text>
              </g>
            )
          })}

          {/* Center score */}
          <text x={CX} y={CY - 6} textAnchor="middle" fill={accentColor} fontSize={22} fontWeight={800} fontFamily="Space Mono, monospace">
            {Math.round(avgScore)}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="var(--text3)" fontSize={8} fontFamily="inherit">
            PERCENTILE
          </text>
        </svg>
        </div>
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
          Enable at least 3 categories to show radar
        </div>
      )}
    </div>
  )
}
