'use client'
import { useState, useMemo, useCallback } from 'react'
import playersRaw from '@/data/players_raw.json'
import { Player, isPitcher, PositionTab, POSITION_TABS, Manager } from '@/lib/types'
import { PriceBadge } from './PriceBadge'
import PlayerCard from './PlayerCard'

const PLAYERS = playersRaw as Record<string, Player[]>

// Deduplicated flat list for search
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
  SS:'#f59e0b', '3B':'#ef4444', OF:'#06b6d4',
  DH:'#ec4899', SP:'#a3e635', RP:'#fb923c',
}

type SortKey = 'pr'|'sc'|'r'|'d2'|'d3'|'hr'|'rb'|'sbn'|'so'|'av'|'ob'|'ip'|'w'|'l'|'sv'|'hld'|'er'|'wh'|'bb'|'k'|'qa3'|'age'|'adp_n'

interface Props {
  draftedIds: Set<string>
  hometownMap: Record<string, string>
  managers: Manager[]
  onNominate: (p: Player) => void
}

export default function BigBoard({ draftedIds, hometownMap, managers, onNominate }: Props) {
  const [tab, setTab] = useState<PositionTab>('SS')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('pr')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [hideDrafted, setHideDrafted] = useState(false)
  const [hideNeg, setHideNeg] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const isSearching = query.trim().length > 1
  const isPit = (tab === 'SP' || tab === 'RP') && !isSearching

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir(key === 'er' || key === 'wh' ? 'asc' : 'desc') }
  }

  const isDrafted = useCallback((p: Player) => draftedIds.has(p.id + '|' + p.n), [draftedIds])

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
    return [...list].sort((a, b) => {
      let av: number, bv: number
      if (sortKey === 'adp_n') {
        av = parseFloat((a as any).adp) || 9999
        bv = parseFloat((b as any).adp) || 9999
      } else {
        av = (a as any)[sortKey] ?? 0
        bv = (b as any)[sortKey] ?? 0
      }
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [baseList, query, hideDrafted, hideNeg, sortKey, sortDir, isDrafted])

  const col = POS_COLORS[tab] ?? 'var(--text2)'

  const hitterSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},
    {key:'r',label:'R'},{key:'d2',label:'2B'},{key:'d3',label:'3B'},{key:'hr',label:'HR'},
    {key:'rb',label:'RBI'},{key:'sbn',label:'SBN'},{key:'so',label:'SO'},
    {key:'av',label:'AVG'},{key:'ob',label:'OBP'},
    {key:'age',label:'AGE'},{key:'adp_n',label:'ADP'},
  ]
  const pitcherSorts: {key: SortKey; label: string}[] = [
    {key:'pr',label:'$'},{key:'sc',label:'SCR'},
    {key:'w',label:'W'},{key:'l',label:'L'},{key:'sv',label:'SV'},{key:'hld',label:'HLD'},
    {key:'er',label:'ERA'},{key:'wh',label:'WHIP'},{key:'bb',label:'BB'},{key:'k',label:'K'},{key:'qa3',label:'QA3'},
    {key:'age',label:'AGE'},
  ]
  const sorts = isPit ? pitcherSorts : hitterSorts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Top controls */}
      <div style={{ padding: '7px 12px', background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {POSITION_TABS.map(t => {
          const c = POS_COLORS[t]
          const active = tab === t && !isSearching
          return (
            <button key={t} onClick={() => { setTab(t); setQuery('') }} style={{
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
      <div style={{ padding: '4px 12px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, overflowX: 'auto' }}>
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
      </div>

      {/* Player rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '3px 8px 24px' }}>
        {filtered.map((p, i) => {
          const drafted = isDrafted(p)
          const hometown = hometownMap[p.n]
          const displayTab = isSearching ? p.ps.split(',')[0].trim() : tab
          const rowCol = POS_COLORS[displayTab] ?? col

          return (
            <div key={p.n + p.t + i}
              onClick={() => setSelectedPlayer(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '5px 8px',
                borderRadius: 5, cursor: 'pointer',
                background: i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)',
                borderLeft: `3px solid ${drafted ? '#450a0a' : hometown ? '#b7791f88' : rowCol + '22'}`,
                opacity: drafted ? 0.45 : 1, transition: 'background 0.08s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg1)' : 'var(--bg)')}
            >
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{i + 1}</div>
              <PriceBadge price={p.pr} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: drafted ? 'var(--text3)' : 'var(--text)' }}>{p.n}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.t}</span>
                  {p.age > 0 && <span style={{ fontSize: 9, color: 'var(--text3)' }}>({p.age})</span>}
                  {hometown && <span style={{ fontSize: 9, color: 'var(--gold)', background: '#b7791f22', padding: '1px 4px', borderRadius: 3 }}>★ HTD</span>}
                  {drafted && <span style={{ fontSize: 9, color: 'var(--red)', background: '#450a0a', padding: '1px 4px', borderRadius: 3 }}>DRAFTED</span>}
                  {isSearching && p.ps.split(',').map(pos => (
                    <span key={pos} style={{ fontSize: 9, color: POS_COLORS[pos.trim()] ?? 'var(--text3)', background: (POS_COLORS[pos.trim()] ?? '#666') + '18', padding: '1px 4px', borderRadius: 3 }}>{pos.trim()}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 10, flexWrap: 'wrap' }}>
                  {!isPitcher(p) ? (
                    <>
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
                      <Stat label="W" v={p.w} />
                      <Stat label="L" v={p.l} />
                      <Stat label="SV" v={p.sv} />
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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--text3)' }}>SCORE</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: rowCol }}>{p.sc}</div>
                </div>
                {!drafted && (
                  <button onClick={e => { e.stopPropagation(); onNominate(p) }}
                    style={{ padding: '4px 8px', border: '1px solid var(--gold)', borderRadius: 4, background: 'transparent', color: 'var(--gold)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    ⚡ NOM
                  </button>
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
      </div>

      {selectedPlayer && (
        <PlayerCard
          player={selectedPlayer}
          managers={managers}
          hometownMap={hometownMap}
          isDrafted={isDrafted(selectedPlayer)}
          onNominate={onNominate}
          onClose={() => setSelectedPlayer(null)}
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
