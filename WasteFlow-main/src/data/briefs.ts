import type { FacilityKind, RouteStatus, SubstreamId } from '@/types'
import type { LayerId } from '@/types'

/**
 * Presentation copy that belongs with the data layer: module briefs and the
 * capability lists shown by the Phase 3+ modules. Keeping it here stops long
 * strings from being scattered through components.
 */

export interface ModuleBrief {
  id: string
  title: string
  code: string
  phase?: string
  description: string
}

export interface PlannedCapability {
  label: string
  detail: string
}

export const MODULE_BRIEFS = {
  operations: {
    id: 'operations',
    title: 'Operations',
    code: 'MOD-02',
    description:
      'Live disposition of the tracked fleet and every infrastructure node in the Mumbai mesh. Selecting a facility or corridor returns to the twin with it inspected.',
  },
  bottlenecks: {
    id: 'bottlenecks',
    title: 'Bottleneck Intelligence',
    code: 'PHASE 4',
    description:
      'Find where Mumbai’s waste flow slows down — and why. Detection, dependency tracing and impact estimation run on the calculation engine’s ledgers, with a live map and fix previews.',
  },
  simulation: {
    id: 'simulation',
    title: 'Simulation',
    code: 'MOD-05',
    phase: 'ENGINE · PHASE 6',
    description:
      'Run interventions against a branch of the live network and compare outcomes before committing them to operations. Phase 2 establishes the branch model and the control surface; the engine binds in Phase 6.',
  },
  optimization: {
    id: 'optimization',
    title: 'Optimization Engine',
    code: 'MOD-06',
    phase: 'ENGINE · PHASE 7',
    description:
      'Turn system bottlenecks into measurable interventions. Evaluates multi-objective strategies across capacity, fleet, routes, and operating schedules grounded in live network physics.',
  },
  scenarios: {
    id: 'scenarios',
    title: 'Scenarios',
    code: 'MOD-07',
    phase: 'OPTIMISER · PHASE 8',
    description:
      'Intervention branches prepared against the live network. Each scenario stores its move set and the outcome it is intended to produce; results populate once the flow engine, simulator and optimiser are online.',
  },
  environment: {
    id: 'environment',
    title: 'Environment',
    code: 'MOD-07',
    description:
      'Impact ledger for the Mumbai mesh: haulage and processing emissions, landfill dependence and material recovery. Emission factors are fixed Phase 2 estimates and will be replaced by per-vehicle telemetry and grid intensity.',
  },
  analytics: {
    id: 'analytics',
    title: 'Analytics',
    code: 'MOD-08',
    phase: 'HISTORY STORE · PHASE 3',
    description:
      'System-level performance across the mesh. Phase 2 presents live-window figures and the chart surface; the history store and comparative analytics arrive with the time-series pipeline.',
  },
} satisfies Record<string, ModuleBrief>

export const SIMULATION_CAPABILITIES: PlannedCapability[] = [
  { label: 'Fleet re-routing', detail: 'Reassign collection rounds and transfer haul legs across a time window.' },
  { label: 'Capacity change', detail: 'Add screening lines, tipping bays or an extra shift at a named node.' },
  { label: 'Shift rebalance', detail: 'Move collection windows to flatten the morning inbound tide.' },
  { label: 'Corridor closure', detail: 'Replay a blocked corridor and let the flow engine rebalance the load.' },
]

export const ANALYTICS_CAPABILITIES: PlannedCapability[] = [
  { label: 'Historical comparison', detail: 'Week-over-week tonnage, diversion and emissions with change attribution.' },
  { label: 'Cost model', detail: 'Collection, transfer, processing and disposal cost per tonne by node.' },
  { label: 'Forecast band', detail: 'Generation forecast with confidence intervals feeding the simulation engine.' },
  { label: 'Impact attribution', detail: 'Which nodes caused a change in recovery rate or emissions.' },
]

/** Operational feed shown in the top bar. Severity drives the badge colour. */
export const OPERATION_FEED = [
  {
    id: 'N-01',
    severity: 'critical' as const,
    title: 'Kanjurmarg Sorting at 96% capacity',
    detail: 'Inbound exceeds screening rate on the morning tide. 38 min queue at the tipping hall; yard buffering in use.',
    at: '3 min ago',
    read: false,
  },
  {
    id: 'N-02',
    severity: 'warning' as const,
    title: 'Kurla corridor blocked at Sion',
    detail: 'Waterlogging has closed RT-06. 838 T/day held at zone level pending manual diversion.',
    at: '17 min ago',
    read: false,
  },
  {
    id: 'N-03',
    severity: 'warning' as const,
    title: 'Deonar Waste Facility above 90%',
    detail: 'Intake at 91.6% of rated capacity, 24 min queue at the tipping face. Methane capture at 64%.',
    at: '52 min ago',
    read: false,
  },
  {
    id: 'N-04',
    severity: 'info' as const,
    title: 'Trombay processing has headroom',
    detail: 'Operating at 58% of capacity — the modelled relief option for eastern organic loads.',
    at: '2 h ago',
    read: true,
  },
]

export const SUBSTREAM_LEGEND: SubstreamId[] = ['organic', 'residual', 'recyclable', 'commercial']

export const ROUTE_STATUS_LEGEND: { status: RouteStatus; label: string; detail: string }[] = [
  { status: 'normal', label: 'NORMAL', detail: 'Subtle flow' },
  { status: 'busy', label: 'BUSY', detail: 'Increased flow' },
  { status: 'congested', label: 'CONGESTED', detail: 'Denser, slower flow' },
  { status: 'blocked', label: 'BLOCKED', detail: 'Flow stopped' },
]

export const FACILITY_KIND_LEGEND: { kind: FacilityKind; label: string; glyph: string }[] = [
  { kind: 'zone', label: 'Collection zone', glyph: 'cluster' },
  { kind: 'transfer', label: 'Transfer station', glyph: 'hex' },
  { kind: 'sorting', label: 'Sorting facility', glyph: 'split' },
  { kind: 'processing', label: 'Processing facility', glyph: 'disc' },
  { kind: 'recovery', label: 'Recovery facility', glyph: 'cycle' },
  { kind: 'landfill', label: 'Landfill', glyph: 'mound' },
]

export const LAYER_BRIEFS: Record<LayerId, { label: string; hint: string }> = {
  flow: { label: 'Flow', hint: 'Waste-flow routes and particles · density = tonnage' },
  vehicles: { label: 'Vehicles', hint: 'Tracked fleet units moving on their corridors' },
  facilities: { label: 'Facilities', hint: 'Node glyphs, codes and daily loads' },
  bottlenecks: { label: 'Bottlenecks', hint: 'Warning and critical nodes with queue marks' },
  emissions: { label: 'Emissions', hint: 'CO₂e overlay from the assigned fleet fuel mix' },
}
