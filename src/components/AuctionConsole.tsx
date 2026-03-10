'use client'
import { useState, useEffect } from 'react'
import { Player, isPitcher, Manager, DraftType, RosterLevel } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerCard from './PlayerCard'
import playersRaw from '@/data/players_raw.json'
import { POSITION_TABS } from '@/lib/types'

// Deduplicated flat player list (players appear in multiple position tabs)
const ALL_PLAYERS_FLAT: Player[] = (() => {
  const seen = new Set<string>()
  const out: Player[] = []
  for (const tab of POSITION_TABS) {
    for (const p of (playersRaw as unknown as Record<string, Player[]>)[tab] ?? []) {
      const key = p.n + '|' + p.t
      if (!seen.has(key)) { seen.add(key); out.push(p) }
    }
  }
  return out
})()

type TimerPhase = 'idle' | 'bidding' | 'going_once' | 'going_twice' | 'sold' | 'logging'
type AuctionTimerReturn = {
  phase: TimerPhase
  secondsLeft: number
  progress: number
  launchBid: () => void
  resetBid: () => void
  forceLogging: () => void
  reset: () => void
}

interface Props {
  timer: AuctionTimerReturn
  managers: Manager[]
  draftPlayer: (p: Player, managerId: string, price: number, dt: DraftType, rl: RosterLevel) => void
  draftedIds: Set<string>
  hometownMap: Record<string, string>
  selectedPlayer: Player | null
  setSelectedPlayer: (p: Player | null) => void
}

export default function AuctionConsole({
  timer, managers, draftPlayer, draftedIds, hometownMap, selectedPlayer, setSelectedPlayer
}: Props) {
  const [query, setQuery] = useState('')
  const [showCard, setShowCard] = useState(false)
  const [logging, setLogging] = useState(false)
  const [logPrice, setLogPrice] = useState('')
  const [logManager, setLogManager] = useState('')
  const [logType, setLogType] = useState<DraftType>('auction')
  const [logLevel, setLogLevel] = useState<RosterLevel>('major')
  const [soldFlash, setSoldFlash] = useState(false)

  const isDrafted = (p: Player) => draftedIds.has(p.id + '|' + p.n)

  // Search results — deduplicated inline
  const searchResults = query.trim().length > 1
    ? (() => {
        const q = query.toLowerCase()
        const seen = new Set<string>()
        return ALL_PLAYERS_FLAT
          .filter(p => {
            const key = p.n + '|' + p.t
            if (seen.has(key)) return false
            seen.add(key)
            return p.n.toLowerCase().includes(q) || p.t.toLowerCase().includes(q)
          })
          .slice(0, 10)
      })()
    : []

  const hometownMgr = selectedPlayer ? managers.find(m => m.id === hometownMap[selectedPlayer.n]) : null
  const hometownDiscount = hometownMgr && selectedPlayer
    ? Math.min(5, Math.round(selectedPlayer.pr * 0.2))
    : 0

  const timerColor = {
    idle:        'var(--text3)',
    bidding:     '#22c55e',
    going_once:  '#f59e0b',
    going_twice: '#ef4444',
    sold:        '#ef4444',
    logging:     'var(--gold)',
  }[timer.phase] ?? 'var(--text3)'

  const phaseLabel: Record<TimerPhase, string> = {
    idle:        '— IDLE',
    bidding:     '🟢 BIDDING',
    going_once:  '🟡 GOING ONCE',
    going_twice: '🔴 GOING TWICE',
    sold:        '🔴 SOLD',
    logging:     '✍ LOGGING',
  }

  function openLogging() {
    timer.forceLogging()
    setLogging(true)
    if (selectedPlayer) {
      setLogPrice(String(Math.max(1, Math.round(selectedPlayer.pr))))
    }
    setLogManager(managers[0]?.id ?? '')
    setLogType('auction')
    setLogLevel('major')
  }

  function handleConfirmDraft() {
    if (!selectedPlayer || !logManager || !logPrice) return
    const price = parseInt(logPrice)
    if (isNaN(price) || price < 1) return
    draftPlayer(selectedPlayer, logManager, price, logType, logLevel)
    setSoldFlash(true)
    setTimeout(() => setSoldFlash(false), 1200)
    setLogging(false)
    setSelectedPlayer(null)
    timer.reset()
    setQuery('')
  }

  // Spacebar = bid reset
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space' && (timer.phase === 'bidding' || timer.phase === 'going_once' || timer.phase === 'going_twice')) {
        e.preventDefault()
        timer.resetBid()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timer])

  // Auto-open logging when timer reaches 'sold'
  useEffect(() => {
    if (timer.phase === 'sold' && selectedPlayer && !logging) {
      openLogging()
    }
  }, [timer.phase]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>

      {/* LEFT: search / nominate */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg1)' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 8 }}>NOMINATE PLAYER</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any player…"
            style={{ width: '100%', padding: '7px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searchResults.map((p, i) => {
            const drafted = isDrafted(p)
            const isActive = selectedPlayer?.n === p.n && selectedPlayer?.t === p.t
            return (
              <div key={p.n + i}
                onClick={() => { if (!drafted) { setSelectedPlayer(p); setQuery('') } }}
                style={{ padding: '8px 12px', cursor: drafted ? 'default' : 'pointer', borderBottom: '1px solid var(--border)', opacity: drafted ? 0.4 : 1, background: isActive ? 'var(--border)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!drafted && !isActive) e.currentTarget.style.background = 'var(--bg2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'var(--border)' : 'transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{p.n}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t} · {p.ps.split(',')[0]}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {drafted && <span style={{ fontSize: 9, color: 'var(--red)' }}>DRAFTED</span>}
                    {hometownMap[p.n] && <span style={{ fontSize: 10, color: 'var(--gold)' }}>★</span>}
                    <PriceBadge price={p.pr} size="sm" />
                  </div>
                </div>
              </div>
            )
          })}
          {searchResults.length === 0 && query.length > 1 && (
            <div style={{ padding: 16, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>No results</div>
          )}
          {query.length === 0 && (
            <div style={{ padding: 20, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.9 }}>
              Type to search, or click<br />⚡ NOM on the Big Board.<br /><br />
              <kbd style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '3px 8px', borderRadius: 3, fontSize: 11 }}>SPACE</kbd>
              <span style={{ display: 'block', marginTop: 6 }}>= register a bid</span>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: active auction */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Timer bar */}
        <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: timerColor, minWidth: 150 }}>
            {phaseLabel[timer.phase]}
          </div>
          <div style={{ flex: 1, height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${timer.progress}%`, background: timerColor, transition: 'width 0.8s linear, background 0.3s' }} />
          </div>
          <div style={{
            fontSize: 36, fontWeight: 800, color: timerColor,
            fontFamily: 'Space Mono, monospace', minWidth: 52, textAlign: 'right',
            animation: timer.phase === 'going_twice' ? 'pulse-red 0.6s ease-in-out infinite' : 'none',
          }}>
            {['idle','sold','logging'].includes(timer.phase) ? '—' : timer.secondsLeft}
          </div>
        </div>

        {selectedPlayer ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

            {/* Player hero card */}
            <div style={{
              background: soldFlash ? '#064e3b' : 'var(--bg1)',
              border: `1px solid ${soldFlash ? '#16a34a' : 'var(--border2)'}`,
              borderRadius: 10, padding: 18, marginBottom: 14,
              transition: 'background 0.4s, border-color 0.4s',
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <PriceBadge price={selectedPlayer.pr} size="lg" />
                <div style={{ flex: 1 }}>
                  <div className="font-syne" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                    {selectedPlayer.n}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700 }}>{selectedPlayer.t}</span>
                    {selectedPlayer.ps.split(',').map(pos => (
                      <span key={pos} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--gold)', border: '1px solid var(--border2)' }}>{pos.trim()}</span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Age {selectedPlayer.age}</span>
                    {selectedPlayer.adp && <span style={{ fontSize: 11, color: 'var(--text3)' }}>ADP {selectedPlayer.adp}</span>}
                    <button onClick={() => setShowCard(true)} style={{ fontSize: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Full card ↗
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                    {!isPitcher(selectedPlayer) ? (
                      <>
                        <span>HR <strong>{selectedPlayer.hr}</strong></span>
                        <span>RBI <strong>{selectedPlayer.rb}</strong></span>
                        <span>R <strong>{selectedPlayer.r}</strong></span>
                        <span>SB <strong>{selectedPlayer.sb}</strong></span>
                        <span>AVG <strong>{selectedPlayer.av.toFixed(3)}</strong></span>
                        <span>OBP <strong>{selectedPlayer.ob.toFixed(3)}</strong></span>
                      </>
                    ) : (
                      <>
                        <span>IP <strong>{selectedPlayer.ip}</strong></span>
                        <span>K <strong>{selectedPlayer.k}</strong></span>
                        <span>ERA <strong style={{ color: selectedPlayer.er < 3.5 ? 'var(--green)' : selectedPlayer.er > 4.5 ? 'var(--red)' : 'var(--gold)' }}>{selectedPlayer.er.toFixed(2)}</strong></span>
                        <span>WHIP <strong>{selectedPlayer.wh.toFixed(2)}</strong></span>
                        <span>W <strong>{selectedPlayer.w}</strong></span>
                        <span>SV <strong>{selectedPlayer.sv}</strong></span>
                        {selectedPlayer.hld > 0 && <span>HLD <strong>{selectedPlayer.hld}</strong></span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {hometownMgr && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#2a1e0688', border: '1px solid #b7791f44', borderRadius: 6 }}>
                  <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>★ HOMETOWN DISCOUNT: </span>
                  <span style={{ color: 'var(--text2)', fontSize: 11 }}>
                    {hometownMgr.name} — 20% off max $5 if no QO
                    {' → '}<strong style={{ color: 'var(--gold2)' }}>${Math.max(1, Math.round(selectedPlayer.pr) - hometownDiscount)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Timer action buttons */}
            {!logging && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                {timer.phase === 'idle' && (
                  <button onClick={timer.launchBid} style={{ flex: 1, padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ▶ Start Bidding (15s)
                  </button>
                )}
                {(timer.phase === 'bidding' || timer.phase === 'going_once' || timer.phase === 'going_twice') && (
                  <>
                    <button onClick={timer.resetBid} style={{ flex: 2, padding: '14px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🙋 BID! <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>(resets timer · or SPACE)</span>
                    </button>
                    <button onClick={openLogging} style={{ flex: 1, padding: '14px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🔨 SOLD
                    </button>
                  </>
                )}
                {timer.phase === 'logging' && (
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--gold)', borderRadius: 8, fontSize: 12, color: 'var(--gold)' }}>
                    ✍ Complete the log form below
                  </div>
                )}
              </div>
            )}

            {/* Logging form */}
            {logging && (
              <div style={{ background: 'var(--bg1)', border: '1px solid var(--gold)', borderRadius: 10, padding: 18 }}>
                <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--gold)' }}>
                  🔨 Log Draft — {selectedPlayer.n}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>FINAL PRICE ($)</label>
                    <input
                      type="number" min={1}
                      value={logPrice}
                      onChange={e => setLogPrice(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 18, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>WINNING MANAGER</label>
                    <select
                      value={logManager}
                      onChange={e => setLogManager(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    >
                      <option value="">— Select Manager —</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (${m.budget - m.spent} left)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>DRAFT TYPE</label>
                    <select
                      value={logType}
                      onChange={e => setLogType(e.target.value as DraftType)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    >
                      <option value="auction">Auction (live draft)</option>
                      <option value="keeper">Keeper</option>
                      <option value="qualifying_offer">Qualifying Offer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>ROSTER LEVEL</label>
                    <select
                      value={logLevel}
                      onChange={e => setLogLevel(e.target.value as RosterLevel)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    >
                      <option value="major">Major League Roster</option>
                      <option value="minor">Minor League Roster</option>
                    </select>
                  </div>
                </div>
                {hometownMgr && (
                  <div style={{ marginBottom: 10 }}>
                    <button onClick={() => {
                      setLogManager(hometownMgr.id)
                      setLogPrice(String(Math.max(1, Math.round(selectedPlayer.pr) - hometownDiscount)))
                    }} style={{ padding: '5px 12px', background: '#2a1e06', border: '1px solid var(--gold)', borderRadius: 4, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
                      ★ Apply HTD for {hometownMgr.name} (−${hometownDiscount})
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleConfirmDraft} style={{ flex: 1, padding: '12px', background: 'var(--gold)', color: '#1c1408', border: 'none', borderRadius: 7, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✓ Confirm Draft
                  </button>
                  <button onClick={() => { setLogging(false); timer.reset() }} style={{ padding: '12px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40 }}>⚡</div>
            <div className="font-syne" style={{ fontSize: 16, fontWeight: 700 }}>No active nomination</div>
            <div style={{ fontSize: 12 }}>Search on the left or click ⚡ NOM from the Big Board</div>
          </div>
        )}
      </div>

      {/* RIGHT: budget grid */}
      <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg1)', overflow: 'auto' }}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em' }}>MANAGER BUDGETS</div>
        {managers.map(m => {
          const rem = m.budget - m.spent
          const pct = Math.min(100, (m.spent / m.budget) * 100)
          return (
            <div key={m.id} style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{m.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: rem < 50 ? 'var(--red)' : rem < 100 ? 'var(--gold)' : 'var(--green)' }}>${rem}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '5px 0 4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: rem < 50 ? 'var(--red)' : rem < 100 ? 'var(--gold)' : 'var(--blue)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Spent ${m.spent}</span>
                <span>{m.roster.length} pl</span>
              </div>
            </div>
          )
        })}
      </div>

      {showCard && selectedPlayer && (
        <PlayerCard player={selectedPlayer} managers={managers} hometownMap={hometownMap} isDrafted={false} onNominate={undefined} onClose={() => setShowCard(false)} />
      )}
    </div>
  )
}
