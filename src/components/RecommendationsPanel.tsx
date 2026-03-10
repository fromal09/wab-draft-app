'use client'
import { Player, isPitcher, TAG_CONFIG, PlayerTag } from '@/lib/types'
import { Recommendation, RecommendationTiers } from '@/hooks/useRecommendations'
import { PriceBadge } from './PriceBadge'

interface Props {
  tiers: RecommendationTiers
  adjustedPrices: Map<string, number>
  tags: Record<string, PlayerTag>
  onCycleTag: (key: string) => void
  onNominate?: (p: Player) => void
  onSelect?: (p: Player) => void
  compact?: boolean
}

const TIER_CONFIG = [
  { key: 'topEnd'  as const, label: 'TOP-END TARGETS',  emoji: '⭐', color: '#f59e0b', desc: 'Top 20% of remaining pool' },
  { key: 'midTier' as const, label: 'MID-TIER VALUES',  emoji: '📈', color: '#34d399', desc: 'Top 21-50% of remaining pool' },
  { key: 'sneaky'  as const, label: 'SNEAKY TARGETS',   emoji: '🔍', color: '#a78bfa', desc: 'Outside top 50% — hidden value' },
]

const CAT_COLOR: Record<string, string> = {
  HR: '#f87171', R: '#fb923c', RBI: '#fbbf24', SBN: '#34d399',
  '2B': '#60a5fa', '3B': '#a78bfa', AVG: '#67e8f9', OBP: '#86efac',
  SO: '#f87171', W: '#34d399', SV: '#34d399', HLD: '#60a5fa', K: '#a78bfa',
  ERA: '#fb923c', WHIP: '#fbbf24', QA3: '#67e8f9', BB: '#f87171', L: '#f87171',
}

function RecList({ recs, adjustedPrices, tags, onCycleTag, onNominate, onSelect, compact }: Omit<Props, 'tiers'> & { recs: Recommendation[], compact: boolean }) {
  if (recs.length === 0) return <div style={{ padding: '6px 4px', color: 'var(--text3)', fontSize: 11, textAlign: 'center', fontStyle: 'italic' }}>None available</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4 }}>
      {recs.map((rec, i) => {
        const p = rec.player
        const pkey = p.id + '|' + p.n
        const tag = tags[pkey] ?? null
        const adj = adjustedPrices.get(pkey)
        const showAdj = adj && Math.abs(adj - Math.round(p.pr)) >= 2

        return (
          <div key={pkey} onClick={() => onSelect?.(p)}
            style={{ padding: compact ? '7px 10px' : '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 7, cursor: onSelect ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { if (onSelect) e.currentTarget.style.borderColor = 'var(--border2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: '50%', background: i < 3 ? 'var(--gold)' : 'var(--bg3)', color: i < 3 ? '#1c1408' : 'var(--text3)', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</span>
                  {tag && <span style={{ fontSize: 10, color: TAG_CONFIG[tag].color }}>{TAG_CONFIG[tag].emoji}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg3)', color: 'var(--gold)' }}>{p.ps.split(',')[0].trim()}</span>
                  {rec.topCats.slice(0, compact ? 2 : 3).map(({ cat }) => (
                    <span key={cat} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: (CAT_COLOR[cat] ?? '#60a5fa') + '22', color: CAT_COLOR[cat] ?? '#60a5fa', border: '1px solid ' + (CAT_COLOR[cat] ?? '#60a5fa') + '44', fontWeight: 700 }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <PriceBadge price={p.pr} size="sm" />
                  {showAdj && (<><span style={{ color: 'var(--text3)', fontSize: 10 }}>→</span><PriceBadge price={adj!} size="sm" /></>)}
                </div>
                <button onClick={e => { e.stopPropagation(); onCycleTag(pkey) }} title="Cycle tag"
                  style={{ padding: '2px 6px', borderRadius: 3, border: tag ? '1px solid ' + TAG_CONFIG[tag].color : '1px solid var(--border2)', background: tag ? TAG_CONFIG[tag].bg : 'var(--bg3)', color: tag ? TAG_CONFIG[tag].color : 'var(--text3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {tag ? TAG_CONFIG[tag].emoji : '○'}
                </button>
                {onNominate && !compact && (
                  <button onClick={e => { e.stopPropagation(); onNominate(p) }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: 'none', background: 'var(--gold)', color: '#1c1408', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ⚡
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RecommendationsPanel({ tiers, adjustedPrices, tags, onCycleTag, onNominate, onSelect, compact = false }: Props) {
  const total = tiers.topEnd.length + tiers.midTier.length + tiers.sneaky.length
  if (total === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
        Draft some players to generate recommendations
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 18 }}>
      {TIER_CONFIG.map(tier => {
        const recs = tiers[tier.key]
        return (
          <div key={tier.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: compact ? 4 : 8 }}>
              <span style={{ fontSize: compact ? 9 : 10, fontWeight: 800, color: tier.color, letterSpacing: '0.1em' }}>{tier.emoji} {tier.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text3)' }}>{recs.length}</span>
              {!compact && <span style={{ fontSize: 9, color: 'var(--text3)', opacity: 0.6 }}>· {tier.desc}</span>}
              <div style={{ flex: 1, height: 1, background: tier.color + '33' }} />
            </div>
            <RecList recs={recs} adjustedPrices={adjustedPrices} tags={tags} onCycleTag={onCycleTag} onNominate={onNominate} onSelect={onSelect} compact={compact} />
          </div>
        )
      })}
    </div>
  )
}
