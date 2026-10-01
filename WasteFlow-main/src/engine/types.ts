import type { Facility, Route, Vehicle } from '@/types'

/**
 * ENGINE CONTRACTS — the output vocabulary Phase 4–7 consume.
 *
 * §23 of the Phase 3 spec fixes these names: facility utilization/backlog,
 * route utilization, vehicle utilization, waiting time, processing capacity,
 * incoming/processed/recovered/landfill waste, fuel and CO₂e. Detection,
 * prediction, simulation and optimisation all read this tree; none of them
 * re-derive it.
 */

/** Minimal input the engine needs. `TwinSnapshot` satisfies this directly. */
export interface EngineInput {
  facilities: Facility[]
  routes: Route[]
  vehicles: Vehicle[]
}

/* ── Collection engine ────────────────────────────────────── */

export interface CollectionResult {
  zoneId: string
  /** Tonnes generated per day by the zone. */
  generatedT: number
  /** Tonnes collected and handed to the transfer network. */
  collectedT: number
  /** generated − collected: the service gap. */
  uncollectedT: number
  /** collected ÷ generated, percent. */
  collectionRatePct: number
  /** Collection trips per day (collected tonnage ÷ vehicle payload, rounded up). */
  tripsPerDay: number
  /** Litres diesel-equivalent burned by the collection rounds. */
  fuelLiters: number
  /**
   * Tonnes collected but not moving: the corridor out of the zone is blocked.
   * This waste exists, is on the ledger, and never reaches a transfer station.
   */
  heldAtZoneT: number
}

/* ── Transport engine ─────────────────────────────────────── */

export interface TransportResult {
  routeId: string
  /** Volume carried per day, tonnes (scheduled demand — includes blocked legs). */
  volumeT: number
  /** Return trips per day needed to move the volume at the corridor's payload. */
  tripsPerDay: number
  /** Payload assumed per trip, tonnes. */
  payloadT: number
  /** Litres diesel-equivalent per day, including deadheading. */
  fuelLiters: number
  /** Tonnes held at the origin because the corridor is blocked. */
  heldT: number
}

/* ── Facility engine ──────────────────────────────────────── */

export interface FacilityResult {
  facilityId: string
  /** Tonnes/day scheduled into the node = Σ inbound route volumes. */
  incomingT: number
  /** Tonnes/day the node can actually process today. */
  processedT: number
  /** Tonnes/day above capacity — waste accumulating at the node. */
  backlogT: number
  /** incoming ÷ capacity, percent. */
  utilizationPct: number
  /** True when demand exceeds rated capacity (spec §17 "OVER CAPACITY"). */
  overCapacity: boolean
  /** Tonnes/day routed onward to downstream nodes. */
  outgoingT: number
  /** Tonnes/day leaving the network as certified product (recovery only). */
  productExitT: number
  /** Tonnes/day terminally disposed (landfill sinks). */
  disposedT: number
  /** Moisture/trim loss: processed tonnage no route accounts for. */
  processLossT: number
  /** Zone tonnage stranded by a blocked outbound corridor (accumulation). */
  heldAtSourceT: number
  /** Tonnes/day drawn from on-site stock so scheduled corridors still run. */
  stockDrawnT: number
  /** Queue time, minutes (from the facility record). */
  waitingMin: number
  /** Rated processing capacity, tonnes/day. */
  processingCapacityT: number
  /** Mass-balance audit: incoming − (outgoing + productExit), tonnes. */
  massResidualT: number
}

/* ── Environmental engine ─────────────────────────────────── */

export interface EnvironmentalResult {
  /** Haulage emissions, kg CO₂e/day. */
  transportCo2eKg: number
  /** Fixed processing footprints minus credits, kg CO₂e/day. */
  facilityCo2eKg: number
  totalCo2eKg: number
  /** Diesel-equivalent litres/day across collection + transfer fleets. */
  fuelLiters: number
  /** Tonne-kilometres hauled per day. */
  tonneKm: number
}

/* ── City rollup (metrics engine) ─────────────────────────── */

export interface CityTotals {
  /** Collected and routed into the network today. */
  collectedTodayT: number
  generatedTodayT: number
  uncollectedTodayT: number
  /** Σ min(intake, capacity) over infrastructure nodes. */
  processedTodayT: number
  /** Collected tonnage that did not reach landfill. */
  recoveredTodayT: number
  landfillTodayT: number
  /** Σ backlog over infrastructure nodes. */
  backlogTodayT: number
  /** Transfer-corridor trips per day (collection trips reported separately). */
  tripsToday: number
  collectionTripsToday: number
  fuelLiters: number
  /** Of which collection rounds. */
  collectionFuelLiters: number
  /** Of which transfer corridors. */
  transferFuelLiters: number
  co2eKg: number
  transportCo2eKg: number
  facilityCo2eKg: number
  tonneKm: number
  activeVehicles: number
  fleetSize: number
  trackedVehicles: number
  meanQueueMin: number
  recoveryRatePct: number
  landfillLoadPct: number
  systemUtilizationPct: number
}

export interface EngineResult {
  collection: Record<string, CollectionResult>
  facility: Record<string, FacilityResult>
  transport: Record<string, TransportResult>
  environmental: EnvironmentalResult
  city: CityTotals
}

/* ── Daily ledger (§19) ───────────────────────────────────── */

/** One day of the deterministic 7-day ledger. */
export interface DayLedgerEntry {
  /** 1-based day index; day 7 is the recorded "today". */
  day: number
  label: string
  wasteGeneratedT: number
  wasteCollectedT: number
  wasteProcessedT: number
  wasteRecoveredT: number
  wasteLandfillT: number
  backlogT: number
  trips: number
  fuelLiters: number
  co2eKg: number
}

/* ── Validation (§20) ─────────────────────────────────────── */

export interface ValidationCase {
  id: string
  name: string
  expected: number
  actual: number
  unit: string
  passed: boolean
}

export interface ValidationReport {
  passed: boolean
  cases: ValidationCase[]
  /** Largest |mass residual| across nodes, tonnes — must be ~0. */
  maxMassResidualT: number
}
