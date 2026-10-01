import { Eye, GitBranch, Layers, TriangleAlert, Truck, Wind } from 'lucide-react'
import type { LayerId } from '@/types'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { LAYER_BRIEFS } from '@/data/briefs'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

const LAYER_ICONS: Record<LayerId, typeof Eye> = {
  flow: GitBranch,
  vehicles: Truck,
  facilities: Layers,
  bottlenecks: TriangleAlert,
  emissions: Wind,
}

const LAYER_ORDER: LayerId[] = ['flow', 'vehicles', 'facilities', 'bottlenecks', 'emissions']

/**
 * LAYER CONTROLS — the visibility deck for the twin.
 * Every toggle acts on real geometry: FLOW removes routes and particles,
 * VEHICLES removes the fleet, FACILITIES removes the plant glyphs and labels,
 * BOTTLENECKS shows only the graded nodes, EMISSIONS recolours corridors by
 * their assigned fleet's fuel mix. Shift-click isolates a single layer.
 */
export function LayerControls({ className }: { className?: string }) {
  const layers = useTwinStore((s) => s.layers)
  const toggleLayer = useTwinStore((s) => s.toggleLayer)
  const isolateLayer = useTwinStore((s) => s.isolateLayer)
  const resetLayers = useTwinStore((s) => s.resetLayers)
  const model = useTwinModel()

  const counts: Record<LayerId, string> = {
    flow: `${model.snapshot.routes.length} LINKS`,
    vehicles: `${model.totals.trackedVehicles} TRACKED`,
    facilities: `${model.derivedList.length} NODES`,
    bottlenecks: `${model.derivedList.filter((d) => d.state !== 'normal').length} FLAGGED`,
    emissions: `${Math.round(model.totals.co2eKg).toLocaleString('en-US')} KG`,
  }

  return (
    <div className={cn('surface ticks w-[182px] border-hair shadow-panel', className)}>
      <header className="flex items-center gap-2 border-b border-hair px-2.5 py-1.5">
        <span className="label-tech text-[8.5px]">LAYERS</span>
        <button
          onClick={resetLayers}
          className="focus-ring ml-auto font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-ghost transition-colors hover:text-signal"
        >
          Reset
        </button>
      </header>
      <ul className="p-1">
        {LAYER_ORDER.map((id) => {
          const active = layers[id]
          const Icon = LAYER_ICONS[id]
          return (
            <li key={id}>
              <Tooltip label={LAYER_BRIEFS[id].label} hint={LAYER_BRIEFS[id].hint} side="left">
                <button
                  onClick={(e) => (e.shiftKey ? isolateLayer(id) : toggleLayer(id))}
                  aria-pressed={active}
                  className={cn(
                    'focus-ring group flex w-full items-center gap-2 px-2 py-[6px] text-left transition-colors duration-200 ease-nexus',
                    active ? 'text-ink' : 'text-ink-ghost hover:text-ink-dim',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-3.5 w-3.5 shrink-0 place-items-center border transition-all duration-200',
                      active ? 'border-signal/60 bg-signal/15' : 'border-hair2 bg-transparent',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 transition-opacity', active ? 'bg-signal opacity-100' : 'opacity-0')} />
                  </span>
                  <Icon size={12} strokeWidth={1.75} className={cn('shrink-0', active ? 'text-signal/90' : 'text-ink-ghost')} />
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em]">{LAYER_BRIEFS[id].label}</span>
                  <span className="ml-auto font-mono text-[8px] tracking-[0.08em] text-ink-ghost">{active ? counts[id] : '—'}</span>
                </button>
              </Tooltip>
            </li>
          )
        })}
      </ul>
      <footer className="border-t border-hair px-2.5 py-1.5">
        <span className="font-mono text-[8px] leading-tight tracking-[0.08em] text-ink-ghost">
          SHIFT-CLICK TO ISOLATE
        </span>
      </footer>
    </div>
  )
}
