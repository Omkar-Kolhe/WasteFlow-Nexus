import { Scale } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'

export function TradeoffPanel({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const { tradeoffs } = scenario

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Scale size={13} className="text-warn" />
          <span className="label-tech text-[8.5px]">TRADE-OFF & FEASIBILITY TRANSPARENCY</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          BALANCING CAPITAL, LOGISTICS & SYSTEM IMPACT
        </span>
      </div>

      <div className="mt-3.5 grid gap-4 md:grid-cols-2">
        {/* Positive Operational Benefits */}
        <div className="border border-signal/30 bg-signal/[0.015] p-3 space-y-2">
          <span className="font-mono text-[8px] font-bold text-signal uppercase tracking-wider block">
            ● CONFIRMED OPERATIONAL DIVIDENDS
          </span>
          <ul className="space-y-1.5 text-[10.5px] text-ink-dim font-sans">
            {tradeoffs.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-signal font-bold">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Real Trade-offs & Constraints */}
        <div className="border border-warn/30 bg-warn/[0.015] p-3 space-y-2">
          <span className="font-mono text-[8px] font-bold text-warn uppercase tracking-wider block">
            ● INTRODUCED CONSTRAINTS & CAVEATS
          </span>
          <ul className="space-y-1.5 text-[10.5px] text-ink-faint font-sans">
            {tradeoffs.downsides.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-warn font-bold">⚠</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Implementation Indicators Strip */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hair/40 pt-2.5 font-mono text-[8px]">
        <div className="border border-hair/40 bg-white/[0.01] p-2 flex items-center justify-between">
          <span className="text-ink-ghost">CAPITAL REQUIREMENT:</span>
          <span className="font-bold text-ink">{tradeoffs.capitalRequirement} CAPEX</span>
        </div>
        <div className="border border-hair/40 bg-white/[0.01] p-2 flex items-center justify-between">
          <span className="text-ink-ghost">OPERATIONAL COMPLEXITY:</span>
          <span className="font-bold text-ink">{tradeoffs.operationalComplexity}</span>
        </div>
        <div className="border border-hair/40 bg-white/[0.01] p-2 flex items-center justify-between">
          <span className="text-ink-ghost">TIME TO COMMISSION:</span>
          <span className="font-bold text-signal">{tradeoffs.timeToDeploy}</span>
        </div>
      </div>
    </div>
  )
}
