'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Manager, DraftEntry, WAB_MANAGERS, Player, DraftType, RosterLevel } from '@/lib/types'
import { computeAdjustedPrices } from '@/lib/adjustedPrices'
import playersRaw from '@/data/players_raw.json'
import { POSITION_TABS } from '@/lib/types'
import { computeStandings } from '@/lib/standings'

const STORAGE_KEY = 'wab_draft_state_2025'

// Flat deduplicated player list for price computation
const ALL_PLAYERS_FLAT: Player[] = (() => {
  const seen = new Set<string>()
  const out: Player[] = []
  for (const tab of POSITION_TABS) {
    for (const p of (playersRaw as Record<string, Player[]>)[tab] ?? []) {
      const key = p.id + '|' + p.n
      if (!seen.has(key)) { seen.add(key); out.push(p) }
    }
  }
  return out
})()

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
  const [slotAssignments, setSlotAssignments] = useState<Record<string, Record<string, string>>>({})

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { managers: m, draftLog: dl, hometownMap: hm, slotAssignments: sa } = JSON.parse(raw)
        if (m) setManagers(m)
        if (dl) setDraftLog(dl)
        if (hm) setHometownMap(hm)
        if (sa) setSlotAssignments(sa)
      }
    } catch {}
  }, [])

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ managers, draftLog, hometownMap, slotAssignments }))
    } catch {}
  }, [managers, draftLog, hometownMap, slotAssignments])

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

  const updateSlotAssignments = useCallback((managerId: string, assignments: Record<string, string>) => {
    setSlotAssignments(prev => ({ ...prev, [managerId]: assignments }))
  }, [])

  const resetDraft = useCallback(() => {
    if (window.confirm('Reset ALL draft data? This cannot be undone.')) {
      setDraftLog([])
      setManagers(prev => prev.map(m => ({ ...m, spent: 0, roster: [] })))
      setSlotAssignments({})
    }
  }, [])

  const importState = useCallback((
    newManagers: Manager[],
    newDraftLog: DraftEntry[],
    newHometownMap: Record<string, string>,
    newSlotAssignments?: Record<string, Record<string, string>>
  ) => {
    setManagers(newManagers)
    setDraftLog(newDraftLog)
    setHometownMap(newHometownMap)
    if (newSlotAssignments) setSlotAssignments(newSlotAssignments)
  }, [])

  const adjustedPrices = useMemo(
    () => computeAdjustedPrices(ALL_PLAYERS_FLAT, draftedIds, managers),
    [draftedIds, managers]
  )

  const standings = useMemo(() => computeStandings(managers), [managers])

  return {
    managers, draftLog, draftedIds, hometownMap, standings, adjustedPrices,
    draftPlayer, undraftPlayer, updateManagerName, updateManagerBudget,
    setHometownPlayers, resetDraft, importState,
    slotAssignments, updateSlotAssignments,
  }
}
