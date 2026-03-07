'use client'
import { Player, isPitcher, Manager } from '@/lib/types'
import { PriceBadge } from './PriceBadge'

interface Props {
  player: Player
  managers: Manager[]
  hometownMap: Record<string, string>
  isDrafted: boolean
  onNominate?: (p: Player) => void
  onClose: () => void
}

export default function PlayerCard({ player, managers, hometownMap, isDrafted, onNominate, onClose }: Props) {
  const p = player
  const isPit = isPitcher(p)
  const hometown = hometownMap[p.n]
  const hometownManager = hometown ? managers.find(m => m.id === hometown) : null

  const posArr = p.ps.split(',').map(s => s.trim())

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg1)', border: '1px solid var(--border2)',
        borderRadius: 12, width: 460, maxWidth: '95vw',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Header strip */}
        <div style={{
          padding: '16px 20px 14px',
          background: p.pr >= 50 ? 'linear-gradient(135deg,#1c1408,#2a1e06)' :
                      p.pr >= 35 ? 'linear-gradient(135deg,#0f172a,#1a2438)' :
                      'var(--bg2)',
          borderBottom: `1px solid ${p.pr >= 50 ? '#b7791f44' : 'var(--border)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <PriceBadge price={p.pr} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-syne" style={{ fontSize: 20, fontWeight: 800, color: isDrafted ? 'var(--text3)' : 'var(--text)', lineHeight: 1.1 }}>
                {p.n}
                {isDrafted && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--red)', background: '#450a0a', padding: '2px 6px', borderRadius: 4 }}>DRAFTED</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>{p.t}</span>
                {posArr.map(pos => (
                  <span key={pos} style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--bg3)', color: 'var(--gold)', border: '1px solid var(--border2)',
                  }}>{pos}</span>
                ))}
                {p.age > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Age {p.age}</span>}
              </div>
            </div>
          </div>

          {/* ADP + Score */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {p.adp && (
              <div style={{ textAlign: 'center', background: 'var(--bg3)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>ADP</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{p.adp}</div>
              </div>
            )}
            <div style={{ textAlign: 'center', background: 'var(--bg3)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>FANTRAX SCORE</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan)' }}>{p.sc}</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg3)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>PROJ GAMES</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{p.gp}</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ padding: '14px 20px' }}>
          {!isPit ? (
            <>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 10 }}>PROJECTED HITTING</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['HR', (p as any).hr], ['RBI', (p as any).rb], ['R', (p as any).r], ['SB', (p as any).sb],
                  ['AB', (p as any).ab], ['H', (p as any).h], ['SO', (p as any).so], ['GP', p.gp],
                ].map(([label, val]) => (
                  <StatBox key={label as string} label={label as string} value={val as number} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                <StatBox label="AVG" value={(p as any).av.toFixed(3)} highlight />
                <StatBox label="OBP" value={(p as any).ob.toFixed(3)} highlight />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 10 }}>PROJECTED PITCHING</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['W', (p as any).w], ['L', (p as any).l], ['SV', (p as any).sv], ['HLD', (p as any).hld],
                  ['K', (p as any).k], ['BB', (p as any).bb], ['IP', (p as any).ip], ['GP', p.gp],
                ].map(([label, val]) => (
                  <StatBox key={label as string} label={label as string} value={val as number} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                <StatBox label="ERA" value={(p as any).er.toFixed(2)} highlight
                  color={(p as any).er < 3.2 ? 'var(--green)' : (p as any).er < 4.0 ? 'var(--gold)' : 'var(--red)'} />
                <StatBox label="WHIP" value={(p as any).wh.toFixed(2)} highlight
                  color={(p as any).wh < 1.1 ? 'var(--green)' : (p as any).wh < 1.3 ? 'var(--gold)' : 'var(--red)'} />
              </div>
            </>
          )}
        </div>

        {/* Hometown discount */}
        {hometownManager && (
          <div style={{
            margin: '0 20px 12px',
            padding: '10px 14px',
            background: 'linear-gradient(135deg,#1c1408,#2a1e06)',
            border: '1px solid #b7791f66',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', fontWeight: 700 }}>
              ★ HOMETOWN DISCOUNT
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
              <strong style={{ color: 'var(--gold2)' }}>{hometownManager.name}</strong> may draft at 20% off (max $5 reduction)
              if no Qualifying Offer was made
            </div>
          </div>
        )}

        {/* Placeholder hometown (no data yet) */}
        {!hometownManager && (
          <div style={{ margin: '0 20px 12px', padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>★ Hometown discount: <em>not assigned (configure in Settings)</em></div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
          {!isDrafted && onNominate && (
            <button onClick={() => { onNominate(player); onClose() }}
              style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                background: 'var(--gold)', color: '#1c1408',
                borderRadius: 6, fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
              }}>
              ⚡ Nominate for Auction
            </button>
          )}
          <button onClick={onClose}
            style={{
              flex: isDrafted || !onNominate ? 1 : 0,
              padding: '10px 16px', border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text3)',
              borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
            }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight, color }: { label: string; value: number | string; highlight?: boolean; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg3)', padding: '8px', borderRadius: 6,
      border: '1px solid var(--border)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? 800 : 600, color: color ?? 'var(--text)', marginTop: 2 }}>
        {value}
      </div>
    </div>
  )
}
