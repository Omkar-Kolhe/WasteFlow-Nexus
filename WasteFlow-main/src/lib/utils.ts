/**
 * Small shared helpers. Deliberately dependency-free.
 */

export type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean>

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const walk = (value: ClassValue) => {
    if (!value) return
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value))
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    for (const key in value) if (value[key]) out.push(key)
  }
  inputs.forEach(walk)
  return out.join(' ')
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Exponential smoothing that is frame-rate independent.
 * The blend factor is clamped to 0..1 so a bad dt can never overshoot.
 */
export const damp = (current: number, target: number, smoothing: number, dt: number) => {
  const t = 1 - Math.pow(smoothing, Math.max(0, dt) * 60)
  return lerp(current, target, Math.min(1, Math.max(0, t)))
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Deterministic pseudo-random so the procedural cityscape is stable across frames. */
export function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const round = (value: number, digits = 0) => {
  const f = Math.pow(10, digits)
  return Math.round(value * f) / f
}
