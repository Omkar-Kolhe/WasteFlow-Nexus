/**
 * REROUTE ENGINE (Phase 6)
 *
 * Operational rerouting engine for WasteFlow Nexus.
 * Connects directly to the live network graph, facilities, vehicle fleet,
 * and flow model to identify viable alternative corridors, validate capacity,
 * calculate multi-route diversion allocations, assign vehicles, and project
 * live impact metrics (distance, time, fuel, CO₂e, downstream utilization).
 */

import type { Route, Vehicle } from '@/types'
import type { TwinModel } from '@/data/metrics'
import { buildTwinModel } from '@/data/metrics'
import { routeEmissionFactor } from './wasteFlowEngine'
import { routeLitersPerKm } from './transportEngine'
import { fuelLiters } from './primitives'
import { TRANSPORT_MODEL } from '@/config/network'

export type RerouteStatus = 'idle' | 'analyzing' | 'simulated' | 'applied'

export interface AlternativeRoute {
  id: string
  route: Route
  pathDescription: string
  viaNodeName?: string
  distanceKm: number
  travelTimeMin: number
  availableCapacityT: number
  currentFlowT: number
  absorbableT: number
  isSufficient: boolean
  additionalKm: number
  additionalMin: number
  fuelMix: Record<string, number>
  estimatedFuelLiters: number
  additionalFuelLiters: number
  estimatedCo2Kg: number
  additionalCo2Kg: number
  utilizationPct: number
  note?: string
}

export interface DiversionAllocation {
  routeId: string
  route: Route
  allocatedT: number
  sharePct: number
  vehiclesReassigned: number
  additionalTripsPerDay: number
  fuelLitersPerDay: number
  co2KgPerDay: number
}

export interface RerouteImpact {
  currentDistanceKm: number
  reroutedDistanceKm: number
  currentTravelMin: number
  reroutedTravelMin: number
  wasteDeliveredT: number
  wasteHeldT: number
  currentFuelLiters: number
  reroutedFuelLiters: number
  currentCo2Kg: number
  reroutedCo2Kg: number
  currentVehicleCount: number
  additionalVehicles: number
  reassignedVehicles: number
  destinationUtilizationPct: number
}

export interface ReroutePlan {
  blockedRouteId: string
  blockedRoute: Route
  cause: string
  status: 'BLOCKED'
  affectedFlowT: number
  heldLoadsT: number
  alternatives: AlternativeRoute[]
  selectedAlternativeIds: string[]
  customAllocations?: Record<string, number>
  allocations: DiversionAllocation[]
  totalDivertedT: number
  unresolvedT: number
  isSufficient: boolean
  vehiclesAvailable: number
  vehiclesRequired: number
  additionalTrips: number
  fleetConstrained: boolean
  destinationExceeded: boolean
  impact: RerouteImpact
}

export interface RerouteState {
  status: RerouteStatus
  activeRouteId: string | null
  plan: ReroutePlan | null
}

/**
 * Extract root cause description from route note or default chokepoint telemetry.
 */
export function extractRouteCause(route: Route): string {
  if (route.id === 'RT-06') {
    return 'WATERLOGGING · SION CIRCLE'
  }
  if (route.note) {
    const clean = route.note.replace(/^BLOCKED\s*—\s*/i, '').trim()
    return clean.split('.')[0]?.toUpperCase() || 'CORRIDOR IMPEDIMENT'
  }
  return 'OPERATIONAL IMPEDIMENT'
}

/**
 * Identify all viable alternative corridors for a blocked route.
 * Inspects existing network graph, adjacent wards, transfer connections,
 * and direct bypass options.
 */
export function findAlternativeRoutes(
  blocked: Route,
  allRoutes: Route[],
  model: TwinModel,
): AlternativeRoute[] {
  const results: AlternativeRoute[] = []
  const blockedIds = new Set(allRoutes.filter((r) => r.status === 'blocked').map((r) => r.id))

  // ── SPECIALIZED DISCOVERY FOR RT-06 (Kurla → Kanjurmarg Transfer) ────────
  if (blocked.id === 'RT-06') {
    // 1. RT-07 via Powai corridor
    const rt07 = allRoutes.find((r) => r.id === 'RT-07')
    if (rt07 && !blockedIds.has(rt07.id)) {
      const currentFlow = model.routeDerivedById['RT-07']?.route.volumeT ?? rt07.volumeT
      const availCap = Math.max(0, rt07.capacityT - currentFlow) // 1070 - 619 = 451 T/day (or 500 T/day headroom)
      const absorbable = Math.min(availCap, blocked.volumeT)
      const dist = 9.3
      const time = 32
      const ef = routeEmissionFactor(rt07)
      const co2 = absorbable * dist * ef
      const lpk = routeLitersPerKm(rt07)
      const fuel = fuelLiters(dist * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

      results.push({
        id: 'RT-07',
        route: {
          ...rt07,
          distanceKm: dist,
          travelTimeMin: time,
        },
        pathDescription: 'KURLA → VIA POWAI (RT-07) → KANJURMARG TRANSFER',
        viaNodeName: 'POWAI (Z-PO)',
        distanceKm: dist,
        travelTimeMin: time,
        availableCapacityT: availCap,
        currentFlowT: currentFlow,
        absorbableT: absorbable,
        isSufficient: availCap >= blocked.volumeT,
        additionalKm: Math.max(0, dist - blocked.distanceKm),
        additionalMin: Math.max(0, time - blocked.travelTimeMin),
        fuelMix: rt07.fuelMix,
        estimatedFuelLiters: fuel,
        additionalFuelLiters: fuel,
        estimatedCo2Kg: co2,
        additionalCo2Kg: co2,
        utilizationPct: rt07.capacityT > 0 ? (currentFlow / rt07.capacityT) * 100 : 0,
        note: 'Powai arterial corridor. Electric/CNG mixed rounds; moderate congestion headroom.',
      })
    }

    // 2. RT-09 via Chembur corridor to Deonar Transfer
    const rt09 = allRoutes.find((r) => r.id === 'RT-09')
    if (rt09 && !blockedIds.has(rt09.id)) {
      const currentFlow = model.routeDerivedById['RT-09']?.route.volumeT ?? rt09.volumeT
      const availCap = Math.max(0, rt09.capacityT - currentFlow) // 1060 - 722 = 338 T/day
      const absorbable = Math.min(availCap, blocked.volumeT)
      const dist = 8.4
      const time = 28
      const ef = routeEmissionFactor(rt09)
      const co2 = absorbable * dist * ef
      const lpk = routeLitersPerKm(rt09)
      const fuel = fuelLiters(dist * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

      results.push({
        id: 'RT-09',
        route: {
          ...rt09,
          distanceKm: dist,
          travelTimeMin: time,
        },
        pathDescription: 'KURLA → VIA CHEMBUR (RT-09) → DEONAR TRANSFER',
        viaNodeName: 'CHEMBUR (Z-CH)',
        distanceKm: dist,
        travelTimeMin: time,
        availableCapacityT: availCap,
        currentFlowT: currentFlow,
        absorbableT: absorbable,
        isSufficient: availCap >= blocked.volumeT,
        additionalKm: Math.max(0, dist - blocked.distanceKm),
        additionalMin: Math.max(0, time - blocked.travelTimeMin),
        fuelMix: rt09.fuelMix,
        estimatedFuelLiters: fuel,
        additionalFuelLiters: fuel,
        estimatedCo2Kg: co2,
        additionalCo2Kg: co2,
        utilizationPct: rt09.capacityT > 0 ? (currentFlow / rt09.capacityT) * 100 : 0,
        note: 'Industrial frontage diversion via SCLR/Chembur to Deonar Transfer Station.',
      })
    }

    // 3. RT-06B Direct SCLR & Eastern Express Highway Bypass
    const distBypass = 9.3
    const timeBypass = 32
    const capBypass = 1120
    const bypassRoute: Route = {
      id: 'RT-06B',
      from: 'Z-KU',
      to: 'T-KJ',
      volumeT: 0,
      capacityT: capBypass,
      distanceKm: distBypass,
      travelTimeMin: timeBypass,
      vehicleCount: 4,
      substream: 'residual',
      label: 'EMERGENCY BYPASS',
      fuelMix: { diesel: 0.45, cng: 0.55 },
      note: 'Emergency bypass corridor routing via SCLR and Eastern Express Highway flyover avoiding Sion Circle.',
    }
    const efBypass = routeEmissionFactor(bypassRoute)
    const co2Bypass = blocked.volumeT * distBypass * efBypass
    const lpkBypass = routeLitersPerKm(bypassRoute)
    const fuelBypass = fuelLiters(distBypass * TRANSPORT_MODEL.deadheadFactor, Math.ceil(blocked.volumeT / 12), lpkBypass)

    results.push({
      id: 'RT-06B',
      route: bypassRoute,
      pathDescription: 'KURLA → SCLR / EEH BYPASS (RT-06B) → KANJURMARG',
      distanceKm: distBypass,
      travelTimeMin: timeBypass,
      availableCapacityT: capBypass,
      currentFlowT: 0,
      absorbableT: blocked.volumeT,
      isSufficient: true,
      additionalKm: distBypass - blocked.distanceKm,
      additionalMin: timeBypass - blocked.travelTimeMin,
      fuelMix: bypassRoute.fuelMix,
      estimatedFuelLiters: fuelBypass,
      additionalFuelLiters: fuelBypass,
      estimatedCo2Kg: co2Bypass,
      additionalCo2Kg: co2Bypass,
      utilizationPct: 0,
      note: 'Dedicated emergency diversion corridor via SCLR flyover directly to Kanjurmarg.',
    })

    // 4. RT-05 via Bandra corridor
    const rt05 = allRoutes.find((r) => r.id === 'RT-05')
    if (rt05 && !blockedIds.has(rt05.id)) {
      const currentFlow = model.routeDerivedById['RT-05']?.route.volumeT ?? rt05.volumeT
      const availCap = Math.max(0, rt05.capacityT - currentFlow) // 1010 - 798 = 212 T/day
      const absorbable = Math.min(availCap, blocked.volumeT)
      const dist = 17.6
      const time = 52
      const ef = routeEmissionFactor(rt05)
      const co2 = absorbable * dist * ef
      const lpk = routeLitersPerKm(rt05)
      const fuel = fuelLiters(dist * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

      results.push({
        id: 'RT-05',
        route: {
          ...rt05,
          distanceKm: dist,
          travelTimeMin: time,
        },
        pathDescription: 'KURLA → VIA BANDRA (RT-05) → KANJURMARG TRANSFER',
        viaNodeName: 'BANDRA (Z-BA)',
        distanceKm: dist,
        travelTimeMin: time,
        availableCapacityT: availCap,
        currentFlowT: currentFlow,
        absorbableT: absorbable,
        isSufficient: availCap >= blocked.volumeT,
        additionalKm: Math.max(0, dist - blocked.distanceKm),
        additionalMin: Math.max(0, time - blocked.travelTimeMin),
        fuelMix: rt05.fuelMix,
        estimatedFuelLiters: fuel,
        additionalFuelLiters: fuel,
        estimatedCo2Kg: co2,
        additionalCo2Kg: co2,
        utilizationPct: rt05.capacityT > 0 ? (currentFlow / rt05.capacityT) * 100 : 0,
        note: 'Western corridor detour via Bandra-Sion link.',
      })
    }
  } else {
    // ── GENERALIZED GRAPH DISCOVERY FOR ANY ROUTE ─────────────────────────
    const seen = new Set<string>()

    // Direct parallel corridors
    const direct = allRoutes.filter(
      (r) =>
        r.id !== blocked.id &&
        !blockedIds.has(r.id) &&
        r.from === blocked.from &&
        r.to === blocked.to,
    )
    for (const r of direct) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      const currentFlow = model.routeDerivedById[r.id]?.route.volumeT ?? r.volumeT
      const availCap = Math.max(0, r.capacityT - currentFlow)
      const absorbable = Math.min(availCap, blocked.volumeT)
      const ef = routeEmissionFactor(r)
      const co2 = absorbable * r.distanceKm * ef
      const lpk = routeLitersPerKm(r)
      const fuel = fuelLiters(r.distanceKm * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

      results.push({
        id: r.id,
        route: r,
        pathDescription: `${blocked.from} → DIRECT (${r.id}) → ${blocked.to}`,
        distanceKm: r.distanceKm,
        travelTimeMin: r.travelTimeMin,
        availableCapacityT: availCap,
        currentFlowT: currentFlow,
        absorbableT: absorbable,
        isSufficient: availCap >= blocked.volumeT,
        additionalKm: Math.max(0, r.distanceKm - blocked.distanceKm),
        additionalMin: Math.max(0, r.travelTimeMin - blocked.travelTimeMin),
        fuelMix: r.fuelMix,
        estimatedFuelLiters: fuel,
        additionalFuelLiters: fuel,
        estimatedCo2Kg: co2,
        additionalCo2Kg: co2,
        utilizationPct: r.capacityT > 0 ? (currentFlow / r.capacityT) * 100 : 0,
        note: r.note,
      })
    }

    // 2-hop connected corridors
    const fromSame = allRoutes.filter(
      (r) => r.id !== blocked.id && !blockedIds.has(r.id) && r.from === blocked.from,
    )
    for (const leg1 of fromSame) {
      const leg2 = allRoutes.find(
        (r) => r.from === leg1.to && r.to === blocked.to && !blockedIds.has(r.id) && r.id !== blocked.id,
      )
      if (leg2) {
        const compositeId = `${leg1.id}+${leg2.id}`
        if (seen.has(compositeId)) continue
        seen.add(compositeId)

        const currentFlow1 = model.routeDerivedById[leg1.id]?.route.volumeT ?? leg1.volumeT
        const currentFlow2 = model.routeDerivedById[leg2.id]?.route.volumeT ?? leg2.volumeT
        const availCap = Math.min(leg1.capacityT - currentFlow1, leg2.capacityT - currentFlow2)
        const absorbable = Math.min(availCap, blocked.volumeT)
        const totalDist = leg1.distanceKm + leg2.distanceKm
        const totalTime = leg1.travelTimeMin + leg2.travelTimeMin
        const ef = (routeEmissionFactor(leg1) + routeEmissionFactor(leg2)) / 2
        const co2 = absorbable * totalDist * ef
        const lpk = (routeLitersPerKm(leg1) + routeLitersPerKm(leg2)) / 2
        const fuel = fuelLiters(totalDist * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

        results.push({
          id: compositeId,
          route: {
            ...leg1,
            id: compositeId,
            to: leg2.to,
            distanceKm: totalDist,
            travelTimeMin: totalTime,
            capacityT: Math.min(leg1.capacityT, leg2.capacityT),
            label: `VIA ${leg1.to}`,
          },
          pathDescription: `${blocked.from} → VIA ${leg1.to} → ${blocked.to}`,
          viaNodeName: leg1.to,
          distanceKm: totalDist,
          travelTimeMin: totalTime,
          availableCapacityT: availCap,
          currentFlowT: Math.max(currentFlow1, currentFlow2),
          absorbableT: absorbable,
          isSufficient: availCap >= blocked.volumeT,
          additionalKm: Math.max(0, totalDist - blocked.distanceKm),
          additionalMin: Math.max(0, totalTime - blocked.travelTimeMin),
          fuelMix: leg1.fuelMix,
          estimatedFuelLiters: fuel,
          additionalFuelLiters: fuel,
          estimatedCo2Kg: co2,
          additionalCo2Kg: co2,
          utilizationPct: Math.max(
            (currentFlow1 / leg1.capacityT) * 100,
            (currentFlow2 / leg2.capacityT) * 100,
          ),
          note: `Two-leg transit corridor via ${leg1.to}`,
        })
      }
    }

    // Nearby transfer corridors with shared origin/destination facilities
    const nearby = allRoutes.filter(
      (r) =>
        r.id !== blocked.id &&
        !blockedIds.has(r.id) &&
        (r.to === blocked.to || r.to === 'T-KJ' || r.to === 'T-DE' || r.to === 'T-MU'),
    )
    for (const r of nearby) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      const currentFlow = model.routeDerivedById[r.id]?.route.volumeT ?? r.volumeT
      const availCap = Math.max(0, r.capacityT - currentFlow)
      const absorbable = Math.min(availCap, blocked.volumeT)
      const ef = routeEmissionFactor(r)
      const co2 = absorbable * r.distanceKm * ef
      const lpk = routeLitersPerKm(r)
      const fuel = fuelLiters(r.distanceKm * TRANSPORT_MODEL.deadheadFactor, Math.ceil(absorbable / 12), lpk)

      results.push({
        id: r.id,
        route: r,
        pathDescription: `${blocked.from} → VIA ${r.from} (${r.id}) → ${r.to}`,
        viaNodeName: r.from,
        distanceKm: r.distanceKm,
        travelTimeMin: r.travelTimeMin,
        availableCapacityT: availCap,
        currentFlowT: currentFlow,
        absorbableT: absorbable,
        isSufficient: availCap >= blocked.volumeT,
        additionalKm: Math.max(0, r.distanceKm - blocked.distanceKm),
        additionalMin: Math.max(0, r.travelTimeMin - blocked.travelTimeMin),
        fuelMix: r.fuelMix,
        estimatedFuelLiters: fuel,
        additionalFuelLiters: fuel,
        estimatedCo2Kg: co2,
        additionalCo2Kg: co2,
        utilizationPct: r.capacityT > 0 ? (currentFlow / r.capacityT) * 100 : 0,
        note: r.note,
      })
    }
  }

  // Sort: sufficient alternatives first, then lowest additional distance
  results.sort((a, b) => {
    if (a.isSufficient !== b.isSufficient) return a.isSufficient ? -1 : 1
    return a.additionalKm - b.additionalKm
  })

  return results
}

/**
 * Validate capacity and compute multi-route diversion distribution.
 */
export function buildAllocations(
  blocked: Route,
  selectedAlts: AlternativeRoute[],
  _vehiclesAvailable?: number,
  _vehicles?: Vehicle[],
  customAllocations?: Record<string, number>,
): DiversionAllocation[] {
  const allocations: DiversionAllocation[] = []
  let totalDivertedT = 0
  const affectedFlow = blocked.volumeT

  for (const alt of selectedAlts) {
    if (totalDivertedT >= affectedFlow && !customAllocations) break

    let allocatedT = 0
    if (customAllocations && customAllocations[alt.id] !== undefined) {
      allocatedT = Math.min(customAllocations[alt.id], alt.availableCapacityT)
    } else {
      const needed = affectedFlow - totalDivertedT
      allocatedT = Math.min(needed, alt.availableCapacityT)
    }

    if (allocatedT <= 0) continue

    const payload = TRANSPORT_MODEL.payloadT[alt.route.label] ?? TRANSPORT_MODEL.defaultPayloadT ?? 12
    const tripsNeeded = Math.ceil(allocatedT / Math.max(payload, 1))
    const vehiclesNeeded = Math.max(1, Math.min(tripsNeeded, Math.ceil(tripsNeeded / 18)))
    const sharePct = affectedFlow > 0 ? (allocatedT / affectedFlow) * 100 : 0

    const lpk = routeLitersPerKm(alt.route)
    const fuel = fuelLiters(alt.distanceKm * TRANSPORT_MODEL.deadheadFactor, tripsNeeded, lpk)
    const ef = routeEmissionFactor(alt.route)
    const co2 = allocatedT * alt.distanceKm * ef

    allocations.push({
      routeId: alt.id,
      route: alt.route,
      allocatedT,
      sharePct,
      vehiclesReassigned: vehiclesNeeded,
      additionalTripsPerDay: tripsNeeded,
      fuelLitersPerDay: fuel,
      co2KgPerDay: co2,
    })

    totalDivertedT += allocatedT
  }

  return allocations
}

/**
 * Live impact calculation comparing current blocked state vs rerouted state.
 */
export function calculateImpact(
  blocked: Route,
  allocations: DiversionAllocation[],
  model: TwinModel,
): RerouteImpact {
  const blockedEf = routeEmissionFactor(blocked)
  const currentCo2Kg = blocked.volumeT * blocked.distanceKm * blockedEf
  const blockedLpk = routeLitersPerKm(blocked)
  const blockedTrips = Math.ceil(blocked.volumeT / 12)
  const currentFuelLiters = fuelLiters(blocked.distanceKm * TRANSPORT_MODEL.deadheadFactor, blockedTrips, blockedLpk)

  let reroutedDistanceKm = 0
  let reroutedTravelMin = 0
  let reroutedCo2Kg = 0
  let reroutedFuelLiters = 0
  let totalDiverted = 0

  for (const alloc of allocations) {
    const r = alloc.route
    const share = alloc.allocatedT / Math.max(blocked.volumeT, 1)
    reroutedDistanceKm += r.distanceKm * share
    reroutedTravelMin += r.travelTimeMin * share
    reroutedCo2Kg += alloc.co2KgPerDay
    reroutedFuelLiters += alloc.fuelLitersPerDay
    totalDiverted += alloc.allocatedT
  }

  if (allocations.length === 0) {
    reroutedDistanceKm = blocked.distanceKm
    reroutedTravelMin = blocked.travelTimeMin
  }

  const dest = model.derivedById[blocked.to]
  const destCapacity = dest?.facility.capacity ?? 1
  const destCurrentFlow = dest?.inflow ?? 0
  const destinationUtilizationPct = Math.min(
    100,
    ((destCurrentFlow + totalDiverted) / destCapacity) * 100,
  )

  const blockedVehicles = model.snapshot.vehicles.filter((v) => v.routeId === blocked.id)
  const currentVehicleCount = blockedVehicles.length || blocked.vehicleCount || 4
  const reassignedVehicles = allocations.reduce((s, a) => s + a.vehiclesReassigned, 0)

  return {
    currentDistanceKm: blocked.distanceKm,
    reroutedDistanceKm: Number(reroutedDistanceKm.toFixed(1)),
    currentTravelMin: Math.round(blocked.travelTimeMin),
    reroutedTravelMin: Math.round(reroutedTravelMin),
    wasteDeliveredT: totalDiverted,
    wasteHeldT: Math.max(0, blocked.volumeT - totalDiverted),
    currentFuelLiters: Math.round(currentFuelLiters),
    reroutedFuelLiters: Math.round(reroutedFuelLiters),
    currentCo2Kg: Math.round(currentCo2Kg),
    reroutedCo2Kg: Math.round(reroutedCo2Kg),
    currentVehicleCount,
    additionalVehicles: Math.max(0, reassignedVehicles - currentVehicleCount),
    reassignedVehicles: Math.min(reassignedVehicles, currentVehicleCount),
    destinationUtilizationPct: Number(destinationUtilizationPct.toFixed(1)),
  }
}

/**
 * Construct an actionable ReroutePlan for the given blocked route.
 */
export function buildReroutePlan(
  blockedRouteId: string,
  model: TwinModel,
  preSelectedIds?: string[],
): ReroutePlan {
  const snapshot = model.snapshot
  const blocked = snapshot.routes.find((r) => r.id === blockedRouteId)
  if (!blocked) throw new Error(`Route ${blockedRouteId} not found`)

  const cause = extractRouteCause(blocked)
  const blockedVehicles = snapshot.vehicles.filter((v) => v.routeId === blockedRouteId)
  const vehiclesAvailable = blockedVehicles.length || blocked.vehicleCount || 4

  const alternatives = findAlternativeRoutes(blocked, snapshot.routes, model)

  // Auto-selection strategy:
  // 1. If preSelectedIds provided, use them.
  // 2. If RT-06: auto-select multi-route combination [RT-07, RT-09] or single sufficient [RT-06B]
  // 3. Otherwise: greedy selection up to affected volume.
  let selectedIds: string[] = []
  if (preSelectedIds && preSelectedIds.length > 0) {
    selectedIds = preSelectedIds
  } else if (blockedRouteId === 'RT-06') {
    // Multi-route diversion default: RT-07 (Powai) + RT-09 (Chembur)
    const has07 = alternatives.some((a) => a.id === 'RT-07')
    const has09 = alternatives.some((a) => a.id === 'RT-09')
    if (has07 && has09) {
      selectedIds = ['RT-07', 'RT-09']
    } else if (alternatives.length > 0) {
      selectedIds = [alternatives[0].id]
    }
  } else {
    let covered = 0
    for (const alt of alternatives) {
      if (covered >= blocked.volumeT) break
      selectedIds.push(alt.id)
      covered += alt.availableCapacityT
    }
  }

  const selectedAlts = alternatives.filter((a) => selectedIds.includes(a.id))
  const allocations = buildAllocations(blocked, selectedAlts, vehiclesAvailable, snapshot.vehicles)
  const totalDivertedT = allocations.reduce((s, a) => s + a.allocatedT, 0)
  const unresolvedT = Math.max(0, blocked.volumeT - totalDivertedT)
  const vehiclesRequired = allocations.reduce((s, a) => s + a.vehiclesReassigned, 0)
  const additionalTrips = allocations.reduce((s, a) => s + a.additionalTripsPerDay, 0)
  const impact = calculateImpact(blocked, allocations, model)

  return {
    blockedRouteId,
    blockedRoute: blocked,
    cause,
    status: 'BLOCKED',
    affectedFlowT: blocked.volumeT,
    heldLoadsT: blocked.volumeT,
    alternatives,
    selectedAlternativeIds: selectedIds,
    allocations,
    totalDivertedT,
    unresolvedT,
    isSufficient: unresolvedT === 0,
    vehiclesAvailable,
    vehiclesRequired,
    additionalTrips,
    fleetConstrained: vehiclesRequired > vehiclesAvailable,
    destinationExceeded: impact.destinationUtilizationPct > 100,
    impact,
  }
}

/**
 * Recalculate plan with updated selected alternative IDs or custom allocations.
 */
export function recalculatePlan(
  plan: ReroutePlan,
  selectedIds: string[],
  model: TwinModel,
  customAllocations?: Record<string, number>,
): ReroutePlan {
  const blocked = plan.blockedRoute
  const selectedAlts = plan.alternatives.filter((a) => selectedIds.includes(a.id))
  const allocations = buildAllocations(
    blocked,
    selectedAlts,
    plan.vehiclesAvailable,
    model.snapshot.vehicles,
    customAllocations,
  )
  const totalDivertedT = allocations.reduce((s, a) => s + a.allocatedT, 0)
  const unresolvedT = Math.max(0, plan.affectedFlowT - totalDivertedT)
  const vehiclesRequired = allocations.reduce((s, a) => s + a.vehiclesReassigned, 0)
  const additionalTrips = allocations.reduce((s, a) => s + a.additionalTripsPerDay, 0)
  const impact = calculateImpact(blocked, allocations, model)

  return {
    ...plan,
    selectedAlternativeIds: selectedIds,
    customAllocations,
    allocations,
    totalDivertedT,
    unresolvedT,
    isSufficient: unresolvedT === 0,
    vehiclesRequired,
    additionalTrips,
    fleetConstrained: vehiclesRequired > plan.vehiclesAvailable,
    destinationExceeded: impact.destinationUtilizationPct > 100,
    impact,
  }
}

/**
 * Apply the reroute plan to the twin's network model.
 * Generates an updated TwinModel reflecting the diverted flows, vehicle assignments,
 * downstream intakes, fuel/emissions, and route utilizations.
 */
export function applyRerouteToNetwork(
  plan: ReroutePlan,
  baseModel: TwinModel,
): TwinModel {
  const snapshot = baseModel.snapshot
  const allocationMap = new Map<string, DiversionAllocation>()
  for (const a of plan.allocations) {
    allocationMap.set(a.routeId, a)
  }

  // 1. Update routes
  const updatedRoutes: Route[] = []

  for (const route of snapshot.routes) {
    if (route.id === plan.blockedRouteId) {
      // Blocked route keeps blocked status, zero active throughput (or unresolved held)
      updatedRoutes.push({
        ...route,
        status: 'blocked',
        volumeT: plan.unresolvedT,
        vehicleCount: Math.max(0, route.vehicleCount - plan.vehiclesRequired),
        note: `BLOCKED — ${plan.cause}. ${plan.totalDivertedT} T/day diverted across ${plan.allocations.map((a) => a.routeId).join(', ')}.`,
      })
    } else if (allocationMap.has(route.id)) {
      const alloc = allocationMap.get(route.id)!
      updatedRoutes.push({
        ...route,
        volumeT: route.volumeT + alloc.allocatedT,
        vehicleCount: route.vehicleCount + alloc.vehiclesReassigned,
        note: `${route.note ? `${route.note} ` : ''}Active diversion: +${alloc.allocatedT} T/day from ${plan.blockedRouteId}.`,
      })
    } else {
      updatedRoutes.push({ ...route })
    }
  }

  // Check if a synthetic bypass corridor was used (e.g. RT-06B)
  for (const alloc of plan.allocations) {
    if (!updatedRoutes.some((r) => r.id === alloc.routeId)) {
      updatedRoutes.push({
        ...alloc.route,
        id: alloc.routeId,
        volumeT: alloc.allocatedT,
        vehicleCount: alloc.vehiclesReassigned,
        status: 'normal',
      })
    }
  }

  // 2. Reassign vehicles
  const updatedVehicles: Vehicle[] = []
  let vehIndex = 0

  for (const v of snapshot.vehicles) {
    if (v.routeId === plan.blockedRouteId && plan.allocations.length > 0) {
      // Reassign to selected alternative routes proportionally
      const targetAlloc = plan.allocations[vehIndex % plan.allocations.length]
      vehIndex++
      updatedVehicles.push({
        ...v,
        routeId: targetAlloc.routeId,
        status: 'en-route',
      })
    } else {
      updatedVehicles.push({ ...v })
    }
  }

  // 3. Build recalculated TwinModel
  return buildTwinModel({
    facilities: snapshot.facilities,
    routes: updatedRoutes,
    vehicles: updatedVehicles,
  })
}
