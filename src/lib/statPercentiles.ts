import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, POSITION_TABS } from '@/lib/types'

const ALL = playersRaw as unknown as Record<string, Player[]>

export const HITTER_STAT_COLS = [
  { key: 'ab',  label: 'AB',   lob: false, w: 48, fmt: (v: number) => String(Math.round(v)) },
  { key: 'r',   label: 'R',    lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'd2',  label: '2B',   lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'd3',  label: '3B',   lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'hr',  label: 'HR',   lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'rb',  label: 'RBI',  lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'sbn', label: 'SBN',  lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'so',  label: 'SO',   lob: true,  w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'av',  label: 'AVG',  lob: false, w: 52, fmt: (v: number) => v.toFixed(3) },
  { key: 'ob',  label: 'OBP',  lob: false, w: 52, fmt: (v: number) => v.toFixed(3) },
] as const

export const PITCHER_STAT_COLS = [
  { key: 'ip',  label: 'IP',   lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'w',   label: 'W',    lob: false, w: 40, fmt: (v: number) => String(Math.round(v)) },
  { key: 'l',   label: 'L',    lob: true,  w: 40, fmt: (v: number) => String(Math.round(v)) },
  { key: 'sv',  label: 'SV',   lob: false, w: 40, fmt: (v: number) => String(Math.round(v)) },
  { key: 'hld', label: 'HLD',  lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'er',  label: 'ERA',  lob: true,  w: 52, fmt: (v: number) => v.toFixed(2) },
  { key: 'wh',  label: 'WHIP', lob: true,  w: 52, fmt: (v: number) => v.toFixed(2) },
  { key: 'bb',  label: 'BB',   lob: true,  w: 40, fmt: (v: number) => String(Math.round(v)) },
  { key: 'k',   label: 'K',    lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
  { key: 'qa3', label: 'QA3',  lob: false, w: 44, fmt: (v: number) => String(Math.round(v)) },
] as const

export type StatCol = (typeof HITTER_STAT_COLS)[number] | (typeof PITCHER_STAT_COLS)[number]

function buildPctMap(players: Player[], stat: string): Map<string, number> {
  const vals = players
    .map(p => {
      const v = (p as any)[stat]
      return typeof v === 'number' && isFinite(v) ? { key: p.n + '|' + p.t, val: v } : null
    })
    .filter((x): x is { key: string; val: number } => x !== null)
  const sorted = [...vals].sort((a, b) => a.val - b.val)
  const n = sorted.length
  const map = new Map<string, number>()
  sorted.forEach((item, i) => map.set(item.key, n <= 1 ? 50 : Math.round((i / (n - 1)) * 100)))
  return map
}

// Build per-position maps for every relevant stat
const POSITION_PCTS: Record<string, Record<string, Map<string, number>>> = {}
for (const tab of POSITION_TABS) {
  if (tab === 'PROS') continue
  const players = ALL[tab] ?? []
  POSITION_PCTS[tab] = {}
  const cols = (tab === 'SP' || tab === 'RP') ? PITCHER_STAT_COLS : HITTER_STAT_COLS
  for (const col of cols) POSITION_PCTS[tab][col.key] = buildPctMap(players, col.key)
}

export function getStatPct(player: Player, statKey: string): number {
  const pkey = player.n + '|' + player.t
  const positions = player.ps.split(',').map(p => p.trim())
  for (const pos of positions) {
    const val = POSITION_PCTS[pos]?.[statKey]?.get(pkey)
    if (val !== undefined) return val
  }
  return 50
}

export function statColor(pct: number, lob: boolean): string {
  const adj = lob ? 100 - pct : pct
  if (adj >= 85) return '#4ade80'
  if (adj >= 68) return '#a3e635'
  if (adj >= 48) return '#e2e8f0'
  if (adj >= 28) return '#fb923c'
  return '#f87171'
}
