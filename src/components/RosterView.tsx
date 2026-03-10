'use client'
import { useState, useCallback } from 'react'
import { Manager, DraftEntry, isPitcher } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import { HITTER_STAT_COLS, PITCHER_STAT_COLS, getStatPct, statColor } from '@/lib/statPercentiles'

interface Props {
  managers: Manager[]
  draftLog: DraftEntry[]
  onUndraft: (entry: DraftEntry) => void
  onMoveSlot: (entry: DraftEntry, newSlot: string) => void
  slotAssignments: Record<string, Record<string, string>>
  onUpdateSlotAssignments: (managerId: string, assignments: Record<string, string>) => void
}

const DRAFT_TYPE_LABELS = { auction: 'Draft', keeper: 'Keeper', qualifying_offer: 'QO' }

// Exact position match from comma-separated list
function hasPos(ps: string, pos: string): boolean {
  return ps.split(',').map(p => p.trim()).includes(pos)
}
function isOutfielder(ps: string): boolean {
  return ps.split(',').map(p => p.trim()).some(p => ['LF','CF','RF','OF'].includes(p))
}
function isHitterPos(ps: string): boolean {
  return !hasPos(ps, 'SP') && !hasPos(ps, 'RP')
}

// WAB roster slot definitions — ordered most-specific to least-specific
// Auto-fill respects this order, so players land in the tightest valid slot first
const SLOT_GROUPS = [
  {
    label: 'CATCHERS',
    slots: [
      { id: 'C-1', label: 'C', eligible: (ps: string) => hasPos(ps, 'C') },
      { id: 'C-2', label: 'C', eligible: (ps: string) => hasPos(ps, 'C') },
    ]
  },
  {
    label: 'INFIELD',
    slots: [
      { id: '1B',   label: '1B', eligible: (ps: string) => hasPos(ps, '1B') },
      { id: '2B',   label: '2B', eligible: (ps: string) => hasPos(ps, '2B') },
      { id: 'SS',   label: 'SS', eligible: (ps: string) => hasPos(ps, 'SS') },
      { id: '3B',   label: '3B', eligible: (ps: string) => hasPos(ps, '3B') },
      { id: 'CI-1', label: 'CI', eligible: (ps: string) => hasPos(ps, '1B') || hasPos(ps, '3B') },
      { id: 'CI-2', label: 'CI', eligible: (ps: string) => hasPos(ps, '1B') || hasPos(ps, '3B') },
      { id: 'MI-1', label: 'MI', eligible: (ps: string) => hasPos(ps, '2B') || hasPos(ps, 'SS') },
      { id: 'MI-2', label: 'MI', eligible: (ps: string) => hasPos(ps, '2B') || hasPos(ps, 'SS') },
    ]
  },
  {
    label: 'OUTFIELD',
    slots: [
      { id: 'LF',   label: 'LF', eligible: (ps: string) => hasPos(ps, 'LF') || hasPos(ps, 'OF') },
      { id: 'CF',   label: 'CF', eligible: (ps: string) => hasPos(ps, 'CF') || hasPos(ps, 'OF') },
      { id: 'RF',   label: 'RF', eligible: (ps: string) => hasPos(ps, 'RF') || hasPos(ps, 'OF') },
      { id: 'OF-1', label: 'OF', eligible: (ps: string) => isOutfielder(ps) },
      { id: 'OF-2', label: 'OF', eligible: (ps: string) => isOutfielder(ps) },
      { id: 'OF-3', label: 'OF', eligible: (ps: string) => isOutfielder(ps) },
    ]
  },
  {
    label: 'DH / UTIL',
    slots: [
      { id: 'DH',     label: 'DH',   eligible: (ps: string) => isHitterPos(ps) },
      { id: 'UTIL-1', label: 'UTIL', eligible: (ps: string) => isHitterPos(ps) },
      { id: 'UTIL-2', label: 'UTIL', eligible: (ps: string) => isHitterPos(ps) },
    ]
  },
  {
    label: 'PITCHING (12)',
    slots: Array.from({ length: 12 }, (_, i) => ({
      id: `P-${i+1}`, label: 'P',
      eligible: (ps: string) => hasPos(ps, 'SP') || hasPos(ps, 'RP'),
    }))
  },
  {
    label: 'BENCH (9)',
    slots: Array.from({ length: 9 }, (_, i) => ({
      id: `BN-${i+1}`, label: 'BN',
      eligible: (_: string) => true,
    }))
  },
  {
    label: 'MINOR LEAGUE (3)',
    slots: Array.from({ length: 3 }, (_, i) => ({
      id: `MiLB-${i+1}`, label: 'MiLB',
      eligible: (_: string) => true,
    }))
  },
]

function slotColor(slotId: string): string {
  if (slotId.startsWith('C')) return '#7dd3fc'
  if (['1B','2B','SS','3B','CI-1','CI-2','MI-1','MI-2'].includes(slotId)) return '#86efac'
  if (slotId.startsWith('LF') || slotId.startsWith('CF') || slotId.startsWith('RF') || slotId.startsWith('OF')) return '#fde68a'
  if (slotId.startsWith('DH') || slotId.startsWith('UTIL')) return '#d8b4fe'
  if (slotId.startsWith('P')) return '#f9a8d4'
  if (slotId.startsWith('BN')) return '#94a3b8'
  if (slotId.startsWith('MiLB')) return '#a78bfa'
  return '#94a3b8'
}

export default function RosterView({ managers, draftLog, onUndraft, onMoveSlot, slotAssignments, onUpdateSlotAssignments }: Props) {
  const [activeManager, setActiveManager] = useState(managers[0]?.id ?? '')
  const [showLog, setShowLog] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{entry: DraftEntry, fromSlot: string} | null>(null)

  const manager = managers.find(m => m.id === activeManager)
  const remaining = manager ? manager.budget - manager.spent : 0
  const assignments = slotAssignments[activeManager] ?? {}

  // Build slot -> entry map
  function buildSlotMap(): Map<string, DraftEntry> {
    if (!manager) return new Map()
    const map = new Map<string, DraftEntry>()
    // Apply saved manual assignments first
    for (const [slotId, playerKey] of Object.entries(assignments)) {
      const entry = manager.roster.find(e => (e.player.id + '|' + e.player.n) === playerKey)
      if (entry) map.set(slotId, entry)
    }
    // Track which players are already placed (by key)
    const assignedKeys = new Set<string>()
    map.forEach(e => assignedKeys.add(e.player.id + '|' + e.player.n))
    // Auto-fill unplaced players into first eligible empty slot
    for (const entry of manager.roster) {
      const pkey = entry.player.id + '|' + entry.player.n
      if (assignedKeys.has(pkey)) continue
      const ps = entry.player.ps
      let placed = false
      for (const group of SLOT_GROUPS) {
        for (const slot of group.slots) {
          if (!map.has(slot.id) && slot.eligible(ps)) {
            map.set(slot.id, entry)
            assignedKeys.add(pkey)
            placed = true
            break
          }
        }
        if (placed) break
      }
    }
    return map
  }

  const slotMap = buildSlotMap()

  if (!manager) return null

  function handleDragStart(entry: DraftEntry, fromSlot: string) {
    setDragging({ entry, fromSlot })
  }

  function handleDrop(toSlotId: string) {
    if (!dragging) return
    // Find the target slot definition and check eligibility
    const targetSlot = SLOT_GROUPS.flatMap(g => g.slots).find(s => s.id === toSlotId)
    if (!targetSlot || !targetSlot.eligible(dragging.entry.player.ps)) {
      setDragging(null)
      setDragOver(null)
      return
    }
    const pkey = dragging.entry.player.id + '|' + dragging.entry.player.n
    const mgr = { ...(slotAssignments[activeManager] ?? {}) }
    // Clear the old slot so player doesn't appear twice
    for (const [slotId, key] of Object.entries(mgr)) {
      if (key === pkey) delete mgr[slotId]
    }
    mgr[toSlotId] = pkey
    onUpdateSlotAssignments(activeManager, mgr)
    setDragging(null)
    setDragOver(null)
  }

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
                background: active ? 'var(--bg3)' : 'transparent',
                borderLeft: active ? '3px solid var(--gold)' : '3px solid transparent',
              }}>
              <div style={{ fontWeight: active ? 700 : 500, fontSize: 12, color: 'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: rem < 50 ? 'var(--red)' : rem < 100 ? 'var(--gold)' : 'var(--green)', marginTop: 2 }}>
                ${rem} left · {m.roster.length} players
              </div>
            </div>
          )
        })}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowLog(!showLog)}
            style={{ width: '100%', padding: '7px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showLog ? '← Roster' : '📋 Draft Log'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {showLog ? (
          <DraftLog log={draftLog} managers={managers} onUndraft={onUndraft} />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 800 }}>{manager.name}</h2>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Budget: ${manager.budget}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Spent: ${manager.spent}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: remaining < 50 ? 'var(--red)' : remaining < 100 ? 'var(--gold)' : 'var(--green)' }}>
                ${remaining} remaining
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>
                {manager.roster.length} / 43 slots filled · drag players between slots
              </span>
            </div>

            {SLOT_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text3)', marginBottom: 6 }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {group.slots.map(slot => {
                    const entry = slotMap.get(slot.id)
                    const isOver = dragOver === slot.id
                    const canAccept = dragging && slot.eligible(dragging.entry.player.ps)
                    return (
                      <div key={slot.id}
                        onDragOver={e => { e.preventDefault(); setDragOver(slot.id) }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => handleDrop(slot.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 0,
                          borderRadius: 5, overflow: 'hidden',
                          border: isOver && canAccept ? '2px dashed var(--gold)' : isOver ? '1px solid var(--red)' : '1px solid var(--border)',
                          background: isOver && canAccept ? 'var(--bg3)' : 'var(--bg2)',
                          minHeight: 34,
                          transition: 'border 0.1s, background 0.1s',
                        }}>
                        {/* Slot label */}
                        <div style={{
                          width: 44, flexShrink: 0, textAlign: 'center',
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                          color: slotColor(slot.id),
                          borderRight: '1px solid var(--border)',
                          padding: '8px 4px', alignSelf: 'stretch',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: slotColor(slot.id) + '18',
                        }}>
                          {slot.label}
                        </div>
                        {/* Player or empty */}
                        {entry ? (
                          <SlotPlayer entry={entry} slotId={slot.id} onUndraft={onUndraft}
                            onDragStart={() => handleDragStart(entry, slot.id)} />
                        ) : (
                          <div style={{ flex: 1, padding: '8px 12px', fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>
                            empty
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function SlotPlayer({ entry, slotId, onUndraft, onDragStart }:
  { entry: DraftEntry; slotId: string; onUndraft: (e: DraftEntry) => void; onDragStart: () => void }) {
  const p = entry.player
  const pit = isPitcher(p)
  const typeColors = { auction: 'var(--blue)', keeper: 'var(--green)', qualifying_offer: 'var(--purple)' }
  const statCols = pit ? PITCHER_STAT_COLS : HITTER_STAT_COLS

  return (
    <div draggable onDragStart={onDragStart}
      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', cursor: 'grab' }}>
      <PriceBadge price={entry.price} size="sm" />
      {/* Name block */}
      <div style={{ minWidth: 160, maxWidth: 180, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{p.n}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--bg3)', color: 'var(--text2)' }}>{p.ps.split(',')[0]}</span>
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: typeColors[entry.draftType], background: typeColors[entry.draftType] + '18' }}>
            {DRAFT_TYPE_LABELS[entry.draftType]}
          </span>
        </div>
      </div>
      {/* Stat cells */}
      <div style={{ display: 'flex', flex: 1 }}>
        {statCols.map(col => {
          const raw = (p as any)[col.key]
          const val = typeof raw === 'number' ? raw : 0
          const pct = getStatPct(p, col.key)
          const color = statColor(pct, col.lob)
          const isNeutral = col.key === 'ab' || col.key === 'ip'
          return (
            <div key={col.key} style={{ width: col.w, flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', lineHeight: 1.2 }}>{col.label}</div>
              <div style={{
                fontSize: 12, fontWeight: 600, lineHeight: 1.2,
                color: isNeutral ? 'var(--text2)' : color,
                fontFamily: 'Space Mono, monospace',
              }}>
                {col.fmt(val)}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={() => { if (window.confirm('Undo: ' + p.n + ' ($' + entry.price + ')?')) onUndraft(entry) }}
        style={{ padding: '3px 7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  {entry.draftType === 'auction' ? 'Draft' : entry.draftType === 'keeper' ? 'Keeper' : 'QO'}{' · '}{entry.rosterLevel === 'minor' ? 'MiLB' : 'MLB'}
                </span>
                <button onClick={() => { if (window.confirm('Undo: ' + p.n + ' to ' + mgr?.name + ' ($' + entry.price + ')?')) onUndraft(entry) }}
                  style={{ padding: '3px 7px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 3, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
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
