/**
 * CALCULATION PRIMITIVES — the reusable core of the Phase 3 engine.
 *
 * Pure, total functions over numbers and records. Every engine module
 * (collection, transport, facility, waste-flow, environmental, metrics) composes
 * these, so business rules exist exactly once and the spec's validation cases
 * (§20) test them directly. Nothing here imports React, data or config.
 */

/* ── Backlog (spec cases 1 & 2) ───────────────────────────── */

/** Tonnes that cannot be processed today: max(0, input − capacity). */
export function backlogOf(inputT: number, capacityT: number): number {
  return Math.max(0, inputT - capacityT)
}

/** Tonnes actually processed today: min(input, capacity). */
export function processedOf(inputT: number, capacityT: number): number {
  return Math.min(inputT, capacityT)
}

/* ── Trips (spec case 3) ──────────────────────────────────── */

/**
 * Vehicle trips needed to move `tonnesT` with `payloadT` per trip.
 * Round up — a part-load trip is still a trip.
 */
export function tripsFor(tonnesT: number, payloadT: number): number {
  if (tonnesT <= 0 || payloadT <= 0) return 0
  return Math.ceil(tonnesT / payloadT)
}

/* ── Fuel (transport engine input) ────────────────────────── */

/**
 * Litres diesel-equivalent burned by `trips` return trips of `distanceKm`
 * at `litersPerKm`. The engine multiplies distance by a deadhead factor
 * before calling this, so the overhead rule lives in one place per engine.
 */
export function fuelLiters(distanceKm: number, trips: number, litersPerKm: number): number {
  return distanceKm * 2 * trips * litersPerKm
}

/* ── Recovery (spec case 4) ───────────────────────────────── */

/** Recovery rate, percent: recovered ÷ input. Returns 0 for empty input. */
export function recoveryRatePct(processedT: number, recoveredT: number): number {
  if (processedT <= 0) return 0
  return (recoveredT / processedT) * 100
}

/* ── Utilization (spec case 5) ────────────────────────────── */

/** Utilization, percent: input ÷ capacity. Returns 0 for zero capacity. */
export function utilizationPct(inputT: number, capacityT: number): number {
  if (capacityT <= 0) return 0
  return (inputT / capacityT) * 100
}

/** Load factor, 0..1 — the corridor-level twin of `utilizationPct`. */
export function loadFactor(volumeT: number, capacityT: number): number {
  if (capacityT <= 0) return 0
  return volumeT / capacityT
}

/* ── Mass balance ─────────────────────────────────────────── */

/**
 * Mass-balance check for one node: inflow must equal outflow plus delta stock.
 * Returns the residual in tonnes (positive = accumulating, negative = deficit).
 */
export function massResidualT(inflowT: number, outflowT: number): number {
  return inflowT - outflowT
}

/** Clamp a share so it is a valid 0..1 fraction (tolerates float drift). */
export function clampShare(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Sum the shares of a fuel/substream mix record. */
export function mixTotal(mix: Record<string, number>): number {
  let total = 0
  for (const key in mix) total += mix[key]
  return total
}

/** Weighted mean of a factor over a mix record; falls back when the mix is empty. */
export function mixWeightedFactor(
  mix: Record<string, number>,
  factorOf: (key: string) => number | undefined,
  fallback: number,
): number {
  let weighted = 0
  let weight = 0
  for (const key in mix) {
    const f = factorOf(key)
    if (f === undefined) continue
    weighted += f * mix[key]
    weight += mix[key]
  }
  return weight > 0 ? weighted / weight : fallback
}
