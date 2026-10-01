import { Sparkles } from 'lucide-react'
import type { SimulationRunResult } from '@/engine/simulationTypes'
import { cn } from '@/lib/utils'

export function SimulationBottleneckDiff({
  resolvedBottlenecks,
  className,
}: {
  resolvedBottlenecks: SimulationRunResult['resolvedBottlenecks']
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">BOTTLENECK RESOLUTION ANALYSIS</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          PHASE 5 INTELLIGENCE RE-EVALUATION
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {resolvedBottlenecks.map((item) => {
          const isResolved = item.status === 'RESOLVED'
          const isRelieved = item.status === 'RELIEVED'

          const badgeColor = isResolved ? '#4FE3C1' : isRelieved ? '#E5B44C' : '#E2595B'
          const badgeBg = isResolved ? 'bg-signal/10 border-signal/40' : isRelieved ? 'bg-warn/10 border-warn/40' : 'bg-critical/10 border-critical/40'

          return (
            <div
              key={item.facilityId}
              className="flex items-start justify-between border border-hair bg-white/[0.015] p-3 transition-all"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5" style={{ background: badgeColor }} />
                  <span className="font-mono text-[10.5px] font-medium tracking-[0.04em] text-ink">
                    {item.facilityName}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2 font-mono text-[8px] text-ink-faint">
                  <span>BEFORE: <strong className="text-critical">{item.beforeSeverity}</strong></span>
                  <span>→</span>
                  <span>AFTER: <strong style={{ color: badgeColor }}>{item.afterSeverity}</strong></span>
                </div>
              </div>

              <span
                className={cn('border px-1.5 py-[1px] font-mono text-[7.5px] tracking-[0.1em] shrink-0', badgeBg)}
                style={{ color: badgeColor }}
              >
                {item.status}
              </span>
            </div>
          )
        })}

        {resolvedBottlenecks.length === 0 && (
          <div className="border border-hair bg-white/[0.015] p-3 text-center font-mono text-[9px] text-ink-faint sm:col-span-2">
            No active baseline bottlenecks to compare.
          </div>
        )}
      </div>
    </div>
  )
}
