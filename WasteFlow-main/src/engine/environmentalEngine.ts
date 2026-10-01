import { EMISSION_FACTORS } from '@/config/network'
import { mixWeightedFactor } from './primitives'
import type { EngineInput, EnvironmentalResult } from './types'

/**
 * ENVIRONMENTAL ENGINE — the impact ledger.
 *
 * Haulage emissions come from each corridor's assigned drivetrain mix applied
 * to its tonne-kilometres; facility emissions are fixed footprints by kind with
 * named credits (biogas export). Fuel accounting is consolidated in the
 * metrics engine, which sees the collection and transport results together.
 */

/** kg CO₂e per tonne-kilometre for a corridor, from its drivetrain mix. */
export function transportRouteEmissionFactor(
  route: { fuelMix: Record<string, number> },
  fallback = EMISSION_FACTORS.transport.diesel,
): number {
  return mixWeightedFactor(route.fuelMix, (key) => EMISSION_FACTORS.transport[key], fallback)
}

/** kg CO₂e per day for one corridor. */
export function routeEmissionsKg(route: {
  volumeT: number
  distanceKm: number
  fuelMix: Record<string, number>
}): number {
  return route.volumeT * route.distanceKm * transportRouteEmissionFactor(route)
}

/** Fixed daily footprint of a facility by kind, minus named credits. */
export function facilityEmissionsKg(facility: { kind: string; id: string }): number {
  return (
    (EMISSION_FACTORS.facilityByKind[facility.kind as keyof typeof EMISSION_FACTORS.facilityByKind] ?? 0) +
    (EMISSION_FACTORS.facilityCredits[facility.id] ?? 0)
  )
}

export function runEnvironmentalEngine(input: EngineInput): EnvironmentalResult {
  let transportCo2eKg = 0
  let tonneKm = 0

  for (const route of input.routes) {
    if (route.status === 'blocked') continue
    transportCo2eKg += routeEmissionsKg(route)
    tonneKm += route.volumeT * route.distanceKm
  }

  let facilityCo2eKg = 0
  for (const facility of input.facilities) {
    facilityCo2eKg +=
      (EMISSION_FACTORS.facilityByKind[facility.kind] ?? 0) + (EMISSION_FACTORS.facilityCredits[facility.id] ?? 0)
  }

  return {
    transportCo2eKg,
    facilityCo2eKg,
    totalCo2eKg: transportCo2eKg + facilityCo2eKg,
    fuelLiters: 0, // consolidated in metricsEngine, which sees every engine's output
    tonneKm,
  }
}
