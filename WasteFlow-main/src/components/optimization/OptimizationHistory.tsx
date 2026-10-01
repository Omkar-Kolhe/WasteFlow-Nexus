import { Bookmark, FlaskConical, Trash2 } from 'lucide-react'
import type { SavedOptimizationScenario } from '@/engine/optimizationTypes'

export function OptimizationHistory({
  scenarios,
  onRetest,
  onDelete,
  className,
}: {
  scenarios: SavedOptimizationScenario[]
  onRetest: (scenario: SavedOptimizationScenario) => void
  onDelete: (scenarioId: string) => void
  className?: string
}) {
  if (scenarios.length === 0) return null

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bookmark size={12} className="text-cyan-400" />
          <span className="label-tech text-[8.5px]">SAVED OPTIMIZATION SCENARIOS (PHASE 8 BUFFER)</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          {scenarios.length} READY FOR DEEP MULTI-SCENARIO BENCHMARK
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scen) => {
          const impact = scen.environmentalImpact

          return (
            <div
              key={scen.scenarioId}
              className="surface border border-hair/70 bg-white/[0.015] p-3 shadow-panel flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-[1px] font-mono text-[7px] font-semibold text-cyan-400 uppercase">
                    {scen.category}
                  </span>
                  <span className="font-mono text-[7.5px] text-ink-ghost">
                    {new Date(scen.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="mt-1.5 text-[11.5px] font-medium leading-snug text-ink line-clamp-1">
                  {scen.title}
                </h4>

                <span className="mt-0.5 block font-mono text-[8px] text-ink-dim truncate">
                  {scen.target}
                </span>

                {/* Impact badges */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono text-[8px]">
                  <span className="border border-signal/30 bg-signal/10 px-1.5 py-[1px] text-signal">
                    CO₂e {impact.co2eDeltaPct > 0 ? '+' : ''}{impact.co2eDeltaPct.toFixed(1)}%
                  </span>
                  <span className="border border-signal/30 bg-signal/10 px-1.5 py-[1px] text-signal">
                    Landfill {impact.landfillDeltaPct > 0 ? '+' : ''}{impact.landfillDeltaPct.toFixed(1)}%
                  </span>
                  <span className="border border-signal/30 bg-signal/10 px-1.5 py-[1px] text-signal">
                    Backlog {impact.backlogDeltaPct > 0 ? '+' : ''}{impact.backlogDeltaPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-hair/40 pt-2">
                <button
                  onClick={() => onRetest(scen)}
                  className="focus-ring flex items-center gap-1 font-mono text-[8px] text-signal hover:underline"
                >
                  <FlaskConical size={10} />
                  <span>RE-TEST IN SIMULATION</span>
                </button>

                <button
                  onClick={() => onDelete(scen.scenarioId)}
                  className="text-ink-ghost hover:text-critical transition-colors"
                  title="Delete saved scenario"
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
