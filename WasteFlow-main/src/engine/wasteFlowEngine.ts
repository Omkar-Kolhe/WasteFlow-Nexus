import type { FlowTier, Route, RouteStatus } from '@/types'
import {
  EMISSION_FACTORS,
  FLOW_TIERS,
  PARTICLE_MODEL,
  ROUTE_STATUS_THRESHOLDS,
} from '@/config/network'

/**
 * WASTE FLOW CALCULATIONS
 *
 * Pure functions over the route records — no JSX, no canvas, no React. Every
 * visual encoding in the twin (particle density, speed, colour, congestion
 * treatment) resolves through this module, which is why the animation can never
 * drift away from the data.
 *
 * Phase 3 replaces `deriveRouteFlow` with the flow engine's output and the
 * renderer keeps working unchanged.
 */

export interface RouteFlow {
  route: Route
  /** volume ÷ corridor capacity, 0..n. */
  loadFactor: number
  utilizationPct: number
  status: RouteStatus
  tier: FlowTier
  /** kg CO₂e/day for this leg, from the assigned fleet's drivetrain mix. */
  emissionsKg: number
  /** Emission factor actually applied, kg CO₂e per tonne-km. */
  emissionFactor: number
  /** Particle count for this link, from tonnage. */
  particles: number
  /** 0..1 — tonnage relative to the busiest link. */
  magnitude: number
}

/** Fuel-mix weighted emission factor for a corridor, kg CO₂e per tonne-km. */
export function routeEmissionFactor(route: Route): number {
  let factor = 0
  let weight = 0
  for (const [fuel, share] of Object.entries(route.fuelMix)) {
    const f = EMISSION_FACTORS.transport[fuel]
    if (f === undefined) continue
    factor += f * share
    weight += share
  }
  return weight > 0 ? factor / weight : EMISSION_FACTORS.transport.diesel
}

/**
 * Route state from load factor, with an explicit operational override allowed
 * (a closed corridor is blocked regardless of how little tonnage it carries).
 */
export function routeStatus(route: Route, utilizationPct: number): RouteStatus {
  if (route.status === 'blocked') return 'blocked'
  if (utilizationPct >= ROUTE_STATUS_THRESHOLDS.blocked) return 'blocked'
  if (utilizationPct >= ROUTE_STATUS_THRESHOLDS.congested) return 'congested'
  if (utilizationPct >= ROUTE_STATUS_THRESHOLDS.busy) return 'busy'
  return 'normal'
}

/** Flow tier relative to the busiest link, so the language scales with the city. */
export function flowTier(volumeT: number, maxVolumeT: number): FlowTier {
  const share = maxVolumeT > 0 ? volumeT / maxVolumeT : 0
  if (share >= FLOW_TIERS.high) return 'high'
  if (share >= FLOW_TIERS.medium) return 'medium'
  return 'low'
}

/** Particle count for a link: density is the primary quantity encoding. */
export function particleCount(volumeT: number): number {
  return Math.max(
    PARTICLE_MODEL.minParticles,
    Math.min(PARTICLE_MODEL.maxParticles, Math.round(volumeT / PARTICLE_MODEL.tonnesPerParticle)),
  )
}

export function deriveRouteFlow(route: Route, maxVolumeT: number): RouteFlow {
  const utilizationPct = route.capacityT > 0 ? (route.volumeT / route.capacityT) * 100 : 0
  const emissionFactor = routeEmissionFactor(route)
  return {
    route,
    loadFactor: utilizationPct / 100,
    utilizationPct,
    status: routeStatus(route, utilizationPct),
    tier: flowTier(route.volumeT, maxVolumeT),
    emissionsKg: route.volumeT * route.distanceKm * emissionFactor,
    emissionFactor,
    particles: particleCount(route.volumeT),
    magnitude: maxVolumeT > 0 ? route.volumeT / maxVolumeT : 0,
  }
}

/** All route flows, plus the normalisation basis the network uses everywhere. */
export function buildFlowModel(routes: Route[]) {
  const maxVolumeT = routes.reduce((m, r) => Math.max(m, r.volumeT), 0)
  const flows = routes.map((r) => deriveRouteFlow(r, maxVolumeT))
  const byId: Record<string, RouteFlow> = {}
  for (const f of flows) byId[f.route.id] = f
  const totalTonneKm = routes.reduce((s, r) => s + r.volumeT * r.distanceKm, 0)
  const totalEmissionsKg = flows.reduce((s, f) => s + f.emissionsKg, 0)
  const maxEmissionsKg = flows.reduce((m, f) => Math.max(m, f.emissionsKg), 0)
  const maxUtilization = flows.reduce((m, f) => Math.max(m, f.utilizationPct), 0)
  return { flows, byId, maxVolumeT, maxEmissionsKg, totalTonneKm, totalEmissionsKg, maxUtilization }
}

export type FlowModel = ReturnType<typeof buildFlowModel>

/** Tonnes/day entering and leaving each node, straight from the route set. */
export function buildFlowIndex(routes: Route[]) {
  const inbound: Record<string, string[]> = {}
  const outbound: Record<string, string[]> = {}
  for (const r of routes) {
    ;(inbound[r.to] ||= []).push(r.id)
    ;(outbound[r.from] ||= []).push(r.id)
  }
  return { inbound, outbound }
}

/**
 * Collection performance for a zone, from its collection profile.
 * Kept here (not in the component) so Phase 3 can swap in live weighbridge
 * data and the panel picks it up automatically.
 */
export function collectionSummary(profile: NonNullable<import('@/types').Facility['collection']>) {
  return {
    generatedT: profile.generatedT,
    collectedT: profile.collectedT,
    uncollectedT: profile.uncollectedT,
    collectionRatePct: profile.collectionRate * 100,
    uncollectedPct: (1 - profile.collectionRate) * 100,
    frequency: profile.frequency,
    routeLengthMin: profile.routeLengthMin,
    /** Vehicles assigned to the zone's collection round. */
    vehicleCount: profile.vehicleCount,
    /** Rated payload of the zone's assigned units, tonnes. */
    avgVehicleCapacityT: profile.avgVehicleCapacityT,
    /** Tonnes per assigned vehicle per day. */
    perVehicleT: profile.vehicleCount > 0 ? profile.collectedT / profile.vehicleCount : 0,
    /** Load carried per vehicle against its rated capacity, averaged over the round. */
    fleetFillPct:
      profile.vehicleCount > 0 && profile.avgVehicleCapacityT > 0
        ? (profile.collectedT / (profile.vehicleCount * profile.avgVehicleCapacityT)) * 100
        : 0,
  }
}
