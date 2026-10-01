/**
 * Domain types for the WasteFlow Nexus digital twin.
 *
 * Phase 2 renders a Mumbai demo network from static mock data. The shapes below
 * are the contract later phases bind to: a telemetry adapter produces the same
 * `TwinSnapshot`, and the existing detection/simulation code can then read
 * `derived` state without touching a single renderer.
 */

export type FacilityKind = 'zone' | 'transfer' | 'sorting' | 'processing' | 'recovery' | 'landfill'

/** Utilisation-driven node state — the twin's traffic-light vocabulary. */
export type NodeState = 'normal' | 'warning' | 'critical'

/** Operational state of a link in the network. */
export type RouteStatus = 'normal' | 'busy' | 'congested' | 'blocked'

/** Visual quantity band for a link, relative to the busiest link. */
export type FlowTier = 'low' | 'medium' | 'high'

export type VehicleStatus = 'collecting' | 'en-route' | 'waiting' | 'at-facility' | 'returning'

export type VehicleKind = 'compactor' | 'rear-loader' | 'roll-off' | 'transfer-hauler' | 'tipper'

export type SubstreamId = 'residual' | 'organic' | 'recyclable' | 'commercial'

export type SystemState = 'optimal' | 'warning' | 'critical'

export interface Vec2 {
  x: number
  y: number
}

export interface SubstreamMeta {
  id: SubstreamId
  label: string
  color: string
}

/** A single waste generation point inside a collection zone. */
export interface GenerationPoint {
  id: string
  /** Zone the point belongs to. */
  parentId: string
  label: string
  /** Fraction of the zone's daily tonnage handled by this point. */
  share: number
  /** Offset from the zone anchor, in world units. */
  offset: Vec2
  substream: SubstreamId
}

/**
 * A node in the network. Collection zones and process facilities share the same
 * node shape because the twin renders, hit-tests and routes them identically —
 * kind-specific fields live in the optional collections below.
 */
export interface Facility {
  id: string
  code: string
  name: string
  shortName: string
  kind: FacilityKind
  /** World-space anchor used by the renderer and camera focus. */
  position: Vec2
  /** Tonnes per day entering the node. */
  input: number
  /** Tonnes per day leaving the node. */
  output: number
  /** Rated daily capacity, tonnes. */
  capacity: number
  /** Queue time in minutes. */
  waiting: number
  /** Mean processing/handling time in minutes. */
  processingTimeMin: number
  /** Metres above the city datum (used by the camera's focus elevation cue). */
  elevation: number
  /** Waste mix handled here, keyed by substream. */
  mix: Partial<Record<SubstreamId, number>>
  crew: number
  uptimePct: number
  commissioned: string
  note: string
  /** Phase 3+ hooks surfaced in the panel as "pending". */
  tags: string[]
  /** Collection-zone payload. Present only when `kind === 'zone'`. */
  collection?: CollectionProfile
  /** Real-world geographic coordinates for Leaflet-driven pixel-perfect alignment. */
  latLon?: { lat: number; lon: number }
}

/** Collection-zone specific figures (spec §4). */
export interface CollectionProfile {
  /** Tonnes generated per day by the zone. */
  generatedT: number
  /** Tonnes actually collected per day. */
  collectedT: number
  /** Tonnes left uncollected per day. */
  uncollectedT: number
  /** collected ÷ generated, 0..1. */
  collectionRate: number
  frequency: string
  vehicleCount: number
  avgVehicleCapacityT: number
  /** Round length in minutes. */
  routeLengthMin: number
  /** Dominant street pattern / access constraint note. */
  access: string
}

export interface Route {
  id: string
  from: string
  to: string
  /** Tonnes per day moving along this link. Drives the entire flow encoding. */
  volumeT: number
  /** Kilometres per day travelled for this leg by the whole assigned fleet. */
  distanceKm: number
  /** Mean travel time for one leg, minutes. */
  travelTimeMin: number
  /** Rated daily throughput of the corridor, tonnes/day. */
  capacityT: number
  /** Fleet units assigned to the corridor. */
  vehicleCount: number
  substream: SubstreamId
  /** Commissioned state. `blocked` may be set explicitly (closed corridor). */
  status?: RouteStatus
  /** Drivetrain mix of the assigned fleet, shares summing to 1. */
  fuelMix: Record<string, number>
  label: string
  note?: string
}

export interface Vehicle {
  id: string
  code: string
  kind: VehicleKind
  /** Route the vehicle is currently servicing. */
  routeId: string
  /** Zone the vehicle is currently working. */
  zoneId: string
  /** Node it is heading for (or at). */
  destinationId: string
  status: VehicleStatus
  /** Rated payload, tonnes. */
  capacityT: number
  /** Tonnes on board right now. */
  loadT: number
  /** loadT ÷ capacityT, 0..1. */
  utilization: number
  /** Minutes to destination. */
  etaMin: number
  speedKph: number
  crew: number
  fuel: string
  plate: string
  /** Progress along its route, 0..1, at t=0. */
  phase: number
  /** Screen-space speed multiplier, so the fleet desynchronises naturally. */
  pace: number
}

export interface CityMeta {
  id: string
  name: string
  region: string
  population: number
  areaKm2: number
  households: number
  /** World-space bounds the camera must stay inside. */
  world: { width: number; height: number }
}

export interface TwinSnapshot {
  city: CityMeta
  substreams: SubstreamMeta[]
  /** Zones first, then infrastructure — the order the legend documents. */
  facilities: Facility[]
  generations: GenerationPoint[]
  routes: Route[]
  vehicles: Vehicle[]
}

export type LayerId = 'flow' | 'vehicles' | 'facilities' | 'bottlenecks' | 'emissions'

export interface LayerMeta {
  id: LayerId
  label: string
  description: string
}

export interface MetricDefinition {
  id: string
  label: string
  value: number
  unit: string
  digits: number
  deltaPct: number
  trend: 'up' | 'down' | 'flat'
  /** Lower is better for metrics like landfill load or emissions. */
  polarity: 'higher-better' | 'lower-better' | 'neutral'
  hint: string
}
