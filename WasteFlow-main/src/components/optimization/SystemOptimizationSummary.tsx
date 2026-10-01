import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Leaf,
  Sparkles,
  TrendingDown,
} from 'lucide-react'
import type { OptimizationSummary } from '@/engine/optimizationTypes'
import { formatNumber } from '@/lib/utils'

export function SystemOptimizationSummary({
  summary,
  className,
}: {
  summary: OptimizationSummary
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">SYSTEM RECOMMENDATION SUMMARY</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          DERIVED FROM LIVE NETWORK PHYSICS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* System Health */}
        <div className="surface border border-hair bg-white/[0.015] p-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[7px] text-ink-ghost">SYSTEM HEALTH</span>
            <Activity size={11} className="text-signal" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="data-value text-[17px] font-semibold text-ink">
              {summary.systemHealthBaselinePct}%
            </span>
            <span className="font-mono text-[10px] text-ink-ghost">→</span>
            <span className="data-value text-[17px] font-semibold text-signal">
              {summary.systemHealthOptimizedPct}%
            </span>
          </div>
          <span className="mt-1 block font-mono text-[8px] text-signal/90">
            +{summary.systemHealthOptimizedPct - summary.systemHealthBaselinePct}% POTENTIAL LIFT
          </span>
        </div>

        {/* Current Bottlenecks */}
        <div className="surface border border-hair bg-white/[0.015] p-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[7px] text-ink-ghost">CURRENT BOTTLENECKS</span>
            <AlertTriangle size={11} className="text-critical" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="data-value text-[18px] font-semibold text-critical">
              {summary.currentBottlenecksCount}
            </span>
            <span className="font-mono text-[9px] text-ink-ghost">
              ({summary.criticalBottlenecksCount} CRITICAL)
            </span>
          </div>
          <span className="mt-1 block font-mono text-[8px] text-warn">
            ACTIONABLE TARGETS IDENTIFIED
          </span>
        </div>

        {/* Optimization Opportunities */}
        <div className="surface border border-hair bg-white/[0.015] p-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[7px] text-ink-ghost">OPTIMIZATION OPPORTUNITIES</span>
            <Sparkles size={11} className="text-cyan-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="data-value text-[18px] font-semibold text-cyan-400">
              {summary.opportunitiesCount}
            </span>
            <span className="font-mono text-[9px] text-ink-ghost">INTERVENTIONS</span>
          </div>
          <span className="mt-1 block font-mono text-[8px] text-ink-faint">
            GROUNDED IN SYSTEM DATA
          </span>
        </div>

        {/* Potential CO2 Reduction */}
        <div className="surface border border-hair bg-white/[0.015] p-3 shadow-panel">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[7px] text-ink-ghost">POTENTIAL CO₂ REDUCTION</span>
            <Leaf size={11} className="text-signal" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="data-value text-[18px] font-semibold text-signal">
              {summary.potentialCo2ReductionT}
            </span>
            <span className="font-mono text-[9px] text-ink-ghost">T / DAY</span>
          </div>
          <span className="mt-1 flex items-center gap-1 font-mono text-[8px] text-signal/90">
            <ArrowDownRight size={10} /> -{formatNumber(summary.potentialCo2ReductionKg)} KG/DAY COMBINED
          </span>
        </div>

        {/* Potential Landfill Diversion */}
        <div className="surface border border-hair bg-white/[0.015] p-3 shadow-panel col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[7px] text-ink-ghost">POTENTIAL LANDFILL DIVERSION</span>
            <TrendingDown size={11} className="text-signal" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="data-value text-[18px] font-semibold text-signal">
              {formatNumber(summary.potentialLandfillDiversionT)}
            </span>
            <span className="font-mono text-[9px] text-ink-ghost">T / DAY</span>
          </div>
          <span className="mt-1 block font-mono text-[8px] text-signal/90">
            DIVERTS +{summary.potentialRecoveryGainPct}% TO RECOVERY
          </span>
        </div>
      </div>
    </div>
  )
}
