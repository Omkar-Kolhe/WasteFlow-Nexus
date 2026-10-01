import { Leaf } from 'lucide-react'
import { ModuleShell } from './ModuleShell'
import { EnvironmentalDashboard } from '../environment/EnvironmentalDashboard'

/**
 * PHASE 9 — ENVIRONMENTAL INTELLIGENCE DASHBOARD
 * "See the environmental consequences of every movement in the waste network."
 */
export function EnvironmentView() {
  return (
    <ModuleShell
      icon={Leaf}
      title="ENVIRONMENTAL INTELLIGENCE"
      code="PH-09"
      phase="Phase 9"
      description="See the environmental consequences of every movement in the waste network."
    >
      <EnvironmentalDashboard />
    </ModuleShell>
  )
}
