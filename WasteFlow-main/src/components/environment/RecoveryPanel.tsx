import React from 'react'
import { Recycle, AlertCircle } from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface RecoveryPanelProps {
  summary: EnvironmentalMetricSummary
}

export const RecoveryPanel: React.FC<RecoveryPanelProps> = ({ summary }) => {
  const currentRecovery = summary.totalRecoveredT
  const potentialRecovery = summary.potentialRecoveryT
  const recoveryGap = summary.recoveryGapT
  const recoveryRate = summary.recoveryRatePct
  const recoveryCapacity = summary.recoveryCapacityT

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Recycle size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recovery & Material Circularity</h3>
              <p className="text-[11px] text-white/50">Citywide resource reclamation vs theoretical ceiling</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {recoveryRate}% EFFICIENCY
          </span>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">CURRENT RECOVERY</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold text-emerald-400">{formatNumber(currentRecovery)}</span>
              <span className="text-[10px] text-white/40">T/day</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Active diversion</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">POTENTIAL CEILING</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold text-white">{formatNumber(potentialRecovery)}</span>
              <span className="text-[10px] text-white/40">T/day</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">With unblocked bottlenecks</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/[0.03] border border-amber-500/20">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">RECOVERY GAP</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold text-amber-400">{formatNumber(recoveryGap)}</span>
              <span className="text-[10px] text-amber-400/60">T/day</span>
            </div>
            <span className="text-[10px] text-amber-300/80 mt-1 block">Unrecovered dry recyclates</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">INSTALLED CAPACITY</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-xl font-bold text-white">{formatNumber(recoveryCapacity)}</span>
              <span className="text-[10px] text-white/40">T/day</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">MRF + Digestion units</span>
          </div>
        </div>

        {/* Visual Progress Bar to Potential */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">Recovery Capture vs Potential</span>
            <span className="text-emerald-400 font-semibold">
              {potentialRecovery > 0 ? ((currentRecovery / potentialRecovery) * 100).toFixed(1) : 0}% Realized
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-emerald-400 rounded-l-full transition-all duration-500"
              style={{
                width: `${potentialRecovery > 0 ? (currentRecovery / potentialRecovery) * 100 : 0}%`,
              }}
            />
            <div
              className="h-full bg-amber-400/40 rounded-r-full"
              style={{
                width: `${potentialRecovery > 0 ? (recoveryGap / potentialRecovery) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Captured: {formatNumber(currentRecovery)} T
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Stranded Gap: {formatNumber(recoveryGap)} T
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Root Cause Gap Notes */}
      <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-xs text-white/60 space-y-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
          <AlertCircle size={12} />
          <span>Why does the {recoveryGap} T/day Recovery Gap exist?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-white/50">
          Over 68% of the gap is driven by Kanjurmarg Sorting line overcapacity ({summary.backlogT} T queuing), forcing surplus mixed streams to bypass mechanical biological treatment directly to open disposal.
        </p>
      </div>
    </div>
  )
}
