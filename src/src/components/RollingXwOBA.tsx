'use client'
import { useMemo } from 'react'

interface Props {
  data: [number, number][]
  playerName: string
  invertColors?: boolean  // true for pitchers: low xwOBA allowed = good = red
}

const LG_AVG = 0.312
const BAND = 0.060  // distance from LG_AVG where color is fully saturated

export default function RollingXwOBA({ data, playerName, invertColors = false }: Props) {
  if (!data || data.length < 3) return null

  // Responsive: use 100% width via viewBox
  const VW = 500
  const VH = 280
  const PAD = { top: 16, right: 56, bottom: 28, left: 40 }
  const W = VW - PAD.left - PAD.right
  const H = VH - PAD.top  - PAD.bottom

  const xwobas = data.map(d => d[1])
  const allVals = [...xwobas, LG_AVG]
  const minV = Math.min(...allVals) - 0.025
  const maxV = Math.max(...allVals) + 0.025
  const maxPA = data[data.length - 1][0]

  const xS = (pa: number) => (pa / maxPA) * W
  const yS = (v: number)  => H - ((v - minV) / (maxV - minV)) * H

  // Color anchored to LG_AVG — never player-relative
  // Hitters: above LG_AVG = red (good), below = blue (bad)
  // Pitchers: below LG_AVG = red (good = fewer xwOBA allowed), above = blue (bad)
  function lineColor(val: number): string {
    const diff = invertColors ? LG_AVG - val : val - LG_AVG
    const t = Math.max(-1, Math.min(1, diff / BAND))
    if (t >= 0) {
      // positive = above LG_AVG for hitter / below for pitcher → red
      return `rgb(${Math.round(115 + (196 - 115) * t)},${Math.round(85 + (55 - 85) * t)},${Math.round(115 + (55 - 115) * t)})`
    } else {
      // negative → blue
      const s = -t
      return `rgb(${Math.round(115 + (46 - 115) * s)},${Math.round(85 + (75 - 85) * s)},${Math.round(115 + (180 - 115) * s)})`
    }
  }

  const segments = useMemo(() => data.slice(1).map((d, i) => ({
    x1: xS(data[i][0]), y1: yS(data[i][1]),
    x2: xS(d[0]),       y2: yS(d[1]),
    color: lineColor((data[i][1] + d[1]) / 2),
  })), [data, invertColors, minV, maxV, maxPA])

  const lastVal = xwobas[xwobas.length - 1]
  const recent = xwobas.slice(-8)
  const trend = recent.length >= 2 ? recent[recent.length - 1] - recent[0] : 0
  const endColor = lineColor(lastVal)

  const yTicks: number[] = []
  const step = 0.05
  let tick = Math.ceil(minV / step) * step
  while (tick <= maxV + 0.001) { yTicks.push(Math.round(tick * 1000) / 1000); tick = Math.round((tick + step) * 1000) / 1000 }

  const xLabels: number[] = []
  for (let pa = 100; pa <= maxPA; pa += 100) xLabels.push(pa)

  const trendUp = trend > 0.008
  const trendDn = trend < -0.008
  const trendColor = trendUp
    ? (invertColors ? '#3b6cb7' : '#c0392b')
    : trendDn ? (invertColors ? '#c0392b' : '#3b6cb7') : 'var(--text3)'

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span className="font-syne" style={{ fontSize: 11, fontWeight: 700 }}>100 PAs Rolling xwOBA</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: endColor, fontFamily: 'Space Mono, monospace' }}>
          {lastVal?.toFixed(3)}
        </span>
        {(trendUp || trendDn) && (
          <span style={{ fontSize: 9, color: trendColor }}>
            {trendUp ? '▲' : '▼'} recent
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`rc-${playerName.replace(/\s/g,'')}`}>
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Y gridlines */}
          {yTicks.map(t => (
            <g key={t}>
              <line x1={0} x2={W} y1={yS(t)} y2={yS(t)}
                stroke="var(--border)" strokeWidth={0.8} strokeDasharray="4 4" />
              <text x={-5} y={yS(t) + 4} textAnchor="end"
                style={{ fontSize: 9, fill: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>
                {t.toFixed(3).replace(/^0\./, '.')}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map(pa => (
            <text key={pa} x={xS(pa)} y={H + 14} textAnchor="middle"
              style={{ fontSize: 8, fill: 'var(--text3)' }}>{pa}</text>
          ))}
          <text x={W / 2} y={H + 26} textAnchor="middle"
            style={{ fontSize: 8, fill: 'var(--text3)' }}>PA</text>

          {/* LG AVG dashed line */}
          <line x1={0} x2={W} y1={yS(LG_AVG)} y2={yS(LG_AVG)}
            stroke="#888" strokeWidth={1} strokeDasharray="5 3" />
          <text x={W + 4} y={yS(LG_AVG) + 4}
            style={{ fontSize: 8, fill: '#888' }}>LG AVG</text>

          {/* Colored segments */}
          <g clipPath={`url(#rc-${playerName.replace(/\s/g,'')})`}>
            {segments.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
            ))}
          </g>

          {/* End dot */}
          <circle cx={xS(maxPA)} cy={yS(lastVal)} r={4}
            fill={endColor} stroke="var(--bg1)" strokeWidth={2} />
        </g>
      </svg>
    </div>
  )
}
