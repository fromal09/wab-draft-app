'use client'
import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, POSITION_TABS } from '@/lib/types'

// ─── Precompute per-position percentile maps at module load ──────────────────

const HITTER_STATS  = ['r','d2','d3','hr','rb','sbn','so','av','ob'] as const
const PITCHER_STATS = ['w','l','sv','hld','er','wh','bb','k','qa3'] as const
const LOWER_BETTER  = new Set(['so','er','wh','bb','l'])

type PctMap = Map<string, number> // "name|team" -> 0-100

const PCT: Record<string, Record<string, PctMap>> = {}

for (const tab of POSITION_TABS) {
  const players = (playersRaw as Record<string, Player[]>)[tab] ?? []
  PCT[tab] = {}
  const stats = (tab === 'SP' || tab === 'RP') ? PITCHER_STATS : HITTER_STATS
  for (const stat of stats) {
    const vals = players.map(p => ({ key: p.n + '|' + p.t, val: (p as any)[stat] ?? 0 }))
    const sorted = [...vals].sort((a, b) => a.val - b.val)
    const n = sorted.length
    const map: PctMap = new Map()
    sorted.forEach((item, i) => { map.set(item.key, n <= 1 ? 50 : (i / (n - 1)) * 100) })
    PCT[tab][stat] = map
  }
}

function getPct(player: Player, stat: string): number {
  const pos = player.ps.split(',')[0].trim()
  return PCT[pos]?.[stat]?.get(player.n + '|' + player.t) ?? 50
}

function pctToColor(pct: number, lowerIsBetter = false): string {
  const p = lowerIsBetter ? 100 - pct : pct
  if (p <= 50) {
    const t = p / 50
    return `rgb(${Math.round(239+(245-239)*t)},${Math.round(68+(158-68)*t)},${Math.round(68+(11-68)*t)})`
  }
  const t = (p - 50) / 50
  return `rgb(${Math.round(245+(34-245)*t)},${Math.round(158+(197-158)*t)},${Math.round(11+(94-11)*t)})`
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

interface SBProps { label: string; value: number | string; pct: number; lowerIsBetter?: boolean; noBar?: boolean }

function StatBox({ label, value, pct, lowerIsBetter = false, noBar = false }: SBProps) {
  const displayPct = lowerIsBetter ? 100 - pct : pct
  const color = noBar ? 'var(--text2)' : pctToColor(pct, lowerIsBetter)
  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 8, padding: '10px 6px', textAlign: 'center',
      border: `1px solid ${noBar ? 'var(--border)' : color + '55'}`,
      boxShadow: noBar ? 'none' : `inset 0 0 12px ${color}11`,
    }}>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>
        {value}
      </div>
      {!noBar && <div style={{ fontSize: 8, color: color, opacity: 0.6, marginTop: 4 }}>{Math.round(displayPct)}th %ile</div>}
      {noBar && <div style={{ fontSize: 8, color: 'var(--text3)', marginTop: 4 }}>proj</div>}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function PlayerStatGrid({ player }: { player: Player }) {
  if (!isPitcher(player)) {
    const h = player as any
    return (
      <div>
        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em', marginBottom: 10 }}>
          PROJECTED HITTING — 9 CATEGORIES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, marginBottom: 7 }}>
          <StatBox label="AB"  value={h.ab}          pct={0} noBar />
          <StatBox label="R"   value={h.r}           pct={getPct(player,'r')}   />
          <StatBox label="2B"  value={h.d2}          pct={getPct(player,'d2')}  />
          <StatBox label="3B"  value={h.d3}          pct={getPct(player,'d3')}  />
          <StatBox label="HR"  value={h.hr}          pct={getPct(player,'hr')}  />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
          <StatBox label="RBI" value={h.rb}          pct={getPct(player,'rb')}  />
          <StatBox label="SBN" value={h.sbn}             pct={getPct(player,'sbn')} />
          <StatBox label="SO"  value={h.so}              pct={getPct(player,'so')}  lowerIsBetter />
          <StatBox label="AVG" value={h.av.toFixed(3)}   pct={getPct(player,'av')}  />
          <StatBox label="OBP" value={h.ob.toFixed(3)}   pct={getPct(player,'ob')}  />
        </div>
      </div>
    )
  } else {
    const p = player as any
    return (
      <div>
        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em', marginBottom: 10 }}>
          PROJECTED PITCHING — 9 CATEGORIES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, marginBottom: 7 }}>
          <StatBox label="IP"  value={Math.round(p.ip)} pct={0} noBar />
          <StatBox label="W"   value={p.w}           pct={getPct(player,'w')}   />
          <StatBox label="L"   value={p.l}           pct={getPct(player,'l')}   lowerIsBetter />
          <StatBox label="SV"  value={typeof p.sv === "number" ? p.sv : 0} pct={getPct(player,'sv')}  />
          <StatBox label="HLD" value={p.hld}         pct={getPct(player,'hld')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
          <StatBox label="QA3"  value={p.qa3}           pct={getPct(player,'qa3')} />
          <StatBox label="ERA"  value={p.er.toFixed(2)} pct={getPct(player,'er')} lowerIsBetter />
          <StatBox label="WHIP" value={p.wh.toFixed(2)} pct={getPct(player,'wh')} lowerIsBetter />
          <StatBox label="BB"   value={p.bb}            pct={getPct(player,'bb')} lowerIsBetter />
          <StatBox label="K"    value={p.k}             pct={getPct(player,'k')}  />
        </div>
      </div>
    )
  }
}
