'use client'
import { useState } from 'react'
import { Manager } from '@/lib/types'

export interface TimerConfig {
  bidding: number
  going_once: number
  going_twice: number
  bid_reset: number
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  bidding:     5,
  going_once:  4,
  going_twice: 4,
  bid_reset:   4,
}

interface Props {
  managers: Manager[]
  onUpdateName: (id: string, name: string) => void
  onUpdateBudget: (id: string, budget: number) => void
  onSetHometown: (id: string, players: string[]) => void
  timerConfig: TimerConfig
  onUpdateTimer: (cfg: TimerConfig) => void
  onClose: () => void
  nominationOrder: string[]
  skippedManagers: string[]
  onUpdateNominationOrder: (order: string[]) => void
  onToggleSkipManager: (managerId: string) => void
}

type Tab = 'managers' | 'hometown' | 'timer' | 'nomination'

export default function SettingsModal({
  managers, onUpdateName, onUpdateBudget, onSetHometown,
  timerConfig, onUpdateTimer, onClose,
  nominationOrder, skippedManagers, onUpdateNominationOrder, onToggleSkipManager,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('managers')
  const [localTimer, setLocalTimer] = useState<TimerConfig>(timerConfig)
  const [hometownInput, setHometownInput] = useState<Record<string, string>>(
    Object.fromEntries(managers.map(m => [m.id, m.hometownPlayers.join('\n')]))
  )

  function handleSaveHometown(managerId: string) {
    const raw = hometownInput[managerId] ?? ''
    const names = raw.split('\n').map(s => s.trim()).filter(Boolean)
    onSetHometown(managerId, names)
  }

  function moveManager(idx: number, dir: -1 | 1) {
    const newOrder = [...nominationOrder]
    const target = idx + dir
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]]
    onUpdateNominationOrder(newOrder)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'managers',   label: 'Managers & Budgets' },
    { id: 'hometown',   label: '★ Hometown Discounts' },
    { id: 'timer',      label: '⏱ Timer' },
    { id: 'nomination', label: '⚡ Nomination Order' },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg1)', border: '1px solid var(--border2)',
        borderRadius: 12, width: 620, maxWidth: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="font-syne" style={{ fontSize: 16, fontWeight: 800 }}>⚙ Draft Setup</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', background: 'transparent',
                color: activeTab === t.id ? 'var(--gold)' : 'var(--text3)',
                borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                fontSize: 11, fontFamily: 'inherit', fontWeight: activeTab === t.id ? 700 : 400,
                whiteSpace: 'nowrap',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {activeTab === 'managers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                Set manager names and starting budgets. Default: $450 per WAB rules.
              </p>
              {managers.map(m => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input value={m.name} onChange={e => onUpdateName(m.id, e.target.value)} placeholder="Manager name"
                    style={{ flex: 1, padding: '7px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Budget $</span>
                  <input type="number" min={1} value={m.budget} onChange={e => onUpdateBudget(m.id, parseInt(e.target.value) || 450)}
                    style={{ width: 80, padding: '7px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Spent ${m.spent}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'hometown' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--gold)' }}>★ Hometown Discount (WAB Rules §6.2):</strong> If an owner does not designate a player with a Qualifying Offer, and then drafts that player in the following season's auction, that player's draft price is reduced by 20% (max $5 reduction).
                <br /><br />
                Enter each player name on its own line, exactly matching the player name in the projections.
              </div>
              {managers.map(m => (
                <div key={m.id} style={{ marginBottom: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{m.hometownPlayers.length} player{m.hometownPlayers.length !== 1 ? 's' : ''} with HTD</span>
                  </div>
                  <div style={{ padding: 10 }}>
                    <textarea value={hometownInput[m.id] ?? ''} onChange={e => setHometownInput(prev => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="One player name per line&#10;e.g. Bobby Witt Jr." rows={3}
                      style={{ width: '100%', padding: '7px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                    <button onClick={() => handleSaveHometown(m.id)}
                      style={{ marginTop: 6, padding: '5px 14px', background: 'var(--gold)', color: '#1c1408', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'timer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
                Configure how long each phase of the auction timer lasts. Changes take effect on the next nomination.
              </p>
              {([
                { key: 'bidding',     label: 'Initial bidding time', desc: 'Countdown when a player is first nominated' },
                { key: 'going_once',  label: 'Going once duration',  desc: 'After bidding expires — "Going once"' },
                { key: 'going_twice', label: 'Going twice duration', desc: 'After going once expires — "Going twice"' },
                { key: 'bid_reset',   label: 'Bid reset time',       desc: 'Clock resets to this when spacebar/bid is pressed' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setLocalTimer(p => ({ ...p, [key]: Math.max(1, (p[key] ?? 1) - 1) }))}
                      style={{ width: 28, height: 28, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--text)', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ width: 48, textAlign: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'Space Mono, monospace', color: 'var(--gold)' }}>{localTimer[key]}s</span>
                    <button onClick={() => setLocalTimer(p => ({ ...p, [key]: (p[key] ?? 1) + 1 }))}
                      style={{ width: 28, height: 28, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--text)', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
              <button onClick={() => onUpdateTimer(localTimer)}
                style={{ padding: '9px 20px', background: 'var(--gold)', color: '#1c1408', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
                Save Timer Settings
              </button>
            </div>
          )}

          {activeTab === 'nomination' && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.7 }}>
                Set the nomination order. Cycles 1 → 10 → 1 → … Use <strong style={{ color: 'var(--text2)' }}>↑ / ↓</strong> to reorder.
                Toggle <strong style={{ color: 'var(--red)' }}>Full</strong> to remove a manager from the rotation when their roster is complete.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {nominationOrder.map((managerId, idx) => {
                  const mgr = managers.find(m => m.id === managerId)
                  if (!mgr) return null
                  const isSkipped = skippedManagers.includes(managerId)
                  return (
                    <div key={managerId} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: isSkipped ? 'var(--bg)' : 'var(--bg2)',
                      border: `1px solid ${isSkipped ? 'var(--border)' : 'var(--border2)'}`,
                      borderRadius: 7, opacity: isSkipped ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isSkipped ? 'var(--bg3)' : 'var(--gold)',
                        color: isSkipped ? 'var(--text3)' : '#1c1408',
                        fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{idx + 1}</div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isSkipped ? 'var(--text3)' : 'var(--text)' }}>
                        {mgr.name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {mgr.roster.length} players · ${mgr.budget - mgr.spent} left
                      </span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button onClick={() => moveManager(idx, -1)} disabled={idx === 0}
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: idx === 0 ? 'var(--border2)' : 'var(--text2)', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}>↑</button>
                        <button onClick={() => moveManager(idx, 1)} disabled={idx === nominationOrder.length - 1}
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: idx === nominationOrder.length - 1 ? 'var(--border2)' : 'var(--text2)', cursor: idx === nominationOrder.length - 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>↓</button>
                      </div>
                      <button onClick={() => onToggleSkipManager(managerId)}
                        style={{ padding: '4px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: isSkipped ? '#450a0a' : 'var(--bg3)', border: `1px solid ${isSkipped ? 'var(--red)' : 'var(--border2)'}`, color: isSkipped ? 'var(--red)' : 'var(--text3)' }}>
                        {isSkipped ? '✕ Full' : 'Active'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '8px 20px', background: 'var(--gold)', color: '#1c1408', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
