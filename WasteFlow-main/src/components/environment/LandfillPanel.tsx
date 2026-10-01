import React from 'react'
import { Trash2, TrendingDown, ShieldAlert } from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface LandfillPanelProps {
  summary: EnvironmentalMetricSummary
}

export const LandfillPanel: React.FC<LandfillPanelProps> = ({ summary }) => {
  const landfillWaste = summary.totalLandfillT
  const dependencyPct = summary.landfillDependencyPct
  const potentialDiversion = summary.potentialLandfillDiversionT
  const trend = summary.periodChanges.landfillTDeltaPct

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Trash2 size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Landfill Dependency & Dumpsite Pressure</h3>
              <p className="text-[11px] text-white/50">Residual tonnage consigned to Deonar and uncontained storage</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            {dependencyPct}% RESIDUAL SHARE
          </span>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-red-500/[0.03] border border-red-500/20">
            <span className="text-[10px] font-mono uppercase text-red-400 block">LANDFILL DEPENDENCY</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-2xl font-bold text-red-400">{dependencyPct}%</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono mt-1 text-white/50">
              <span>Trend:</span>
              <span className={`flex items-center gap-0.5 font-semibold ${trend <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <TrendingDown size={11} />
                {trend > 0 ? '+' : ''}{trend}% vs baseline
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-white/40 block">LANDFILL DAILY MASS</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-2xl font-bold text-white">{formatNumber(landfillWaste)}</span>
              <span className="text-[10px] text-white/40">T/day</span>
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">Active dumpsite dumping</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">POTENTIAL DIVERSION</span>
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              <span className="text-2xl font-bold text-emerald-400">{formatNumber(potentialDiversion)}</span>
              <span className="text-[10px] text-emerald-400/60">T/day</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-1 block">Abatable through MRF relief</span>
          </div>
        </div>

        {/* Visual Gauge / Flow Horizontal Bar */}
        <div className="mt-4 p-3.5 rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/60">Landfill Stream Breakdown</span>
            <span className="text-red-400 font-semibold">{formatNumber(landfillWaste)} T Total</span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
            {/* Irreducible residual */}
            <div
              className="h-full bg-red-500/80 rounded-l-full transition-all duration-500"
              style={{
                width: `${landfillWaste > 0 ? Math.max(10, ((landfillWaste - potentialDiversion) / landfillWaste) * 100) : 0}%`,
              }}
            />
            {/* Divertible residual */}
            <div
              className="h-full bg-emerald-400/70 rounded-r-full"
              style={{
                width: `${landfillWaste > 0 ? (potentialDiversion / landfillWaste) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Inert Residual ({formatNumber(landfillWaste - potentialDiversion)} T)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Divertible Recyclates ({formatNumber(potentialDiversion)} T)
            </span>
          </div>
        </div>
      </div>

      {/* Dumpsite Environmental Risk Warning */}
      <div className="p-3 rounded-xl bg-red-500/[0.03] border border-red-500/20 text-xs text-white/60 flex items-start gap-2.5">
        <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-mono text-red-400 font-semibold uppercase tracking-wider block">
            DUMPSITE ENVIRONMENTAL IMPACT
          </span>
          <p className="text-[11px] leading-relaxed text-white/50 mt-0.5">
            Every tonne sent to Deonar generates an estimated 1.15 T CO₂e over its lifecycle due to uncaptured anaerobic decomposition and leachate percolation into Thane Creek.
          </p>
        </div>
      </div>
    </div>
  )
}
