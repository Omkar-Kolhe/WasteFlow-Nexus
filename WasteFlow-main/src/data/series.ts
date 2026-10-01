import { hashString, seeded } from '@/lib/utils'

/**
 * Deterministic mock telemetry traces.
 * Phase 3 replaces these with recorded history from the time-series store; the
 * shape (plain number[]) is what the chart components consume.
 */
export function dailySeries(seed: string, base: number, points = 24, volatility = 0.09): number[] {
  const rand = seeded(hashString(seed))
  const out: number[] = []
  for (let i = 0; i < points; i++) {
    // Two-peak municipal curve: morning and evening collection tides.
    const tide = Math.sin((i / points) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5
    const wobble = (rand() - 0.5) * 2 * volatility
    out.push(base * (0.72 + tide * 0.5 + wobble))
  }
  return out
}

export function seriesDelta(series: number[]): number {
  if (series.length < 2) return 0
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  if (!prev) return 0
  return ((last - prev) / prev) * 100
}
