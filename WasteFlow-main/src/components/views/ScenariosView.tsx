import { GitBranch } from 'lucide-react'
import { ModuleShell } from './ModuleShell'
import { ScenarioLab } from '../scenarios/ScenarioLab'

/**
 * PHASE 8 — BEFORE vs AFTER / SCENARIO LAB
 * Explore how operational decisions reshape the waste network.
 */
export function ScenariosView() {
  return (
    <ModuleShell
      icon={GitBranch}
      title="SCENARIO LAB"
      code="PH-08"
      phase="Phase 8"
      description="Explore how operational decisions reshape the waste network."
    >
      <ScenarioLab />
    </ModuleShell>
  )
}
