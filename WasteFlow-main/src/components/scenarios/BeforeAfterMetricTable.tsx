import { BarChart2 } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn, formatNumber } from '@/lib/utils'

export function BeforeAfterMetricTable({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const { baselineMetrics, simulatedMetrics, deltas } = scenario

  const tableRows = [
    {
      label: 'Waste Collected',
      unit: 'T/day',
      current: baselineMetrics.wasteCollectedT,
      scenarioVal: simulatedMetrics.wasteCollectedT,
      delta: deltas.wasteCollected?.deltaPct ?? 0,
      polarity: 'neutral' as const,
    },
    {
      label: 'Waste Processed',
      unit: 'T/day',
      current: baselineMetrics.wasteProcessedT,
      scenarioVal: simulatedMetrics.wasteProcessedT,
      delta: deltas.wasteProcessed?.deltaPct ?? 0,
      polarity: 'higher-better' as const,
    },
    {
      label: 'Recovery Rate',
      unit: '%',
      current: baselineMetrics.recoveryRatePct,
      scenarioVal: simulatedMetrics.recoveryRatePct,
      delta: Number((simulatedMetrics.recoveryRatePct - baselineMetrics.recoveryRatePct).toFixed(1)),
      polarity: 'higher-better' as const,
      isAbsoluteDiff: true,
    },
    {
      label: 'Landfill Waste',
      unit: 'T/day',
      current: baselineMetrics.wasteToLandfillT,
      scenarioVal: simulatedMetrics.wasteToLandfillT,
      delta: deltas.wasteToLandfill?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
    {
      label: 'Backlog Tonnage',
      unit: 'T',
      current: baselineMetrics.backlogT,
      scenarioVal: simulatedMetrics.backlogT,
      delta: deltas.backlog?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
    {
      label: 'Waiting Time (Gate Dwell)',
      unit: 'min',
      current: baselineMetrics.meanQueueMin,
      scenarioVal: simulatedMetrics.meanQueueMin,
      delta: Number((simulatedMetrics.meanQueueMin - baselineMetrics.meanQueueMin).toFixed(0)),
      polarity: 'lower-better' as const,
      isAbsoluteDiff: true,
    },
    {
      label: 'System Utilization',
      unit: '%',
      current: baselineMetrics.systemUtilizationPct,
      scenarioVal: simulatedMetrics.systemUtilizationPct,
      delta: Number((simulatedMetrics.systemUtilizationPct - baselineMetrics.systemUtilizationPct).toFixed(1)),
      polarity: 'lower-better' as const,
      isAbsoluteDiff: true,
    },
    {
      label: 'Total Fleet Trips',
      unit: '/day',
      current: baselineMetrics.tripsToday,
      scenarioVal: simulatedMetrics.tripsToday,
      delta: deltas.totalTrips?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
    {
      label: 'Haul Distance Workload',
      unit: 'T·km',
      current: baselineMetrics.distanceTonneKm,
      scenarioVal: simulatedMetrics.distanceTonneKm,
      delta: deltas.distanceTonneKm?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
    {
      label: 'Diesel Fuel Burn',
      unit: 'L/day',
      current: baselineMetrics.fuelLiters,
      scenarioVal: simulatedMetrics.fuelLiters,
      delta: deltas.fuelBurn?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
    {
      label: 'CO₂e Footprint',
      unit: 'kg/day',
      current: baselineMetrics.co2eKg,
      scenarioVal: simulatedMetrics.co2eKg,
      delta: deltas.co2e?.deltaPct ?? 0,
      polarity: 'lower-better' as const,
    },
  ]

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel space-y-4',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} className="text-signal" />
          <span className="label-tech text-[8.5px]">11-METRIC SYSTEM RECALCULATION</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          ALL VALUES STRICTLY DERIVED FROM CALCULATION ENGINE
        </span>
      </div>

      {/* Visual Comparison Bars for Core Indicators */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 border border-hair/50 bg-white/[0.01] p-3">
        <VisualComparisonBar
          label="CO₂e EMISSIONS"
          baseline={baselineMetrics.co2eKg}
          simulated={simulatedMetrics.co2eKg}
          unit="kg/d"
          deltaPct={scenario.environmentalImpact.co2eDeltaPct}
          polarity="lower-better"
        />
        <VisualComparisonBar
          label="LANDFILL INTAKE"
          baseline={baselineMetrics.wasteToLandfillT}
          simulated={simulatedMetrics.wasteToLandfillT}
          unit="T/d"
          deltaPct={scenario.environmentalImpact.landfillDeltaPct}
          polarity="lower-better"
        />
        <VisualComparisonBar
          label="RECOVERY RATE"
          baseline={baselineMetrics.recoveryRatePct}
          simulated={simulatedMetrics.recoveryRatePct}
          unit="%"
          deltaPct={scenario.environmentalImpact.recoveryDeltaPct}
          polarity="higher-better"
        />
        <VisualComparisonBar
          label="GATE QUEUE DWELL"
          baseline={baselineMetrics.meanQueueMin}
          simulated={simulatedMetrics.meanQueueMin}
          unit="min"
          deltaPct={
            baselineMetrics.meanQueueMin > 0
              ? ((simulatedMetrics.meanQueueMin - baselineMetrics.meanQueueMin) /
                  baselineMetrics.meanQueueMin) *
                100
              : 0
          }
          polarity="lower-better"
        />
      </div>

      {/* Full 11-Metric Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[9px] border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-hair/60 text-ink-ghost text-[7.5px] uppercase tracking-wider">
              <th className="py-1.5 pl-2 font-medium">METRIC INDICATOR</th>
              <th className="py-1.5 text-right font-medium">CURRENT SYSTEM</th>
              <th className="py-1.5 text-right font-medium text-signal">SCENARIO RESULT</th>
              <th className="py-1.5 text-right pr-2 font-medium">MEASURED DELTA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {tableRows.map((row) => {
              const isPositive =
                row.polarity === 'higher-better'
                  ? row.delta > 0
                  : row.polarity === 'lower-better'
                    ? row.delta < 0
                    : true

              const isNeutral = Math.abs(row.delta) < 0.1

              const toneColor = isNeutral
                ? 'text-ink-ghost'
                : isPositive
                  ? 'text-signal'
                  : 'text-critical'

              return (
                <tr key={row.label} className="hover:bg-white/[0.015] transition-colors">
                  <td className="py-2 pl-2 text-ink-dim flex items-center gap-1.5">
                    <span className="h-1 w-1 bg-signal/60 rounded-full" />
                    <span>{row.label}</span>
                  </td>
                  <td className="py-2 text-right text-ink-ghost">
                    {formatNumber(row.current)} {row.unit}
                  </td>
                  <td className="py-2 text-right font-semibold text-ink">
                    {formatNumber(row.scenarioVal)} {row.unit}
                  </td>
                  <td className={cn('py-2 text-right pr-2 font-bold', toneColor)}>
                    {row.delta > 0 ? '+' : ''}
                    {row.delta}
                    {row.isAbsoluteDiff ? ` ${row.unit}` : '%'}
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

function VisualComparisonBar({
  label,
  baseline,
  simulated,
  unit,
  deltaPct,
  polarity,
}: {
  label: string
  baseline: number
  simulated: number
  unit: string
  deltaPct: number
  polarity: 'higher-better' | 'lower-better'
}) {
  const isPositive = polarity === 'higher-better' ? deltaPct > 0 : deltaPct < 0
  const maxVal = Math.max(baseline, simulated) * 1.05
  const baseRatio = (baseline / maxVal) * 100
  const simRatio = (simulated / maxVal) * 100

  return (
    <div className="space-y-1.5 p-1 font-mono text-[8px]">
      <div className="flex items-center justify-between">
        <span className="text-ink-ghost">{label}</span>
        <span className={cn('font-bold', isPositive ? 'text-signal' : 'text-critical')}>
          {deltaPct > 0 ? '+' : ''}
          {deltaPct.toFixed(1)}%
        </span>
      </div>

      {/* Baseline Bar */}
      <div>
        <div className="flex justify-between text-[7px] text-ink-ghost mb-0.5">
          <span>CURRENT</span>
          <span>
            {formatNumber(baseline)} {unit}
          </span>
        </div>
        <div className="h-1 w-full bg-white/[0.05]">
          <div className="h-full bg-white/30" style={{ width: `${baseRatio}%` }} />
        </div>
      </div>

      {/* Scenario Bar */}
      <div>
        <div className="flex justify-between text-[7px] text-ink-dim mb-0.5">
          <span>SCENARIO</span>
          <span className="text-signal font-semibold">
            {formatNumber(simulated)} {unit}
          </span>
        </div>
        <div className="h-1 w-full bg-white/[0.05]">
          <div
            className={cn('h-full', isPositive ? 'bg-signal' : 'bg-critical')}
            style={{ width: `${simRatio}%` }}
          />
        </div>
      </div>
    </div>
  )
}
