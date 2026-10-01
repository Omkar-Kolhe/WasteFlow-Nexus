import type { Bottleneck } from './bottleneckEngine'
import type { Facility, Route, Vehicle } from '@/types'

/**
 * SIMULATION LAB TYPES (Phase 6)
 */

export interface SimulationParameters {
  // A. VEHICLES & FLEET
  fleetCountDelta: number // -10 .. +30 trucks
  vehiclePayloadMultiplier: number // 0.8 .. 1.6x payload
  electricFleetSharePct: number // 0 .. 100%

  // B. COLLECTION
  collectionFrequencyMultiplier: number // 0.8 .. 1.4x (service frequency)
  generationVolumeMultiplier: number // 0.8 .. 1.3x (waste generation load)

  // C. SORTING
  kanjurmargSortingCapacity: number // T/day (baseline 3500)
  deonarSortingCapacity: number // T/day (baseline 3600)
  sortingOperatingHours: number // 8 .. 24 hours (shifts)

  // D. PROCESSING (AD & BIOGAS)
  kanjurmargProcessingCapacity: number // T/day (baseline 1150)
  trombayProcessingCapacity: number // T/day (baseline 1200)
  processingOperatingHours: number // 8 .. 24 hours

  // E. RECOVERY
  kanjurmargRecoveryCapacity: number // T/day (baseline 1900)
  deonarRecoveryCapacity: number // T/day (baseline 2600)
  targetRecoveryRatePct: number // 40 .. 85%

  // F. TRANSFER STATIONS
  mulundTransferCapacity: number // T/day (baseline 1500)
  kanjurmargTransferCapacity: number // T/day (baseline 4600)
  deonarTransferCapacity: number // T/day (baseline 2200)

  // G. ROUTES & LOGISTICS
  unblockSionCircleRoute: boolean // unblocks RT-06
  routeDistanceOptimizationPct: number // 0 .. 25% detour reduction
  routeCongestionRelief: boolean // relieves busy/congested arterial links
}

export interface SimulationMetricsSummary {
  wasteGeneratedT: number
  wasteCollectedT: number
  wasteProcessedT: number
  wasteRecoveredT: number
  wasteToLandfillT: number
  recoveryRatePct: number
  landfillLoadPct: number
  backlogT: number
  activeVehicles: number
  tripsToday: number
  distanceTonneKm: number
  fuelLiters: number
  co2eKg: number
  transportCo2eKg: number
  facilityCo2eKg: number
  meanQueueMin: number
  systemUtilizationPct: number
  criticalBottlenecksCount: number
  warningBottlenecksCount: number
}

export interface SimulationMetricDelta {
  label: string
  baselineValue: number
  simulatedValue: number
  unit: string
  deltaAbsolute: number
  deltaPct: number
  polarity: 'higher-better' | 'lower-better' | 'neutral'
  isPositive: boolean
}

export interface SimulationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SimulationPreset {
  id: string
  label: string
  shortDescription: string
  fullDescription: string
  parameters: Partial<SimulationParameters>
  tag: string
}

export interface SimulationScenarioSnapshot {
  scenarioId: string
  scenarioName: string
  description?: string
  baselineParameters: SimulationParameters
  simulationParameters: SimulationParameters
  baselineMetrics: SimulationMetricsSummary
  simulatedMetrics: SimulationMetricsSummary
  deltas: Record<string, SimulationMetricDelta>
  changedVariables: {
    category: string
    name: string
    baseline: string | number
    simulated: string | number
    unit?: string
  }[]
  bottlenecksBefore: Bottleneck[]
  bottlenecksAfter: Bottleneck[]
  resolvedBottlenecksCount: number
  environmentalImpact: {
    co2eDeltaPct: number
    co2eDeltaKg: number
    landfillDeltaPct: number
    landfillDeltaT: number
    fuelDeltaPct: number
    fuelDeltaLiters: number
    tripsDeltaPct: number
    recoveryDeltaPct: number
    backlogDeltaPct: number
  }
  timestamp: string
}

export interface SimulationRunResult {
  simulatedFacilities: Facility[]
  simulatedRoutes: Route[]
  simulatedVehicles: Vehicle[]
  baselineMetrics: SimulationMetricsSummary
  simulatedMetrics: SimulationMetricsSummary
  deltas: Record<string, SimulationMetricDelta>
  bottlenecksBefore: Bottleneck[]
  bottlenecksAfter: Bottleneck[]
  resolvedBottlenecks: {
    facilityId: string
    facilityName: string
    beforeSeverity: string
    afterSeverity: string
    status: 'RESOLVED' | 'RELIEVED' | 'PERSISTENT' | 'DEGRADED'
  }[]
  environmentalImpact: SimulationScenarioSnapshot['environmentalImpact']
}
