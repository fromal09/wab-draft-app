'use client'
import { useState, useMemo, useCallback } from 'react'
import { Player, PositionTab, Manager, DraftEntry } from '@/lib/types'
import playersRaw from '@/data/players_raw.json'

const PLAYERS_RAW = playersRaw as Record<string, Player[]>

function hasPos(ps: string, pos: string) { return ps.split(',').map(s => s.trim()).includes(pos) }
const PLAYERS: Record<string, Player[]> = {
  ...PLAYERS_RAW,
  LF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'LF')),
  CF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'CF')),
  RF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'RF')),
}

const ALL_TABS: PositionTab[] = ['C','1B','2B','SS','3B','LF','CF','RF','OF','DH','SP','RP']

const POS_COLORS: Record<string, string> = {
  C:'#0ea5e9', '1B':'#10b981', '2B':'#8b5cf6',
  SS:'#f59e0b', '3B':'#ef4444',
  LF:'#06b6d4', CF:'#22d3ee', RF:'#67e8f9', OF:'#06b6d4',
  DH:'#ec4899', SP:'#a3e635', RP:'#fb923c',
}

const ADAM_ID = 'm1'

interface Props {
  draftedIds: Set<string>
  draftLog: DraftEntry[]
  adjustedPrices: Map<string, number>
  managers: Manager[]
}

interface PinnedCard {
  player: Player
  drafted: boolean
  isAdam: boolean
  adjPrice: number
  screenX: number
  screenY: number
}

const MARGIN = { top: 20, right: 30, bottom: 52, left: 58 }

export default function PositionViz({ draftedIds, draftLog, adjustedPrices, managers }: Props) {
  const [tab, setTab] = useState<PositionTab>('SS')
  const [hideDrafted, setHideDrafted] = useState(false)
  const [pinned, setPinned] = useState<PinnedCard | null>(null)
  const [hovered, setHovered] = useState<Player | null>(null)

  const isDrafted = useCallback((p: Player) => draftedIds.has(p.id + '|' + p.n), [draftedIds])

  // Build set of player keys owned by Adam
  const adamKeys = useMemo(() => {
    const s = new Set<string>()
    for (const e of draftLog) {
      if (e.managerId === ADAM_ID) s.add(e.player.id + '|' + e.player.n)
    }
    return s
  }, [draftLog])

  const getAdjPrice = useCallback((p: Player) => {
    const key = p.id + '|' + p.n
    return adjustedPrices.get(key) ?? Math.round(p.pr)
  }, [adjustedPrices])

  const players = useMemo(() => {
    const raw = PLAYERS[tab] ?? []
    return hideDrafted ? raw.filter(p => !isDrafted(p)) : raw
  }, [tab, hideDrafted, isDrafted])

  const color = POS_COLORS[tab] ?? '#888'

  // Axis extents using adjusted price for Y
  const { minPr, maxPr, minSc, maxSc } = useMemo(() => {
    if (!players.length) return { minPr: 0, maxPr: 60, minSc: 0, maxSc: 100 }
    const prs = players.map(p => Math.max(0, getAdjPrice(p)))
    const scs = players.map(p => p.sc)
    const prRange = Math.max(...prs) - Math.min(...prs)
    const scRange = Math.max(...scs) - Math.min(...scs)
    return {
      minPr: Math.max(0, Math.min(...prs) - prRange * 0.05),
      maxPr: Math.max(...prs) + prRange * 0.05,
      minSc: Math.min(...scs) - scRange * 0.05,
      maxSc: Math.max(...scs) + scRange * 0.08,
    }
  }, [players, getAdjPrice])

  const W = 900, H = 520
  const innerW = W - MARGIN.left - MARGIN.right
  const innerH = H - MARGIN.top - MARGIN.bottom

  function toX(sc: number) { return MARGIN.left + ((sc - minSc) / (maxSc - minSc)) * innerW }
  function toY(pr: number) { return MARGIN.top + innerH - ((Math.max(0, pr) - minPr) / (maxPr - minPr)) * innerH }

  const xTicks = useMemo(() => {
    const range = maxSc - minSc
    const step = range <= 20 ? 2 : range <= 50 ? 5 : range <= 100 ? 10 : 20
    const ticks = []
    for (let v = Math.ceil(minSc / step) * step; v <= maxSc; v += step) ticks.push(v)
    return ticks
  }, [minSc, maxSc])

  const yTicks = useMemo(() => {
    const step = maxPr <= 10 ? 1 : maxPr <= 30 ? 5 : maxPr <= 70 ? 10 : 20
    const ticks = []
    for (let v = Math.ceil(minPr / step) * step; v <= maxPr; v += step) ticks.push(v)
    return ticks
  }, [minPr, maxPr])

  const draftedCount = useMemo(() => (PLAYERS[tab] ?? []).filter(isDrafted).length, [tab, isDrafted])
  const availCount = (PLAYERS[tab] ?? []).filter(p => !isDrafted(p)).length
  const adamCount = useMemo(() => (PLAYERS[tab] ?? []).filter(p => adamKeys.has(p.id + '|' + p.n)).length, [tab, adamKeys])



  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Controls bar */}
      <div style={{ padding: '7px 14px', background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {ALL_TABS.map(t => {
          const c = POS_COLORS[t]
          const active = tab === t
          return (
            <button key={t} onClick={() => { setTab(t); setPinned(null) }} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              background: active ? c + '22' : 'transparent',
              color: active ? c : 'var(--text3)',
              borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
              borderRadius: '3px 3px 0 0',
              fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400,
            }}>
              {t} <span style={{ fontSize: 9, opacity: 0.5 }}>({(PLAYERS[t] ?? []).length})</span>
            </button>
          )
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="5" fill="#16a34a" fillOpacity="0.8" stroke="#22c55e" strokeWidth="1" />
              </svg>
              Available ({availCount})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="2" y1="2" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="2" x2="2" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Drafted ({draftedCount})
            </span>
            {adamCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <text x="7" y="11" textAnchor="middle" fontSize="12" fill="#60a5fa">★</text>
                </svg>
                Adam ({adamCount})
              </span>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text2)' }}>
            <div onClick={() => { setHideDrafted(v => !v); setPinned(null) }} style={{
              width: 32, height: 17, borderRadius: 9, background: hideDrafted ? '#16a34a' : 'var(--bg3)',
              border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: hideDrafted ? 16 : 2,
                width: 11, height: 11, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
              }} />
            </div>
            Hide drafted
          </label>
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '10px 14px 8px', position: 'relative' }}>
        <svg
                  viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: hovered ? 'pointer' : 'crosshair' }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Grid lines */}
          {xTicks.map(v => (
            <g key={v}>
              <line x1={toX(v)} y1={MARGIN.top} x2={toX(v)} y2={MARGIN.top + innerH}
                stroke="var(--border)" strokeWidth="1" />
              <text x={toX(v)} y={MARGIN.top + innerH + 18} textAnchor="middle"
                fill="var(--text3)" fontSize="13">{v}</text>
            </g>
          ))}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={MARGIN.left} y1={toY(v)} x2={MARGIN.left + innerW} y2={toY(v)}
                stroke="var(--border)" strokeWidth="1" />
              <text x={MARGIN.left - 8} y={toY(v) + 4} textAnchor="end"
                fill="var(--text3)" fontSize="13">${v}</text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={MARGIN.left + innerW / 2} y={H - 6} textAnchor="middle"
            fill="var(--text3)" fontSize="13" fontFamily="Space Mono, monospace">
            FANTRAX SCORE
          </text>
          <text
            x={16} y={MARGIN.top + innerH / 2}
            textAnchor="middle" fill="var(--text3)" fontSize="13"
            fontFamily="Space Mono, monospace"
            transform={`rotate(-90, 16, ${MARGIN.top + innerH / 2})`}>
            PROJECTED PRICE ($)
          </text>

          {/* Axis borders */}
          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + innerH}
            stroke="var(--border2)" strokeWidth="1.5" />
          <line x1={MARGIN.left} y1={MARGIN.top + innerH} x2={MARGIN.left + innerW} y2={MARGIN.top + innerH}
            stroke="var(--border2)" strokeWidth="1.5" />

          {/* Data points — each has its own click + hover handlers */}
          {players.map((p) => {
            const drafted = isDrafted(p)
            const pkey = p.id + '|' + p.n
            const isAdam = adamKeys.has(pkey)
            const adjPr = getAdjPrice(p)
            const px = toX(p.sc)
            const py = toY(adjPr)
            const isPinned = pinned?.player === p
            const isHov = hovered === p

            function handlePointClick(e: React.MouseEvent) {
              e.stopPropagation()
              if (isPinned) { setPinned(null); return }
              setPinned({ player: p, drafted, isAdam, adjPrice: adjPr,
                screenX: e.clientX, screenY: e.clientY })
            }
            function handlePointEnter() { setHovered(p) }
            function handlePointLeave() { setHovered(null) }

            if (isAdam) {
              const sz = isPinned ? 16 : isHov ? 14 : 11
              return (
                <g key={pkey} onClick={handlePointClick} onMouseEnter={handlePointEnter} onMouseLeave={handlePointLeave}
                  style={{ cursor: 'pointer' }}>
                  <circle cx={px} cy={py} r={16} fill="transparent" />
                  <text x={px} y={py + sz * 0.38} textAnchor="middle" fontSize={sz * 2}
                    fill={isPinned ? '#93c5fd' : isHov ? '#60a5fa' : '#3b82f6'}
                    style={{ userSelect: 'none', filter: isPinned ? 'drop-shadow(0 0 5px #3b82f6)' : 'none' }}>
                    ★
                  </text>
                </g>
              )
            }

            if (drafted) {
              const s = isPinned ? 10 : isHov ? 8 : 6
              return (
                <g key={pkey} onClick={handlePointClick} onMouseEnter={handlePointEnter} onMouseLeave={handlePointLeave}
                  style={{ cursor: 'pointer' }} opacity={isPinned ? 0.9 : isHov ? 0.75 : 0.5}>
                  <circle cx={px} cy={py} r={14} fill="transparent" />
                  <line x1={px - s} y1={py - s} x2={px + s} y2={py + s}
                    stroke={isPinned || isHov ? '#fca5a5' : '#ef4444'} strokeWidth={isPinned ? 2.5 : 1.8} strokeLinecap="round" />
                  <line x1={px + s} y1={py - s} x2={px - s} y2={py + s}
                    stroke={isPinned || isHov ? '#fca5a5' : '#ef4444'} strokeWidth={isPinned ? 2.5 : 1.8} strokeLinecap="round" />
                </g>
              )
            }

            return (
              <g key={pkey} onClick={handlePointClick} onMouseEnter={handlePointEnter} onMouseLeave={handlePointLeave}
                style={{ cursor: 'pointer' }}>
                <circle cx={px} cy={py} r={14} fill="transparent" />
                <circle cx={px} cy={py}
                  r={isPinned ? 8 : isHov ? 7 : 5.5}
                  fill={isPinned ? color : '#16a34a'}
                  fillOpacity={isPinned ? 0.95 : isHov ? 0.9 : 0.75}
                  stroke={isPinned ? color : isHov ? '#4ade80' : '#22c55e'}
                  strokeWidth={isPinned ? 2 : 1}
                />
              </g>
            )
          })}

          {/* Pinned ring highlight */}
          {pinned && !pinned.isAdam && (
            <circle
              cx={toX(pinned.player.sc)}
              cy={toY(pinned.adjPrice)}
              r={12} fill="none"
              stroke={pinned.drafted ? '#fca5a5' : color}
              strokeWidth={1.5} opacity={0.5}
              strokeDasharray="3 2"
            />
          )}
        </svg>

        {/* Pinned card — dismiss on click outside */}
        {pinned && (
          <div style={{
            position: 'fixed',
            left: Math.min(pinned.screenX + 14, window.innerWidth - 210),
            top: Math.min(pinned.screenY - 10, window.innerHeight - 180),
            background: 'var(--bg2)',
            border: `1px solid ${pinned.isAdam ? '#3b82f688' : pinned.drafted ? '#ef444466' : color + '88'}`,
            borderRadius: 8,
            padding: '10px 14px',
            pointerEvents: 'auto',
            zIndex: 999,
            minWidth: 180,
            boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pinned.isAdam && <span style={{ color: '#60a5fa', fontSize: 14 }}>★</span>}
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', fontFamily: 'Space Mono, monospace' }}>
                {pinned.player.n}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {pinned.player.t} · {pinned.player.ps}
              {pinned.player.age > 0 && ` · age ${pinned.player.age}`}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>PROJ $</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', fontFamily: 'Space Mono, monospace' }}>${pinned.adjPrice}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>SCORE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: color, fontFamily: 'Space Mono, monospace' }}>{pinned.player.sc}</div>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: pinned.isAdam ? '#60a5fa' : pinned.drafted ? '#ef4444' : '#22c55e' }}>
              {pinned.isAdam ? '★ Adam\'s player' : pinned.drafted ? '✗ DRAFTED' : '● AVAILABLE'}
            </div>
            <button onClick={() => setPinned(null)}
              style={{ marginTop: 6, width: '100%', padding: '3px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', pointerEvents: 'auto' }}>
              ✕ dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
