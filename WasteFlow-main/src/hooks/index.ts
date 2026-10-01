import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly interpolates toward a target value — used by every data readout so
 * numbers feel measured rather than switched.
 */
export function useAnimatedNumber(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target)
  const fromRef = useRef(enabled ? 0 : target)
  const startRef = useRef(0)
  const rafRef = useRef(0)
  const currentRef = useRef(value)

  useEffect(() => {
    if (!enabled) {
      currentRef.current = target
      setValue(target)
      return
    }
    fromRef.current = currentRef.current
    startRef.current = performance.now()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      currentRef.current = target
      setValue(target)
      return
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = fromRef.current + (target - fromRef.current) * eased
      currentRef.current = next
      setValue(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, enabled])

  return value
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = () => setMatches(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

/** Live UTC clock — the twin always shows system time. */
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

/** Sequential reveal timings for staggered entrances. */
export function useMounted(delay = 0) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), delay)
    return () => window.clearTimeout(id)
  }, [delay])
  return mounted
}
