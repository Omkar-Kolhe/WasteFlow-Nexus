import { TRANSPORT_MODEL } from '@/config/network'
import { fuelLiters, mixWeightedFactor, tripsFor } from './primitives'
import type { EngineInput, TransportResult } from './types'

/**
 * TRANSPORT ENGINE — corridor economics.
 *
 * Converts scheduled tonnage into trips, distance and diesel-equivalent litres.
 * The corridor's payload comes from the label (collection hauls use the city's
 * 12 t compactor; bulk transfers use the heavier default). Blocked corridors
 * still report their scheduled demand — with `heldT` carrying the tonnage that
 * is not moving — so the ledger accounts for the disruption instead of hiding it.
 *
 * Fuel is mix-weighted: each corridor's assigned drivetrain share applies its
 * own litres/km, so an electric shuttle corridor demonstrably burns less.
 */

/** Payload assigned to one trip on a corridor, tonnes. */
export function routePayloadT(route: { label: string }): number {
  return TRANSPORT_MODEL.payloadT[route.label] ?? TRANSPORT_MODEL.defaultPayloadT
}

/** Litres diesel-equivalent per km for a corridor's assigned fleet. */
export function routeLitersPerKm(route: { fuelMix: Record<string, number> }): number {
  return mixWeightedFactor(
    route.fuelMix,
    (key) => TRANSPORT_MODEL.litersPerKm[key],
    TRANSPORT_MODEL.litersPerKm.diesel ?? 0,
  )
}

export function runTransportEngine(input: EngineInput): Record<string, TransportResult> {
  const results: Record<string, TransportResult> = {}

  for (const route of input.routes) {
    const payloadT = routePayloadT(volumeAdapter(route))
    const tripsPerDay = tripsFor(route.volumeT, payloadT)
    const blocked = route.status === 'blocked'

    const fuelLitersPerDay = blocked
      ? 0
      : fuelLiters(route.distanceKm * TRANSPORT_MODEL.deadheadFactor, tripsPerDay, routeLitersPerKm(route))

    results[route.id] = {
      routeId: route.id,
      volumeT: route.volumeT,
      tripsPerDay,
      payloadT,
      fuelLiters: fuelLitersPerDay,
      heldT: blocked ? route.volumeT : 0,
    }
  }

  return results
}

/** The payload model keys off the corridor label; routes satisfy it directly. */
function volumeAdapter(route: { label: string }): { label: string } {
  return { label: route.label }
}
