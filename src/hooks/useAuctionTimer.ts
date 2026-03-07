'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AuctionPhase } from '@/lib/types'

const PHASE_DURATIONS: Record<string, number> = {
  bidding:     15,
  going_once:   8,
  going_twice:  4,
}

export function useAuctionTimer() {
  const [phase, setPhase] = useState<AuctionPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Core: start a named phase, run its countdown, then advance
  const startPhase = useCallback((p: 'bidding' | 'going_once' | 'going_twice') => {
    clearTimer()
    const dur = PHASE_DURATIONS[p]
    setPhase(p)
    setSecondsLeft(dur)

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          // Determine next phase without depending on state
          setPhase(cur => {
            if (cur === 'bidding')     return 'going_once'
            if (cur === 'going_once')  return 'going_twice'
            if (cur === 'going_twice') return 'sold'
            return cur
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  // When phase naturally advances to going_once / going_twice, kick off the sub-timer.
  // Use a ref flag to avoid re-triggering after startPhase itself sets the phase.
  const prevPhaseRef = useRef<AuctionPhase>('idle')
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase
    // Only auto-start if this phase was set by the *timer expiring*, not by startPhase
    // We detect that by checking: if prev was the preceding phase AND interval is null
    if (
      (phase === 'going_once'  && prev === 'bidding'     && intervalRef.current === null) ||
      (phase === 'going_twice' && prev === 'going_once'  && intervalRef.current === null)
    ) {
      startPhase(phase as 'going_once' | 'going_twice')
    }
  }, [phase, startPhase])

  const launchBid = useCallback(() => startPhase('bidding'), [startPhase])

  // BID pressed — always restart at full 15s
  const resetBid = useCallback(() => startPhase('bidding'), [startPhase])

  const forceLogging = useCallback(() => {
    clearTimer()
    setPhase('logging')
    setSecondsLeft(0)
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setPhase('idle')
    setSecondsLeft(0)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const totalDur = PHASE_DURATIONS[phase] ?? 1
  const progress = phase === 'idle' || phase === 'sold' || phase === 'logging'
    ? 0
    : (secondsLeft / totalDur) * 100

  return { phase, secondsLeft, progress, launchBid, resetBid, forceLogging, reset }
}
