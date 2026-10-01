import { Bookmark, Play, Trash2 } from 'lucide-react'
import type { SimulationScenarioSnapshot } from '@/engine/simulationTypes'
import { cn } from '@/lib/utils'

export function SimulationHistory({
  scenarios,
  onLoad,
  onDelete,
  className,
}: {
  scenarios: SimulationScenarioSnapshot[]
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}) {
  if (scenarios.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bookmark size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">SAVED SCENARIOS & RECENT RUNS</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          {scenarios.length} SAVED
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((sc) => {
          const co2Pct = sc.environmentalImpact.co2eDeltaPct
          const isGood = co2Pct < 0

          return (
            <div
              key={sc.scenarioId}
              className="group flex flex-col justify-between border border-hair bg-white/[0.015] p-3 transition-colors hover:bg-white/[0.035]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[7px] text-ink-ghost">
                    {new Date(sc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className={cn(
                      'border px-1 py-[0.5px] font-mono text-[6.5px]',
                      isGood ? 'border-signal/30 text-signal' : 'border-warn/30 text-warn',
                    )}
                  >
                    CO₂e {co2Pct > 0 ? `+${co2Pct}%` : `${co2Pct}%`}
                  </span>
                </div>

                <h4 className="mt-1 font-mono text-[10.5px] font-medium leading-tight text-ink">
                  {sc.scenarioName}
                </h4>

                <p className="mt-1 text-[8.5px] text-ink-faint">
                  {sc.changedVariables.length} variable{sc.changedVariables.length === 1 ? '' : 's'} modified · {sc.resolvedBottlenecksCount} resolved
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-hair/50 pt-2">
                <button
                  onClick={() => onLoad(sc.scenarioId)}
                  className="flex items-center gap-1 font-mono text-[8px] text-signal hover:underline"
                >
                  <Play size={9} />
                  LOAD SCENARIO
                </button>

                <button
                  onClick={() => onDelete(sc.scenarioId)}
                  className="text-ink-ghost hover:text-critical transition-colors"
                  aria-label="Delete scenario"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
