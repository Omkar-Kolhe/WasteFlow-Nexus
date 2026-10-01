import { Sparkles } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'

export function BottleneckTransformation({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const diffs = scenario.bottleneckDiff

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">BOTTLENECK DISSIPATION & RE-DETECTION</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          PHASE 5 INTELLIGENCE RE-EVALUATION
        </span>
      </div>

      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {diffs.map((diff) => {
          const isResolved = diff.status === 'RESOLVED'
          const isReduced = diff.status === 'REDUCED'

          const badgeClass = isResolved
            ? 'border-signal/50 bg-signal/15 text-signal'
            : isReduced
              ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-400'
              : 'border-white/10 bg-white/[0.04] text-ink-ghost'

          return (
            <div
              key={diff.facilityId}
              className="border border-hair/50 bg-white/[0.01] p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[7px] text-ink-ghost">
                    {diff.facilityId}
                  </span>
                  <span
                    className={cn(
                      'border px-1.5 py-[1px] font-mono text-[7px] font-bold uppercase',
                      badgeClass,
                    )}
                  >
                    {diff.status}
                  </span>
                </div>

                <h4 className="mt-1 text-[12px] font-medium text-ink">
                  {diff.facilityName}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-hair/30 flex items-center justify-between font-mono text-[8.5px]">
                <span className="text-critical uppercase font-semibold">
                  BEFORE: {diff.beforeSeverity}
                </span>
                <span className="text-ink-ghost">→</span>
                <span
                  className={cn(
                    'uppercase font-bold',
                    isResolved ? 'text-signal' : 'text-warn',
                  )}
                >
                  AFTER: {diff.afterSeverity}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
