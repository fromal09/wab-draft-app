'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AuctionPhase } from '@/lib/types'
import { DEFAULT_TIMER_CONFIG } from '@/components/SettingsModal'
import type { TimerConfig } from '@/components/SettingsModal'

// ─── Speech ──────────────────────────────────────────────────────────────────
function playAudio(file: string) {
  if (typeof window === 'undefined') return
  const audio = new Audio(file)
  audio.play().catch(() => {})
}

export function useAuctionTimer(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
  const [phase, setPhase] = useState<AuctionPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Self-contained: each phase chains to the next directly
  const runPhase = useCallback((p: 'bidding' | 'going_once' | 'going_twice', dur: number) => {
    clearTimer()
    setPhase(p)
    setSecondsLeft(dur)

    if (p === 'going_once')  playAudio('/audio/going-once.mp3')
    if (p === 'going_twice') playAudio('/audio/going-twice.mp3')

    let remaining = dur
    intervalRef.current = setInterval(() => {
      remaining -= 1
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearTimer()
        if (p === 'bidding') {
          runPhase('going_once', configRef.current.going_once)
        } else if (p === 'going_once') {
          runPhase('going_twice', configRef.current.going_twice)
        } else if (p === 'going_twice') {
          playAudio('/audio/sold.mp3')
          setPhase('sold')
        }
      }
    }, 1000)
  }, [clearTimer])

  const launchBid = useCallback(() => {
    runPhase('bidding', configRef.current.bidding)
  }, [runPhase])

  const resetBid = useCallback(() => {
    window.speechSynthesis?.cancel()
    runPhase('bidding', configRef.current.bid_reset)
  }, [runPhase])

  const forceLogging = useCallback(() => {
    clearTimer()
    setPhase('logging')
    setSecondsLeft(0)
  }, [clearTimer])

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel()
    clearTimer()
    setPhase('idle')
    setSecondsLeft(0)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const totalDur = phase === 'bidding'     ? config.bidding
                 : phase === 'going_once'  ? config.going_once
                 : phase === 'going_twice' ? config.going_twice
                 : 1
  const progress = phase === 'idle' || phase === 'sold' || phase === 'logging'
    ? 0
    : (secondsLeft / totalDur) * 100

  return { phase, secondsLeft, progress, launchBid, resetBid, forceLogging, reset }
}
