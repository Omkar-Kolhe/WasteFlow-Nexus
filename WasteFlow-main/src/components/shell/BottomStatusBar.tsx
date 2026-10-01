import { useClock } from '@/hooks'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { useEngineStats } from '@/components/twin/TwinContext'

const LAYER_ORDER = ['flow', 'vehicles', 'facilities', 'bottlenecks', 'emissions'] as const

/** BOTTOM STATUS STRIP — engine truth at a glance, monospaced and quiet. */
export function BottomStatusBar() {
  const model = useTwinModel()
  const layers = useTwinStore((s) => s.layers)
  const view = useTwinStore((s) => s.view)
  const stats = useEngineStats(800)
  const now = useClock(1000)

  const activeLayers = LAYER_ORDER.filter((l) => layers[l])

  return (
    <footer className="relative z-40 flex h-6 shrink-0 items-center gap-3 border-t border-hair bg-base/90 px-3 font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost backdrop-blur-xl">
      <span className="text-ink-faint">WASTEFLOW NEXUS</span>
      <span className="hidden sm:inline">TWIN v0.1 · MOCK TELEMETRY</span>
      <span className="mx-0.5 hidden h-3 w-px bg-hair sm:block" />
      <span className="hidden md:inline">
        LAYERS: <span className="text-signal/80">{activeLayers.join(' · ').toUpperCase() || 'NONE'}</span>
      </span>
      <span className="ml-auto hidden lg:inline">
        NODES {model.derivedList.length} · LINKS {model.snapshot.routes.length} · UNITS{' '}
        {model.snapshot.vehicles.length}
      </span>
      <span className="mx-0.5 hidden h-3 w-px bg-hair lg:block" />
      <span className={view === 'twin' ? 'text-signal/80' : 'text-ink-ghost'}>
        ENGINE {view === 'twin' ? `${stats.fps} FPS` : 'PAUSED'}
      </span>
      <span className="hidden tabular-nums sm:inline">{now.toISOString().slice(11, 19)} UTC</span>
    </footer>
  )
}
