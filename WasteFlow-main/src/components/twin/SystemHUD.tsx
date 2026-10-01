import { useTwinModel } from '@/hooks/useTwinModel'
import { formatNumber } from '@/lib/utils'
import { useClock } from '@/hooks'
import { MetricCard } from './MetricCard'

/**
 * SYSTEM HUD — the six city vitals, always on screen while the twin is open.
 * Every value is derived from the network model (`data/metrics.ts`): collected
 * tonnage, diversion, landfill load, fleet, utilisation and emissions.
 */
export function SystemHUD({ className }: { className?: string }) {
  const model = useTwinModel()
  const now = useClock(1000)

  return (
    <div className={className}>
      <div className="surface ticks border-hair shadow-panel">
        <header className="flex items-center gap-2 border-b border-hair px-3 py-2">
          <span className="label-tech text-[9px]">CITY VITALS</span>
          <span className="h-1 w-1 animate-status-pulse bg-signal" />
          <span className="font-mono text-[9px] tracking-[0.1em] text-ink-ghost">
            {model.snapshot.city.name} · 24H WINDOW
          </span>
          <span className="ml-auto font-mono text-[9px] tabular-nums tracking-[0.12em] text-ink-faint">
            {now.toISOString().slice(11, 19)} UTC
          </span>
        </header>
        <div className="grid grid-cols-2 gap-px bg-ink/[0.045] p-px">
          {model.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} className="border-0" />
          ))}
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-hair px-3 py-1.5">
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            GENERATED {formatNumber(model.totals.generatedToday)} T · FUEL {formatNumber(model.totals.fuelLiters)} L/DAY
          </span>
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            {model.totals.tripsToday + model.totals.collectionTripsToday} TRIPS/DAY
          </span>
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            {model.totals.trackedVehicles}/{model.totals.fleetSize} TRACKED
          </span>
        </footer>
      </div>
    </div>
  )
}
