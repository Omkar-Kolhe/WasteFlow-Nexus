import { Layers } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'

export function RootCauseTransformation({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-signal" />
          <span className="label-tech text-[8.5px]">ROOT-CAUSE CAUSAL CHAIN TRANSFORMATION</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          SYSTEMIC DEPENDENCY RE-STRUCTURING
        </span>
      </div>

      <div className="mt-3.5 space-y-4">
        {/* BEFORE CHAIN */}
        <div className="border border-critical/30 bg-critical/[0.02] p-3">
          <span className="font-mono text-[8px] font-bold text-critical uppercase tracking-wider block mb-2">
            ● BASELINE CAUSAL FAILURE CASCADE
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[8.5px]">
            {scenario.causalChainBefore.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="border border-critical/40 bg-white/[0.02] px-2 py-1">
                  <span className="text-critical font-bold block text-[7px]">{step.label}</span>
                  <span className="text-ink-dim block text-[8px]">{step.detail}</span>
                </div>
                {i < scenario.causalChainBefore.length - 1 && (
                  <span className="text-critical/60 font-bold">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AFTER CHAIN */}
        <div className="border border-signal/30 bg-signal/[0.02] p-3">
          <span className="font-mono text-[8px] font-bold text-signal uppercase tracking-wider block mb-2">
            ● SCENARIO RESOLVED VALUE CASCADE
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[8.5px]">
            {scenario.causalChainAfter.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="border border-signal/40 bg-white/[0.02] px-2 py-1">
                  <span className="text-signal font-bold block text-[7px]">{step.label}</span>
                  <span className="text-ink-dim block text-[8px]">{step.detail}</span>
                </div>
                {i < scenario.causalChainAfter.length - 1 && (
                  <span className="text-signal/60 font-bold">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
