'use client'
import { useState } from 'react'
import { usePlayerTags } from '@/hooks/usePlayerTags'
import { useDraftState } from '@/hooks/useDraftState'
import { useAuctionTimer } from '@/hooks/useAuctionTimer'
import { Player } from '@/lib/types'
import BigBoard from './BigBoard'
import AuctionConsole from './AuctionConsole'
import RosterView from './RosterView'
import StandingsView from './StandingsView'
import PositionViz from './PositionViz'
import SettingsModal, { TimerConfig, DEFAULT_TIMER_CONFIG } from './SettingsModal'

import TargetFinder from './TargetFinder'

export type AppView = 'board' | 'auction' | 'rosters' | 'standings' | 'viz' | 'targets'

export default function DraftApp() {
  const [view, setView] = useState<AppView>('board')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = typeof window !== 'undefined' ? (() => { const r = { current: null as HTMLInputElement | null }; return r })() : { current: null }

  const draft = useDraftState()

  function handleExport() {
    const state = {
      version: '2025-v1',
      exportedAt: new Date().toISOString(),
      managers: draft.managers,
      draftLog: draft.draftLog,
      hometownMap: draft.hometownMap,
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wab-draft-${new Date().toISOString().slice(0,16).replace('T','-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportError(null)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (!data.managers || !data.draftLog) throw new Error('Invalid file format')
          if (!window.confirm('Load draft state from ' + file.name + '?\nThis will overwrite current draft data.')) return
          draft.importState(data.managers, data.draftLog, data.hometownMap ?? {})
        } catch (err) {
          setImportError(err instanceof Error ? err.message : 'Failed to parse file')
          setTimeout(() => setImportError(null), 4000)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
  const [timerConfig, setTimerConfig] = useState<TimerConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_TIMER_CONFIG
    try {
      const saved = localStorage.getItem('wab_timer_config_2025')
      return saved ? { ...DEFAULT_TIMER_CONFIG, ...JSON.parse(saved) } : DEFAULT_TIMER_CONFIG
    } catch { return DEFAULT_TIMER_CONFIG }
  })

  function handleUpdateTimer(cfg: TimerConfig) {
    setTimerConfig(cfg)
    localStorage.setItem('wab_timer_config_2025', JSON.stringify(cfg))
  }

  const { tags, cycleTag } = usePlayerTags()
  const timer = useAuctionTimer(timerConfig)

  function handleNominate(player: Player) {
    setSelectedPlayer(player)
    setView('auction')
  }

  const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'board',     label: 'Big Board',     icon: '⬛' },
    { id: 'auction',   label: 'Auction',       icon: '⚡' },
    { id: 'rosters',   label: 'Rosters',       icon: '📋' },
    { id: 'standings', label: 'Standings',     icon: '📊' },
    { id: 'targets',   label: 'Target Finder', icon: '🎯' },
    { id: 'viz',       label: 'Position Viz',  icon: '📈' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 16px', height: 48, flexShrink: 0,
        background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="font-syne" style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.03em' }}>WAB</span>
          <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em' }}>2025 DRAFT COMMAND CENTER</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                background: view === item.id ? 'var(--border)' : 'transparent',
                color: view === item.id ? 'var(--text)' : 'var(--text3)',
                borderRadius: 4, fontSize: 11, fontFamily: 'inherit',
                fontWeight: view === item.id ? 700 : 400,
                transition: 'all 0.15s',
              }}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side info */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Budget summary */}
          <div style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {draft.managers.map(m => (
              <span key={m.id} style={{ whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text2)' }}>{m.name.split(' ')[0]}</span>
                {' '}
                <span style={{ color: m.budget - m.spent < 50 ? 'var(--red)' : m.budget - m.spent < 120 ? 'var(--gold)' : 'var(--green)' }}>
                  ${m.budget - m.spent}
                </span>
              </span>
            ))}
          </div>

          <button onClick={() => setSettingsOpen(true)}
            style={{ padding: '4px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚙ Setup
          </button>
          <button onClick={draft.resetDraft}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            ↺ Reset
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <button onClick={handleExport}
            title="Save draft state to JSON file"
            style={{ padding: '4px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--cyan)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            ↓ Export
          </button>
          <button onClick={handleImportClick}
            title="Load draft state from JSON file"
            style={{ padding: '4px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--gold)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            ↑ Import
          </button>
          {importError && (
            <span style={{ fontSize: 10, color: 'var(--red)', maxWidth: 180 }}>{importError}</span>
          )}
        </div>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {view === 'board' && (
          <BigBoard
            draftedIds={draft.draftedIds}
            hometownMap={draft.hometownMap}
            managers={draft.managers}
            onNominate={handleNominate}
            adjustedPrices={draft.adjustedPrices}
            draftLog={draft.draftLog}
            tags={tags}
            onCycleTag={cycleTag}
          />
        )}
        {view === 'auction' && (
          <AuctionConsole
            timer={timer}
            managers={draft.managers}
            draftPlayer={draft.draftPlayer}
            draftedIds={draft.draftedIds}
            hometownMap={draft.hometownMap}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            adjustedPrices={draft.adjustedPrices}
            tags={tags}
            onCycleTag={cycleTag}
          />
        )}
        {view === 'rosters' && (
          <RosterView
            managers={draft.managers}
            draftLog={draft.draftLog}
            onUndraft={draft.undraftPlayer}
            onMoveSlot={() => {}}
            slotAssignments={draft.slotAssignments}
            onUpdateSlotAssignments={draft.updateSlotAssignments}
          />
        )}
        {view === 'standings' && (
          <StandingsView
            managers={draft.managers}
            standings={draft.standings}
          />
        )}
        {view === 'targets' && (
          <TargetFinder
            draftedIds={draft.draftedIds}
            managers={draft.managers}
            hometownMap={draft.hometownMap}
            adjustedPrices={draft.adjustedPrices}
            tags={tags}
            onCycleTag={cycleTag}
          />
        )}
        {view === 'viz' && (
          <PositionViz
            draftedIds={draft.draftedIds}
            draftLog={draft.draftLog}
            adjustedPrices={draft.adjustedPrices}
            managers={draft.managers}
          />
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          managers={draft.managers}
          onUpdateName={draft.updateManagerName}
          onUpdateBudget={draft.updateManagerBudget}
          onSetHometown={draft.setHometownPlayers}
          timerConfig={timerConfig}
          onUpdateTimer={handleUpdateTimer}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
