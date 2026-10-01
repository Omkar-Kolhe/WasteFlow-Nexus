import {
  Activity,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn, formatNumber } from '@/lib/utils'

export function ScenarioTimeline({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const steps = [
    {
      stage: 'STAGE 01',
      title: 'BASELINE STATE',
      desc: `${formatNumber(scenario.baselineMetrics.wasteCollectedT)} T/day collected · ${scenario.baselineMetrics.criticalBottlenecksCount} critical bottlenecks active`,
      tone: 'critical',
    },
    {
      stage: 'STAGE 02',
      title: 'INTERVENTION INTRODUCED',
      desc: scenario.interventionSummary,
      tone: 'warn',
    },
    {
      stage: 'STAGE 03',
      title: 'SIMULATION RECALCULATION',
      desc: 'Flow corridors, queue dynamics, and emissions re-balanced through core engine',
      tone: 'signal',
    },
    {
      stage: 'STAGE 04',
      title: 'MEASURED RESULT',
      desc: `${scenario.environmentalImpact.backlogDeltaPct}% backlog reduction · ${scenario.environmentalImpact.co2eDeltaPct}% CO₂e reduction`,
      tone: 'cyan',
    },
  ]

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Activity size={13} className="text-signal" />
          <span className="label-tech text-[8.5px]">INTERVENTION DEPLOYMENT TIMELINE</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          CHRONOLOGICAL LIFE-CYCLE
        </span>
      </div>

      <div className="mt-3.5 grid gap-2 sm:grid-cols-4 font-mono text-[8.5px]">
        {steps.map((st, i) => {
          const toneColor =
            st.tone === 'critical'
              ? 'border-critical/50 text-critical bg-critical/[0.02]'
              : st.tone === 'warn'
                ? 'border-warn/50 text-warn bg-warn/[0.02]'
                : st.tone === 'cyan'
                  ? 'border-cyan-400/50 text-cyan-400 bg-cyan-400/[0.02]'
                  : 'border-signal/50 text-signal bg-signal/[0.02]'

          return (
            <div key={i} className={cn('border p-3 flex flex-col justify-between', toneColor)}>
              <div>
                <span className="block text-[7px] text-ink-ghost uppercase tracking-wider mb-1">
                  {st.stage}
                </span>
                <h4 className="font-semibold text-[10.5px] uppercase tracking-wide">
                  {st.title}
                </h4>
              </div>
              <p className="mt-2 text-[9.5px] leading-relaxed text-ink-dim font-sans">
                {st.desc}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
