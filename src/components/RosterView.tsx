'use client'
import { useState } from 'react'
import { Manager, DraftEntry, isPitcher } from '@/lib/types'
import { PriceBadge } from './PriceBadge'

interface Props {
  managers: Manager[]
  draftLog: DraftEntry[]
  onUndraft: (entry: DraftEntry) => void
}

const DRAFT_TYPE_LABELS = {
  auction: 'Draft',
  keeper: 'Keeper',
  qualifying_offer: 'QO',
}


export default function RosterView({ managers, draftLog, onUndraft }: Props) {
  const [activeManager, setActiveManager] = useState(managers[0]?.id ?? '')
  const [showLog, setShowLog] = useState(false)

  const manager = managers.find(m => m.id === activeManager)
  if (!manager) return null

  const majorRoster = manager.roster.filter(e => e.rosterLevel === 'major')
  const minorRoster = manager.roster.filter(e => e.rosterLevel === 'minor')
  const remaining = manager.budget - manager.spent

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Manager sidebar */}
      <div style={{ width: 200, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', overflow: 'auto' }}>
        <div style={{ padding: '10px 12px 6px', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', borderBottom: '1px solid var(--border)' }}>
          ROSTERS
        </div>
        {managers.map(m => {
          const rem = m.budget - m.spent
          const active = m.id === activeManager
          return (
            <div key={m.id} onClick={() => setActiveManager(m.id)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: active ? 'var(--border)' : 'transparent',
                borderLeft: active ? '3px solid var(--gold)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontWeight: active ? 700 : 500, fontSize: 12, color: 'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: rem < 50 ? 'var(--red)' : rem < 100 ? 'var(--gold)' : 'var(--green)', marginTop: 2 }}>
                ${rem} remaining · {m.roster.length} players
              </div>
            </div>
          )
        })}
        {/* Log toggle */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowLog(!showLog)}
            style={{ width: '100%', padding: '7px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showLog ? '← Back to Roster' : '📋 Draft Log'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {showLog ? (
          <DraftLog log={draftLog} managers={managers} onUndraft={onUndraft} />
        ) : (
          <>
            {/* Manager header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
              <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 800 }}>{manager.name}</h2>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Budget: ${manager.budget}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Spent: ${manager.spent}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: remaining < 50 ? 'var(--red)' : 'var(--green)' }}>
                Remaining: ${remaining}
              </span>
            </div>

            {/* Major league roster */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 8 }}>
                MAJOR LEAGUE ROSTER ({majorRoster.length}/40)
              </div>
              {majorRoster.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 12, padding: '20px 0' }}>No major league players yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {majorRoster.map((entry, i) => (
                    <RosterRow key={i} entry={entry} onUndraft={onUndraft} />
                  ))}
                </div>
              )}
            </div>

            {/* Minor league roster */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 8 }}>
                MINOR LEAGUE ROSTER ({minorRoster.length}/3)
              </div>
              {minorRoster.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 12, padding: '20px 0' }}>No minor league players</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {minorRoster.map((entry, i) => (
                    <RosterRow key={i} entry={entry} onUndraft={onUndraft} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RosterRow({ entry, onUndraft }: { entry: DraftEntry; onUndraft: (e: DraftEntry) => void }) {
  const p = entry.player
  const typeColors = {
    auction: 'var(--blue)',
    keeper: 'var(--green)',
    qualifying_offer: 'var(--purple)',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
      background: 'var(--bg1)', borderRadius: 5, border: '1px solid var(--border)',
    }}>
      <PriceBadge price={entry.price} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{p.n}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg3)', color: 'var(--text2)' }}>
            {p.ps.split(',')[0]}
          </span>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: typeColors[entry.draftType], background: typeColors[entry.draftType] + '18' }}>
            {DRAFT_TYPE_LABELS[entry.draftType]}
          </span>
          {entry.rosterLevel === 'minor' && (
            <span style={{ fontSize: 9, color: 'var(--purple)', background: '#3b0764', padding: '1px 5px', borderRadius: 3 }}>MiLB</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
          {!isPitcher(p) ? `${(p as any).hr}HR ${(p as any).rb}RBI ${(p as any).r}R ${(p as any).sb}SB .${String((p as any).av.toFixed(3)).slice(1)}`
            : `${(p as any).ip}IP ${(p as any).k}K ${(p as any).er.toFixed(2)}ERA`}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
        Proj ${p.pr}
      </div>
      <button onClick={() => {
        if (window.confirm(`Undo draft: ${p.n} ($${entry.price})?`)) onUndraft(entry)
      }} style={{ padding: '3px 7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
        ↩
      </button>
    </div>
  )
}

function DraftLog({ log, managers, onUndraft }: { log: DraftEntry[]; managers: Manager[]; onUndraft: (e: DraftEntry) => void }) {
  return (
    <div>
      <h2 className="font-syne" style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Draft Log</h2>
      {log.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: 12 }}>No picks logged yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.map((entry, i) => {
            const mgr = managers.find(m => m.id === entry.managerId)
            const p = entry.player
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--bg1)', borderRadius: 5, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 28, textAlign: 'right' }}>#{log.length - i}</span>
                <PriceBadge price={entry.price} size="sm" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{p.n}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 8 }}>{p.t} · {p.ps.split(',')[0]}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{mgr?.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 3 }}>
                  {entry.draftType === 'auction' ? 'Draft' : entry.draftType === 'keeper' ? 'Keeper' : 'QO'}
                  {' · '}{entry.rosterLevel === 'minor' ? 'MiLB' : 'MLB'}
                </span>
                <button onClick={() => {
                  if (window.confirm(`Undo: ${p.n} to ${mgr?.name} ($${entry.price})?`)) onUndraft(entry)
                }} style={{ padding: '3px 7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ↩
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
