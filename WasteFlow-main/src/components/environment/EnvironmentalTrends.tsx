import React, { useState } from 'react'
import { Sparkles, BarChart2 } from 'lucide-react'
import type { TimeSeriesTrendPoint } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface EnvironmentalTrendsProps {
  trendData: Record<'24H' | '7D' | '30D', TimeSeriesTrendPoint[]>
  insights: string[]
}

type MetricKey = 'recoveryRate' | 'landfillWaste' | 'co2eKg' | 'fuelLiters' | 'wasteProcessed' | 'trips'

export const EnvironmentalTrends: React.FC<EnvironmentalTrendsProps> = ({
  trendData,
  insights,
}) => {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D' | 'CUSTOM'>('7D')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('recoveryRate')

  const metricConfigs: Record<
    MetricKey,
    { label: string; unit: string; color: string; format: (v: number) => string; lowerIsBetter: boolean }
  > = {
    recoveryRate: {
      label: 'Recovery Rate',
      unit: '%',
      color: '#4FE3C1',
      format: (v) => `${v}%`,
      lowerIsBetter: false,
    },
    landfillWaste: {
      label: 'Landfill Waste',
      unit: 'T/day',
      color: '#F43F5E',
      format: (v) => `${formatNumber(v)} T`,
      lowerIsBetter: true,
    },
    co2eKg: {
      label: 'CO₂e Emissions',
      unit: 'kg/day',
      color: '#FBBF24',
      format: (v) => `${formatNumber(v)} kg`,
      lowerIsBetter: true,
    },
    fuelLiters: {
      label: 'Fuel Consumption',
      unit: 'L/day',
      color: '#38BDF8',
      format: (v) => `${formatNumber(v)} L`,
      lowerIsBetter: true,
    },
    wasteProcessed: {
      label: 'Waste Processed',
      unit: 'T/day',
      color: '#A855F7',
      format: (v) => `${formatNumber(v)} T`,
      lowerIsBetter: false,
    },
    trips: {
      label: 'Vehicle Trips',
      unit: 'trips',
      color: '#E2E8F0',
      format: (v) => `${formatNumber(v)}`,
      lowerIsBetter: true,
    },
  }

  const activePoints = timeRange === 'CUSTOM' ? trendData['7D'] : trendData[timeRange]
  const config = metricConfigs[selectedMetric]

  // Chart dimensions & calculations
  const values = activePoints.map((p) => p[selectedMetric])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
              <BarChart2 size={14} className="text-emerald-400" />
              TEMPORAL ENVIRONMENTAL TRENDS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
              LEDGER VERIFIED
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Diurnal rhythms, 7-day cyclical model shifts, and projected long-range material flows.
          </p>
        </div>

        {/* Time-Range Selector Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto font-mono text-[10.5px]">
          {(['24H', '7D', '30D', 'CUSTOM'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {r === '24H' ? '24 HOURS' : r === '7D' ? '7 DAYS' : r === '30D' ? '30 DAYS' : 'CUSTOM'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {(Object.keys(metricConfigs) as MetricKey[]).map((key) => {
          const cfg = metricConfigs[key]
          const isSelected = selectedMetric === key

          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'border-white/30 bg-white/10 text-white font-bold shadow-md'
                  : 'border-white/5 bg-white/[0.015] text-white/50 hover:text-white hover:border-white/15'
              }`}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* SVG Trend Chart Visualization */}
      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white/50">{config.label} Dynamics ({config.unit})</span>
          <div className="flex items-center gap-3">
            <span className="text-white/40">Min: <strong className="text-white font-mono">{config.format(minVal)}</strong></span>
            <span className="text-white/40">Peak: <strong className="text-white font-mono">{config.format(maxVal)}</strong></span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="h-44 flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1">
          {activePoints.map((p, idx) => {
            const val = p[selectedMetric]
            const heightPct = Math.max(12, Math.round(((val - minVal) / range) * 80 + 15))

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 border border-white/20 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-20">
                  {p.label}: {config.format(val)}
                </div>

                {/* Bar */}
                <div
                  className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: config.color,
                    opacity: 0.85,
                  }}
                />

                {/* X-axis label */}
                <span className="text-[9px] font-mono text-white/40 mt-1.5 truncate max-w-full">
                  {p.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 11. Trend Insights Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-emerald-400 font-semibold tracking-wider">
          <Sparkles size={12} />
          <span>DATA-DRIVEN TREND OBSERVATIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-white/70">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span className="text-[11.5px] leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
