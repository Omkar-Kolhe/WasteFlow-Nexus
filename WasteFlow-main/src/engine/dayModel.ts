import { buildDailyLedger, TODAY_INDEX } from './metricsEngine'
import type { CityTotals, DayLedgerEntry, EngineInput } from './types'

/**
 * DAY MODEL (§19) — the 7-day ledger seam.
 *
 * `buildDailyLedger` lives with the metrics engine because it re-runs the
 * facility and transport engines at each day's scaled demand; this module is
 * the named API surface the UI (and Phase 5 forecasts) import.
 */
export { buildDailyLedger, TODAY_INDEX }

export function dayLedger(base: CityTotals, input: EngineInput): DayLedgerEntry[] {
  return buildDailyLedger(base, input)
}
