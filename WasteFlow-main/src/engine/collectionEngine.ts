import type { Facility, Vehicle } from '@/types'
import { COLLECTION_MODEL, TRANSPORT_MODEL } from '@/config/network'
import { mixWeightedFactor, tripsFor } from './primitives'
import type { CollectionResult, EngineInput } from './types'

/**
 * COLLECTION ENGINE — ward-level service model.
 *
 * Derives each zone's ledger from its collection profile and, unlike the
 * Phase 2 presentation layer, also reports *where the waste is*: tonnage whose
 * outbound corridor is blocked is held at the zone, visible in the ledger and
 * ready for Phase 4 root-cause analysis.
 */

/** Payload a zone's fleet lifts per trip, tonnes (spec §4: avg 12 t). */
export function zonePayloadT(zone: Facility): number {
  return zone.collection?.avgVehicleCapacityT ?? TRANSPORT_MODEL.defaultPayloadT
}

export function runCollectionEngine(input: EngineInput): Record<string, CollectionResult> {
  const results: Record<string, CollectionResult> = {}

  for (const zone of input.facilities) {
    if (zone.kind !== 'zone' || !zone.collection) continue
    const profile = zone.collection
    const uncollectedT = Math.max(0, profile.generatedT - profile.collectedT)

    // The zone's outgoing corridor carries exactly the collected tonnage.
    const outbound = input.routes.filter((r) => r.from === zone.id)
    const activeOutT = outbound
      .filter((r) => r.status !== 'blocked')
      .reduce((s, r) => s + r.volumeT, 0)
    const scheduledOutT = outbound.reduce((s, r) => s + r.volumeT, 0)
    const heldAtZoneT = Math.max(0, scheduledOutT - activeOutT)

    const payloadT = zonePayloadT(zone)
    const tripsPerDay = tripsFor(profile.collectedT, payloadT)

    const litersPerKm =
      mixWeightedFactor(
        COLLECTION_MODEL.fuelMix,
        (key) => TRANSPORT_MODEL.litersPerKm[key],
        TRANSPORT_MODEL.litersPerKm.diesel ?? 0,
      ) ?? 0

    const fuelLiters =
      tripsPerDay * COLLECTION_MODEL.avgTripKm * COLLECTION_MODEL.deadheadFactor * 2 * litersPerKm

    results[zone.id] = {
      zoneId: zone.id,
      generatedT: profile.generatedT,
      collectedT: profile.collectedT,
      uncollectedT,
      collectionRatePct: profile.generatedT > 0 ? (profile.collectedT / profile.generatedT) * 100 : 0,
      tripsPerDay,
      fuelLiters,
      heldAtZoneT,
    }
  }

  return results
}

/** Number of collection vehicles that are actively servicing a zone right now. */
export function activeVehiclesInZone(zoneId: string, all: Vehicle[]): number {
  return all.filter((v) => v.zoneId === zoneId && v.status !== 'returning').length
}

/** The engine reads payloads from the zone profile; kept for fleet-plan consumers. */
export function zoneFleetPlan(zone: Facility): { vehicles: number; payloadT: number } {
  return {
    vehicles: zone.collection?.vehicleCount ?? 0,
    payloadT: zonePayloadT(zone),
  }
}
