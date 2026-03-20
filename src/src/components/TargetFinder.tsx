'use client'
import { useState, useMemo, useRef } from 'react'
import { Player, isPitcher, POSITION_TABS } from '@/lib/types'
import playersRaw from '@/data/players_raw.json'
import PlayerCard from './PlayerCard'
import { Manager, PlayerTag, TAG_CONFIG } from '@/lib/types'

// ── Data ─────────────────────────────────────────────────────────────────────

const ALL_PLAYERS_RAW = playersRaw as Record<string, Player[]>

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

function deriveKPct(p: Player): number | null {
  const so = (p as any).so, ab = (p as any).ab
  if (typeof so !== 'number' || typeof ab !== 'number' || ab === 0) return null
  return so / ab
}

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

const POSITION_PCTS: Record<string, Record<string, Map<string, number>>> = {}
for (const tab of POSITION_TABS) {
  const players = ALL_PLAYERS_RAW[tab] ?? []
  POSITION_PCTS[tab] = {}
  const cats = (tab === 'SP' || tab === 'RP') ? PITCHER_CATS : HITTER_CATS
  for (const cat of cats) {
    POSITION_PCTS[tab][cat.key] = cat.key === 'kpct'
      ? buildPctMap(players, 'kpct', deriveKPct)
      : buildPctMap(players, cat.key)
  }
}

function buildCombinedPctMaps(positions: string[]): Record<string, Map<string, number>> {
  const isPit = positions.every(p => PITCHER_POSITIONS.includes(p))
  const cats = isPit ? PITCHER_CATS : HITTER_CATS
  const players = positions
    .flatMap(pos => ALL_PLAYERS_RAW[pos] ?? [])
    .filter((p, i, arr) => arr.findIndex(x => x.n === p.n && x.t === p.t) === i)
  return Object.fromEntries(
    cats.map(c => [c.key, c.key === 'kpct'
      ? buildPctMap(players, 'kpct', deriveKPct)
      : buildPctMap(players, c.key)
    ])
  )
}

function getPlayerPct(p: Player, cats: readonly CatDef[], activeCats: Set<string>, pctMaps: Record<string, Map<string, number>>): number {
  const pkey = p.n + '|' + p.t
  const active = cats.filter(c => activeCats.has(c.key))
  if (active.length === 0) return 50
  const scores = active.map(c => {
    const raw = pctMaps[c.key]?.get(pkey) ?? 50
    return c.lob ? 100 - raw : raw
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}


// ── Helpers ────────────────────────────────────────────────────────────────

function tierColor(pct: number) {
  if (pct >= 75) return '#4ade80'
  if (pct >= 55) return '#a3e635'
  if (pct >= 40) return '#facc15'
  if (pct >= 25) return '#fb923c'
  return '#f87171'
}

// ── Position groups ────────────────────────────────────────────────────────

const HITTER_POSITIONS = ['C','1B','2B','SS','3B','LF','CF','RF','OF','DH']
const PITCHER_POSITIONS = ['SP','RP']
const ALL_POSITIONS = [...HITTER_POSITIONS, ...PITCHER_POSITIONS]

interface Props {
  draftedIds: Set<string>
  managers: Manager[]
  hometownMap: Record<string, string>
  adjustedPrices: Map<string, number>
  tags: Record<string, PlayerTag>
  onCycleTag: (key: string) => void
}

export default function TargetFinder({ draftedIds, managers, hometownMap, adjustedPrices, tags, onCycleTag }: Props) {
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set(['SS']))
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set(HITTER_CATS.map(c => c.key)))
  const [showDrafted, setShowDrafted] = useState(false)
  const [tooltip, setTooltip] = useState<{ player: Player; x: number; y: number } | null>(null)
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Determine if we're in pitcher mode based on selected positions
  const isPitcherMode = selectedPositions.size > 0 &&
    Array.from(selectedPositions).every(p => PITCHER_POSITIONS.includes(p))
  const isMixedMode = Array.from(selectedPositions).some(p => HITTER_POSITIONS.includes(p)) &&
    Array.from(selectedPositions).some(p => PITCHER_POSITIONS.includes(p))

  const currentCats: readonly CatDef[] = isPitcherMode ? PITCHER_CATS : HITTER_CATS

  // Sync active cats when mode switches
  const effectiveCats = useMemo(() => {
    return new Set(Array.from(activeCats).filter(k => currentCats.some(c => c.key === k)))
  }, [activeCats, currentCats, isPitcherMode])

  // Build player list for selected positions
  const players = useMemo(() => {
    if (selectedPositions.size === 0) return []
    const seen = new Set<string>()
    const out: Player[] = []
    for (const pos of ALL_POSITIONS) {
      if (!selectedPositions.has(pos)) continue
      for (const p of ALL_PLAYERS_RAW[pos] ?? []) {
        const key = p.n + '|' + p.t
        if (!seen.has(key)) { seen.add(key); out.push(p) }
      }
    }
    return out
  }, [selectedPositions])

  // Build plot data
  const plotData = useMemo(() => {
    const catsToUse = effectiveCats.size > 0 ? effectiveCats : new Set(currentCats.map(c => c.key))
    const pctMaps = buildCombinedPctMaps(Array.from(selectedPositions))
    return players
      .filter(p => showDrafted || !draftedIds.has(p.id + '|' + p.n))
      .filter(p => p.pr > 0)
      .map(p => ({
        player: p,
        pct: getPlayerPct(p, currentCats, catsToUse, pctMaps),
        price: Math.round(p.pr),
        drafted: draftedIds.has(p.id + '|' + p.n),
        key: p.n + '|' + p.t,
        tag: tags[p.id + '|' + p.n] ?? null,
      }))
  }, [players, effectiveCats, currentCats, showDrafted, draftedIds, tags, selectedPositions])

  // Axis ranges
  const maxPrice = useMemo(() => Math.max(60, ...plotData.map(d => d.price)), [plotData])
  const PAD = { left: 52, right: 24, top: 20, bottom: 44 }
  const W = 900, H = 480
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  function toSVG(pct: number, price: number) {
    return {
      x: PAD.left + (pct / 100) * plotW,
      y: PAD.top + plotH - (price / maxPrice) * plotH,
    }
  }

  function togglePos(pos: string) {
    setSelectedPositions(prev => {
      const next = new Set(prev)
      if (next.has(pos)) { if (next.size > 1) next.delete(pos) }
      else next.add(pos)
      return next
    })
  }

  function toggleCat(key: string) {
    setActiveCats(prev => {
      const next = new Set(prev)
      const effective = Array.from(next).filter(k => currentCats.some(c => c.key === k))
      if (next.has(key)) { if (effective.length > 2) next.delete(key) }
      else next.add(key)
      return next
    })
  }

  // Grid lines
  const xGridLines = [0, 25, 50, 75, 100]
  const yGridLines = useMemo(() => {
    const step = maxPrice <= 60 ? 10 : maxPrice <= 100 ? 20 : 25
    const lines = []
    for (let v = 0; v <= maxPrice; v += step) lines.push(v)
    return lines
  }, [maxPrice])

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 12 }}>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', flexShrink: 0 }}>

        {/* Position toggles */}
        <div>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 6 }}>POSITIONS</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {/* Hitter group */}
            <div style={{ display: 'flex', gap: 3, padding: '3px 4px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)' }}>
              {HITTER_POSITIONS.map(pos => {
                const on = selectedPositions.has(pos)
                return (
                  <button key={pos} onClick={() => togglePos(pos)} style={{
                    padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    border: on ? '1px solid #38bdf8' : '1px solid transparent',
                    background: on ? '#0c3a5a' : 'transparent',
                    color: on ? '#38bdf8' : 'var(--text3)',
                    fontSize: 10, fontFamily: 'inherit', fontWeight: on ? 700 : 400,
                    transition: 'all 0.1s',
                  }}>{pos}</button>
                )
              })}
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            {/* Pitcher group */}
            <div style={{ display: 'flex', gap: 3, padding: '3px 4px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--border)' }}>
              {PITCHER_POSITIONS.map(pos => {
                const on = selectedPositions.has(pos)
                return (
                  <button key={pos} onClick={() => togglePos(pos)} style={{
                    padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    border: on ? '1px solid #a78bfa' : '1px solid transparent',
                    background: on ? '#2e1065' : 'transparent',
                    color: on ? '#a78bfa' : 'var(--text3)',
                    fontSize: 10, fontFamily: 'inherit', fontWeight: on ? 700 : 400,
                    transition: 'all 0.1s',
                  }}>{pos}</button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category toggles */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 6 }}>
            CATEGORIES <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 9 }}>(avg percentile across active)</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {currentCats.map(cat => {
              const on = effectiveCats.has(cat.key)
              return (
                <button key={cat.key} onClick={() => toggleCat(cat.key)} style={{
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${on ? '#64748b' : 'var(--border)'}`,
                  background: on ? '#1e293b' : 'transparent',
                  color: on ? 'var(--text)' : 'var(--text3)',
                  fontSize: 10, fontFamily: 'inherit', fontWeight: on ? 700 : 400,
                  opacity: on ? 1 : 0.5, transition: 'all 0.1s',
                }}>
                  {cat.label}
                </button>
              )
            })}
            <button onClick={() => setActiveCats(new Set(currentCats.map(c => c.key)))} style={{
              padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text3)', fontSize: 10, fontFamily: 'inherit',
            }}>All</button>
          </div>
        </div>

        {/* Show drafted toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em' }}>OPTIONS</div>
          <button onClick={() => setShowDrafted(v => !v)} style={{
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${showDrafted ? '#f87171' : 'var(--border)'}`,
            background: showDrafted ? '#450a0a' : 'transparent',
            color: showDrafted ? '#f87171' : 'var(--text3)',
            fontSize: 10, fontFamily: 'inherit', fontWeight: showDrafted ? 700 : 400,
            transition: 'all 0.1s',
          }}>
            {showDrafted ? '● Show Drafted' : '○ Show Drafted'}
          </button>
        </div>

        {/* Player count badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em' }}>SHOWING</div>
          <div style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace', textAlign: 'center' }}>
            {plotData.length} players
          </div>
        </div>
      </div>

      {/* ── Plot ── */}
      <div style={{ flex: 1, minHeight: 0, background: 'var(--bg1)', borderRadius: 10, border: '1px solid var(--border2)', overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={svgRef}
          width="100%" height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid */}
          {xGridLines.map(v => {
            const x = PAD.left + (v / 100) * plotW
            return (
              <g key={`xg${v}`}>
                <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + plotH} stroke="var(--border)" strokeWidth={v === 50 ? 1 : 0.5} strokeDasharray={v === 50 ? '4,3' : undefined} />
                <text x={x} y={PAD.top + plotH + 16} textAnchor="middle" fill="var(--text3)" fontSize={10} fontFamily="Space Mono, monospace">{v}</text>
              </g>
            )
          })}
          {yGridLines.map(v => {
            const y = PAD.top + plotH - (v / maxPrice) * plotH
            return (
              <g key={`yg${v}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="var(--border)" strokeWidth={0.5} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize={10} fontFamily="Space Mono, monospace">${v}</text>
              </g>
            )
          })}

          {/* Axis labels */}
          <text x={PAD.left + plotW / 2} y={H - 4} textAnchor="middle" fill="var(--text3)" fontSize={10} letterSpacing={1}>AVG PERCENTILE RANK</text>
          <text x={12} y={PAD.top + plotH / 2} textAnchor="middle" fill="var(--text3)" fontSize={10} letterSpacing={1} transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}>PRICE</text>

          {/* Dots */}
          {plotData.map(d => {
            const pos = toSVG(d.pct, d.price)
            const col = d.drafted ? '#374151' : tierColor(d.pct)
            const isTagged = !!d.tag
            return (
              <g
                key={d.key}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const svgRect = svgRef.current?.getBoundingClientRect()
                  if (!svgRect) return
                  setTooltip({ player: d.player, x: e.clientX - svgRect.left, y: e.clientY - svgRect.top })
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => setCardPlayer(d.player)}
              >
                {isTagged && (
                  <circle cx={pos.x} cy={pos.y} r={9} fill="none" stroke={TAG_CONFIG[d.tag!].color} strokeWidth={1.5} opacity={0.7} />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={d.drafted ? 4 : 5}
                  fill={col} fillOpacity={d.drafted ? 0.25 : 0.85}
                  stroke={col} strokeWidth={d.drafted ? 0.5 : 1}
                />
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            const d = plotData.find(d => d.player === tooltip.player)
            if (!d) return null
            const pos = toSVG(d.pct, d.price)
            // Flip tooltip if near right/bottom edge
            const tx = pos.x > W * 0.7 ? pos.x - 155 : pos.x + 14
            const ty = pos.y > H * 0.7 ? pos.y - 70 : pos.y - 10
            const col = tierColor(d.pct)
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tx} y={ty} width={148} height={62} rx={6} fill="#0d1117" stroke="var(--border2)" strokeWidth={1} />
                <text x={tx + 10} y={ty + 18} fill="var(--text)" fontSize={12} fontWeight={700}>{d.player.n}</text>
                <text x={tx + 10} y={ty + 32} fill="var(--text3)" fontSize={9}>{d.player.t} · {d.player.ps}</text>
                <text x={tx + 10} y={ty + 48} fill={col} fontSize={11} fontWeight={700} fontFamily="Space Mono, monospace">{d.pct}th %ile</text>
                <text x={tx + 85} y={ty + 48} fill="var(--gold)" fontSize={11} fontWeight={700} fontFamily="Space Mono, monospace">${d.price}</text>
                {d.drafted && <text x={tx + 10} y={ty + 60} fill="var(--red)" fontSize={9}>DRAFTED</text>}
              </g>
            )
          })()}
        </svg>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>PERCENTILE:</span>
        {[
          { label: '75–100', color: '#4ade80' },
          { label: '55–74',  color: '#a3e635' },
          { label: '40–54',  color: '#facc15' },
          { label: '25–39',  color: '#fb923c' },
          { label: '0–24',   color: '#f87171' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text3)' }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={4.5} fill={color} fillOpacity={0.85} /></svg>
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text3)' }}>Click a dot to open player card</span>
      </div>

      {/* Player card modal */}
      {cardPlayer && (
        <PlayerCard
          player={cardPlayer}
          managers={managers}
          hometownMap={hometownMap}
          isDrafted={draftedIds.has(cardPlayer.id + '|' + cardPlayer.n)}
          onNominate={undefined}
          onClose={() => setCardPlayer(null)}
          adjustedPrices={adjustedPrices}
          tag={tags[cardPlayer.id + '|' + cardPlayer.n] ?? null}
          onCycleTag={onCycleTag}
        />
      )}
    </div>
  )
}
