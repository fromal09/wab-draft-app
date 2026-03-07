'use client'
import { useState } from 'react'
import { useDraftState } from '@/hooks/useDraftState'
import { useAuctionTimer } from '@/hooks/useAuctionTimer'
import { Player } from '@/lib/types'
import BigBoard from './BigBoard'
import AuctionConsole from './AuctionConsole'
import RosterView from './RosterView'
import StandingsView from './StandingsView'
import SettingsModal from './SettingsModal'

export type AppView = 'board' | 'auction' | 'rosters' | 'standings'

export default function DraftApp() {
  const [view, setView] = useState<AppView>('board')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const draft = useDraftState()
  const timer = useAuctionTimer()

  function handleNominate(player: Player) {
    setSelectedPlayer(player)
    setView('auction')
  }

  const navItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'board',     label: 'Big Board',  icon: '⬛' },
    { id: 'auction',   label: 'Auction',    icon: '⚡' },
    { id: 'rosters',   label: 'Rosters',    icon: '📋' },
    { id: 'standings', label: 'Standings',  icon: '📊' },
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
          />
        )}
        {view === 'rosters' && (
          <RosterView
            managers={draft.managers}
            draftLog={draft.draftLog}
            onUndraft={draft.undraftPlayer}
          />
        )}
        {view === 'standings' && (
          <StandingsView
            managers={draft.managers}
            standings={draft.standings}
          />
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          managers={draft.managers}
          onUpdateName={draft.updateManagerName}
          onUpdateBudget={draft.updateManagerBudget}
          onSetHometown={draft.setHometownPlayers}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
