'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AuctionPhase } from '@/lib/types'
import { DEFAULT_TIMER_CONFIG } from '@/components/SettingsModal'
import type { TimerConfig } from '@/components/SettingsModal'

// ─── Speech ──────────────────────────────────────────────────────────────────
let cachedVoice: SpeechSynthesisVoice | null = null

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  cachedVoice = voices.find(v => v.name === 'Samantha') ??
    voices.find(v => v.name === 'Victoria') ??
    voices.find(v => v.name === 'Karen') ??
    voices.find(v => v.name === 'Moira') ??
    voices.find(v => v.name === 'Microsoft Zira Desktop') ??
    voices.find(v => v.lang === 'en-US' && v.localService) ??
    voices.find(v => v.lang.startsWith('en')) ?? null
  return cachedVoice
}

// Pre-load voices as soon as they are available
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getVoice() }
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate   = 0.78
  utt.pitch  = 0.5
  utt.volume = 1.0
  const v = getVoice()
  if (v) utt.voice = v
  window.speechSynthesis.speak(utt)
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

    if (p === 'going_once')  speak('Going once')
    if (p === 'going_twice') speak('Going twice')

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
          speak('Sold!')
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
