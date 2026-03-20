'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AuctionPhase } from '@/lib/types'
import { DEFAULT_TIMER_CONFIG } from '@/components/SettingsModal'
import type { TimerConfig } from '@/components/SettingsModal'

// ─── Speech ──────────────────────────────────────────────────────────────────
function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate  = 0.95
  utt.pitch = 1.0
  utt.volume = 1.0
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    /daniel|alex|arthur|fred|junior|thomas/i.test(v.name)
  ) ?? voices.find(v => v.lang === 'en-US') ?? null
  if (preferred) utt.voice = preferred
  window.speechSynthesis.speak(utt)
}

export function useAuctionTimer(config: TimerConfig = DEFAULT_TIMER_CONFIG) {
  const [phase, setPhase] = useState<AuctionPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const configRef = useRef(config)
  configRef.current = config  // always up to date without re-creating callbacks

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPhase = useCallback((p: 'bidding' | 'going_once' | 'going_twice') => {
    clearTimer()
    const cfg = configRef.current
    const dur = p === 'bidding'     ? cfg.bidding
              : p === 'going_once'  ? cfg.going_once
              :                       cfg.going_twice

    setPhase(p)
    setSecondsLeft(dur)

    if (p === 'going_once')  speak('Going once')
    if (p === 'going_twice') speak('Going twice')

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          setPhase(cur => {
            if (cur === 'bidding')     return 'going_once'
            if (cur === 'going_once')  return 'going_twice'
            if (cur === 'going_twice') {
              speak('Sold!')
              return 'sold'
            }
            return cur
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  const prevPhaseRef = useRef<AuctionPhase>('idle')
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase
    if (
      (phase === 'going_once'  && prev === 'bidding'    && intervalRef.current === null) ||
      (phase === 'going_twice' && prev === 'going_once' && intervalRef.current === null)
    ) {
      startPhase(phase as 'going_once' | 'going_twice')
    }
  }, [phase, startPhase])

  const launchBid = useCallback(() => startPhase('bidding'), [startPhase])

  const resetBid = useCallback(() => {
    window.speechSynthesis?.cancel()
    // Reset to bid_reset duration, stay in bidding phase
    clearTimer()
    const dur = configRef.current.bid_reset
    setPhase('bidding')
    setSecondsLeft(dur)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          setPhase('going_once')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

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
