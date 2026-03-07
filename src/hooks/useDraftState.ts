'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Manager, DraftEntry, WAB_MANAGERS, Player, DraftType, RosterLevel } from '@/lib/types'
import { computeStandings } from '@/lib/standings'

const STORAGE_KEY = 'wab_draft_state_2025'

function defaultManagers(): Manager[] {
  return WAB_MANAGERS.map(m => ({
    ...m,
    budget: 450,
    spent: 0,
    roster: [],
    hometownPlayers: [],
  }))
}

export function useDraftState() {
  const [managers, setManagers] = useState<Manager[]>(defaultManagers)
  const [draftLog, setDraftLog] = useState<DraftEntry[]>([])
  const [hometownMap, setHometownMap] = useState<Record<string, string>>({})

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { managers: m, draftLog: dl, hometownMap: hm } = JSON.parse(raw)
        if (m) setManagers(m)
        if (dl) setDraftLog(dl)
        if (hm) setHometownMap(hm)
      }
    } catch {}
  }, [])

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ managers, draftLog, hometownMap }))
    } catch {}
  }, [managers, draftLog, hometownMap])

  // Stable Set — only recomputed when draftLog changes
  const draftedIds = useMemo(
    () => new Set(draftLog.map(e => e.player.id + '|' + e.player.n)),
    [draftLog]
  )

  const draftPlayer = useCallback((
    player: Player,
    managerId: string,
    price: number,
    draftType: DraftType,
    rosterLevel: RosterLevel
  ) => {
    const entry: DraftEntry = { player, managerId, price, draftType, rosterLevel, timestamp: Date.now() }
    setDraftLog(prev => [entry, ...prev])
    setManagers(prev => prev.map(m =>
      m.id !== managerId ? m : { ...m, spent: m.spent + price, roster: [...m.roster, entry] }
    ))
  }, [])

  const undraftPlayer = useCallback((entry: DraftEntry) => {
    setDraftLog(prev => prev.filter(e => e.timestamp !== entry.timestamp))
    setManagers(prev => prev.map(m =>
      m.id !== entry.managerId ? m : {
        ...m,
        spent: m.spent - entry.price,
        roster: m.roster.filter(e => e.timestamp !== entry.timestamp),
      }
    ))
  }, [])

  const updateManagerName = useCallback((managerId: string, name: string) => {
    setManagers(prev => prev.map(m => m.id === managerId ? { ...m, name } : m))
  }, [])

  const updateManagerBudget = useCallback((managerId: string, budget: number) => {
    setManagers(prev => prev.map(m => m.id === managerId ? { ...m, budget } : m))
  }, [])

  const setHometownPlayers = useCallback((managerId: string, playerNames: string[]) => {
    setManagers(prev => prev.map(m =>
      m.id === managerId ? { ...m, hometownPlayers: playerNames } : m
    ))
    setHometownMap(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (next[k] === managerId) delete next[k] })
      playerNames.forEach(name => { next[name] = managerId })
      return next
    })
  }, [])

  const resetDraft = useCallback(() => {
    if (window.confirm('Reset ALL draft data? This cannot be undone.')) {
      setDraftLog([])
      setManagers(prev => prev.map(m => ({ ...m, spent: 0, roster: [] })))
    }
  }, [])

  const standings = useMemo(() => computeStandings(managers), [managers])

  return {
    managers, draftLog, draftedIds, hometownMap, standings,
    draftPlayer, undraftPlayer, updateManagerName, updateManagerBudget,
    setHometownPlayers, resetDraft,
  }
}
