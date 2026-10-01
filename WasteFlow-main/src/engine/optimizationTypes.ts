import type {
  SimulationMetricDelta,
  SimulationParameters,
  SimulationRunResult,
  SimulationScenarioSnapshot,
} from './simulationTypes'

/**
 * OPTIMIZATION & RECOMMENDATION ENGINE TYPES (Phase 7)
 */

export type OptimizationStrategyId =
  | 'BALANCED'
  | 'ENVIRONMENT_FIRST'
  | 'EFFICIENCY_FIRST'
  | 'CAPACITY_FIRST'

export type InterventionCategory =
  | 'CAPACITY'
  | 'FLEET'
  | 'ROUTING'
  | 'SCHEDULING'
  | 'OPERATING_HOURS'
  | 'RECOVERY'
  | 'TRANSFER'
  | 'COLLECTION'

export interface OptimizationTradeoffs {
  benefits: string[]
  downsides: string[]
  capitalRequirement: 'LOW' | 'MEDIUM' | 'HIGH'
  operationalComplexity: 'LOW' | 'MEDIUM' | 'HIGH'
  timeToDeploy: string
}

export interface OptimizationReasoningChain {
  observedProblem: string
  rootCause: string
  intervention: string
  simulationProof: string
  measuredImpact: string
}

export interface OptimizationConfidence {
  level: 'HIGH' | 'VERY_HIGH' | 'MEDIUM'
  score: number // 0-100
  evidence: string[]
}

export interface OptimizationRecommendation {
  id: string
  title: string
  category: InterventionCategory
  targetFacilityId?: string
  targetFacilityName: string
  targetRouteId?: string
  targetRouteName?: string
  reason: string
  currentCondition: string
  proposedChange: string
  targetBottleneckId?: string
  targetBottleneckSeverity?: 'critical' | 'warning' | 'normal'
  confidence: OptimizationConfidence
  reasoningChain: OptimizationReasoningChain
  tradeoffs: OptimizationTradeoffs
  parameters: Partial<SimulationParameters>
  simulationResult: SimulationRunResult
  strategyScores: Record<OptimizationStrategyId, number>
  rank: number
}

export interface OptimizationSummary {
  systemHealthBaselinePct: number
  systemHealthOptimizedPct: number
  currentBottlenecksCount: number
  criticalBottlenecksCount: number
  opportunitiesCount: number
  potentialCo2ReductionKg: number
  potentialCo2ReductionT: number
  potentialLandfillDiversionT: number
  potentialBacklogReliefT: number
  potentialTripsReduction: number
  potentialRecoveryGainPct: number
}

export interface StrategyDefinition {
  id: OptimizationStrategyId
  label: string
  shortDescription: string
  focusAreas: string[]
  weights: {
    co2e: number
    landfill: number
    recovery: number
    trips: number
    backlog: number
    waiting: number
    throughput: number
  }
}

/** Phase 8 structured snapshot schema */
export interface SavedOptimizationScenario {
  scenarioId: string
  scenarioName: string
  interventionId: string
  title: string
  category: InterventionCategory
  target: string
  parameters: SimulationParameters
  baselineMetrics: SimulationScenarioSnapshot['baselineMetrics']
  simulatedMetrics: SimulationScenarioSnapshot['simulatedMetrics']
  deltas: Record<string, SimulationMetricDelta>
  bottlenecksBefore: SimulationScenarioSnapshot['bottlenecksBefore']
  bottlenecksAfter: SimulationScenarioSnapshot['bottlenecksAfter']
  environmentalImpact: SimulationScenarioSnapshot['environmentalImpact']
  tradeoffs: OptimizationTradeoffs
  strategy: OptimizationStrategyId
  timestamp: string
}
