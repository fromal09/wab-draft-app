'use client'

interface SavantData {
  [key: string]: number | [number, number][] | undefined
}

interface BarRow {
  label: string
  value: number
  pct: number   // already display-corrected (high = good, always)
  fmt?: (v: number) => string
}

// Calibrated 2025 ranges (p0 to p100 approx from Savant distributions)
// For lower-is-better stats: pct = 100 - rank (so high pct = good)
const H_RANGES: Record<string, [number, number, boolean]> = {
  // [min, max, lowerIsBetter]
  xwoba:     [.215, .415, false],
  xba:       [.170, .320, false],
  xslg:      [.260, .650, false],
  ev:        [81.0, 97.5, false],
  brl_pct:   [0.0,  22.0, false],
  hh_pct:    [20.0, 58.0, false],
  bat_spd:   [61.0, 83.0, false],
  chase_pct: [16.0, 46.0, true],
  whiff_pct: [8.0,  44.0, true],
  k_pct:     [8.0,  40.0, true],
  bb_pct:    [2.0,  18.5, false],
  spd:       [22.0, 32.0, false],
}
const P_RANGES: Record<string, [number, number, boolean]> = {
  xera:      [2.20, 5.90, true],
  xba:       [.165, .315, true],
  ev:        [82.0, 95.5, true],
  brl_pct:   [0.5,  16.0, true],
  chase_pct: [18.0, 44.0, false],
  whiff_pct: [13.0, 44.0, false],
  k_pct:     [10.0, 38.0, false],
  bb_pct:    [2.5,  16.5, true],
  hh_pct:    [20.0, 52.0, true],
  gb_pct:    [22.0, 62.0, false],
}

function computeDisplayPct(val: number, min: number, max: number, lb: boolean): number {
  const raw = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100))
  return lb ? 100 - raw : raw
}

function getDisplayPct(sv: SavantData, key: string, ranges: Record<string, [number, number, boolean]>): number {
  // Prefer stored real percentile
  const stored = sv[key + '_pct']
  if (typeof stored === 'number') return stored
  // Fall back to calibrated range
  const val = sv[key]
  const r = ranges[key]
  if (typeof val === 'number' && r) return computeDisplayPct(val, r[0], r[1], r[2])
  return 50
}

function pctColor(pct: number): string {
  // 0=dark blue, 50=muted, 100=dark red
  if (pct <= 50) {
    const t = pct / 50
    return `rgb(${Math.round(46 + (115-46)*t)},${Math.round(75 + (85-75)*t)},${Math.round(180 + (115-180)*t)})`
  }
  const t = (pct - 50) / 50
  return `rgb(${Math.round(115 + (196-115)*t)},${Math.round(85 + (55-85)*t)},${Math.round(115 + (55-115)*t)})`
}

function Bar({ row }: { row: BarRow }) {
  const pct = Math.max(0, Math.min(100, row.pct))
  const color = pctColor(pct)
  const displayVal = row.fmt ? row.fmt(row.value) : String(row.value)
  const bubbleInside = pct > 83

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{ width: 108, textAlign: 'right', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
        {row.label}
      </div>
      <div style={{ flex: 1, height: 18, background: 'var(--bg3)', borderRadius: 3, position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, minWidth: pct > 1 ? 3 : 0 }} />
        <div style={{
          position: 'absolute',
          left: bubbleInside ? `calc(${pct}% - 21px)` : `calc(${pct}% + 2px)`,
          top: '50%', transform: 'translateY(-50%)',
          background: color, color: 'white', borderRadius: '50%',
          width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, boxShadow: '0 1px 4px #0006', zIndex: 2,
        }}>
          {Math.round(pct)}
        </div>
      </div>
      <div style={{ width: 40, fontSize: 10, color: 'var(--text2)', textAlign: 'right', flexShrink: 0 }}>
        {displayVal}
      </div>
    </div>
  )
}

type RowDef = [string, string, ((v:number)=>string)?]

export function HitterBars({ sv }: { sv: SavantData }) {
  const f3 = (v: number) => v.toFixed(3).replace(/^0\./, '.')
  const f1 = (v: number) => v.toFixed(1)
  const fp = (v: number) => v.toFixed(1) + '%'

  const defs: RowDef[] = [
    ['xwOBA',         'xwoba',     f3],
    ['xBA',           'xba',       f3],
    ['xSLG',          'xslg',      f3],
    ['Avg Exit Velo', 'ev',        f1],
    ['Barrel %',      'brl_pct',   fp],
    ['Hard-Hit %',    'hh_pct',    fp],
    ['Bat Speed',     'bat_spd',   f1],
    ['Chase %',       'chase_pct', fp],
    ['Whiff %',       'whiff_pct', fp],
    ['K %',           'k_pct',     fp],
    ['BB %',          'bb_pct',    fp],
    ['Sprint Speed',  'spd',       f1],
  ]

  const rows: BarRow[] = defs
    .filter(([, key]) => typeof sv[key] === 'number')
    .map(([label, key, fmt]) => ({
      label, value: sv[key] as number,
      pct: getDisplayPct(sv, key, H_RANGES), fmt,
    }))

  if (rows.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>🏏</span>
        <span className="font-syne" style={{ fontSize: 11, fontWeight: 700 }}>Batting</span>
        <span style={{ fontSize: 8, color: 'var(--text3)', marginLeft: 2 }}>2025 STATCAST · PERCENTILE VS MLB</span>
      </div>
      {rows.map(r => <Bar key={r.label} row={r} />)}
    </div>
  )
}

export function PitcherBars({ sv }: { sv: SavantData }) {
  const f2 = (v: number) => v.toFixed(2)
  const f1 = (v: number) => v.toFixed(1)
  const fp = (v: number) => v.toFixed(1) + '%'
  const f3 = (v: number) => v.toFixed(3).replace(/^0\./, '.')

  const defs: RowDef[] = [
    ['xERA',          'xera',      f2],
    ['xBA',           'xba',       f3],
    ['Avg Exit Velo', 'ev',        f1],
    ['Chase %',       'chase_pct', fp],
    ['Whiff %',       'whiff_pct', fp],
    ['K %',           'k_pct',     fp],
    ['BB %',          'bb_pct',    fp],
    ['Barrel %',      'brl_pct',   fp],
    ['Hard-Hit %',    'hh_pct',    fp],
    ['GB %',          'gb_pct',    fp],
  ]

  const rows: BarRow[] = defs
    .filter(([, key]) => typeof sv[key] === 'number')
    .map(([label, key, fmt]) => ({
      label, value: sv[key] as number,
      pct: getDisplayPct(sv, key, P_RANGES), fmt,
    }))

  if (rows.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>⚾</span>
        <span className="font-syne" style={{ fontSize: 11, fontWeight: 700 }}>Pitching</span>
        <span style={{ fontSize: 8, color: 'var(--text3)', marginLeft: 2 }}>2025 STATCAST · PERCENTILE VS MLB</span>
      </div>
      {rows.map(r => <Bar key={r.label} row={r} />)}
    </div>
  )
}
