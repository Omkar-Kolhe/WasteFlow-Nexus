import { create } from 'zustand'
import type { LayerId } from '@/types'
import { OPERATION_FEED } from '@/data/briefs'
import { getTwinModel, type TwinModel } from '@/data'
import type {
  SimulationParameters,
  SimulationRunResult,
  SimulationScenarioSnapshot,
} from '@/engine/simulationTypes'
import {
  DEFAULT_SIMULATION_PARAMETERS,
  SIMULATION_PRESETS,
  createScenarioSnapshot,
} from '@/engine/simulationEngine'
import type {
  OptimizationRecommendation,
  OptimizationStrategyId,
  SavedOptimizationScenario,
} from '@/engine/optimizationTypes'
import { createSavedOptimizationScenario } from '@/engine/optimizationEngine'
import type { RerouteState } from '@/engine/rerouteEngine'
import { buildReroutePlan, recalculatePlan, applyRerouteToNetwork } from '@/engine/rerouteEngine'

export type ViewId =
  | 'twin'
  | 'operations'
  | 'bottlenecks'
  | 'simulation'
  | 'optimization'
  | 'scenarios'
  | 'environment'
  | 'analytics'

export type SimulationState = 'baseline' | 'editing' | 'simulating' | 'completed' | 'invalid'

export interface Notification {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  detail: string
  at: string
  read: boolean
}

export const DEFAULT_LAYERS: Record<LayerId, boolean> = {
  flow: true,
  vehicles: true,
  facilities: true,
  bottlenecks: true,
  emissions: false,
}

const STORAGE_KEY = 'wasteflow_saved_scenarios_v1'
const OPT_STORAGE_KEY = 'wasteflow_saved_opt_scenarios_v1'

function loadSavedScenarios(): SimulationScenarioSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  return []
}

function persistSavedScenarios(scenarios: SimulationScenarioSnapshot[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
  } catch {
    // Ignore storage quota error
  }
}

function loadSavedOptimizationScenarios(): SavedOptimizationScenario[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OPT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  return []
}

function persistSavedOptimizationScenarios(scenarios: SavedOptimizationScenario[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(OPT_STORAGE_KEY, JSON.stringify(scenarios))
  } catch {
    // Ignore storage quota error
  }
}

function getInitialView(): ViewId {
  if (typeof window !== 'undefined') {
    const p = window.location.pathname.replace(/^\//, '').toLowerCase()
    if (p === 'optimization') return 'optimization'
    if (p === 'simulation') return 'simulation'
    if (p === 'bottlenecks') return 'bottlenecks'
    if (p === 'operations') return 'operations'
    if (p === 'scenarios') return 'scenarios'
    if (p === 'environment') return 'environment'
    if (p === 'analytics') return 'analytics'
  }
  return 'twin'
}

interface TwinStore {
  /** Landing experience vs. application shell. */
  phase: 'landing' | 'app'
  enterTwin: () => void
  exitToLanding: () => void

  view: ViewId
  setView: (view: ViewId) => void

  theme: 'dark' | 'light'
  toggleTheme: () => void

  /** Selected node (facility or collection zone). */
  selectedId: string | null
  select: (id: string | null) => void

  /** Selected corridor. Mutually exclusive with a node selection. */
  selectedRouteId: string | null
  selectRoute: (id: string | null) => void

  hoveredId: string | null
  hover: (id: string | null) => void

  /**
   * Camera-focus request for a node. Module views render outside the engine
   * context, so they ask the twin (which owns the engine) to move the camera;
   * the twin clears the request once handled.
   */
  focusNodeId: string | null
  requestFocus: (id: string | null) => void
  clearFocusRequest: () => void

  /** Corridor under the pointer — highlighted while hovered. */
  hoveredRouteId: string | null
  hoverRoute: (id: string | null) => void

  cityId: string
  setCityId: (id: string) => void

  layers: Record<LayerId, boolean>
  toggleLayer: (id: LayerId) => void
  setLayer: (id: LayerId, value: boolean) => void
  isolateLayer: (id: LayerId) => void
  resetLayers: () => void

  notifications: Notification[]
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  markNotificationsRead: () => void

  /* ── Phase 6: What-If Simulation Lab State ──────────────── */
  simulationModel: TwinModel | null
  simulationParameters: SimulationParameters
  simulationResult: SimulationRunResult | null
  activeSnapshot: SimulationScenarioSnapshot | null
  simulationState: SimulationState
  selectedPresetId: string | null
  savedScenarios: SimulationScenarioSnapshot[]

  setSimulationModel: (model: TwinModel | null) => void
  setSimulationParameters: (params: Partial<SimulationParameters>) => void
  setSimulationResult: (result: SimulationRunResult | null) => void
  setSimulationState: (state: SimulationState) => void
  applySimulationPreset: (presetId: string) => void
  resetSimulation: () => void
  testBottleneckIntervention: (bottleneckId: string) => void
  saveCurrentScenario: (name: string) => void
  deleteScenario: (scenarioId: string) => void
  loadScenario: (scenarioId: string) => void

  /* ── Phase 7: Optimization & Recommendation Engine State ── */
  selectedStrategy: OptimizationStrategyId
  setSelectedStrategy: (strategy: OptimizationStrategyId) => void
  selectedInterventionId: string | null
  setSelectedInterventionId: (id: string | null) => void
  activeComparisonIds: string[]
  toggleComparisonId: (id: string) => void
  clearComparison: () => void
  applyRecommendationToSimulation: (rec: OptimizationRecommendation) => void
  savedOptimizationScenarios: SavedOptimizationScenario[]
  saveOptimizationScenario: (rec: OptimizationRecommendation, strategy: OptimizationStrategyId, customName?: string) => void
  deleteOptimizationScenario: (scenarioId: string) => void

  /* ── Reroute Engine State ─────────────────────────────────── */
  rerouteState: RerouteState
  rerouteModel: TwinModel | null
  openReroute: (routeId: string, model: import('@/data/metrics').TwinModel) => void
  closeReroute: () => void
  selectRerouteAlternatives: (ids: string[], model: import('@/data/metrics').TwinModel) => void
  simulateReroute: (baseModel?: import('@/data/metrics').TwinModel) => void
  applyReroute: (baseModel?: import('@/data/metrics').TwinModel) => void
  restoreOriginalRoute: () => void
}

/**
 * Application state. Kept separate from the render engine on purpose:
 * the engine reads this state, it never owns it.
 */
export const useTwinStore = create<TwinStore>((set, get) => ({
  phase: 'landing',
  enterTwin: () => set({ phase: 'app' }),
  exitToLanding: () => set({ phase: 'landing', view: 'twin' }),

  view: getInitialView(),
  setView: (view) => {
    if (typeof window !== 'undefined') {
      const targetPath = view === 'twin' ? '/' : `/${view}`
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath)
      }
    }
    set({ view })
  },

  theme: 'dark',
  toggleTheme: () => {
    const current = get().theme
    const next = current === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      if (next === 'light') {
        document.documentElement.classList.add('light-mode')
      } else {
        document.documentElement.classList.remove('light-mode')
      }
    }
    set({ theme: next })
  },

  selectedId: null,
  select: (id) => set({ selectedId: id, selectedRouteId: null }),

  selectedRouteId: null,
  selectRoute: (id) => set({ selectedRouteId: id, selectedId: null }),

  hoveredId: null,
  hover: (id) => set({ hoveredId: id }),

  focusNodeId: null,
  requestFocus: (id) => set({ focusNodeId: id, selectedId: id, selectedRouteId: null }),
  clearFocusRequest: () => set({ focusNodeId: null }),

  hoveredRouteId: null,
  hoverRoute: (id) => set({ hoveredRouteId: id }),

  cityId: 'mumbai',
  setCityId: (cityId) => set({ cityId }),

  layers: { ...DEFAULT_LAYERS },
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setLayer: (id, value) => set((s) => ({ layers: { ...s.layers, [id]: value } })),
  isolateLayer: (id) =>
    set(() => {
      const next: Record<LayerId, boolean> = {
        flow: false,
        vehicles: false,
        facilities: false,
        bottlenecks: false,
        emissions: false,
      }
      next[id] = true
      return { layers: next }
    }),
  resetLayers: () => set({ layers: { ...DEFAULT_LAYERS } }),

  notifications: OPERATION_FEED.map((n) => ({ ...n })),
  notificationsOpen: false,
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  markNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  /* ── Phase 6 Simulation Store Implementation ────────────── */
  simulationModel: null,
  simulationParameters: { ...DEFAULT_SIMULATION_PARAMETERS },
  simulationResult: null,
  activeSnapshot: null,
  simulationState: 'baseline',
  selectedPresetId: null,
  savedScenarios: loadSavedScenarios(),

  setSimulationModel: (simulationModel) => set({ simulationModel }),

  setSimulationParameters: (partialParams) =>
    set((s) => ({
      simulationParameters: { ...s.simulationParameters, ...partialParams },
      simulationState: s.simulationState === 'simulating' ? s.simulationState : 'editing',
      selectedPresetId: null, // clear preset badge on manual tweak
    })),

  setSimulationResult: (simulationResult) => set({ simulationResult }),

  setSimulationState: (simulationState) => set({ simulationState }),

  applySimulationPreset: (presetId) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    set({
      simulationParameters: { ...DEFAULT_SIMULATION_PARAMETERS, ...preset.parameters },
      selectedPresetId: presetId,
      simulationState: 'editing',
    })
  },

  resetSimulation: () =>
    set({
      simulationModel: null,
      simulationParameters: { ...DEFAULT_SIMULATION_PARAMETERS },
      simulationResult: null,
      activeSnapshot: null,
      simulationState: 'baseline',
      selectedPresetId: null,
    }),

  testBottleneckIntervention: (bottleneckId: string) => {
    // Tailor parameters specifically to solve the selected bottleneck
    if (bottleneckId === 'S-KJ') {
      set({
        view: 'simulation',
        selectedPresetId: 'SORTING_EXPANSION',
        simulationParameters: {
          ...DEFAULT_SIMULATION_PARAMETERS,
          kanjurmargSortingCapacity: 4375, // +25%
          sortingOperatingHours: 16, // Double shift
          kanjurmargTransferCapacity: 5000,
        },
        simulationState: 'editing',
      })
    } else if (bottleneckId === 'L-DE') {
      set({
        view: 'simulation',
        selectedPresetId: 'RECOVERY_BOOST',
        simulationParameters: {
          ...DEFAULT_SIMULATION_PARAMETERS,
          targetRecoveryRatePct: 75.0,
          kanjurmargRecoveryCapacity: 2600,
          deonarRecoveryCapacity: 3400,
          kanjurmargProcessingCapacity: 1500,
        },
        simulationState: 'editing',
      })
    } else if (bottleneckId === 'Z-KU' || bottleneckId === 'RT-06') {
      set({
        view: 'simulation',
        selectedPresetId: 'ROUTE_OPTIMIZATION',
        simulationParameters: {
          ...DEFAULT_SIMULATION_PARAMETERS,
          unblockSionCircleRoute: true,
          routeCongestionRelief: true,
          routeDistanceOptimizationPct: 15,
        },
        simulationState: 'editing',
      })
    } else {
      set({
        view: 'simulation',
        selectedPresetId: 'BALANCED',
        simulationParameters: {
          ...DEFAULT_SIMULATION_PARAMETERS,
          fleetCountDelta: 4,
          kanjurmargSortingCapacity: 4025,
          deonarSortingCapacity: 4140,
          targetRecoveryRatePct: 62.0,
          unblockSionCircleRoute: true,
        },
        simulationState: 'editing',
      })
    }
  },

  saveCurrentScenario: (name: string) => {
    const { simulationParameters, simulationResult, savedScenarios } = get()
    if (!simulationResult) return
    const snapshot = createScenarioSnapshot(name, simulationParameters, simulationResult)
    const nextList = [snapshot, ...savedScenarios.filter((s) => s.scenarioId !== snapshot.scenarioId)]
    persistSavedScenarios(nextList)
    set({
      savedScenarios: nextList,
      activeSnapshot: snapshot,
    })
  },

  deleteScenario: (scenarioId: string) => {
    const { savedScenarios } = get()
    const nextList = savedScenarios.filter((s) => s.scenarioId !== scenarioId)
    persistSavedScenarios(nextList)
    set({ savedScenarios: nextList })
  },

  loadScenario: (scenarioId: string) => {
    const { savedScenarios } = get()
    const target = savedScenarios.find((s) => s.scenarioId === scenarioId)
    if (!target) return
    set({
      simulationParameters: { ...target.simulationParameters },
      activeSnapshot: target,
      simulationState: 'completed',
    })
  },

  /* ── Phase 7: Optimization & Recommendation Engine State ── */
  selectedStrategy: 'BALANCED',
  setSelectedStrategy: (selectedStrategy) => set({ selectedStrategy }),

  selectedInterventionId: null,
  setSelectedInterventionId: (selectedInterventionId) => set({ selectedInterventionId }),

  activeComparisonIds: ['INT-CAP-01', 'INT-OPS-01', 'INT-REC-01'],
  toggleComparisonId: (id) => {
    const { activeComparisonIds } = get()
    if (activeComparisonIds.includes(id)) {
      if (activeComparisonIds.length > 1) {
        set({ activeComparisonIds: activeComparisonIds.filter((x) => x !== id) })
      }
    } else {
      if (activeComparisonIds.length < 4) {
        set({ activeComparisonIds: [...activeComparisonIds, id] })
      } else {
        set({ activeComparisonIds: [...activeComparisonIds.slice(1), id] })
      }
    }
  },
  clearComparison: () => set({ activeComparisonIds: [] }),

  applyRecommendationToSimulation: (rec) => {
    set({
      view: 'simulation',
      simulationParameters: {
        ...DEFAULT_SIMULATION_PARAMETERS,
        ...rec.parameters,
      },
      simulationState: 'editing',
    })
  },

  savedOptimizationScenarios: loadSavedOptimizationScenarios(),
  saveOptimizationScenario: (rec, strategy, customName) => {
    const { savedOptimizationScenarios } = get()
    const snapshot = createSavedOptimizationScenario(rec, strategy, customName)
    const nextList = [
      snapshot,
      ...savedOptimizationScenarios.filter((s) => s.scenarioId !== snapshot.scenarioId),
    ]
    persistSavedOptimizationScenarios(nextList)
    set({ savedOptimizationScenarios: nextList })
  },
  deleteOptimizationScenario: (scenarioId) => {
    const { savedOptimizationScenarios } = get()
    const nextList = savedOptimizationScenarios.filter((s) => s.scenarioId !== scenarioId)
    persistSavedOptimizationScenarios(nextList)
    set({ savedOptimizationScenarios: nextList })
  },

  /* ── Reroute Engine ──────────────────────────────────────── */
  rerouteState: { status: 'idle', activeRouteId: null, plan: null },
  rerouteModel: null,

  openReroute: (routeId, model) => {
    try {
      const plan = buildReroutePlan(routeId, model)
      set({ rerouteState: { status: 'analyzing', activeRouteId: routeId, plan } })
    } catch {
      set({ rerouteState: { status: 'analyzing', activeRouteId: routeId, plan: null } })
    }
  },

  closeReroute: () => set({ rerouteState: { status: 'idle', activeRouteId: null, plan: null } }),

  selectRerouteAlternatives: (ids, model) => {
    const { rerouteState } = get()
    if (!rerouteState.plan) return
    const plan = recalculatePlan(rerouteState.plan, ids, model)
    const baseModel = getTwinModel()
    let rerouteModel = get().rerouteModel
    if (rerouteState.status === 'simulated' || rerouteState.status === 'applied') {
      rerouteModel = applyRerouteToNetwork(plan, baseModel)
    }
    set({ rerouteState: { ...rerouteState, plan }, rerouteModel })
  },

  simulateReroute: (baseModel) => {
    const { rerouteState } = get()
    if (!rerouteState.plan) return
    const base = baseModel ?? getTwinModel()
    const simulatedModel = applyRerouteToNetwork(rerouteState.plan, base)
    set({
      rerouteState: { ...rerouteState, status: 'simulated' },
      rerouteModel: simulatedModel,
    })
  },

  applyReroute: (baseModel) => {
    const { rerouteState, notifications } = get()
    if (!rerouteState.plan) return
    const base = baseModel ?? getTwinModel()
    const appliedModel = applyRerouteToNetwork(rerouteState.plan, base)
    const newNotif: Notification = {
      id: `reroute-${Date.now()}`,
      title: `REROUTE APPLIED · ${rerouteState.plan.blockedRouteId}`,
      detail: `Diverted ${rerouteState.plan.totalDivertedT} T/day across ${rerouteState.plan.allocations.map((a) => a.routeId).join(' + ')}. Reassigned ${rerouteState.plan.vehiclesRequired} vehicles.`,
      severity: 'info',
      at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      read: false,
    }
    set({
      rerouteState: { ...rerouteState, status: 'applied' },
      rerouteModel: appliedModel,
      notifications: [newNotif, ...notifications],
    })
  },

  restoreOriginalRoute: () => {
    const { notifications, rerouteState } = get()
    const restoredRouteId = rerouteState.activeRouteId || 'RT-06'
    const newNotif: Notification = {
      id: `restore-${Date.now()}`,
      title: `ORIGINAL ROUTE RESTORED · ${restoredRouteId}`,
      detail: `Corridor ${restoredRouteId} restored to standard operations. Diversions cleared.`,
      severity: 'info',
      at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      read: false,
    }
    set({
      rerouteState: { status: 'idle', activeRouteId: null, plan: null },
      rerouteModel: null,
      notifications: [newNotif, ...notifications],
    })
  },
}))
