'use client'
import { useState, useEffect } from 'react'
import { Player, isPitcher, Manager, DraftType, RosterLevel, TAG_CONFIG, PlayerTag } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerStatGrid from './PlayerStatGrid'
import CategoryRadar from './CategoryRadar'
import { HitterBars, PitcherBars } from './SavantBars'
import RollingXwOBA from './RollingXwOBA'
import RecommendationsPanel from './RecommendationsPanel'
import { useRecommendations, RecommendationTiers } from '@/hooks/useRecommendations'
import playersRaw from '@/data/players_raw.json'
import { POSITION_TABS } from '@/lib/types'

const ALL_PLAYERS_FLAT: Player[] = (() => {
  const seen = new Set<string>()
  const out: Player[] = []
  for (const tab of POSITION_TABS) {
    for (const p of (playersRaw as Record<string, Player[]>)[tab] ?? []) {
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
  adjustedPrices: Map<string, number>
  tags: Record<string, PlayerTag>
  onCycleTag: (key: string) => void
}

export default function AuctionConsole({
  timer, managers, draftPlayer, draftedIds, hometownMap, selectedPlayer, setSelectedPlayer, adjustedPrices, tags, onCycleTag
}: Props) {
  const [query, setQuery] = useState('')
  const [logging, setLogging] = useState(false)
  const [logPrice, setLogPrice] = useState('')
  const [logManager, setLogManager] = useState('')
  const [logType, setLogType] = useState<DraftType>('auction')
  const [logLevel, setLogLevel] = useState<RosterLevel>('major')
  const [soldFlash, setSoldFlash] = useState(false)
  const [showCustomNom, setShowCustomNom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPos, setCustomPos] = useState('SP')

  const isDrafted = (p: Player) => draftedIds.has(p.id + '|' + p.n)
  const recs: RecommendationTiers = useRecommendations(managers, draftedIds, ALL_PLAYERS_FLAT, 15)

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
    if (selectedPlayer) setLogPrice(String(Math.max(1, Math.round(selectedPlayer.pr))))
    setLogManager(managers[0]?.id ?? '')
    setLogType('auction')
    setLogLevel('major')
  }

  function handleConfirmDraft() {
    if (!selectedPlayer || !logManager || !logPrice) return
    let price = parseInt(logPrice)
    if (isNaN(price) || price < 1) return
    const htdMgrId = hometownMap[selectedPlayer.n]
    if (htdMgrId && logManager === htdMgrId) {
      const discount = Math.min(5, Math.round(price * 0.2))
      price = Math.max(1, price - discount)
    }
    draftPlayer(selectedPlayer, logManager, price, logType, logLevel)
    setSoldFlash(true)
    setTimeout(() => setSoldFlash(false), 1200)
    setLogging(false)
    setSelectedPlayer(null)
    timer.reset()
    setQuery('')
  }

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

  useEffect(() => {
    if (timer.phase === 'sold' && selectedPlayer && !logging) openLogging()
  }, [timer.phase]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>

      {/* LEFT: search + REC panel */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg1)' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', marginBottom: 8 }}>NOMINATE PLAYER</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any player…"
            style={{ width: '100%', padding: '7px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        {/* Search results */}
        <div style={{ flex: query.length > 1 ? 1 : 0, overflowY: 'auto', minHeight: 0 }}>
          {searchResults.map((p, i) => {
            const drafted = isDrafted(p)
            const isActive = selectedPlayer?.n === p.n && selectedPlayer?.t === p.t
            return (
              <div key={p.n + i}
                onClick={() => { if (!drafted) { setSelectedPlayer(p); setQuery('') } }}
                style={{ padding: '8px 12px', cursor: drafted ? 'default' : 'pointer', borderBottom: '1px solid var(--border)', opacity: drafted ? 0.4 : 1, background: isActive ? 'var(--border)' : 'transparent' }}
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
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginBottom: 10 }}>No results</div>
              {!showCustomNom ? (
                <button onClick={() => { setShowCustomNom(true); setCustomName(query) }}
                  style={{ width: '100%', padding: '7px', background: 'var(--bg2)', border: '1px dashed var(--border2)', borderRadius: 5, color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Nominate custom player
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Player name"
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                  <select value={customPos} onChange={e => setCustomPos(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 4, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                    {['C','1B','2B','SS','3B','LF','CF','RF','OF','DH','SP','RP'].map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                      if (!customName.trim()) return
                      const isP = customPos === 'SP' || customPos === 'RP'
                      const custom: any = isP
                        ? { id: 'custom_' + Date.now(), n: customName.trim(), t: '???', ps: customPos, age: 0, adp: '999', pr: 1, sc: 0, w:0, l:0, sv:0, hld:0, er:0, wh:0, bb:0, k:0, qa3:0, ip:0, gp:0 }
                        : { id: 'custom_' + Date.now(), n: customName.trim(), t: '???', ps: customPos, age: 0, adp: '999', pr: 1, sc: 0, r:0, d2:0, d3:0, hr:0, rb:0, sbn:0, so:0, av:0, ob:0, ab:0, h:0, gp:0 }
                      setSelectedPlayer(custom)
                      setShowCustomNom(false)
                      setCustomName('')
                      setQuery('')
                    }}
                      style={{ flex: 1, padding: '6px', background: 'var(--gold)', color: '#1c1408', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Nominate
                    </button>
                    <button onClick={() => setShowCustomNom(false)}
                      style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Idle hint — only when not searching */}
        {query.length === 0 && (
          <div style={{ padding: '14px 12px 8px', fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.9, flexShrink: 0 }}>
            Type to search, or click<br />⚡ NOM on the Big Board.<br /><br />
            <kbd style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '3px 8px', borderRadius: 3, fontSize: 11 }}>SPACE</kbd>
            <span style={{ display: 'block', marginTop: 6 }}>= register a bid</span>
          </div>
        )}

        {/* REC panel — fills remaining space */}
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '6px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700 }}>🎯 TARGETS FOR ADAM</span>
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>{recs.topEnd.length + recs.midTier.length + recs.sneaky.length} suggestions</span>
          </div>
          <div style={{ overflowY: 'auto', padding: '0 8px 8px', flex: 1 }}>
            <RecommendationsPanel
              tiers={{ topEnd: recs.topEnd.slice(0,3), midTier: recs.midTier.slice(0,3), sneaky: recs.sneaky.slice(0,3) }}
              adjustedPrices={adjustedPrices}
              tags={tags}
              onCycleTag={onCycleTag}
              onSelect={p => { setSelectedPlayer(p); setQuery('') }}
              compact={true}
            />
          </div>
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
          <div style={{ fontSize: 36, fontWeight: 800, color: timerColor, fontFamily: 'Space Mono, monospace', minWidth: 52, textAlign: 'right', animation: timer.phase === 'going_twice' ? 'pulse-red 0.6s ease-in-out infinite' : 'none' }}>
            {['idle','sold','logging'].includes(timer.phase) ? '—' : timer.secondsLeft}
          </div>
        </div>

        {selectedPlayer ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div style={{ background: soldFlash ? '#064e3b' : 'var(--bg1)', border: `1px solid ${soldFlash ? '#16a34a' : 'var(--border2)'}`, borderRadius: 10, padding: 18, marginBottom: 14, transition: 'background 0.4s, border-color 0.4s' }}>

              {/* Header */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <PriceBadge price={selectedPlayer.pr} size="lg" />
                  {(() => {
                    if (draftedIds.size === 0) return null
                    const adj = adjustedPrices.get(selectedPlayer.id + '|' + selectedPlayer.n)
                    if (!adj || Math.abs(adj - Math.round(selectedPlayer.pr)) < 2) return null
                    return (
                      <>
                        <span style={{ color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}>→</span>
                        <PriceBadge price={adj} size="lg" />
                      </>
                    )
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="font-syne" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{selectedPlayer.n}</div>
                    {(() => {
                      const pkey = selectedPlayer.id + '|' + selectedPlayer.n
                      const tag = tags[pkey]
                      return (
                        <button onClick={() => onCycleTag(pkey)} title="Cycle tag"
                          style={{ padding: '2px 9px', borderRadius: 4, border: tag ? `1px solid ${TAG_CONFIG[tag].color}` : '1px solid var(--border2)', background: tag ? TAG_CONFIG[tag].bg : 'var(--bg3)', color: tag ? TAG_CONFIG[tag].color : 'var(--text3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {tag ? `${TAG_CONFIG[tag].emoji} ${TAG_CONFIG[tag].label}` : '○'}
                        </button>
                      )
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700 }}>{selectedPlayer.t}</span>
                    {selectedPlayer.ps.split(',').map(pos => (
                      <span key={pos} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--gold)', border: '1px solid var(--border2)' }}>{pos.trim()}</span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Age {selectedPlayer.age}</span>
                    {selectedPlayer.adp && <span style={{ fontSize: 11, color: 'var(--text3)' }}>ADP {selectedPlayer.adp}</span>}
                    {(() => {
                      const rank = (selectedPlayer as any).prospect_rank
                      const eta  = (selectedPlayer as any).prospect_eta
                      if (!rank) return null
                      return (
                        <>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, color: '#e9d5ff', background: '#4c1d95', border: '1px solid #7c3aed' }}>🔮 Prospect #{rank}</span>
                          {eta && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: '#c4b5fd', background: '#2e1065' }}>ETA {eta}</span>}
                        </>
                      )
                    })()}
                    {draftedIds.has(selectedPlayer.id + '|' + selectedPlayer.n) && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#450a0a', color: 'var(--red)' }}>DRAFTED</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {selectedPlayer.adp && (
                  <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>ADP</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{selectedPlayer.adp}</div>
                  </div>
                )}
                <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>SCORE</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{selectedPlayer.sc}</div>
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em' }}>PROJ GP</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'Space Mono, monospace' }}>{selectedPlayer.gp}</div>
                </div>
              </div>

              {/* HTD banner */}
              {hometownMgr && (() => {
                const bidPrice = Math.max(1, parseInt(logPrice) || Math.round(selectedPlayer.pr))
                const liveDiscount = Math.min(5, Math.round(bidPrice * 0.2))
                const discountedPrice = Math.max(1, bidPrice - liveDiscount)
                return (
                  <div style={{ marginBottom: 10, padding: '8px 12px', background: '#2a1e0688', border: '1px solid #b7791f66', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>★ HTD: {hometownMgr.name}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>20% off actual bid, max −$5</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--gold2)', fontSize: 13, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>
                      ${bidPrice} → ${discountedPrice}
                    </span>
                  </div>
                )
              })()}

              {/* Scout blurb */}
              {(() => {
                const blurb = (selectedPlayer as any).blurb
                if (!blurb) return null
                return (
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, borderLeft: '3px solid #4a9eff' }}>
                    <div style={{ fontSize: 9, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 5 }}>SCOUT INTEL · Pitcher List</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{blurb}</div>
                  </div>
                )
              })()}

              {/* Zone 2: projections | radar side by side */}
              {(() => {
                const hasRadar = selectedPlayer.sc > 0
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: hasRadar ? '1fr 1fr' : '1fr', alignItems: 'start', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '0 -18px', padding: '0 18px' }}>
                    <div style={{ paddingRight: hasRadar ? 16 : 0, borderRight: hasRadar ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em' }}>2025 PROJECTIONS</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>
                      <PlayerStatGrid player={selectedPlayer} />
                    </div>
                    {hasRadar && (
                      <div style={{ paddingLeft: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em' }}>CATEGORY RADAR</span>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>
                        <CategoryRadar player={selectedPlayer} />
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Zone 3: Statcast full width */}
              {(() => {
                const sv = (selectedPlayer as any).savant
                if (!sv || typeof sv !== 'object' || Array.isArray(sv)) return (
                  <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text3)', textAlign: 'center', padding: '8px' }}>
                    Run fetch_savant.py to add 2025 Statcast data
                  </div>
                )
                const hasRoll = sv.xwoba_roll && Array.isArray(sv.xwoba_roll) && sv.xwoba_roll.length > 5
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 10px' }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.14em' }}>2025 STATCAST ACTUALS</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: hasRoll ? '1fr 1fr' : '1fr', gap: 16 }}>
                      <div>{isPitcher(selectedPlayer) ? <PitcherBars sv={sv} /> : <HitterBars sv={sv} />}</div>
                      {hasRoll && (
                        <div><RollingXwOBA data={sv.xwoba_roll} playerName={selectedPlayer.n} invertColors={isPitcher(selectedPlayer)} /></div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Timer buttons */}
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
                    <input type="number" min={1} value={logPrice} onChange={e => setLogPrice(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 18, fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>WINNING MANAGER</label>
                    <select value={logManager} onChange={e => setLogManager(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                      <option value="">— Select Manager —</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (${m.budget - m.spent} left)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>DRAFT TYPE</label>
                    <select value={logType} onChange={e => setLogType(e.target.value as DraftType)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                      <option value="auction">Auction (live draft)</option>
                      <option value="keeper">Keeper</option>
                      <option value="qualifying_offer">Qualifying Offer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>ROSTER LEVEL</label>
                    <select value={logLevel} onChange={e => setLogLevel(e.target.value as RosterLevel)}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                      <option value="major">Major League Roster</option>
                      <option value="minor">Minor League Roster</option>
                    </select>
                  </div>
                </div>
                {hometownMgr && (
                  <div style={{ marginBottom: 10 }}>
                    <button onClick={() => {
                      const bidPrice = Math.max(1, parseInt(logPrice) || Math.round(selectedPlayer.pr))
                      const actualDiscount = Math.min(5, Math.round(bidPrice * 0.2))
                      setLogManager(hometownMgr.id)
                      setLogPrice(String(Math.max(1, bidPrice - actualDiscount)))
                    }} style={{ padding: '5px 12px', background: '#2a1e06', border: '1px solid var(--gold)', borderRadius: 4, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
                      ★ Set manager to {hometownMgr.name} (HTD auto-applies on confirm)
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

    </div>
  )
}
