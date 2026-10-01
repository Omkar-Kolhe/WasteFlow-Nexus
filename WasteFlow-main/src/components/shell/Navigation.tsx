import {
  BarChart3,
  Cpu,
  GitBranch,
  Leaf,
  Radar,
  Sparkles,
  TriangleAlert,
  Truck,
  Play,
} from 'lucide-react'
import { useTwinStore, type ViewId } from '@/state/twinStore'
import { usePresentationStore } from '@/state/presentationStore'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

const ITEMS: { id: ViewId | 'presentation'; label: string; icon: typeof Radar; hint: string }[] = [
  { id: 'twin', label: 'Digital Twin', icon: Radar, hint: 'Live city waste network' },
  { id: 'operations', label: 'Operations', icon: Truck, hint: 'Fleet, zones and facility state' },
  { id: 'bottlenecks', label: 'Bottlenecks', icon: TriangleAlert, hint: 'Capacity pressure ranking' },
  { id: 'simulation', label: 'Simulation', icon: Cpu, hint: 'Intervention modelling · Phase 6' },
  { id: 'optimization', label: 'Optimization', icon: Sparkles, hint: 'Data-driven interventions · Phase 7' },
  { id: 'scenarios', label: 'Scenarios', icon: GitBranch, hint: 'Saved intervention branches' },
  { id: 'environment', label: 'Environment', icon: Leaf, hint: 'Emissions and diversion impact' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, hint: 'Long-run system analytics' },
  { id: 'presentation', label: 'Play Demo', icon: Play, hint: 'Start cinematic presentation' },
]

/**
 * NAVIGATION — deliberately narrow. The map is the product, so navigation is a
 * rail, not a sidebar; labels live in tooltips and the active label only.
 */
export function Navigation() {
  const view = useTwinStore((s) => s.view)
  const setView = useTwinStore((s) => s.setView)
  const startDemo = usePresentationStore((s) => s.startDemo)

  return (
    <nav className="absolute left-3 top-1/2 z-40 -translate-y-1/2">
      <div className="surface flex flex-col gap-0.5 border-hair p-1 shadow-panel">
        {ITEMS.map(({ id, label, icon: Icon, hint }) => {
          const active = view === id
          return (
            <Tooltip key={id} label={label} hint={hint} side="right">
              <button
                onClick={() => {
                  if (id === 'presentation') {
                    startDemo()
                  } else {
                    setView(id)
                  }
                }}
                aria-current={active}
                aria-label={label}
                className={cn(
                  'focus-ring group relative grid h-9 w-9 place-items-center transition-colors duration-200 ease-nexus',
                  active ? 'bg-signal/[0.1] text-signal' : 'text-ink-faint hover:bg-white/[0.05] hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 transition-all duration-300 ease-nexus',
                    active ? 'bg-signal opacity-100' : 'opacity-0',
                  )}
                />
                <Icon size={15} strokeWidth={1.6} />
                {id === 'simulation' && (
                  <span className="absolute right-1 top-1 h-1 w-1 bg-flow/80" aria-hidden />
                )}
              </button>
            </Tooltip>
          )
        })}
      </div>
    </nav>
  )
}
