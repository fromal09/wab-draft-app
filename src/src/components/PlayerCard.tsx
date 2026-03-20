'use client'
import { Player, isPitcher, Manager, PlayerTag, TAG_CONFIG } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerStatGrid from './PlayerStatGrid'
import CategoryRadar from './CategoryRadar'
import { HitterBars, PitcherBars } from './SavantBars'
import RollingXwOBA from './RollingXwOBA'

interface Props {
  player: Player
  managers: Manager[]
  hometownMap: Record<string, string>
  isDrafted: boolean
  onNominate: ((p: Player) => void) | undefined
  onClose: () => void
  adjustedPrices?: Map<string, number>
  tag?: PlayerTag | null
  onCycleTag?: (key: string) => void
}

function StatMeta({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 7, padding: '9px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{value}</div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function PlayerCard({ player, managers, hometownMap, isDrafted, onNominate, onClose, adjustedPrices, tag, onCycleTag }: Props) {
  const isPit = isPitcher(player)
  const hometownMgrId = hometownMap[player.n]
  const hometownMgr = hometownMgrId ? managers.find(m => m.id === hometownMgrId) : null
  const discount = hometownMgr ? Math.min(5, Math.round(player.pr * 0.2)) : 0
  const sv = (player as any).savant ?? null
  const hasSavant = sv !== null
  const hasRadar = (player as any).sc > 0
  const hasRoll = hasSavant && sv.xwoba_roll && Array.isArray(sv.xwoba_roll) && sv.xwoba_roll.length > 5
  const blurb = (player as any).blurb

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: '#00000088', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 14,
          width: 980, maxWidth: '96vw', maxHeight: '94vh', overflow: 'auto',
          boxShadow: '0 24px 60px #00000088',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <PriceBadge price={player.pr} size="lg" />
              {(() => {
                if (!adjustedPrices) return null
                const adj = adjustedPrices.get(player.id + '|' + player.n)
                if (!adj || Math.abs(adj - Math.round(player.pr)) < 2) return null
                return (
                  <>
                    <span style={{ color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}>→</span>
                    <PriceBadge price={adj} size="lg" />
                  </>
                )
              })()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="font-syne" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{player.n}</div>
                {onCycleTag && (
                  <button
                    onClick={() => onCycleTag(player.id + '|' + player.n)}
                    title="Cycle tag"
                    style={{ padding: '3px 10px', borderRadius: 5, border: tag ? `1px solid ${TAG_CONFIG[tag].color}` : '1px solid var(--border2)', background: tag ? TAG_CONFIG[tag].bg : 'var(--bg3)', color: tag ? TAG_CONFIG[tag].color : 'var(--text3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    {tag ? `${TAG_CONFIG[tag].emoji} ${TAG_CONFIG[tag].label}` : '○ Tag'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text2)', fontSize: 14 }}>{player.t}</span>
                {player.ps.split(',').map(pos => (
                  <span key={pos} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--gold)', border: '1px solid var(--border2)' }}>{pos.trim()}</span>
                ))}
                {(() => {
                  const rank = (player as any).prospect_rank
                  const eta  = (player as any).prospect_eta
                  if (!rank) return null
                  return (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, color: '#e9d5ff', background: '#4c1d95', border: '1px solid #7c3aed' }}>🔮 Prospect #{rank}</span>
                      {eta && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: '#c4b5fd', background: '#2e1065' }}>ETA {eta}</span>}
                    </>
                  )
                })()}
                {isDrafted && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#450a0a', color: 'var(--red)' }}>DRAFTED</span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {player.adp && <StatMeta label="ADP" value={player.adp} />}
            <StatMeta label="FANTRAX SCORE" value={player.sc} />
            <StatMeta label="PROJ GAMES" value={player.gp} />
          </div>
        </div>

        {/* ── HOMETOWN DISCOUNT ── */}
        {hometownMgr && (
          <div style={{ margin: '10px 20px 0', padding: '9px 14px', background: '#2a1e0688', border: '1px solid #b7791f66', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>★ HOMETOWN DISCOUNT</span>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>·</span>
            <span style={{ color: 'var(--text2)', fontSize: 11 }}>{hometownMgr.name}</span>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>— 20% off, max $5</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: 'var(--gold2)', fontFamily: 'Space Mono, monospace' }}>
              ${Math.max(1, Math.round(player.pr) - discount)}
            </span>
          </div>
        )}

        {/* ── ZONE 2: blurb + projections | radar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: hasRadar ? '1fr 1fr' : '1fr', alignItems: 'start', borderBottom: '1px solid var(--border)' }}>

          {/* LEFT: blurb + projections */}
          <div style={{ padding: '12px 20px 16px', borderRight: hasRadar ? '1px solid var(--border)' : 'none' }}>
            {blurb && (
              <div style={{ padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, borderLeft: '3px solid #4a9eff', marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 5 }}>SCOUT INTEL · Pitcher List</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{blurb}</div>
              </div>
            )}
            <Divider label="2025 PROJECTIONS" />
            <PlayerStatGrid player={player} />
          </div>

          {/* RIGHT: radar — height naturally matches left column */}
          {hasRadar && (
            <div style={{ padding: '12px 20px 16px' }}>
              <Divider label="CATEGORY RADAR" />
              <CategoryRadar player={player} />
            </div>
          )}
        </div>

        {/* ── ZONE 3: statcast full-width, split into two columns inside ── */}
        {hasSavant && (
          <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <Divider label="2025 STATCAST ACTUALS" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              <div>{!isPit ? <HitterBars sv={sv} /> : <PitcherBars sv={sv} />}</div>
              {hasRoll
                ? <div><RollingXwOBA data={sv.xwoba_roll} playerName={player.n} invertColors={isPit} /></div>
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 11 }}>No rolling data</div>
              }
            </div>
          </div>
        )}
        {!hasSavant && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: '9px 14px', background: 'var(--bg2)', borderRadius: 6, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
              Run <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>python3 fetch_savant.py</code> to add Statcast data
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8 }}>
          {!isDrafted && onNominate && (
            <button onClick={() => { onNominate(player); onClose() }} style={{
              flex: 1, padding: '11px', background: 'var(--gold)', color: '#1c1408',
              border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ⚡ Nominate for Auction
            </button>
          )}
          <button onClick={onClose} style={{
            padding: '11px 20px', background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
