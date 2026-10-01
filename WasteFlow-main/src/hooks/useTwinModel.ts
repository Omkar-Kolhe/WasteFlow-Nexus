import { getTwinModel } from '@/data'
import { useTwinStore } from '@/state/twinStore'

/**
 * Live twin model hook.
 * Returns the active simulated model if a simulation is running, or the canonical baseline model.
 */
export function useTwinModel() {
  const simulationModel = useTwinStore((s) => s.simulationModel)
  const rerouteModel = useTwinStore((s) => s.rerouteModel)
  return rerouteModel ?? simulationModel ?? getTwinModel()
}

/**
 * Always returns the unmodified canonical baseline model.
 */
export function useBaselineTwinModel() {
  return getTwinModel()
}
