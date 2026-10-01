import type { Facility, MetricDefinition, NodeState, Route, SystemState, TwinSnapshot, Vehicle } from '@/types'
import {
  COLLECTION_SERVICE_THRESHOLDS,
  UTILIZATION_THRESHOLDS,
} from '@/config/network'
import { city as cityMeta, substreams } from './city'
import { buildGenerationPoints, zones } from './cityZones'
import { facilities } from './facilities'
import { routes } from './routes'
import { vehicles } from './vehicles'
import { buildFlowIndex, buildFlowModel, collectionSummary, type FlowModel, type RouteFlow } from '@/engine/wasteFlowEngine'
import { facilityEmissionsKg } from '@/engine/environmentalEngine'
import { runEngines } from '@/engine/run'
import { buildDailyLedger, TODAY_INDEX } from '@/engine/metricsEngine'
import { runBottleneckEngine, bottleneckTotals, type Bottleneck } from '@/engine/bottleneckEngine'
import type { DayLedgerEntry, EngineResult } from '@/engine/types'

/**
 * DERIVED MODEL — the calculation seam between data and UI.
 *
 * Every figure the application renders resolves through the Phase 3 engine
 * (`src/engine`): this module composes the engine run with the visualization
 * flow model and exposes the ledger. Nothing here recomputes business rules —
 * utilization, backlog, trips, fuel and CO₂e are all engine outputs, which is
 * what makes the HUD "a working model" rather than decorated numbers. Phase 4+
 * replaces the inputs (telemetry, simulations) and keeps this contract.
 */

/** All network nodes: the eight collection zones first, then infrastructure. */
export const nodes: Facility[] = [...zones, ...facilities]

/**
 * Node state from utilisation.
 * Process facilities use the plant bands (<70 normal, 70–90 warning, >90
 * critical); collection zones use service bands, where the same ratio means
 * "share of generated waste actually collected" and lower is worse.
 */
export function nodeStateFor(kind: Facility['kind'], utilizationPct: number): NodeState {
  if (kind === 'zone') {
    if (utilizationPct < COLLECTION_SERVICE_THRESHOLDS.critical) return 'critical'
    if (utilizationPct < COLLECTION_SERVICE_THRESHOLDS.warning) return 'warning'
    return 'normal'
  }
  if (utilizationPct >= UTILIZATION_THRESHOLDS.critical) return 'critical'
  if (utilizationPct >= UTILIZATION_THRESHOLDS.warning) return 'warning'
  return 'normal'
}

export interface FacilityDerived {
  facility: Facility
  /** Tonnes/day entering (for a zone: tonnes/day collected). Engine-derived. */
  inflow: number
  /** Engine: tonnes/day the node can process (zones: collected tonnage). */
  processedT: number
  /** Engine: tonnes/day accumulating above capacity (zones: service gap). */
  backlogT: number
  /** Engine: demand exceeds rated capacity. */
  overCapacity: boolean
  outflow: number
  /** inflow ÷ capacity, percent — the twin's primary health signal. */
  utilizationPct: number
  state: NodeState
  /** Headroom to rated capacity, tonnes/day (never negative). */
  headroomT: number
  /** Zone tonnage stranded by a blocked outbound corridor (engine). */
  heldAtSourceT: number
  healthScore: number
  inboundRouteIds: string[]
  outboundRouteIds: string[]
  throughputShare: number
  co2eKg: number
  /** Collection trips/day for zones, from the collection engine. */
  tripsPerDay?: number
  /** Collection-round fuel litres/day for zones, from the collection engine. */
  fuelLiters?: number
  /** Present for collection zones only. */
  collection?: ReturnType<typeof collectionSummary>
  /** Present for collection zones only: the zone's daily generation. */
  generatedT?: number
}

function deriveFacility(
  facility: Facility,
  inbound: string[],
  outbound: string[],
  volumeById: Record<string, number>,
  engine: EngineResult,
): FacilityDerived {
  const isZone = facility.kind === 'zone'
  const collectionResult = engine.collection[facility.id]
  const facilityResult = engine.facility[facility.id]

  // Zones ledger from the collection engine; plants from the facility engine.
  const inflow = isZone ? (collectionResult?.collectedT ?? 0) : (facilityResult?.incomingT ?? 0)
  const utilizationPct = isZone
    ? (collectionResult?.collectionRatePct ?? 0)
    : (facilityResult?.utilizationPct ?? 0)
  const processedT = isZone ? inflow : (facilityResult?.processedT ?? 0)
  const backlogT = isZone ? (collectionResult?.uncollectedT ?? 0) : (facilityResult?.backlogT ?? 0)
  const outflow = outbound.reduce((s, id) => s + (volumeById[id] ?? 0), 0)

  const excessUtilization = Math.max(0, utilizationPct - UTILIZATION_THRESHOLDS.warning)
  const queuePenalty = Math.min(20, facility.waiting * 0.7)
  const healthScore =
    isZone ? Math.max(0, 100 - (100 - utilizationPct) * 2.2) : Math.max(0, 100 - excessUtilization * 0.9 - queuePenalty)

  return {
    facility,
    inflow,
    processedT,
    backlogT,
    overCapacity: isZone ? false : (facilityResult?.overCapacity ?? false),
    outflow,
    utilizationPct,
    state: nodeStateFor(facility.kind, utilizationPct),
    headroomT: Math.max(0, facility.capacity - inflow),
    heldAtSourceT: facilityResult?.heldAtSourceT ?? 0,
    healthScore,
    inboundRouteIds: inbound,
    outboundRouteIds: outbound,
    throughputShare: 0,
    co2eKg: facilityEmissionsKg(facility),
    tripsPerDay: collectionResult?.tripsPerDay,
    fuelLiters: collectionResult?.fuelLiters,
    collection: facility.collection ? collectionSummary(facility.collection) : undefined,
    generatedT: facility.collection?.generatedT,
  }
}

export interface TwinModel {
  snapshot: TwinSnapshot
  /** Route flow calculations: load factor, state, tier, particles, emissions. */
  flow: FlowModel
  /** Phase 3 calculation engine output — the ledger every figure resolves through. */
  engine: EngineResult
  /** Phase 5 bottleneck intelligence: detection, causes, impacts, fixes. */
  bottlenecks: Bottleneck[]
  /** Phase 5 system-wide impact rollup (includes zone-held tonnage). */
  bottleneckTotals: {
    delayedT: number
    co2eKg: number
    diversionPotentialT: number
    fuelLiters: number
    extraTripsPerDay: number
  }
  /** Deterministic 7-day ledger; day `TODAY_INDEX` matches the live totals. */
  daily: DayLedgerEntry[]
  derivedList: FacilityDerived[]
  derivedById: Record<string, FacilityDerived>
  metrics: MetricDefinition[]
  systemState: SystemState
  totals: {
    /** Tonnes collected and routed into the network today. */
    wasteToday: number
    /** Tonnes generated by the eight zones today. */
    generatedToday: number
    /** Tonnes never collected (service gap). */
    uncollectedToday: number
    /** Σ min(incoming, capacity) across infrastructure nodes. */
    processedToday: number
    /** Σ backlog across infrastructure nodes (waste accumulating). */
    backlogToday: number
    /** Transfer-corridor trips/day (engine). */
    tripsToday: number
    /** Collection rounds/day (engine). */
    collectionTripsToday: number
    /** Diesel-equivalent litres/day, collection + transfer fleets (engine). */
    fuelLiters: number
    /** Of which collection rounds. */
    collectionFuelLiters: number
    /** Of which transfer corridors. */
    transferFuelLiters: number
    toLandfill: number
    recovered: number
    tonneKm: number
    co2eKg: number
    transportCo2eKg: number
    facilityCo2eKg: number
    activeVehicles: number
    fleetSize: number
    trackedVehicles: number
    meanQueueMin: number
  }
  routeDerivedById: Record<string, RouteFlow>
}

/** Units recorded as off-road for maintenance in the demo fleet roster. */
const MAINTENANCE_UNITS = 2

export function buildTwinModel(customInput?: {
  facilities?: Facility[]
  routes?: Route[]
  vehicles?: Vehicle[]
}): TwinModel {
  const activeFacilities = customInput?.facilities ?? nodes
  const activeRoutes = customInput?.routes ?? routes
  const activeVehiclesList = customInput?.vehicles ?? vehicles

  // ── Engine pass: the single calculation of record ──────────
  const engine = runEngines({ facilities: activeFacilities, routes: activeRoutes, vehicles: activeVehiclesList })
  const city = engine.city

  const flow = buildFlowModel(activeRoutes)
  const index = buildFlowIndex(activeRoutes)

  const volumeById: Record<string, number> = {}
  for (const r of activeRoutes) volumeById[r.id] = r.volumeT

  const derivedList = activeFacilities.map((node) =>
    deriveFacility(node, index.inbound[node.id] ?? [], index.outbound[node.id] ?? [], volumeById, engine),
  )
  const derivedById: Record<string, FacilityDerived> = {}
  for (const d of derivedList) derivedById[d.facility.id] = d

  const processNodes = derivedList.filter((d) => d.facility.kind !== 'zone')
  const totalThroughput = processNodes.reduce((s, d) => s + d.inflow, 0)
  for (const d of derivedList) d.throughputShare = totalThroughput > 0 && d.facility.kind !== 'zone' ? d.inflow / totalThroughput : 0

  const wasteToday = city.collectedTodayT
  const generatedToday = city.generatedTodayT
  const uncollectedToday = city.uncollectedTodayT

  const landfill = processNodes.find((d) => d.facility.kind === 'landfill')
  const toLandfill = city.landfillTodayT
  const recovered = city.recoveredTodayT

  const systemState: SystemState = processNodes.some((d) => d.state === 'critical')
    ? 'critical'
    : processNodes.some((d) => d.state === 'warning')
      ? 'warning'
      : 'optimal'

  const fleetCount = activeRoutes.reduce((sum, r) => sum + r.vehicleCount, 0)
  const activeVehicles = Math.max(0, fleetCount - MAINTENANCE_UNITS)

  const metrics: MetricDefinition[] = [
    {
      id: 'total-waste-today', label: 'TOTAL WASTE TODAY', value: wasteToday, unit: 'T', digits: 0,
      deltaPct: 2.1, trend: 'up', polarity: 'neutral',
      hint: `Collected across the 8 zones. Generation is ${generatedToday.toLocaleString('en-US')} T/day.`,
    },
    {
      id: 'recovery-rate', label: 'TOTAL RECOVERY RATE', value: city.recoveryRatePct, unit: '%', digits: 1,
      deltaPct: 1.4, trend: 'up', polarity: 'higher-better',
      hint: `Share of collected waste diverted from landfill (${recovered.toLocaleString('en-US')} T/day).`,
    },
    {
      id: 'landfill-load', label: 'TOTAL LANDFILL LOAD', value: city.landfillLoadPct, unit: '%', digits: 1,
      deltaPct: -1.9, trend: 'down', polarity: 'lower-better',
      hint: `Deonar Waste Facility intake against its ${landfill?.facility.capacity.toLocaleString('en-US')} T/day rated capacity.`,
    },
    {
      id: 'active-vehicles', label: 'ACTIVE VEHICLES', value: activeVehicles, unit: '', digits: 0,
      deltaPct: 0, trend: 'flat', polarity: 'neutral',
      hint: `Of ${fleetCount} assigned units making ${city.tripsToday.toLocaleString('en-US')} transfer trips today.`,
    },
    {
      id: 'system-utilization', label: 'SYSTEM UTILIZATION', value: city.systemUtilizationPct, unit: '%', digits: 1,
      deltaPct: 0.8, trend: 'up', polarity: 'neutral',
      hint: 'Throughput-weighted utilisation across the infrastructure nodes.',
    },
    {
      id: 'total-co2e', label: 'TOTAL CO₂e', value: city.co2eKg, unit: 'KG', digits: 0,
      deltaPct: -3.6, trend: 'down', polarity: 'lower-better',
      hint: `Haulage ${Math.round(city.transportCo2eKg).toLocaleString('en-US')} kg plus facility load ${Math.round(city.facilityCo2eKg)} kg, today.`,
    },
  ]

  const daily = buildDailyLedger(city, { facilities: activeFacilities, routes: activeRoutes, vehicles: activeVehiclesList })

  // Phase 5: bottleneck intelligence reads the ledgers, never raw data.
  const bottlenecks = runBottleneckEngine({ facilities: activeFacilities, routes: activeRoutes, engines: engine })
  const bottleneckTotalsResult = bottleneckTotals(bottlenecks, engine.collection)

  return {
    snapshot: {
      city: cityMeta,
      substreams,
      facilities: activeFacilities,
      generations: buildGenerationPoints(),
      routes: activeRoutes,
      vehicles: activeVehiclesList,
    },
    flow,
    engine,
    bottlenecks,
    bottleneckTotals: bottleneckTotalsResult,
    daily,
    derivedList,
    derivedById,
    metrics,
    systemState,
    totals: {
      wasteToday,
      generatedToday,
      uncollectedToday,
      processedToday: city.processedTodayT,
      backlogToday: city.backlogTodayT,
      tripsToday: city.tripsToday,
      collectionTripsToday: city.collectionTripsToday,
      fuelLiters: city.fuelLiters,
      collectionFuelLiters: city.collectionFuelLiters,
      transferFuelLiters: city.transferFuelLiters,
      toLandfill,
      recovered,
      tonneKm: city.tonneKm,
      co2eKg: city.co2eKg,
      transportCo2eKg: city.transportCo2eKg,
      facilityCo2eKg: city.facilityCo2eKg,
      activeVehicles,
      fleetSize: city.fleetSize,
      trackedVehicles: city.trackedVehicles,
      meanQueueMin: city.meanQueueMin,
    },
    routeDerivedById: flow.byId,
  }
}

/** Index of "today" inside `TwinModel.daily`. */
export { TODAY_INDEX }
