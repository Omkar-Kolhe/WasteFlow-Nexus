import React from 'react'
import {
  TrendingDown,
  TrendingUp,
  Activity,
  Recycle,
  Trash2,
  Leaf,
  Fuel,
} from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface EnvironmentalKPIPrioritizedGridProps {
  summary: EnvironmentalMetricSummary
}

export const EnvironmentalKPIPrioritizedGrid: React.FC<EnvironmentalKPIPrioritizedGridProps> = ({
  summary,
}) => {
  const { periodChanges } = summary

  const primaryKPIs = [
    {
      title: 'RECOVERY YIELD',
      val: `${summary.recoveryRatePct}%`,
      sub: 'Of collected municipal stream',
      icon: Recycle,
      delta: { val: `${periodChanges.recoveryPctDelta > 0 ? '+' : ''}${periodChanges.recoveryPctDelta}%`, isGood: periodChanges.recoveryPctDelta >= 0 },
      color: 'text-emerald-400',
      border: 'border-emerald-500/20 bg-emerald-500/[0.02]',
    },
    {
      title: 'LANDFILL DEPENDENCY',
      val: `${summary.landfillDependencyPct}%`,
      sub: `${formatNumber(summary.totalLandfillT)} T residual to Deonar`,
      icon: Trash2,
      delta: { val: `${periodChanges.landfillTDeltaPct > 0 ? '+' : ''}${periodChanges.landfillTDeltaPct}%`, isGood: periodChanges.landfillTDeltaPct <= 0 },
      color: 'text-red-400',
      border: 'border-red-500/20 bg-red-500/[0.02]',
    },
    {
      title: 'DAILY EMISSIONS',
      val: `${summary.totalCo2eT} T`,
      sub: `${summary.transportCo2eT} T transport / ${summary.facilityCo2eT} T plants`,
      icon: Leaf,
      delta: { val: `${periodChanges.co2eDeltaPct > 0 ? '+' : ''}${periodChanges.co2eDeltaPct}%`, isGood: periodChanges.co2eDeltaPct <= 0 },
      color: 'text-amber-400',
      border: 'border-amber-500/20 bg-amber-500/[0.02]',
    },
    {
      title: 'FLEET FUEL EXPENDITURE',
      val: `${formatNumber(summary.totalFuelLiters)} L`,
      sub: `${summary.fuelPerTripLiters} L per dispatched haul`,
      icon: Fuel,
      delta: { val: `${periodChanges.fuelDeltaPct > 0 ? '+' : ''}${periodChanges.fuelDeltaPct}%`, isGood: periodChanges.fuelDeltaPct <= 0 },
      color: 'text-cyan-400',
      border: 'border-cyan-500/20 bg-cyan-500/[0.02]',
    },
  ]

  const secondaryKPIs = [
    { label: 'Waste Generated', value: `${formatNumber(summary.totalGeneratedT)} T` },
    { label: 'Waste Collected', value: `${formatNumber(summary.totalCollectedT)} T` },
    { label: 'Waste Processed', value: `${formatNumber(summary.totalProcessedT)} T` },
    { label: 'Waste Recovered', value: `${formatNumber(summary.totalRecoveredT)} T` },
    { label: 'Waste to Landfill', value: `${formatNumber(summary.totalLandfillT)} T` },
    { label: 'Total Trips', value: `${summary.totalTrips}` },
    { label: 'Vehicle Payload Util', value: '88.4%' },
    { label: 'Average Queue Delay', value: `${summary.avgWaitingMin.toFixed(0)} min` },
  ]

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
              <Activity size={14} className="text-teal-400" />
              SYSTEM PERFORMANCE SCORECARD
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
              TODAY VS PREVIOUS PERIOD
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Key operational metrics prioritized by environmental consequence and resource intensity.
          </p>
        </div>
      </div>

      {/* Primary Tier (Large Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {primaryKPIs.map((kpi, idx) => {
          const Icon = kpi.icon

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${kpi.border} flex flex-col justify-between shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                    {kpi.title}
                  </span>
                  <Icon size={14} className={kpi.color} />
                </div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${kpi.color}`}>
                  {kpi.val}
                </div>
                <p className="text-[11px] text-white/45 mt-1">{kpi.sub}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between font-mono text-[10px]">
                <span className="text-white/40">vs Yesterday</span>
                <span
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold ${
                    kpi.delta.isGood
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {kpi.delta.isGood ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                  {kpi.delta.val}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Secondary Operational Tier (Compact Grid) */}
      <div className="pt-2">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-2 font-medium">
          NETWORK LOGISTICS & OPERATIONAL PARAMETERS
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {secondaryKPIs.map((s, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-white/[0.015] border border-white/5 text-center font-mono"
            >
              <span className="text-[9.5px] text-white/40 block truncate" title={s.label}>
                {s.label}
              </span>
              <span className="text-xs font-bold text-white block mt-1">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
