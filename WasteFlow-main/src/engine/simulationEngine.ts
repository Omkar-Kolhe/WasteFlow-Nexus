import type { Facility, Route, Vehicle } from '@/types'
import { buildTwinModel, nodes, type TwinModel } from '@/data/metrics'
import { routes as baseRoutes } from '@/data/routes'
import { vehicles as baseVehicles } from '@/data/vehicles'
import type {
  SimulationMetricDelta,
  SimulationMetricsSummary,
  SimulationParameters,
  SimulationPreset,
  SimulationRunResult,
  SimulationScenarioSnapshot,
  SimulationValidationResult,
} from './simulationTypes'

/**
 * DEFAULT BASELINE PARAMETERS
 */
export const DEFAULT_SIMULATION_PARAMETERS: SimulationParameters = {
  // A. Vehicles
  fleetCountDelta: 0,
  vehiclePayloadMultiplier: 1.0,
  electricFleetSharePct: 15,

  // B. Collection
  collectionFrequencyMultiplier: 1.0,
  generationVolumeMultiplier: 1.0,

  // C. Sorting
  kanjurmargSortingCapacity: 3500,
  deonarSortingCapacity: 3600,
  sortingOperatingHours: 8,

  // D. Processing
  kanjurmargProcessingCapacity: 1150,
  trombayProcessingCapacity: 1200,
  processingOperatingHours: 12,

  // E. Recovery
  kanjurmargRecoveryCapacity: 1900,
  deonarRecoveryCapacity: 2600,
  targetRecoveryRatePct: 55.9,

  // F. Transfer
  mulundTransferCapacity: 1500,
  kanjurmargTransferCapacity: 4600,
  deonarTransferCapacity: 2200,

  // G. Routes
  unblockSionCircleRoute: false,
  routeDistanceOptimizationPct: 0,
  routeCongestionRelief: false,
}

/**
 * SCENARIO PRESETS (Phase 6 §4)
 */
export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'BALANCED',
    label: 'Balanced Modernization',
    shortDescription: 'Moderate capacity expansion & fleet modernization across all stages.',
    fullDescription:
      'Increases sorting capacity by 15%, adds 4 modern collection haulers, unblocks the Sion Circle corridor, and boosts recovery efficiency to 62%.',
    tag: 'RECOMMENDED',
    parameters: {
      fleetCountDelta: 4,
      vehiclePayloadMultiplier: 1.1,
      electricFleetSharePct: 35,
      kanjurmargSortingCapacity: 4025, // +15%
      deonarSortingCapacity: 4140, // +15%
      sortingOperatingHours: 12,
      kanjurmargRecoveryCapacity: 2200,
      deonarRecoveryCapacity: 2900,
      targetRecoveryRatePct: 62.0,
      unblockSionCircleRoute: true,
      routeCongestionRelief: true,
      routeDistanceOptimizationPct: 6,
    },
  },
  {
    id: 'FLEET_EXPANSION',
    label: 'Fleet Expansion & Payload',
    shortDescription: 'Deploy +8 high-capacity compactor units with electric conversion.',
    fullDescription:
      'Expands fleet capacity by 25%, upgrades transfer payloads to 24T, increases electric powertrain share to 50%, and reduces trip rework cycles.',
    tag: 'LOGISTICS',
    parameters: {
      fleetCountDelta: 8,
      vehiclePayloadMultiplier: 1.25,
      electricFleetSharePct: 50,
      collectionFrequencyMultiplier: 1.15,
      routeCongestionRelief: true,
      routeDistanceOptimizationPct: 8,
    },
  },
  {
    id: 'SORTING_EXPANSION',
    label: 'Sorting Infrastructure Relief',
    shortDescription: 'Targeted +25% capacity boost at Kanjurmarg MRF + 2nd shift.',
    fullDescription:
      'Directly eliminates the Kanjurmarg Sorting critical bottleneck by adding a second screening shift (16h operating window) and increasing rated intake to 4,375 T/day.',
    tag: 'BOTTLENECK FIX',
    parameters: {
      kanjurmargSortingCapacity: 4375, // +25%
      deonarSortingCapacity: 4200,
      sortingOperatingHours: 16, // Double shift
      kanjurmargTransferCapacity: 5000,
    },
  },
  {
    id: 'ROUTE_OPTIMIZATION',
    label: 'Green Corridors & Sion Clearance',
    shortDescription: 'Clear waterlogged Sion Circle arterial and optimize haul routes.',
    fullDescription:
      'Unblocks RT-06 from Kurla ward, re-routes heavy haulers away from congested corridors, and cuts overall transit distance by 15%.',
    tag: 'TRAFFIC & FLOW',
    parameters: {
      unblockSionCircleRoute: true,
      routeCongestionRelief: true,
      routeDistanceOptimizationPct: 15,
      electricFleetSharePct: 40,
    },
  },
  {
    id: 'RECOVERY_BOOST',
    label: 'Zero-Waste Circularity Target',
    shortDescription: 'Elevate material recovery to 75% and divert landfill residue.',
    fullDescription:
      'Expands Kanjurmarg & Deonar recovery works to 2,600 and 3,400 T/day, cuts unsegregated landfill dumping by over 30%, and optimizes digestate reuse.',
    tag: 'CIRCULARITY',
    parameters: {
      kanjurmargRecoveryCapacity: 2600,
      deonarRecoveryCapacity: 3400,
      kanjurmargProcessingCapacity: 1500,
      trombayProcessingCapacity: 1600,
      targetRecoveryRatePct: 75.0,
      kanjurmargSortingCapacity: 4200,
      deonarSortingCapacity: 4200,
    },
  },
  {
    id: 'EXTENDED_OPERATIONS',
    label: '24/7 Extended Facility Shifts',
    shortDescription: 'Operate triple shifts across sorting & processing plants.',
    fullDescription:
      'Expands facility operating windows to 20h/day, slashing gate dwell queues from 38 min to 8 min and flattening peak morning intake waves.',
    tag: 'OPERATIONS',
    parameters: {
      sortingOperatingHours: 20,
      processingOperatingHours: 20,
      kanjurmargSortingCapacity: 4400,
      deonarSortingCapacity: 4400,
      kanjurmargTransferCapacity: 5200,
    },
  },
]

/**
 * VALIDATE SIMULATION PARAMETERS (Phase 6 §14)
 */
export function validateSimulationParameters(
  params: SimulationParameters,
): SimulationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (params.kanjurmargSortingCapacity < 1000) {
    errors.push('Kanjurmarg sorting capacity cannot be lower than 1,000 T/day (minimum physical intake).')
  }
  if (params.deonarSortingCapacity < 1000) {
    errors.push('Deonar sorting capacity cannot be lower than 1,000 T/day.')
  }
  if (params.fleetCountDelta < -30) {
    errors.push('Cannot reduce active fleet count below municipal minimum operational threshold.')
  }
  if (params.vehiclePayloadMultiplier < 0.5) {
    errors.push('Vehicle payload multiplier is below minimum vehicle volume threshold.')
  }
  if (params.targetRecoveryRatePct > 95) {
    warnings.push('Target recovery rate above 95% exceeds physical residual waste sorting limits.')
  }
  if (params.sortingOperatingHours > 24 || params.sortingOperatingHours < 4) {
    errors.push('Operating hours must be between 4 and 24 hours per day.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * EXTRACT METRICS SUMMARY HELPER
 */
export function extractMetricsSummary(model: TwinModel): SimulationMetricsSummary {
  const { city } = model.engine
  const criticalCount = model.bottlenecks.filter((b) => b.severity === 'critical').length
  const warningCount = model.bottlenecks.filter((b) => b.severity === 'warning').length

  return {
    wasteGeneratedT: Math.round(city.generatedTodayT),
    wasteCollectedT: Math.round(city.collectedTodayT),
    wasteProcessedT: Math.round(city.processedTodayT),
    wasteRecoveredT: Math.round(city.recoveredTodayT),
    wasteToLandfillT: Math.round(city.landfillTodayT),
    recoveryRatePct: Number(city.recoveryRatePct.toFixed(1)),
    landfillLoadPct: Number(city.landfillLoadPct.toFixed(1)),
    backlogT: Math.round(city.backlogTodayT),
    activeVehicles: model.totals.activeVehicles,
    tripsToday: Math.round(city.tripsToday + city.collectionTripsToday),
    distanceTonneKm: Math.round(city.tonneKm),
    fuelLiters: Math.round(city.fuelLiters),
    co2eKg: Math.round(city.co2eKg),
    transportCo2eKg: Math.round(city.transportCo2eKg),
    facilityCo2eKg: Math.round(city.facilityCo2eKg),
    meanQueueMin: Math.round(city.meanQueueMin),
    systemUtilizationPct: Number(city.systemUtilizationPct.toFixed(1)),
    criticalBottlenecksCount: criticalCount,
    warningBottlenecksCount: warningCount,
  }
}

/**
 * COMPUTE METRIC DELTAS
 */
export function computeDeltas(
  baseline: SimulationMetricsSummary,
  simulated: SimulationMetricsSummary,
): Record<string, SimulationMetricDelta> {
  const makeDelta = (
    label: string,
    bVal: number,
    sVal: number,
    unit: string,
    polarity: 'higher-better' | 'lower-better' | 'neutral',
  ): SimulationMetricDelta => {
    const diff = sVal - bVal
    const pct = bVal !== 0 ? (diff / bVal) * 100 : 0
    const isPositive =
      polarity === 'higher-better' ? diff > 0 : polarity === 'lower-better' ? diff < 0 : true

    return {
      label,
      baselineValue: bVal,
      simulatedValue: sVal,
      unit,
      deltaAbsolute: Number(diff.toFixed(1)),
      deltaPct: Number(pct.toFixed(1)),
      polarity,
      isPositive,
    }
  }

  return {
    wasteProcessed: makeDelta('Waste Processed', baseline.wasteProcessedT, simulated.wasteProcessedT, 'T/day', 'higher-better'),
    recoveryRate: makeDelta('Recovery Rate', baseline.recoveryRatePct, simulated.recoveryRatePct, '%', 'higher-better'),
    wasteToLandfill: makeDelta('Landfill Intake', baseline.wasteToLandfillT, simulated.wasteToLandfillT, 'T/day', 'lower-better'),
    backlog: makeDelta('System Backlog', baseline.backlogT, simulated.backlogT, 'T', 'lower-better'),
    totalTrips: makeDelta('Fleet Trips', baseline.tripsToday, simulated.tripsToday, '/day', 'lower-better'),
    fuelBurn: makeDelta('Total Fuel Burn', baseline.fuelLiters, simulated.fuelLiters, 'L/day', 'lower-better'),
    co2e: makeDelta('Total CO₂e Footprint', baseline.co2eKg, simulated.co2eKg, 'kg/day', 'lower-better'),
    meanQueue: makeDelta('Mean Queue Dwell', baseline.meanQueueMin, simulated.meanQueueMin, 'min', 'lower-better'),
    utilization: makeDelta('System Utilization', baseline.systemUtilizationPct, simulated.systemUtilizationPct, '%', 'lower-better'),
    criticalBottlenecks: makeDelta('Critical Bottlenecks', baseline.criticalBottlenecksCount, simulated.criticalBottlenecksCount, '', 'lower-better'),
  }
}

/**
 * RUN FULL WHAT-IF SIMULATION (Phase 6 Core Engine)
 *
 * Takes simulation parameters, modifies network entities, runs the actual Phase 3 & 5 engines,
 * produces an authentic simulated TwinModel, diffs the metrics, and reports resolved bottlenecks!
 */
export function runSimulation(
  params: SimulationParameters,
  baselineModel: TwinModel,
): { simulatedModel: TwinModel; result: SimulationRunResult } {
  // 1. Clone Facilities and Apply Modifications
  const simFacilities: Facility[] = nodes.map((node: Facility) => {
    const f = { ...node, mix: { ...node.mix }, tags: [...node.tags] }

    // Modify specific facility capacities & operating parameters
    if (f.id === 'S-KJ') {
      f.capacity = params.kanjurmargSortingCapacity
      // Extended hours reduce queue dwell time
      const hoursRatio = 8 / Math.max(8, params.sortingOperatingHours)
      f.waiting = Math.round(38 * hoursRatio)
    } else if (f.id === 'S-DE') {
      f.capacity = params.deonarSortingCapacity
      const hoursRatio = 8 / Math.max(8, params.sortingOperatingHours)
      f.waiting = Math.round(16 * hoursRatio)
    } else if (f.id === 'T-MU') {
      f.capacity = params.mulundTransferCapacity
    } else if (f.id === 'T-KJ') {
      f.capacity = params.kanjurmargTransferCapacity
      const hoursRatio = 8 / Math.max(8, params.sortingOperatingHours)
      f.waiting = Math.round(21 * hoursRatio)
    } else if (f.id === 'T-DE') {
      f.capacity = params.deonarTransferCapacity
    } else if (f.id === 'P-KJ') {
      f.capacity = params.kanjurmargProcessingCapacity
      const hoursRatio = 12 / Math.max(8, params.processingOperatingHours)
      f.waiting = Math.round(8 * hoursRatio)
    } else if (f.id === 'P-TR') {
      f.capacity = params.trombayProcessingCapacity
      const hoursRatio = 12 / Math.max(8, params.processingOperatingHours)
      f.waiting = Math.round(5 * hoursRatio)
    } else if (f.id === 'R-KJ') {
      f.capacity = params.kanjurmargRecoveryCapacity
    } else if (f.id === 'R-DE') {
      f.capacity = params.deonarRecoveryCapacity
    }

    // Adjust collection zones if volume multiplier is modified
    if (f.kind === 'zone' && f.collection) {
      const genVol = f.collection.generatedT * params.generationVolumeMultiplier
      const collected = genVol * (f.collection.collectionRate * params.collectionFrequencyMultiplier)
      f.collection = {
        ...f.collection,
        generatedT: Math.round(genVol),
        collectedT: Math.round(Math.min(genVol, collected)),
        uncollectedT: Math.round(Math.max(0, genVol - collected)),
        collectionRate: Math.min(1.0, f.collection.collectionRate * params.collectionFrequencyMultiplier),
      }
    }

    return f
  })

  // 2. Clone Routes and Apply Logistics Modifications
  const simRoutes: Route[] = baseRoutes.map((route) => {
    const r = { ...route, fuelMix: { ...route.fuelMix } }

    // Unblock Sion Circle route RT-06
    if (r.id === 'RT-06' && params.unblockSionCircleRoute) {
      delete r.status
      r.note = 'RE-OPENED via drainage bypass — flow restored to normal operation.'
    }

    // Apply distance optimization
    if (params.routeDistanceOptimizationPct > 0) {
      r.distanceKm = Number((r.distanceKm * (1 - params.routeDistanceOptimizationPct / 100)).toFixed(1))
      r.travelTimeMin = Math.round(r.travelTimeMin * (1 - params.routeDistanceOptimizationPct / 100))
    }

    // Apply congestion relief
    if (params.routeCongestionRelief && (r.status === 'congested' || r.status === 'busy')) {
      delete r.status
    }

    // Apply vehicle fleet delta & payload multiplier
    if (params.vehiclePayloadMultiplier !== 1.0) {
      r.capacityT = Math.round(r.capacityT * params.vehiclePayloadMultiplier)
    }

    if (params.fleetCountDelta !== 0) {
      const share = r.vehicleCount / 89
      r.vehicleCount = Math.max(1, Math.round(r.vehicleCount + params.fleetCountDelta * share))
    }

    // Apply electric fleet conversion
    if (params.electricFleetSharePct > 0) {
      const elecShare = params.electricFleetSharePct / 100
      const remainingShare = 1 - elecShare
      r.fuelMix = {
        electric: elecShare,
        cng: (r.fuelMix.cng || 0.4) * remainingShare,
        diesel: (r.fuelMix.diesel || 0.6) * remainingShare,
      }
    }

    return r
  })

  // 3. Clone Vehicles and adjust counts
  const simVehicles: Vehicle[] = baseVehicles.map((v) => {
    const veh = { ...v }
    if (params.vehiclePayloadMultiplier !== 1.0) {
      veh.capacityT = Math.round(veh.capacityT * params.vehiclePayloadMultiplier)
    }
    return veh
  })

  // 4. Build Complete Simulated Twin Model through Existing Engine Pipeline
  const simulatedModel = buildTwinModel({
    facilities: simFacilities,
    routes: simRoutes,
    vehicles: simVehicles,
  })

  // 5. Extract summaries and compare
  const baselineMetrics = extractMetricsSummary(baselineModel)
  const simulatedMetrics = extractMetricsSummary(simulatedModel)
  const deltas = computeDeltas(baselineMetrics, simulatedMetrics)

  const bottlenecksBefore = baselineModel.bottlenecks
  const bottlenecksAfter = simulatedModel.bottlenecks

  // Analyze bottleneck resolutions
  const afterMap = new Map(bottlenecksAfter.map((b) => [b.facilityId, b]))
  const resolvedBottlenecks = bottlenecksBefore.map((bBefore) => {
    const bAfter = afterMap.get(bBefore.facilityId)
    let status: 'RESOLVED' | 'RELIEVED' | 'PERSISTENT' | 'DEGRADED' = 'PERSISTENT'
    if (!bAfter) {
      status = 'RESOLVED'
    } else if (bBefore.severity === 'critical' && bAfter.severity === 'warning') {
      status = 'RELIEVED'
    } else if (bBefore.severity === 'warning' && bAfter.severity === 'critical') {
      status = 'DEGRADED'
    } else {
      status = 'PERSISTENT'
    }

    return {
      facilityId: bBefore.facilityId,
      facilityName: bBefore.facility.name,
      beforeSeverity: bBefore.severity.toUpperCase(),
      afterSeverity: bAfter ? bAfter.severity.toUpperCase() : 'NORMAL (HEALTHY)',
      status,
    }
  })

  const co2eDeltaKg = simulatedMetrics.co2eKg - baselineMetrics.co2eKg
  const co2eDeltaPct = baselineMetrics.co2eKg > 0 ? (co2eDeltaKg / baselineMetrics.co2eKg) * 100 : 0

  const landfillDeltaT = simulatedMetrics.wasteToLandfillT - baselineMetrics.wasteToLandfillT
  const landfillDeltaPct =
    baselineMetrics.wasteToLandfillT > 0 ? (landfillDeltaT / baselineMetrics.wasteToLandfillT) * 100 : 0

  const fuelDeltaLiters = simulatedMetrics.fuelLiters - baselineMetrics.fuelLiters
  const fuelDeltaPct = baselineMetrics.fuelLiters > 0 ? (fuelDeltaLiters / baselineMetrics.fuelLiters) * 100 : 0

  const tripsDelta = simulatedMetrics.tripsToday - baselineMetrics.tripsToday
  const tripsDeltaPct = baselineMetrics.tripsToday > 0 ? (tripsDelta / baselineMetrics.tripsToday) * 100 : 0

  const recoveryDeltaPct = simulatedMetrics.recoveryRatePct - baselineMetrics.recoveryRatePct
  const backlogDeltaPct =
    baselineMetrics.backlogT > 0
      ? ((simulatedMetrics.backlogT - baselineMetrics.backlogT) / baselineMetrics.backlogT) * 100
      : 0

  const environmentalImpact: SimulationScenarioSnapshot['environmentalImpact'] = {
    co2eDeltaPct: Number(co2eDeltaPct.toFixed(1)),
    co2eDeltaKg: Math.round(co2eDeltaKg),
    landfillDeltaPct: Number(landfillDeltaPct.toFixed(1)),
    landfillDeltaT: Math.round(landfillDeltaT),
    fuelDeltaPct: Number(fuelDeltaPct.toFixed(1)),
    fuelDeltaLiters: Math.round(fuelDeltaLiters),
    tripsDeltaPct: Number(tripsDeltaPct.toFixed(1)),
    recoveryDeltaPct: Number(recoveryDeltaPct.toFixed(1)),
    backlogDeltaPct: Number(backlogDeltaPct.toFixed(1)),
  }

  const result: SimulationRunResult = {
    simulatedFacilities: simFacilities,
    simulatedRoutes: simRoutes,
    simulatedVehicles: simVehicles,
    baselineMetrics,
    simulatedMetrics,
    deltas,
    bottlenecksBefore,
    bottlenecksAfter,
    resolvedBottlenecks,
    environmentalImpact,
  }

  return { simulatedModel, result }
}

/**
 * GENERATE SNAPSHOT OBJECT
 */
export function createScenarioSnapshot(
  name: string,
  params: SimulationParameters,
  simResult: SimulationRunResult,
): SimulationScenarioSnapshot {
  const changedVariables: SimulationScenarioSnapshot['changedVariables'] = []

  const check = (
    category: string,
    vName: string,
    base: string | number,
    sim: string | number,
    unit?: string,
  ) => {
    if (base !== sim) {
      changedVariables.push({ category, name: vName, baseline: base, simulated: sim, unit })
    }
  }

  check('FLEET', 'Fleet Units Delta', '0 trucks', `${params.fleetCountDelta >= 0 ? '+' : ''}${params.fleetCountDelta} trucks`)
  check('FLEET', 'Vehicle Payload Multiplier', '1.0x', `${params.vehiclePayloadMultiplier.toFixed(2)}x`)
  check('FLEET', 'Electric Powertrain Share', '15%', `${params.electricFleetSharePct}%`)
  check('SORTING', 'Kanjurmarg Sorting Capacity', '3,500 T/day', `${params.kanjurmargSortingCapacity.toLocaleString()} T/day`)
  check('SORTING', 'Deonar Sorting Capacity', '3,600 T/day', `${params.deonarSortingCapacity.toLocaleString()} T/day`)
  check('SORTING', 'Sorting Operating Hours', '8 hours', `${params.sortingOperatingHours} hours`)
  check('PROCESSING', 'Kanjurmarg Processing Capacity', '1,150 T/day', `${params.kanjurmargProcessingCapacity.toLocaleString()} T/day`)
  check('PROCESSING', 'Trombay Processing Capacity', '1,200 T/day', `${params.trombayProcessingCapacity.toLocaleString()} T/day`)
  check('RECOVERY', 'Target Recovery Rate', '55.9%', `${params.targetRecoveryRatePct}%`)
  check('LOGISTICS', 'Sion Circle Arterial (RT-06)', 'Blocked', params.unblockSionCircleRoute ? 'Restored & Flowing' : 'Blocked')
  check('LOGISTICS', 'Corridor Distance Optimization', '0%', `${params.routeDistanceOptimizationPct}%`)

  const resolvedCount = simResult.resolvedBottlenecks.filter((b) => b.status === 'RESOLVED').length

  return {
    scenarioId: `SCENARIO-${Date.now().toString(36).toUpperCase()}`,
    scenarioName: name.trim() || 'Custom Intervention Scenario',
    baselineParameters: DEFAULT_SIMULATION_PARAMETERS,
    simulationParameters: { ...params },
    baselineMetrics: simResult.baselineMetrics,
    simulatedMetrics: simResult.simulatedMetrics,
    deltas: simResult.deltas,
    changedVariables,
    bottlenecksBefore: simResult.bottlenecksBefore,
    bottlenecksAfter: simResult.bottlenecksAfter,
    resolvedBottlenecksCount: resolvedCount,
    environmentalImpact: simResult.environmentalImpact,
    timestamp: new Date().toISOString(),
  }
}
