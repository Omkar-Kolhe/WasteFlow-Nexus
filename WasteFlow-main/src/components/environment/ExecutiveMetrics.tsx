import React from 'react'
import {
  TrendingDown,
  TrendingUp,
  Recycle,
  Trash2,
  Leaf,
  Fuel,
  Scale,
  Sparkles,
} from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface ExecutiveMetricsProps {
  summary: EnvironmentalMetricSummary
  scenarioActive?: boolean
  scenarioName?: string
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({
  summary,
  scenarioActive = false,
  scenarioName,
}) => {
  const { periodChanges } = summary

  const cards = [
    {
      label: 'TOTAL WASTE TODAY',
      value: formatNumber(summary.totalCollectedT),
      unit: 'T/day',
      icon: Scale,
      subtext: `${formatNumber(summary.totalGeneratedT)} T generated · ${summary.totalGeneratedT - summary.totalCollectedT} T gap`,
      color: 'text-white',
      accent: 'border-white/10 bg-white/[0.02]',
      delta: null,
      tooltip: 'Total waste physically collected by the system.',
    },
    {
      label: 'CIRCULAR RECOVERY',
      value: formatNumber(summary.totalRecoveredT),
      unit: 'T/day',
      icon: Recycle,
      subtext: `Target: ${formatNumber(summary.potentialRecoveryT)} T/day recoverable`,
      color: 'text-emerald-400',
      accent: 'border-emerald-500/20 bg-emerald-500/[0.02]',
      delta: {
        val: `${periodChanges.recoveryPctDelta > 0 ? '+' : ''}${periodChanges.recoveryPctDelta}%`,
        isGood: periodChanges.recoveryPctDelta >= 0,
      },
      tooltip: 'Waste diverted from landfill into circular economy streams.',
    },
    {
      label: 'LANDFILL DEPOSIT',
      value: formatNumber(summary.totalLandfillT),
      unit: 'T/day',
      icon: Trash2,
      subtext: `Dependency: ${summary.landfillDependencyPct}% of collected stream`,
      color: 'text-red-400',
      accent: 'border-red-500/20 bg-red-500/[0.02]',
      delta: {
        val: `${periodChanges.landfillTDeltaPct > 0 ? '+' : ''}${periodChanges.landfillTDeltaPct}%`,
        isGood: periodChanges.landfillTDeltaPct <= 0,
      },
      tooltip: 'Share of processed waste sent to landfill.',
    },
    {
      label: 'RECOVERY RATE',
      value: `${summary.recoveryRatePct}%`,
      unit: 'efficiency',
      icon: Sparkles,
      subtext: `Benchmark: 75% target (+${(75 - summary.recoveryRatePct).toFixed(1)}% needed)`,
      color: 'text-teal-400',
      accent: 'border-teal-500/20 bg-teal-500/[0.02]',
      delta: {
        val: `${periodChanges.recoveryPctDelta > 0 ? '+' : ''}${periodChanges.recoveryPctDelta}%`,
        isGood: periodChanges.recoveryPctDelta >= 0,
      },
      tooltip: 'Recovered waste as a percentage of processed waste.',
    },
    {
      label: 'TOTAL CO₂e FOOTPRINT',
      value: summary.totalCo2eT.toString(),
      unit: 'T/day',
      icon: Leaf,
      subtext: `${summary.transportCo2eT} T transport · ${summary.facilityCo2eT} T plants`,
      color: 'text-amber-400',
      accent: 'border-amber-500/20 bg-amber-500/[0.02]',
      delta: {
        val: `${periodChanges.co2eDeltaPct > 0 ? '+' : ''}${periodChanges.co2eDeltaPct}%`,
        isGood: periodChanges.co2eDeltaPct <= 0,
      },
      tooltip: 'Estimated carbon emissions associated with system operations.',
    },
    {
      label: 'FLEET FUEL CONSUMED',
      value: formatNumber(summary.totalFuelLiters),
      unit: 'L/day',
      icon: Fuel,
      subtext: `${summary.fuelPerTripLiters} L/trip · ${summary.fuelPerTonneLiters} L/Tonne haul`,
      color: 'text-cyan-400',
      accent: 'border-cyan-500/20 bg-cyan-500/[0.02]',
      delta: {
        val: `${periodChanges.fuelDeltaPct > 0 ? '+' : ''}${periodChanges.fuelDeltaPct}%`,
        isGood: periodChanges.fuelDeltaPct <= 0,
      },
      tooltip: 'Diesel equivalent fuel consumed by the collection and transfer fleet.',
    },
  ]

  return (
    <div className="space-y-2">
      {scenarioActive && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
              SCENARIO IMPACT OVERLAY ACTIVE:
            </span>
            <span className="text-white font-medium">{scenarioName || 'Simulated Scenario'}</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300/70">
            Metrics reflect simulated network transformation
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border ${c.accent} flex flex-col justify-between hover:border-white/20 transition-all shadow-lg backdrop-blur-sm`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-mono tracking-wider uppercase text-white/50">
                      {c.label}
                    </span>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5" title={c.tooltip}>
                    <Icon size={13} className={c.color} />
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-bold tracking-tight font-mono ${c.color}`}>
                    {c.value}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">{c.unit}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10.5px]">
                <span className="text-white/45 truncate max-w-[130px]" title={c.subtext}>
                  {c.subtext}
                </span>
                {c.delta && (
                  <span
                    className={`font-mono text-[10px] flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded ${
                      c.delta.isGood
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {c.delta.isGood ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                    {c.delta.val}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
