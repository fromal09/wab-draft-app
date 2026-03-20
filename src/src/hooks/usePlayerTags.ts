'use client'
import { useState, useCallback } from 'react'
import { PlayerTag } from '@/lib/types'

const STORAGE_KEY = 'wab_player_tags_2025'

function load(): Record<string, PlayerTag> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

export function usePlayerTags() {
  const [tags, setTags] = useState<Record<string, PlayerTag>>(load)

  const setTag = useCallback((playerKey: string, tag: PlayerTag | null) => {
    setTags(prev => {
      const next = { ...prev }
      if (tag === null) delete next[playerKey]
      else next[playerKey] = tag
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getTag = useCallback((playerKey: string): PlayerTag | null => {
    return tags[playerKey] ?? null
  }, [tags])

  const cycleTag = useCallback((playerKey: string) => {
    const order: (PlayerTag | null)[] = [null, 'target', 'star', 'avoid']
    const current = tags[playerKey] ?? null
    const idx = order.indexOf(current)
    const next = order[(idx + 1) % order.length]
    setTag(playerKey, next)
  }, [tags, setTag])

  return { tags, setTag, getTag, cycleTag }
}
