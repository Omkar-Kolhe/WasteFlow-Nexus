import type { Bottleneck } from './bottleneckEngine'
import type {
  SimulationMetricDelta,
  SimulationMetricsSummary,
  SimulationParameters,
} from './simulationTypes'
import type { OptimizationTradeoffs } from './optimizationTypes'

/**
 * SCENARIO LAB TYPES (Phase 8)
 */

export type ScenarioStatus = 'DRAFT' | 'SIMULATED' | 'SAVED' | 'UPDATED'

export interface ScenarioChangedVariable {
  category: string
  name: string
  baseline: string | number
  simulated: string | number
  unit?: string
}

export interface ScenarioCausalStep {
  label: string
  detail: string
  tone: 'critical' | 'warn' | 'signal' | 'cyan'
}

export interface ScenarioStorySlide {
  stage: 'PROBLEM' | 'INTERVENTION' | 'CHANGE' | 'ENVIRONMENT' | 'RESULT'
  title: string
  headline: string
  description: string
  keyMetrics: { label: string; value: string; tone?: 'signal' | 'warn' | 'critical' }[]
}

export interface ScenarioDetailData {
  scenarioId: string
  scenarioName: string
  description: string
  status: ScenarioStatus
  targetFacilityId?: string
  targetFacilityName: string
  targetRouteId?: string
  targetRouteName?: string
  category: string
  interventionSummary: string
  createdAt: string
  updatedAt: string

  // Parameters
  baselineParameters: SimulationParameters
  simulationParameters: SimulationParameters
  changedVariables: ScenarioChangedVariable[]

  // Metrics
  baselineMetrics: SimulationMetricsSummary
  simulatedMetrics: SimulationMetricsSummary
  deltas: Record<string, SimulationMetricDelta>

  // Bottlenecks
  bottlenecksBefore: Bottleneck[]
  bottlenecksAfter: Bottleneck[]
  bottleneckDiff: {
    facilityId: string
    facilityName: string
    beforeSeverity: string
    afterSeverity: string
    status: 'RESOLVED' | 'REDUCED' | 'UNCHANGED' | 'NEW'
  }[]

  // Environmental Impact
  environmentalImpact: {
    co2eDeltaPct: number
    co2eDeltaKg: number
    co2eDeltaT: number
    landfillDeltaPct: number
    landfillDeltaT: number
    fuelDeltaPct: number
    fuelDeltaLiters: number
    tripsDeltaPct: number
    tripsDeltaCount: number
    recoveryDeltaPct: number
    wasteDivertedT: number
    backlogDeltaPct: number
  }

  // Trade-offs
  tradeoffs: OptimizationTradeoffs

  // Flow Transformation
  flowStages: {
    current: {
      collectionStatus: string
      transferStatus: string
      sortingStatus: 'critical' | 'warning' | 'normal'
      sortingNote: string
      processingStatus: 'critical' | 'warning' | 'normal'
      landfillLoadT: number
      recoveryRatePct: number
    }
    scenario: {
      collectionStatus: string
      transferStatus: string
      sortingStatus: 'critical' | 'warning' | 'normal'
      sortingNote: string
      processingStatus: 'critical' | 'warning' | 'normal'
      landfillLoadT: number
      recoveryRatePct: number
    }
  }

  // Causal Chains
  causalChainBefore: ScenarioCausalStep[]
  causalChainAfter: ScenarioCausalStep[]

  // Presentation Story Slides
  storySlides: ScenarioStorySlide[]
}

export interface ScenarioFilterOptions {
  searchQuery: string
  categoryFilter: string
  statusFilter: string
  impactFilter: 'ALL' | 'HIGH_CO2' | 'HIGH_LANDFILL' | 'HIGH_RECOVERY'
}
