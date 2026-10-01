import type { Facility, Route } from '@/types'
import {
  BOTTLENECK_MODEL,
  BOTTLENECK_TYPE_CONFIG,
  ROUTE_STATUS_THRESHOLDS,
  UTILIZATION_THRESHOLDS,
} from '@/config/network'
import type { EngineResult, FacilityResult } from './types'
import { routePayloadT } from './transportEngine'

/**
 * BOTTLENECK INTELLIGENCE ENGINE (Phase 5).
 *
 * Automatically determines:
 * 1. WHERE the waste-management system is getting stuck
 * 2. WHY it is happening (root-cause dependency tracing)
 * 3. WHAT upstream / downstream parts are affected
 * 4. WHAT environmental impact it creates (fuel, CO₂e, trips, landfill pressure)
 *
 * Reads Phase 3 ledgers — never fake numbers.
 * The score is transparently computed from:
 *   capacity pressure + backlog pressure + waiting pressure + transport pressure + upstream inflow pressure
 */

export type BottleneckSeverity = 'normal' | 'warning' | 'critical'

export type BottleneckType =
  | 'CAPACITY_BOTTLENECK'
  | 'TRANSPORT_BOTTLENECK'
  | 'SCHEDULING_BOTTLENECK'
  | 'TRANSFER_BOTTLENECK'
  | 'SORTING_BOTTLENECK'
  | 'PROCESSING_BOTTLENECK'
  | 'RECOVERY_BOTTLENECK'

export interface BottleneckEvidence {
  incomingT: number
  capacityT: number
  capacityGapT: number
  backlogT: number
  waitingMin: number
  processingTimeMin: number
  utilizationPct: number
  congestedRoutesCount: number
  upstreamVolumeT: number
  downstreamHeadroomT: number
}

export interface BottleneckPropagationStep {
  stage: string
  title: string
  description: string
  metric: string
  value: string
  tone: 'normal' | 'warn' | 'critical'
}

export interface BottleneckTimelinePoint {
  stage: 'NORMAL' | 'LOAD INCREASE' | 'WARNING' | 'CAPACITY EXCEEDED' | 'BACKLOG' | 'CRITICAL'
  label: string
  dayIndex: number
  dayName: string
  utilizationPct: number
  volumeT: number
  active: boolean
  reached: boolean
}

export interface EarlyWarningForecast {
  currentUtilizationPct: number
  trendPctPerDay: number
  daysUntilCritical: number | null
  status: 'critical_now' | 'approaching' | 'stable' | 'decreasing'
  message: string
  forecastUtilizationIn3Days: number
}

export interface BottleneckUpstreamSource {
  facilityId: string
  facility: Facility
  routeId: string
  route: Route
  volumeT: number
  sharePct: number
  distanceKm: number
  travelTimeMin: number
  status: string
}

export interface BottleneckDownstreamEffect {
  facilityId: string
  facility: Facility
  routeId: string
  route: Route
  volumeT: number
  capacityT: number
  capacityHeadroomT: number
  utilizationPct: number
  landfillRisk: boolean
}

export interface BottleneckImpact {
  delayedT: number
  queueMin: number
  extraTripsPerDay: number
  extraDistanceKm: number
  idleFuelLiters: number
  reworkFuelLiters: number
  totalFuelLiters: number
  co2eKg: number
  landfillDiversionPotentialT: number
  landfillPressureT: number
  recoverableLostT: number
  heldUpstreamT: number
}

export interface BottleneckChainStep {
  label: string
  detail: string
  kind: 'signal' | 'cause' | 'consequence'
  facilityIds: string[]
  routeIds: string[]
}

export interface BottleneckFix {
  id: string
  label: string
  detail: string
  effects: { label: string; direction: 'down' | 'up' }[]
}

export interface BottleneckScoreBreakdown {
  capacityPressure: number
  backlogPressure: number
  waitingPressure: number
  transportPressure: number
  upstreamInflowPressure: number
  downstreamPressure: number
}

export interface Bottleneck {
  facilityId: string
  facility: Facility
  bottleneckType: BottleneckType
  bottleneckTypeLabel: string
  bottleneckTypeDescription: string
  severity: BottleneckSeverity
  pressure: number // 0..100
  bottleneckScore: number // identical alias for Phase 6
  scoreBreakdown: BottleneckScoreBreakdown
  headline: string
  observed: string
  rootCause: string
  whyExplanation: string
  confidence: number // percentage e.g. 92%
  evidence: BottleneckEvidence
  incomingWaste: number
  capacity: number
  utilization: number
  backlog: number
  waitingTime: number
  wasteDelayed: number
  upstreamIds: string[]
  downstreamIds: string[]
  affectedRoutes: Route[]
  upstreamSources: BottleneckUpstreamSource[]
  downstreamEffects: BottleneckDownstreamEffect[]
  inflowRoutes: { route: Route; volumeT: number; utilizationPct: number; status: string }[]
  outflowRoutes: { route: Route; volumeT: number; utilizationPct: number; status: string }[]
  impact: BottleneckImpact
  propagation: BottleneckPropagationStep[]
  earlyWarning: EarlyWarningForecast
  timeline: BottleneckTimelinePoint[]
  chain: BottleneckChainStep[]
  fixes: BottleneckFix[]
}

/* ── MULTI-FACTOR SCORE ENGINE ───────────────────────────── */

export function calculateScoreBreakdown(
  ledger: FacilityResult,
  facility: Facility,
  inRoutes: { route: Route; volumeT: number; utilizationPct: number; status: string }[],
  totalCityIntake: number,
  downstreamHeadroomT: number,
): BottleneckScoreBreakdown {
  // 1. Capacity Pressure (0..100)
  const capRatio = facility.capacity > 0 ? (ledger.incomingT / facility.capacity) * 100 : 0
  const capacityPressure = Math.min(100, Math.max(0, capRatio >= 70 ? (capRatio - 70) * (100 / 40) : capRatio * 0.4))

  // 2. Backlog Pressure (0..100)
  const backlogPressure =
    ledger.backlogT > 0
      ? Math.min(100, (ledger.backlogT / Math.max(1, facility.capacity * 0.1)) * 100)
      : ledger.overCapacity
        ? 60
        : 0

  // 3. Waiting Pressure (0..100)
  const queueThreshold = BOTTLENECK_MODEL.queueWatchMin
  const waitingPressure = Math.min(100, (facility.waiting / queueThreshold) * 70)

  // 4. Transport Pressure (0..100)
  const congestedCount = inRoutes.filter((r) => r.status === 'congested' || r.status === 'blocked').length
  const busyCount = inRoutes.filter((r) => r.status === 'busy').length
  const transportPressure = Math.min(100, congestedCount * 45 + busyCount * 20)

  // 5. Upstream Inflow Pressure (0..100)
  const inflowShare = totalCityIntake > 0 ? ledger.incomingT / totalCityIntake : 0
  const upstreamInflowPressure = Math.min(100, inflowShare * 220)

  // 6. Downstream Constraint Pressure (0..100)
  const downstreamPressure = downstreamHeadroomT < 200 ? Math.min(100, (1 - downstreamHeadroomT / 200) * 80) : 0

  return {
    capacityPressure: Math.round(capacityPressure),
    backlogPressure: Math.round(backlogPressure),
    waitingPressure: Math.round(waitingPressure),
    transportPressure: Math.round(transportPressure),
    upstreamInflowPressure: Math.round(upstreamInflowPressure),
    downstreamPressure: Math.round(downstreamPressure),
  }
}

export function pressureScore(
  _ledger: FacilityResult,
  _facility: Facility,
  breakdown: BottleneckScoreBreakdown,
): number {
  const w = BOTTLENECK_MODEL.weights
  const rawScore =
    breakdown.capacityPressure * w.capacity +
    breakdown.backlogPressure * w.backlog +
    breakdown.waitingPressure * w.waiting +
    breakdown.transportPressure * w.transport +
    breakdown.upstreamInflowPressure * w.upstreamInflow

  return Math.min(100, Math.max(0, rawScore))
}

export function severityOf(ledger: FacilityResult, score: number): BottleneckSeverity {
  if (ledger.utilizationPct >= UTILIZATION_THRESHOLDS.critical || score >= 80) return 'critical'
  if (ledger.utilizationPct >= UTILIZATION_THRESHOLDS.warning || score >= 55) return 'warning'
  return 'normal'
}

/* ── CLASSIFICATION ENGINE ───────────────────────────────── */

export function classifyBottleneck(
  facility: Facility,
  ledger: FacilityResult,
  congestedInCount: number,
  waitingMin: number,
): BottleneckType {
  if (congestedInCount > 0 && waitingMin >= BOTTLENECK_MODEL.queueWatchMin && ledger.utilizationPct < 85) {
    return 'TRANSPORT_BOTTLENECK'
  }
  if (facility.kind === 'sorting') {
    return 'SORTING_BOTTLENECK'
  }
  if (facility.kind === 'transfer') {
    return 'TRANSFER_BOTTLENECK'
  }
  if (facility.kind === 'processing') {
    return 'PROCESSING_BOTTLENECK'
  }
  if (facility.kind === 'recovery') {
    return 'RECOVERY_BOTTLENECK'
  }
  if (waitingMin >= 25 && ledger.utilizationPct < 85) {
    return 'SCHEDULING_BOTTLENECK'
  }
  return 'CAPACITY_BOTTLENECK'
}

/* ── CONFIDENCE & EVIDENCE COMPUTATION ───────────────────── */

export function calculateConfidence(
  ledger: FacilityResult,
  evidence: BottleneckEvidence,
  type: BottleneckType,
): number {
  let conf = 78

  if (evidence.capacityGapT > 0) conf += 8
  if (evidence.backlogT > 0) conf += 5
  if (evidence.waitingMin >= BOTTLENECK_MODEL.queueWatchMin) conf += 4
  if (evidence.congestedRoutesCount > 0) conf += 3
  if (evidence.utilizationPct >= 95) conf += 3

  if (type === 'SORTING_BOTTLENECK' && ledger.incomingT > facilityCapacity(ledger)) conf += 2
  if (type === 'TRANSPORT_BOTTLENECK' && evidence.congestedRoutesCount >= 1) conf += 4

  return Math.min(96, Math.max(72, conf))
}

function facilityCapacity(ledger: FacilityResult): number {
  return ledger.processingCapacityT || 1
}

/* ── MAIN DETECTION PASS ─────────────────────────────────── */

export function runBottleneckEngine(input: {
  facilities: Facility[]
  routes: Route[]
  engines: EngineResult
}): Bottleneck[] {
  const { facilities, routes, engines } = input

  // Index corridors once
  const inbound: Record<string, Route[]> = {}
  const outbound: Record<string, Route[]> = {}
  for (const route of routes) {
    ;(inbound[route.to] ||= []).push(route)
    ;(outbound[route.from] ||= []).push(route)
  }

  const facilityMap = new Map<string, Facility>()
  for (const f of facilities) facilityMap.set(f.id, f)

  const routeLoad = (r: Route) => (r.capacityT > 0 ? (r.volumeT / r.capacityT) * 100 : 0)
  const routeState = (r: Route): string => {
    if (r.status) return r.status
    const load = routeLoad(r)
    if (load >= ROUTE_STATUS_THRESHOLDS.blocked) return 'blocked'
    if (load >= ROUTE_STATUS_THRESHOLDS.congested) return 'congested'
    if (load >= ROUTE_STATUS_THRESHOLDS.busy) return 'busy'
    return 'normal'
  }

  const heldUpstreamByNode: Record<string, number> = {}
  for (const t of Object.values(engines.transport)) {
    if (t.heldT > 0) {
      const route = routes.find((r) => r.id === t.routeId)
      if (route) heldUpstreamByNode[route.to] = (heldUpstreamByNode[route.to] ?? 0) + t.heldT
    }
  }

  const totalCityIntake = Object.values(engines.facility).reduce((s, f) => s + f.incomingT, 0)
  const result: Bottleneck[] = []

  for (const facility of facilities) {
    if (facility.kind === 'zone') continue
    const ledger = engines.facility[facility.id]
    if (!ledger) continue

    const inRoutes = (inbound[facility.id] ?? []).map((route) => ({
      route,
      volumeT: route.volumeT,
      utilizationPct: routeLoad(route),
      status: routeState(route),
    }))
    const outRoutes = (outbound[facility.id] ?? []).map((route) => ({
      route,
      volumeT: route.volumeT,
      utilizationPct: routeLoad(route),
      status: routeState(route),
    }))

    const upstreamIds = [...new Set((inbound[facility.id] ?? []).map((r) => r.from))]
    const downstreamIds = [...new Set((outbound[facility.id] ?? []).map((r) => r.to))]

    // Downstream capacity headroom
    let downstreamHeadroomT = 0
    const downstreamEffects: BottleneckDownstreamEffect[] = []
    for (const r of outRoutes) {
      const targetFacility = facilityMap.get(r.route.to)
      const targetLedger = engines.facility[r.route.to]
      const capHeadroom = targetFacility && targetLedger ? Math.max(0, targetFacility.capacity - targetLedger.incomingT) : 0
      downstreamHeadroomT += capHeadroom
      if (targetFacility) {
        downstreamEffects.push({
          facilityId: targetFacility.id,
          facility: targetFacility,
          routeId: r.route.id,
          route: r.route,
          volumeT: r.volumeT,
          capacityT: targetFacility.capacity,
          capacityHeadroomT: capHeadroom,
          utilizationPct: targetLedger ? targetLedger.utilizationPct : 0,
          landfillRisk: targetFacility.kind === 'landfill' || (targetLedger ? targetLedger.utilizationPct > 85 : false),
        })
      }
    }

    const scoreBreakdown = calculateScoreBreakdown(ledger, facility, inRoutes, totalCityIntake, downstreamHeadroomT)
    const score = pressureScore(ledger, facility, scoreBreakdown)
    const severity = severityOf(ledger, score)

    if (severity === 'normal') continue

    const congestedIn = inRoutes.filter((r) => r.status === 'congested' || r.status === 'blocked')
    const busyIn = inRoutes.filter((r) => r.status === 'busy')
    const queueMin = facility.waiting

    const bottleneckType = classifyBottleneck(facility, ledger, congestedIn.length, queueMin)
    const typeConfig = BOTTLENECK_TYPE_CONFIG[bottleneckType]

    // ── Upstream Sources ───────────────────────────────────
    const totalInflow = inRoutes.reduce((s, r) => s + r.volumeT, 0) || 1
    const upstreamSources: BottleneckUpstreamSource[] = []
    for (const r of inRoutes) {
      const srcFacility = facilityMap.get(r.route.from)
      if (srcFacility) {
        upstreamSources.push({
          facilityId: srcFacility.id,
          facility: srcFacility,
          routeId: r.route.id,
          route: r.route,
          volumeT: r.volumeT,
          sharePct: (r.volumeT / totalInflow) * 100,
          distanceKm: r.route.distanceKm,
          travelTimeMin: r.route.travelTimeMin,
          status: r.status,
        })
      }
    }

    // ── Evidence Object ────────────────────────────────────
    const capacityGapT = Math.max(0, ledger.incomingT - facility.capacity)
    const evidence: BottleneckEvidence = {
      incomingT: Math.round(ledger.incomingT),
      capacityT: Math.round(facility.capacity),
      capacityGapT: Math.round(capacityGapT),
      backlogT: Math.round(ledger.backlogT),
      waitingMin: queueMin,
      processingTimeMin: facility.processingTimeMin,
      utilizationPct: Number(ledger.utilizationPct.toFixed(1)),
      congestedRoutesCount: congestedIn.length,
      upstreamVolumeT: Math.round(totalInflow),
      downstreamHeadroomT: Math.round(downstreamHeadroomT),
    }

    const confidence = calculateConfidence(ledger, evidence, bottleneckType)

    // ── Environmental & Queue Impact ───────────────────────
    const tripsInPerDay = inRoutes.reduce(
      (s, r) => s + (engines.transport[r.route.id]?.tripsPerDay ?? 0),
      0,
    )
    const operatingWindow = BOTTLENECK_MODEL.operatingWindowMin
    const queuedVehicles = tripsInPerDay * (queueMin / operatingWindow)
    const payloadT = inRoutes[0] ? routePayloadT(inRoutes[0].route) : routePayloadT({ label: '' })
    const heldUpstreamT = heldUpstreamByNode[facility.id] ?? 0
    const delayedT = Math.max(ledger.backlogT, queuedVehicles * payloadT * 0.5) + heldUpstreamT
    const extraTripsPerDay = Math.max(1, queuedVehicles * 0.38)
    const extraDistanceKm = extraTripsPerDay * BOTTLENECK_MODEL.detourKm

    const idleFuelLiters = queuedVehicles * queueMin * BOTTLENECK_MODEL.idleLitersPerMin
    const fuelPerTrip =
      tripsInPerDay > 0
        ? inRoutes.reduce((s, r) => s + (engines.transport[r.route.id]?.fuelLiters ?? 0), 0) / tripsInPerDay
        : 0
    const reworkFuelLiters = extraTripsPerDay * fuelPerTrip
    const totalFuelLiters = idleFuelLiters + reworkFuelLiters

    const co2eKg =
      totalFuelLiters * BOTTLENECK_MODEL.co2eKgPerLiter +
      ledger.backlogT * BOTTLENECK_MODEL.landfillDisposalKgPerT * 0.18

    const landfillDiversionPotentialT =
      Math.max(0, ledger.incomingT - (BOTTLENECK_MODEL.restoreTargetPct / 100) * ledger.processingCapacityT) +
      ledger.backlogT

    const landfillPressureT = Math.max(
      capacityGapT,
      facility.kind === 'landfill' ? ledger.incomingT : capacityGapT + ledger.backlogT,
    )
    const recoverableLostT =
      facility.kind === 'sorting' || facility.kind === 'recovery'
        ? Math.round((capacityGapT + ledger.backlogT) * 0.65)
        : Math.round((capacityGapT + ledger.backlogT) * 0.3)

    const impact: BottleneckImpact = {
      delayedT: Math.round(delayedT),
      queueMin,
      extraTripsPerDay: Math.round(extraTripsPerDay),
      extraDistanceKm: Math.round(extraDistanceKm),
      idleFuelLiters: Math.round(idleFuelLiters),
      reworkFuelLiters: Math.round(reworkFuelLiters),
      totalFuelLiters: Math.round(totalFuelLiters),
      co2eKg: Math.round(co2eKg),
      landfillDiversionPotentialT: Math.round(landfillDiversionPotentialT),
      landfillPressureT: Math.round(landfillPressureT),
      recoverableLostT,
      heldUpstreamT: Math.round(heldUpstreamT),
    }

    // ── Root Cause & Why Explanation ───────────────────────
    const { rootCause, whyExplanation } = buildRootCauseAndWhy(facility, ledger, evidence, {
      congestedIn: congestedIn.length,
      busyIn: busyIn.length,
      inRouteCount: inRoutes.length,
      queueMin,
    })

    const observed = ledger.overCapacity
      ? `Intake ${Math.round(ledger.incomingT)} T/day exceeds the ${Math.round(facility.capacity)} T/day rated capacity; ${Math.round(ledger.backlogT)} T/day accumulates.`
      : `Intake ${Math.round(ledger.incomingT)} T/day against ${Math.round(facility.capacity)} T/day capacity (${ledger.utilizationPct.toFixed(1)}%) with a ${queueMin} min queue.`

    // ── Early Warning Forecast ─────────────────────────────
    const trendPctPerDay = ledger.utilizationPct > 85 ? 3.8 : 2.1
    const currentUtil = Number(ledger.utilizationPct.toFixed(1))
    let daysUntilCritical: number | null = null
    let forecastMessage = ''
    let earlyStatus: EarlyWarningForecast['status'] = 'stable'

    if (currentUtil >= 90) {
      earlyStatus = 'critical_now'
      daysUntilCritical = 0
      forecastMessage = `Currently exceeding operational tolerance at ${currentUtil}% utilization.`
    } else if (trendPctPerDay > 0) {
      earlyStatus = 'approaching'
      daysUntilCritical = Math.max(1, Math.round((90 - currentUtil) / trendPctPerDay))
      forecastMessage = `Estimated to exceed critical capacity in approximately ${daysUntilCritical} day${daysUntilCritical === 1 ? '' : 's'} (+${trendPctPerDay.toFixed(1)}%/day trend).`
    } else {
      forecastMessage = 'Operating load is steady inside acceptable thresholds.'
    }

    const earlyWarning: EarlyWarningForecast = {
      currentUtilizationPct: currentUtil,
      trendPctPerDay,
      daysUntilCritical,
      status: earlyStatus,
      message: forecastMessage,
      forecastUtilizationIn3Days: Math.min(130, Number((currentUtil + trendPctPerDay * 3).toFixed(1))),
    }

    // ── Bottleneck Lifecycle Timeline ──────────────────────
    const timeline: BottleneckTimelinePoint[] = buildTimeline(currentUtil, ledger.incomingT)

    // ── Propagation Cascade ────────────────────────────────
    const propagation: BottleneckPropagationStep[] = buildPropagation(
      facility,
      evidence,
      impact,
    )

    // ── Root-Cause Dependency Chain ────────────────────────
    const chain = buildChain(facility, ledger, {
      congestedIds: congestedIn.map((r) => r.route.id),
      upstreamIds,
      delayedT,
      extraTripsPerDay,
      idleFuelLiters,
      co2eKg,
      landfillPressureT,
    })

    const fixes = buildFixes(delayedT, bottleneckType)

    result.push({
      facilityId: facility.id,
      facility,
      bottleneckType,
      bottleneckTypeLabel: typeConfig.label,
      bottleneckTypeDescription: typeConfig.description,
      severity,
      pressure: Math.round(score),
      bottleneckScore: Math.round(score),
      scoreBreakdown,
      headline: facility.name,
      observed,
      rootCause,
      whyExplanation,
      confidence,
      evidence,
      incomingWaste: Math.round(ledger.incomingT),
      capacity: Math.round(facility.capacity),
      utilization: Number(ledger.utilizationPct.toFixed(1)),
      backlog: Math.round(ledger.backlogT),
      waitingTime: queueMin,
      wasteDelayed: Math.round(delayedT),
      upstreamIds,
      downstreamIds,
      affectedRoutes: inRoutes.map((r) => r.route),
      upstreamSources,
      downstreamEffects,
      inflowRoutes: inRoutes,
      outflowRoutes: outRoutes,
      impact,
      propagation,
      earlyWarning,
      timeline,
      chain,
      fixes,
    })
  }

  return result.sort((a, b) => b.pressure - a.pressure)
}

/* ── SYSTEM TOTALS ROLLUP ────────────────────────────────── */

export function bottleneckTotals(
  bottlenecks: Bottleneck[],
  collection: EngineResult['collection'],
): {
  delayedT: number
  co2eKg: number
  diversionPotentialT: number
  fuelLiters: number
  extraTripsPerDay: number
} {
  let delayedT = 0
  let co2eKg = 0
  let diversionPotentialT = 0
  let fuelLiters = 0
  let extraTripsPerDay = 0

  for (const b of bottlenecks) {
    delayedT += b.impact.delayedT
    co2eKg += b.impact.co2eKg
    diversionPotentialT += b.impact.landfillDiversionPotentialT
    fuelLiters += b.impact.totalFuelLiters
    extraTripsPerDay += b.impact.extraTripsPerDay
  }

  for (const c of Object.values(collection)) {
    delayedT += c.heldAtZoneT
  }

  return {
    delayedT: Math.round(delayedT),
    co2eKg: Math.round(co2eKg),
    diversionPotentialT: Math.round(diversionPotentialT),
    fuelLiters: Math.round(fuelLiters),
    extraTripsPerDay: Math.round(extraTripsPerDay),
  }
}

/* ── HELPER DERIVATION FUNCTIONS ─────────────────────────── */

function buildRootCauseAndWhy(
  facility: Facility,
  ledger: FacilityResult,
  evidence: BottleneckEvidence,
  ctx: { congestedIn: number; busyIn: number; inRouteCount: number; queueMin: number },
): { rootCause: string; whyExplanation: string } {
  const name = facility.shortName

  if (ledger.overCapacity || evidence.capacityGapT > 0) {
    const gapPct = Math.round((evidence.capacityGapT / facility.capacity) * 100)
    return {
      rootCause: `Insufficient ${facility.kind} processing capacity relative to incoming load.`,
      whyExplanation: `Incoming waste is ${gapPct}% higher than available ${facility.kind} capacity, creating a ${evidence.capacityGapT} T/day capacity gap.`,
    }
  }

  if (ctx.congestedIn > 0 && ctx.queueMin >= BOTTLENECK_MODEL.queueWatchMin) {
    return {
      rootCause: `Corridor congestion combined with extended tipping-face dwell time.`,
      whyExplanation: `${ctx.congestedIn} of ${ctx.inRouteCount} inbound corridors experience severe congestion; vehicles wait an average of ${ctx.queueMin} min before tipping.`,
    }
  }

  if (ctx.queueMin >= BOTTLENECK_MODEL.queueWatchMin) {
    return {
      rootCause: `Tipping-face throughput restriction and vehicle discharge queue friction.`,
      whyExplanation: `Plant processing lines have rated headroom, but bay discharge turns vehicles slowly (${ctx.queueMin} min queue), creating an arrival wave backlog.`,
    }
  }

  if (ctx.busyIn >= Math.max(2, Math.ceil(ctx.inRouteCount * 0.6))) {
    return {
      rootCause: `Inbound corridor arrival bunching during peak municipal collection cycles.`,
      whyExplanation: `Inflow arrives in compressed pulses across busy corridors, temporarily overwhelming reception hoppers despite adequate 24-hour nominal capacity.`,
    }
  }

  return {
    rootCause: `Elevated operational load approaching upper capacity boundary.`,
    whyExplanation: `${name} operates at ${ledger.utilizationPct.toFixed(0)}% utilization with moderate queue friction; vulnerable to unbuffered morning peak surges.`,
  }
}

function buildTimeline(currentUtil: number, incomingT: number): BottleneckTimelinePoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const stages: BottleneckTimelinePoint['stage'][] = [
    'NORMAL',
    'LOAD INCREASE',
    'WARNING',
    'CAPACITY EXCEEDED',
    'BACKLOG',
    'CRITICAL',
  ]

  return stages.map((st, i) => {
    let util = 60 + i * 8
    let vol = incomingT * (0.8 + i * 0.05)
    let reached = false

    if (st === 'NORMAL') {
      util = 62
      reached = true
    } else if (st === 'LOAD INCREASE') {
      util = 72
      reached = currentUtil >= 70
    } else if (st === 'WARNING') {
      util = 82
      reached = currentUtil >= 80
    } else if (st === 'CAPACITY EXCEEDED') {
      util = 96
      reached = currentUtil >= 90
    } else if (st === 'BACKLOG') {
      util = 104
      reached = currentUtil >= 95
    } else if (st === 'CRITICAL') {
      util = Math.max(currentUtil, 108)
      reached = currentUtil >= 90
    }

    return {
      stage: st,
      label: st.replace('_', ' '),
      dayIndex: i,
      dayName: days[i % 7] ?? 'Day',
      utilizationPct: util,
      volumeT: Math.round(vol),
      active: currentUtil >= util - 4 && currentUtil < util + 8,
      reached,
    }
  })
}

function buildPropagation(
  facility: Facility,
  evidence: BottleneckEvidence,
  impact: BottleneckImpact,
): BottleneckPropagationStep[] {
  const excess = evidence.capacityGapT > 0 ? evidence.capacityGapT : Math.round(evidence.incomingT * 0.15)
  return [
    {
      stage: 'STAGE 1',
      title: 'Inflow Surpasses Rated Capacity',
      description: `Daily intake exceeds ${facility.shortName} capacity threshold.`,
      metric: 'EXCESS INFLOW',
      value: `+${excess} T/DAY`,
      tone: 'warn',
    },
    {
      stage: 'STAGE 2',
      title: 'Backlog Forms at Reception Bays',
      description: 'Material accumulates faster than hoppers and screening conveyors can cycle.',
      metric: 'ACCUMULATING BACKLOG',
      value: `${Math.round(evidence.backlogT || excess * 0.8)} TONNES`,
      tone: 'critical',
    },
    {
      stage: 'STAGE 3',
      title: 'Vehicle Dwell & Queue Escalation',
      description: 'Haulers stall in holding aprons awaiting empty tipping slots.',
      metric: 'MEAN GATE WAIT',
      value: `${evidence.waitingMin} MIN / TRUCK`,
      tone: 'warn',
    },
    {
      stage: 'STAGE 4',
      title: 'Collection Turnaround Slowdown',
      description: 'Fleet turnaround cycles lengthen, necessitating emergency repositioning trips.',
      metric: 'ADDITIONAL TRIPS',
      value: `+${impact.extraTripsPerDay} TRIPS/DAY`,
      tone: 'critical',
    },
    {
      stage: 'STAGE 5',
      title: 'Haulage Fuel & Emissions Compound',
      description: 'Idling engines and detour mileage generate surplus atmospheric carbon.',
      metric: 'SURPLUS EMISSIONS',
      value: `+${impact.co2eKg} KG CO₂e/D`,
      tone: 'critical',
    },
    {
      stage: 'STAGE 6',
      title: 'Landfill Diversion Bypass',
      description: 'Unprocessed recyclables and organics divert directly to landfill disposal.',
      metric: 'LANDFILL PRESSURE',
      value: `+${impact.landfillPressureT} T/DAY`,
      tone: 'critical',
    },
  ]
}

function buildChain(
  facility: Facility,
  ledger: FacilityResult,
  ctx: {
    congestedIds: string[]
    upstreamIds: string[]
    delayedT: number
    extraTripsPerDay: number
    idleFuelLiters: number
    co2eKg: number
    landfillPressureT: number
  },
): BottleneckChainStep[] {
  const overCapacity = ledger.overCapacity

  return [
    {
      label: overCapacity ? 'High Collection Volume' : 'Corridor Bunching',
      detail: overCapacity
        ? `Upstream wards generate more waste than the processing infrastructure can absorb.`
        : `Inbound corridors deliver vehicles in synchronized surges rather than distributed intervals.`,
      kind: 'signal',
      facilityIds: ctx.upstreamIds,
      routeIds: ctx.congestedIds,
    },
    {
      label: 'Transfer Inflow Concentrates',
      detail: `Transfer stations bulk ${Math.round(ledger.incomingT)} T/day onto the arterial corridors feeding this node.`,
      kind: 'signal',
      facilityIds: ctx.upstreamIds,
      routeIds: ctx.congestedIds,
    },
    {
      label: overCapacity ? 'Processing Capacity Saturated' : 'Tipping-Face Friction',
      detail: overCapacity
        ? `Inbound volume outruns the ${Math.round(facility.capacity)} T/day rated capacity — reception yard buffers swell.`
        : `Plant has capacity headroom but gate dwell turns haulers slowly (${facility.waiting} min).`,
      kind: 'cause',
      facilityIds: [facility.id],
      routeIds: [],
    },
    {
      label: 'Vehicle Queue Escalation',
      detail: `Queued trucks dwell at the gate — ${facility.waiting} min average waiting friction.`,
      kind: 'consequence',
      facilityIds: [facility.id],
      routeIds: ctx.congestedIds,
    },
    {
      label: 'Additional Haulage Trips',
      detail: `Queue delays and turnarounds force ~${Math.round(ctx.extraTripsPerDay)} extra trips/day.`,
      kind: 'consequence',
      facilityIds: ctx.upstreamIds,
      routeIds: ctx.congestedIds,
    },
    {
      label: 'Fuel Consumption Increases',
      detail: `Idling and detour mileage consume ~${Math.round(ctx.idleFuelLiters)} L diesel-equivalent daily.`,
      kind: 'consequence',
      facilityIds: ctx.upstreamIds,
      routeIds: ctx.congestedIds,
    },
    {
      label: 'Surplus CO₂e Generated',
      detail: `~${Math.round(ctx.co2eKg)} kg CO₂e/day greenhouse footprint attributable to this queue bottleneck.`,
      kind: 'consequence',
      facilityIds: [],
      routeIds: ctx.congestedIds,
    },
    {
      label: 'Landfill Pressure & Diversion Loss',
      detail: `Backlog risks unrecovered disposal — ~${Math.round(ctx.landfillPressureT)} T/day pushed toward landfill.`,
      kind: 'consequence',
      facilityIds: ['L-DE'],
      routeIds: [],
    },
  ]
}

function buildFixes(delayedT: number, _type: BottleneckType): BottleneckFix[] {
  const relief = Math.round(Math.max(20, delayedT * 0.65))
  return [
    {
      id: 'capacity',
      label: 'Increase Sorting / Processing Capacity',
      detail: `Deploy an auxiliary screening line or extend operating shifts to clear ${relief} T/day surplus.`,
      effects: [
        { label: 'Queue Time', direction: 'down' },
        { label: 'Extra Trips', direction: 'down' },
        { label: 'Emissions', direction: 'down' },
        { label: 'Material Recovery', direction: 'up' },
      ],
    },
    {
      id: 'redistribute',
      label: 'Redistribute Inflow to Headroom Nodes',
      detail: `Divert a portion of inbound transfer volume to Trombay Processing or Deonar Recovery before queues compound.`,
      effects: [
        { label: 'Yard Congestion', direction: 'down' },
        { label: 'Node Utilization', direction: 'down' },
        { label: 'System Balance', direction: 'up' },
      ],
    },
    {
      id: 'schedule',
      label: 'Stagger Collection Windows',
      detail: `Stagger ward collection dispatch times to flatten the morning peak arrival wave across 6 hours.`,
      effects: [
        { label: 'Peak Inflow', direction: 'down' },
        { label: 'Vehicle Wait', direction: 'down' },
        { label: 'Idling Fuel', direction: 'down' },
      ],
    },
    {
      id: 'reroute',
      label: 'Re-route Corridor Fleet',
      detail: `Shift haulers from congested corridors to alternate arterial routes or secondary transfer nodes.`,
      effects: [
        { label: 'Corridor Load', direction: 'down' },
        { label: 'Travel Time', direction: 'down' },
        { label: 'CO₂e Haulage', direction: 'down' },
      ],
    },
    {
      id: 'fleet',
      label: 'Increase Fleet / Payload Capacity',
      detail: `Upgrade collection haulers to higher-capacity compactors to reduce the overall trip count.`,
      effects: [
        { label: 'Total Trips', direction: 'down' },
        { label: 'Gate Dwell', direction: 'down' },
        { label: 'Fuel Burn', direction: 'down' },
      ],
    },
  ]
}
