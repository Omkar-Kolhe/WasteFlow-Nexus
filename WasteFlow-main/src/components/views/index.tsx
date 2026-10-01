import type { ComponentType } from 'react'
import type { ViewId } from '@/state/twinStore'
import { OperationsView } from './OperationsView'
import { BottlenecksView } from './BottlenecksView'
import { SimulationView } from './SimulationView'
import { OptimizationView } from './OptimizationView'
import { ScenariosView } from './ScenariosView'
import { EnvironmentView } from './EnvironmentView'
import { AnalyticsView } from './AnalyticsView'

/** Every module except the twin itself renders as an overlay on the map. */
export const MODULE_VIEWS: Partial<Record<ViewId, ComponentType>> = {
  operations: OperationsView,
  bottlenecks: BottlenecksView,
  simulation: SimulationView,
  optimization: OptimizationView,
  scenarios: ScenariosView,
  environment: EnvironmentView,
  analytics: AnalyticsView,
}
