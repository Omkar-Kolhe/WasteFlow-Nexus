import { AlertTriangle, CheckCircle2, Sliders } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'

export function ScenarioChangeSummary({
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
      <div className="grid gap-4 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {/* 1. WHAT CHANGED? */}
        <div className="md:pr-4">
          <div className="flex items-center gap-1.5 pb-1">
            <Sliders size={12} className="text-cyan-400" />
            <span className="label-tech text-[8px] text-cyan-400">WHAT CHANGED?</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {scenario.changedVariables.map((v, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between border-l-2 border-cyan-400/40 pl-2 font-mono text-[9px]"
              >
                <span className="text-ink-dim truncate">{v.name}</span>
                <span className="text-signal font-semibold shrink-0 ml-2">
                  {v.baseline} → {v.simulated} {v.unit ?? ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. WHY? */}
        <div className="pt-3 md:pt-0 md:px-4">
          <div className="flex items-center gap-1.5 pb-1">
            <AlertTriangle size={12} className="text-warn" />
            <span className="label-tech text-[8px] text-warn">WHY WAS THIS DONE?</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint border-l-2 border-warn/40 pl-2">
            {scenario.description || 'Intervention formulated to alleviate network friction and bottleneck overload.'}
          </p>
        </div>

        {/* 3. RESULT */}
        <div className="pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center gap-1.5 pb-1">
            <CheckCircle2 size={12} className="text-signal" />
            <span className="label-tech text-[8px] text-signal">MEASURED SYSTEM RESULT</span>
          </div>
          <div className="mt-2 space-y-1 font-mono text-[9.5px]">
            <div className="flex items-center gap-1.5 text-signal">
              <span>✓</span>
              <span>Backlog: {scenario.environmentalImpact.backlogDeltaPct}% cleared</span>
            </div>
            <div className="flex items-center gap-1.5 text-signal">
              <span>✓</span>
              <span>CO₂e: {scenario.environmentalImpact.co2eDeltaPct}% abated</span>
            </div>
            <div className="flex items-center gap-1.5 text-signal">
              <span>✓</span>
              <span>Landfill: {scenario.environmentalImpact.landfillDeltaPct}% diverted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
