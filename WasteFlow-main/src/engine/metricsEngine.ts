import { CITY_DAY_COUNT } from '@/config/network'
import { recoveryRatePct } from './primitives'
import { runFacilityEngine } from './facilityEngine'
import { runTransportEngine, routePayloadT } from './transportEngine'
import type { CityTotals, DayLedgerEntry, EngineInput, EngineResult } from './types'
import type { Route } from '@/types'

/**
 * METRICS ENGINE — the city rollup and the deterministic 7-day ledger.
 *
 * Consumes the other engines' outputs (never the raw data alone) and produces
 * the figures every HUD module, panel and view renders. This is the seam
 * Phase 4–7 bind to: swap the engine inputs, keep the contract.
 */

/** Vehicles recorded off-road for maintenance in the demo fleet roster. */
const MAINTENANCE_UNITS = 2

export function runMetricsEngine(
  input: EngineInput,
  engines: Omit<EngineResult, 'city'>,
): CityTotals {
  const { collection, facility, transport, environmental } = engines

  const zoneResults = Object.values(collection)
  const generatedTodayT = zoneResults.reduce((s, r) => s + r.generatedT, 0)
  const collectedTodayT = zoneResults.reduce((s, r) => s + r.collectedT, 0)
  const uncollectedTodayT = Math.max(0, generatedTodayT - collectedTodayT)

  const facilityResults = Object.values(facility)
  const kindOf = (id: string) => input.facilities.find((x) => x.id === id)?.kind
  const infrastructure = facilityResults.filter((f) => {
    const kind = kindOf(f.facilityId)
    return kind !== undefined && kind !== 'zone'
  })
  const processedTodayT = infrastructure.reduce((s, f) => s + f.processedT, 0)
  const backlogTodayT = infrastructure.reduce((s, f) => s + f.backlogT, 0)

  // Landfill intake: tonnage entering nodes of kind `landfill`.
  let landfillTodayT = 0
  for (const f of infrastructure) {
    if (kindOf(f.facilityId) === 'landfill') landfillTodayT += f.incomingT
  }

  // Recovery rate: share of collected waste NOT disposed to landfill.
  const recoveredTodayT = Math.max(0, collectedTodayT - landfillTodayT)
  const recoveryRate = recoveryRatePct(collectedTodayT, recoveredTodayT)

  // Landfill load uses the landfill node's own rated capacity.
  const landfillNode = input.facilities.find((f) => f.kind === 'landfill')
  const landfillCapacity = landfillNode?.capacity ?? 0
  const landfillLoadPct = landfillCapacity > 0 ? (landfillTodayT / landfillCapacity) * 100 : 0

  const tripsToday = Object.values(transport).reduce((s, t) => s + t.tripsPerDay, 0)
  const collectionTripsToday = zoneResults.reduce((s, r) => s + r.tripsPerDay, 0)

  // Fuel split: collection rounds from the collection engine, transfer corridors
  // from the transport engine (blocked corridors burn nothing).
  const collectionFuelLiters = zoneResults.reduce((s, r) => s + r.fuelLiters, 0)
  const transferFuelLiters = Object.values(transport).reduce((s, t) => s + t.fuelLiters, 0)
  const fuelLiters = collectionFuelLiters + transferFuelLiters

  const fleetSize = input.routes.reduce((s, r) => s + r.vehicleCount, 0)
  const activeVehicles = Math.max(0, fleetSize - MAINTENANCE_UNITS)
  const meanQueueMin =
    infrastructure.length > 0
      ? infrastructure.reduce((s, f) => s + f.waitingMin, 0) / infrastructure.length
      : 0

  // Throughput-weighted utilisation across infrastructure nodes.
  const totalIncoming = infrastructure.reduce((s, f) => s + f.incomingT, 0)
  const systemUtilizationPct =
    totalIncoming > 0
      ? infrastructure.reduce((s, f) => s + f.utilizationPct * f.incomingT, 0) / totalIncoming
      : 0

  return {
    collectedTodayT,
    generatedTodayT,
    uncollectedTodayT,
    processedTodayT,
    backlogTodayT,
    landfillTodayT,
    recoveredTodayT,
    tripsToday,
    collectionTripsToday,
    fuelLiters,
    collectionFuelLiters,
    transferFuelLiters,
    co2eKg: environmental.totalCo2eKg,
    transportCo2eKg: environmental.transportCo2eKg,
    facilityCo2eKg: environmental.facilityCo2eKg,
    tonneKm: environmental.tonneKm,
    activeVehicles,
    fleetSize,
    trackedVehicles: input.vehicles.length,
    meanQueueMin,
    recoveryRatePct: recoveryRate,
    landfillLoadPct,
    systemUtilizationPct,
  }
}

/* ── Daily ledger (§19) ───────────────────────────────────── */

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/**
 * Weekly demand shape. Municipal waste surges into the Friday/Saturday market
 * cycle and dips on Sunday. Thursday is `today` — its factors reproduce the
 * live engine totals exactly, so the ledger and the HUD can never disagree.
 */
const DAY_SHAPE = [
  { generation: 0.97, collectionRate: 0.943 }, // MON
  { generation: 0.95, collectionRate: 0.951 }, // TUE
  { generation: 0.98, collectionRate: 0.947 }, // WED
  { generation: 1.0, collectionRate: 0.942 }, // THU — today
  { generation: 1.06, collectionRate: 0.935 }, // FRI
  { generation: 1.09, collectionRate: 0.928 }, // SAT
  { generation: 0.88, collectionRate: 0.958 }, // SUN
] as const

/** Today is day 4 (THU) — the live figures are the day-4 column. */
export const TODAY_INDEX = 3

/**
 * Deterministic 7-day ledger, produced by RE-RUNNING the facility and
 * transport engines at each day's scaled demand. Consequences fall out of the
 * model instead of being typed in: the Friday/Saturday surge pushes Kanjurmarg
 * Sorting past its rated capacity and the backlog column lights up. Blocked
 * corridors stay blocked all week; their tonnage is never collected forward.
 */
export function buildDailyLedger(base: CityTotals, input: EngineInput): DayLedgerEntry[] {
  const baseCollected = base.collectedTodayT
  const baseTransferFuelPerT = baseCollected > 0 ? base.transferFuelLiters / baseCollected : 0
  const baseTransportCo2ePerT = baseCollected > 0 ? base.transportCo2eKg / baseCollected : 0
  const baseCollectionFuelPerT = baseCollected > 0 ? base.collectionFuelLiters / baseCollected : 0
  const baseCollectionTripsPerT = baseCollected > 0 ? base.collectionTripsToday / baseCollected : 0

  const entries: DayLedgerEntry[] = []
  for (let i = 0; i < CITY_DAY_COUNT; i++) {
    const shape = DAY_SHAPE[i % DAY_SHAPE.length]
    const generatedT = base.generatedTodayT * shape.generation
    const collectedT = generatedT * shape.collectionRate
    const demandScale = baseCollected > 0 ? collectedT / baseCollected : 0

    // Scale the scheduled route set with demand; blocked legs stay blocked.
    const scaledRoutes: Route[] = input.routes.map((r) => ({
      ...r,
      volumeT: r.status === 'blocked' ? r.volumeT : r.volumeT * demandScale,
    }))
    const dayInput: EngineInput = { ...input, routes: scaledRoutes }
    const facilityRun = runFacilityEngine(dayInput)
    const transportRun = runTransportEngine(dayInput)

    const kindOf = (id: string) => input.facilities.find((x) => x.id === id)?.kind
    let backlogT = 0
    let landfillT = 0
    for (const f of Object.values(facilityRun)) {
      const kind = kindOf(f.facilityId)
      if (kind === 'zone' || kind === undefined) continue
      backlogT += f.backlogT
      if (kind === 'landfill') landfillT = f.incomingT
    }

    const processedT = Math.max(0, collectedT - backlogT)
    const recoveredT = Math.max(0, processedT - landfillT)

    const trips = Object.values(transportRun).reduce((s, t) => s + t.tripsPerDay, 0)
    const collectionTrips = Math.round(baseCollectionTripsPerT * collectedT)
    const transferFuel = baseTransferFuelPerT * collectedT
    const collectionFuel = baseCollectionFuelPerT * collectedT
    const co2eKg = baseTransportCo2ePerT * collectedT + base.facilityCo2eKg

    entries.push({
      day: i + 1,
      label: DAY_LABELS[i % DAY_LABELS.length],
      wasteGeneratedT: generatedT,
      wasteCollectedT: collectedT,
      wasteProcessedT: processedT,
      wasteRecoveredT: recoveredT,
      wasteLandfillT: landfillT,
      backlogT,
      trips: trips + collectionTrips,
      fuelLiters: transferFuel + collectionFuel,
      co2eKg,
    })
  }
  return entries
}

/** Kept for consumers that need the payload model outside the transport engine. */
export { routePayloadT }
