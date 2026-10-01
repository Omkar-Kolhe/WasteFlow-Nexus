import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { SimulationMetricDelta } from '@/engine/simulationTypes'
import { cn, formatNumber } from '@/lib/utils'

export function BeforeAfterComparison({
  deltas,
  className,
}: {
  deltas: Record<string, SimulationMetricDelta>
  className?: string
}) {
  const deltaList = Object.values(deltas)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="label-tech text-[8.5px]">CURRENT SYSTEM VS SIMULATED OUTCOME</span>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          10-METRIC FULL DIFF
        </span>
      </div>

      <div className="overflow-x-auto border border-hair bg-white/[0.01]">
        <table className="w-full text-left font-mono text-[9px]">
          <thead>
            <tr className="border-b border-hair bg-white/[0.02] text-ink-ghost">
              <th className="p-2.5 font-normal">OPERATIONAL METRIC</th>
              <th className="p-2.5 font-normal text-right">BASELINE (CURRENT)</th>
              <th className="p-2.5 font-normal text-center">→</th>
              <th className="p-2.5 font-normal text-right">SIMULATED</th>
              <th className="p-2.5 font-normal text-right">NET DELTA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair/50">
            {deltaList.map((d) => {
              const isGood = d.isPositive
              const isZero = d.deltaAbsolute === 0
              const deltaColor = isZero ? 'text-ink-dim' : isGood ? 'text-signal' : 'text-critical'

              return (
                <tr key={d.label} className="transition-colors hover:bg-white/[0.02]">
                  <td className="p-2.5 font-medium text-ink">{d.label}</td>
                  <td className="p-2.5 text-right text-ink-faint">
                    {formatNumber(d.baselineValue)} {d.unit}
                  </td>
                  <td className="p-2.5 text-center text-ink-ghost">
                    <ArrowRight size={10} className="inline opacity-40" />
                  </td>
                  <td className="p-2.5 text-right font-semibold text-ink">
                    {formatNumber(d.simulatedValue)} {d.unit}
                  </td>
                  <td className={cn('p-2.5 text-right font-semibold', deltaColor)}>
                    <div className="flex items-center justify-end gap-1">
                      {!isZero && (
                        d.deltaAbsolute > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                      )}
                      {isZero ? (
                        <span>—</span>
                      ) : (
                        <span>
                          {d.deltaPct > 0 ? `+${d.deltaPct.toFixed(1)}%` : `${d.deltaPct.toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
