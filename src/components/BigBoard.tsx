'use client'
import { useState, useMemo, useCallback } from 'react'
import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, PositionTab, POSITION_TABS, Manager, PlayerTag, TAG_CONFIG, DraftEntry } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerCard from './PlayerCard'
import RecommendationsPanel from './RecommendationsPanel'
import { useRecommendations } from '@/hooks/useRecommendations'

const PLAYERS_RAW = playersRaw as Record<string, Player[]>

const hasPos = (ps: string, pos: string) => ps.split(',').map(s => s.trim()).includes(pos)
const PLAYERS: Record<string, Player[]> = {
  ...PLAYERS_RAW,
  LF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'LF')),
  CF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'CF')),
  RF: (PLAYERS_RAW['OF'] ?? []).filter(p => hasPos(p.ps, 'RF')),
}

const ALL_FLAT: Player[] = (() => {
  const seen = new Set<string>()
  const out: Player[] = []
  for (const tab of POSITION_TABS) {
    for (const p of PLAYERS[tab] ?? []) {
      const key = p.n + '|' + p.t
      if (!seen.has(key)) { seen.add(key); out.push(p) }
    }
  }
  return out
})()

const POS_COLORS: Record<string, string> = {
  C:'#0ea5e9', '1B':'#10b981', '2B':'#8b5cf6',
  SS:'#f59e0b', '3B':'#ef4444',
  LF:'#06b6d4', CF:'#22d3ee', RF:'#67e8f9', OF:'#06b6d4',
  DH:'#ec4899', SP:'#a3e635', RP:'#fb923c',
  PROS:'#a78bfa',
}

const PROSPECT_COLOR = '#a78bfa'

// ─── Pitcher List HLD Rankings ───────────────────────────────────────────────
const PL_HLD_RANKS: Record<string, number> = {
  'Jeremiah Estrada': 1, 'Garrett Whitlock': 2, 'Adrian Morejon': 3,
  'Tanner Scott': 4, 'Robert Suarez': 5, 'Edwin Uceta': 6,
  'Matt Brash': 7, 'Phil Maton': 8, 'Garrett Cleavinger': 9,
  'Gabe Speier': 10, 'Dylan Lee': 11, 'Alex Vesia': 12,
  'Luke Weaver': 13, 'Jason Adam': 14, 'Brad Keller': 15,
  'Will Vest': 16, 'Kyle Finnegan': 17, 'Hunter Gaddis': 18,
  'Tyler Rogers': 19, 'Grant Taylor': 20, 'Louis Varland': 21,
  'Fernando Cruz': 22, 'Erik Sabrowski': 23, 'Mason Montgomery': 24,
  'Aaron Ashby': 25, 'Matt Strahm': 26, 'Bryan Baker': 27,
  'Jose A. Ferrer': 28, 'José Alvarado': 29, 'Andrew Nardi': 30,
  'Camilo Doval': 31, 'Steven Okert': 32, 'Caleb Thielbar': 33,
  'Brooks Raley': 34, 'Matt Svanson': 35, 'Andrew Kittredge': 36,
  'Bryan King': 37, 'Drew Pomeranz': 38, 'Jordan Leasure': 39,
  'Graham Ashcraft': 40, 'Justin Slaten': 41, 'Orion Kerkering': 42,
  'Shawn Armstrong': 43, 'Tony Santillan': 44, 'Gregory Soto': 45,
  'Anthony Bender': 46, 'Chris Martin': 47, 'Lucas Erceg': 48,
  'Jared Koenig': 49, 'Connor Phillips': 50, 'Justin Sterner': 51,
  'Brendon Little': 52, 'Braydon Fisher': 53, 'Eduard Bazardo': 54,
  'Hunter Harvey': 55, 'Elvis Alvarado': 56, 'Mason Fluharty': 57,
  'Rico Garcia': 58, 'Jonathan Bowlan': 59, 'Carmen Mlodzinski': 60,
  'Hunter Bigge': 61, 'Dylan Dodd': 62, 'Ryan Zeferjahn': 63,
  'Jack Dreyer': 64, 'Ryne Stanek': 65, 'Jonathan Loáisiga': 66,
  'Edgardo Henriquez': 67, 'Hogan Harris': 68, 'Angel Zerpa': 69,
  'Cole Sands': 70, 'Isaac Mattson': 71, 'Dietrich Enns': 72,
  'Lake Bachar': 73, 'Matt Festa': 74, 'Tyler Holton': 75,
  'Calvin Faucher': 76, 'JoJo Romero': 77, 'Nick Mears': 78,
  'Grant Anderson': 79, 'Pierce Johnson': 80, 'Yennier Cano': 81,
  'Tanner Banks': 82, 'Tyler Kinley': 83, 'Blake Treinen': 84,
  'Kody Funderburk': 85, 'John Schreiber': 86, 'Scott Barlow': 87,
  'Ryan Thompson': 88, 'José Buttó': 89, 'Jordan Romano': 90,
  'Brock Burke': 91, 'David Morgan': 92, 'Keegan Akin': 93,
  'Jacob Webb': 94, 'Aaron Bummer': 95, 'Juan Mejia': 96,
  'Eric Orze': 97, 'Erik Miller': 98, 'Will Klein': 99, 'DL Hall': 100,
}

type SortKey = 'pr'|'sc'|'ab'|'r'|'d2'|'d3'|'hr'|'rb'|'sbn'|'so'|'av'|'ob'|'ip'|'w'|'l'|'sv'|'hld'|'er'|'wh'|'bb'|'k'|'qa3'|'age'|'adp_n'|'prospect_rank'|'pl_hld_rk'

interface Props {
  draftedIds: Set<string>
  hometownMap: Record<string, string>
  managers: Manager[]
  onNominate: (p: Player) => void
  adjustedPrices: Map<string, number>
  draftLog: DraftEntry[]
  tags: Record<string, PlayerTag>
  onCycleTag: (key: string) => void
  notes?: Record<string, string>
  onUpdateNote?: (key: string, note: string) => void
}

export default function BigBoard({ draftedIds, hometownMap, managers, onNominate, adjustedPrices, draftLog, tags, onCycleTag, notes = {}, onUpdateNote = () => {} }: Props) {
  const [tab, setTab] = useState<PositionTab>('SS')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('pr')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [hideDrafted, setHideDrafted] = useState(false)
  const [hideNeg, setHideNeg] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showRec, setShowRec] = useState(false)

  const isSearching = query.trim().length > 1
  const isProsTab = tab === 'PROS' && !isSearching
  const isPit = (tab === 'SP' || tab === 'RP') && !isSearching

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else {
      setSortKey(key)
      setSortDir(key === 'er' || key === 'wh' || key === 'prospect_rank' ? 'asc' : 'desc')
    }
  }

  const isDrafted = useCallback((p: Player) => draftedIds.has(p.id + '|' + p.n), [draftedIds])
  const recs = useRecommendations(managers, draftedIds, ALL_FLAT)
  const draftedInfoMap = useMemo(() => {
    const m = new Map<string, { price: number; managerName: string; draftType: import('@/lib/types').DraftType }>()
    for (const e of draftLog) {
      const mgr = managers.find(m => m.id === e.managerId)
      m.set(e.player.id + '|' + e.player.n, {
        price: e.price,
        managerName: mgr ? mgr.name.split(' ')[0] : e.managerId,
        draftType: e.draftType,
      })
    }
    return m
  }, [draftLog, managers])

  const baseList: Player[] = useMemo(() =>
    isSearching ? ALL_FLAT : (PLAYERS[tab] ?? [])
  , [tab, isSearching])

  const filtered = useMemo(() => {
    let list = baseList
    if (query.trim().length > 1) {
      const q = query.toLowerCase()
      list = list.filter(p => p.n.toLowerCase().includes(q) || p.t.toLowerCase().includes(q))
    }
    if (hideDrafted) list = list.filter(p => !isDrafted(p))
    if (hideNeg) list = list.filter(p => p.pr > 0)
    // On PROS tab default sort is prospect_rank asc; elsewhere default is pr desc
    return [...list].sort((a, b) => {
      let av: number, bv: number
      if (sortKey === 'adp_n') {
        av = parseFloat((a as any).adp) || 9999
        bv = parseFloat((b as any).adp) || 9999
      } else if (sortKey === 'pl_hld_rk') {
        av = PL_HLD_RANKS[(a as any).n] ?? 9999
        bv = PL_HLD_RANKS[(b as any).n] ?? 9999
      } else {
        const ar = (a as any)[sortKey]; av = typeof ar === 'number' ? ar : 0
        const br = (b as any)[sortKey]; bv = typeof br === 'number' ? br : 0
      }
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [baseList, query, hideDrafted, hideNeg, sortKey, sortDir, isDrafted])

  // When switching to PROS tab, default sort to rank
  const handleTabChange = (t: PositionTab) => {
    setTab(t)
    setQuery('')
    setShowRec(false)
    if (t === 'PROS') {
      setSortKey('prospect_rank')
      setSortDir('asc')
    } else if (sortKey === 'prospect_rank') {
      setSortKey('pr')
      setSortDir('desc')
    }
  }

  const col = POS_COLORS[tab] ?? 'var(--text2)'

  const hitterSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},{key:'ab',label:'AB'},
    {key:'r',label:'R'},{key:'d2',label:'2B'},{key:'d3',label:'3B'},{key:'hr',label:'HR'},
    {key:'rb',label:'RBI'},{key:'sbn',label:'SBN'},{key:'sv',label:'SV'},{key:'so',label:'SO'},
    {key:'av',label:'AVG'},{key:'ob',label:'OBP'},
    {key:'age',label:'AGE'},{key:'adp_n',label:'ADP'},
  ]
  const pitcherSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},{key:'ip',label:'IP'},
    {key:'w',label:'W'},{key:'l',label:'L'},{key:'sv',label:'SV'},{key:'hld',label:'HLD'},
    {key:'er',label:'ERA'},{key:'wh',label:'WHIP'},{key:'bb',label:'BB'},{key:'k',label:'K'},{key:'qa3',label:'QA3'},
    {key:'age',label:'AGE'},{key:'pl_hld_rk',label:'PL HLD Rk'},
  ]
  const prosSorts: {key: SortKey; label: string}[] = [
    {key:'prospect_rank',label:'RANK'},{key:'pr',label:'$'},{key:'sc',label:'SCR'},
    {key:'age',label:'AGE'},
  ]
  const sorts = isProsTab ? prosSorts : isPit ? pitcherSorts : hitterSorts

  // Separate tabs: regular position tabs vs PROS
  const regularTabs = POSITION_TABS.filter(t => t !== 'PROS')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Top controls */}
      <div style={{ padding: '7px 12px', background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {regularTabs.map(t => {
          const c = POS_COLORS[t]
          const active = tab === t && !isSearching && !showRec
          return (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              background: active ? c + '22' : 'transparent',
              color: active ? c : 'var(--text3)',
              borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
              borderRadius: '3px 3px 0 0',
              fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400, transition: 'all 0.1s',
            }}>
              {t} <span style={{ fontSize: 9, opacity: 0.5 }}>({PLAYERS[t]?.length ?? 0})</span>
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 2px' }} />

        {/* PROS tab */}
        {(() => {
          const active = tab === 'PROS' && !isSearching && !showRec
          return (
            <button onClick={() => handleTabChange('PROS')} style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer',
              background: active ? PROSPECT_COLOR + '22' : 'transparent',
              color: active ? PROSPECT_COLOR : 'var(--text3)',
              borderBottom: active ? `2px solid ${PROSPECT_COLOR}` : '2px solid transparent',
              borderRadius: '3px 3px 0 0',
              fontSize: 11, fontFamily: 'inherit', fontWeight: active ? 700 : 400, transition: 'all 0.1s',
            }}>
              🔮 PROS <span style={{ fontSize: 9, opacity: 0.5 }}>({PLAYERS['PROS']?.length ?? 0})</span>
            </button>
          )
        })()}

        <button onClick={() => { setShowRec(r => !r); setQuery('') }} style={{
          padding: '4px 12px', border: 'none', cursor: 'pointer',
          background: showRec ? '#4a9eff22' : 'transparent',
          color: showRec ? '#4a9eff' : 'var(--text3)',
          borderBottom: showRec ? '2px solid #4a9eff' : '2px solid transparent',
          borderRadius: '3px 3px 0 0',
          fontSize: 11, fontFamily: 'inherit', fontWeight: showRec ? 700 : 400,
        }}>
          🎯 REC
        </button>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideDrafted} onChange={e => setHideDrafted(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide drafted
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={hideNeg} onChange={e => setHideNeg(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Hide $0
        </label>
        <div style={{ position: 'relative' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all positions…"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 5, padding: '5px 28px 5px 10px', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit', outline: 'none', width: 180 }} />
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Sort bar */}
      {!showRec && <div style={{ padding: '4px 12px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, overflowX: 'auto' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 6, whiteSpace: 'nowrap' }}>SORT:</span>
        {sorts.map(s => (
          <button key={s.key} onClick={() => toggleSort(s.key)} style={{
            padding: '3px 7px', border: 'none', cursor: 'pointer',
            background: sortKey === s.key ? 'var(--border2)' : 'transparent',
            color: sortKey === s.key ? 'var(--text)' : 'var(--text3)',
            borderRadius: 4, fontSize: 10, fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {s.label}
            {sortKey === s.key && <span style={{ fontSize: 8 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {isSearching ? `${filtered.length} results` : `${filtered.length} / ${PLAYERS[tab]?.length ?? 0}`}
          {hideDrafted && draftedIds.size > 0 ? ` · ${draftedIds.size} drafted` : ''}
        </span>
      </div>}

      {/* REC view */}
      {showRec && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#4a9eff', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>🎯 RECOMMENDED FOR ADAM · {recs.topEnd.length + recs.midTier.length + recs.sneaky.length} players</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              Ranked by marginal category value relative to your current needs. Colored tags show which cats each player helps most. Updates live as picks happen.
            </div>
          </div>
          <RecommendationsPanel
            tiers={recs}
            adjustedPrices={adjustedPrices}
            tags={tags}
            onCycleTag={onCycleTag}
            onNominate={onNominate}
            onSelect={setSelectedPlayer}
          />
        </div>
      )}

      {/* Player rows */}
      {!showRec && <div style={{ flex: 1, overflowY: 'auto', padding: '3px 8px 24px' }}>
        {filtered.map((p, i) => {
          const drafted = isDrafted(p)
          const hometown = hometownMap[p.n]
          const displayTab = isSearching ? p.ps.split(',')[0].trim() : tab
          const rowCol = isProsTab ? PROSPECT_COLOR : (POS_COLORS[displayTab] ?? col)
          const prospectRank: number | undefined = (p as any).prospect_rank
          const prospectEta: number | undefined = (p as any).prospect_eta
          const isProspectOnly = prospectRank !== undefined && p.pr === 0 && p.sc === 0

          return (
            <div key={p.n + p.t + i}
              onClick={() => setSelectedPlayer(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '5px 8px',
                borderRadius: 5, cursor: 'pointer',
                background: i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)',
                borderLeft: `3px solid ${drafted ? '#450a0a' : hometown ? '#b7791f88' : prospectRank && isProspectOnly ? PROSPECT_COLOR + '44' : rowCol + '22'}`,
                opacity: drafted ? 0.45 : 1, transition: 'background 0.08s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)')}
            >
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {!isProspectOnly && <PriceBadge price={p.pr} size="sm" />}
                {!isProspectOnly && (() => {
                  if (draftedIds.size === 0) return null
                  const adj = adjustedPrices.get(p.id + '|' + p.n)
                  if (!adj || Math.abs(adj - Math.round(p.pr)) < 2) return null
                  return (
                    <>
                      <span style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1 }}>→</span>
                      <PriceBadge price={adj} size="sm" />
                    </>
                  )
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: drafted ? 'var(--text3)' : 'var(--text)' }}>{p.n}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
                  {p.age > 0 && <span style={{ fontSize: 9, color: 'var(--text3)' }}>({p.age})</span>}

                  {/* Prospect badges */}
                  {prospectRank !== undefined && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      color: '#e9d5ff', background: '#4c1d95',
                      border: '1px solid #7c3aed',
                    }}>
                      🔮 Prospect #{prospectRank}
                    </span>
                  )}
                  {prospectEta !== undefined && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                      color: '#c4b5fd', background: '#2e1065',
                    }}>
                      ETA {prospectEta}
                    </span>
                  )}

                  {hometown && (() => {
                    const mgrName = managers.find(m => m.id === hometown)?.name ?? hometown
                    const shortName = mgrName.split(' ')[0]
                    return <span style={{ fontSize: 9, color: 'var(--gold)', background: '#b7791f22', padding: '1px 4px', borderRadius: 3 }}>★ HTD: {shortName}</span>
                  })()}
                  {drafted && (() => {
                    const info = draftedInfoMap.get(p.id + '|' + p.n)
                    const suffix = info?.draftType === 'keeper' ? ' (keeper)' : info?.draftType === 'qualifying_offer' ? ' (QO)' : ''
                    return (
                      <span style={{ fontSize: 9, color: 'var(--red)', background: '#450a0a', padding: '1px 5px', borderRadius: 3 }}>
                        DRAFTED{info ? ` $${info.price} by ${info.managerName}${suffix}` : ''}
                      </span>
                    )
                  })()}
                  {(() => {
                    const pkey = p.id + '|' + p.n
                    const tag = tags[pkey]
                    if (!tag) return null
                    const tc = TAG_CONFIG[tag]
                    return <span style={{ fontSize: 9, color: tc.color, background: tc.bg, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{tc.emoji} {tc.label}</span>
                  })()}
                  {tab === 'RP' && !isSearching && (() => {
                    const rank = PL_HLD_RANKS[p.n]
                    if (!rank) return null
                    return (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        color: rank <= 25 ? '#4ade80' : rank <= 50 ? '#a3e635' : rank <= 75 ? '#e2e8f0' : '#fb923c',
                        background: 'var(--bg3)', border: '1px solid var(--border2)' }}>
                        PL HLD #{rank}
                      </span>
                    )
                  })()}
                  {(isSearching || isProsTab) && p.ps.split(',').map(pos => (
                    <span key={pos} style={{ fontSize: 9, color: POS_COLORS[pos.trim()] ?? 'var(--text3)', background: (POS_COLORS[pos.trim()] ?? '#666') + '18', padding: '1px 4px', borderRadius: 3 }}>{pos.trim()}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 10, flexWrap: 'wrap' }}>
                  {isProspectOnly ? (
                    <span style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>Minor league prospect — no MLB projections yet</span>
                  ) : !isPitcher(p) ? (
                    <>
                      <Stat label="AB" v={p.ab} />
                      <Stat label="R" v={p.r} />
                      <Stat label="2B" v={p.d2} />
                      <Stat label="3B" v={p.d3} />
                      <Stat label="HR" v={p.hr} />
                      <Stat label="RBI" v={p.rb} />
                      <Stat label="SBN" v={p.sbn} />
                      <Stat label="SO" v={p.so} />
                      <Stat label="AVG" v={p.av.toFixed(3)} />
                      <Stat label="OBP" v={p.ob.toFixed(3)} />
                    </>
                  ) : (
                    <>
                      <Stat label="IP" v={Math.round(p.ip)} />
                      <Stat label="W" v={p.w} />
                      <Stat label="L" v={p.l} />
                      <Stat label="SV" v={typeof (p as any).sv === 'number' ? (p as any).sv : 0} />
                      <Stat label="HLD" v={p.hld} />
                      <Stat label="ERA" v={p.er.toFixed(2)} color={p.er < 3.2 ? 'var(--green)' : p.er < 4.0 ? 'var(--gold)' : 'var(--red)'} />
                      <Stat label="WHIP" v={p.wh.toFixed(2)} color={p.wh < 1.1 ? 'var(--green)' : p.wh < 1.3 ? 'var(--gold)' : 'var(--red)'} />
                      <Stat label="BB" v={p.bb} />
                      <Stat label="K" v={p.k} />
                      <Stat label="QA3" v={p.qa3} />
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {!isProspectOnly && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)' }}>SCORE</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: rowCol }}>{p.sc}</div>
                  </div>
                )}
                {!drafted && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); onCycleTag(p.id + '|' + p.n) }}
                      title="Cycle tag: Target → ★ → Avoid → None"
                      style={{ padding: '3px 7px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, cursor: 'pointer', flexShrink: 0, minWidth: 28, textAlign: 'center' }}>
                      {(() => { const t = tags[p.id + '|' + p.n]; return t ? TAG_CONFIG[t].emoji : '○' })()}
                    </button>
                    <button onClick={e => { e.stopPropagation(); onNominate(p) }}
                      style={{ padding: '4px 8px', border: '1px solid var(--gold)', borderRadius: 4, background: 'transparent', color: 'var(--gold)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      ⚡ NOM
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
            {query ? 'No players match your search' : 'No players in this view'}
          </div>
        )}
      </div>}

      {selectedPlayer && (
        <PlayerCard
          player={selectedPlayer}
          managers={managers}
          hometownMap={hometownMap}
          isDrafted={isDrafted(selectedPlayer)}
          onNominate={onNominate}
          onClose={() => setSelectedPlayer(null)}
          adjustedPrices={adjustedPrices}
          tag={tags[selectedPlayer.id + '|' + selectedPlayer.n] ?? null}
          onCycleTag={onCycleTag}
          note={selectedPlayer ? (notes[selectedPlayer.id + '|' + selectedPlayer.n] ?? '') : ''}
          onUpdateNote={onUpdateNote}
        />
      )}
    </div>
  )
}

function Stat({ label, v, color }: { label: string; v: number | string; color?: string }) {
  return (
    <span>
      <span style={{ color: 'var(--border2)' }}>{label} </span>
      <span style={{ color: color ?? 'var(--text2)' }}>{v}</span>
    </span>
  )
}
