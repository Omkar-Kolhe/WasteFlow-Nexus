import { Play, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'

/**
 * SIMULATION LAUNCHER — Contextual entry point to the Simulation Lab.
 */
export function SimulationPlaceholder({ className }: { className?: string }) {
  const setView = useTwinStore((s) => s.setView)
  const selectRoute = useTwinStore((s) => s.selectRoute)
  const selectedRouteId = useTwinStore((s) => s.selectedRouteId)
  const model = useTwinModel()

  // Context-aware: if a corridor is inspected, offer to model around it.
  const blockedRoute = model.snapshot.routes.find((r) => r.id === selectedRouteId || r.status === 'blocked')

  return (
    <div className={cn('surface w-[236px] border-hair px-3 py-2.5 shadow-panel', className)}>
      <div className="flex items-center gap-2">
        <Sliders size={12} className="text-ink-ghost" strokeWidth={1.75} />
        <span className="label-tech text-[8.5px]">SIMULATION LAB</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] tracking-[0.12em] text-signal/80 font-semibold">
          ACTIVE
        </span>
      </div>

      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">
        {blockedRoute && blockedRoute.status === 'blocked'
          ? `${blockedRoute.id} is blocked. Open the lab to simulate re-routing ${Math.round(
              blockedRoute.volumeT,
            ).toLocaleString('en-US')} T/day.`
          : 'Test operational interventions—fleet re-routing, capacity changes, shift windows—against the live network.'}
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          onClick={() => {
            setView('simulation')
            selectRoute(null)
          }}
          className="focus-ring flex h-7 flex-1 items-center justify-center gap-1.5 border border-hair bg-white/[0.02] font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-white/[0.06]"
        >
          <Play size={10} strokeWidth={1.75} />
          ENTER LAB
        </button>
      </div>
    </div>
  )
}
