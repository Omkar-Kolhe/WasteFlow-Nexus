import {
  Flame,
  Leaf,
  Recycle,
  TrendingDown,
  Truck,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn, formatNumber } from '@/lib/utils'

export function EnvironmentalImpactPanel({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const impact = scenario.environmentalImpact

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Leaf size={13} className="text-signal" />
          <span className="label-tech text-[8.5px]">ENVIRONMENTAL DIVIDEND ASSESSMENT</span>
        </div>
        <span className="font-mono text-[8px] text-ink-ghost">
          CALCULATED CITYWIDE ECO-DIVIDENDS
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 font-mono">
        {/* 1. CO2e */}
        <div className="border border-signal/30 bg-signal/[0.03] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px]">
            <span>CO₂e FOOTPRINT</span>
            <Leaf size={11} className="text-signal" />
          </div>
          <span className="data-value mt-1 block text-[15px] font-bold text-signal">
            {impact.co2eDeltaPct > 0 ? '+' : ''}{impact.co2eDeltaPct.toFixed(1)}%
          </span>
          <span className="mt-1 block text-[8px] text-ink-faint">
            -{impact.co2eDeltaT} T CO₂e / DAY
          </span>
        </div>

        {/* 2. Landfill */}
        <div className="border border-signal/30 bg-signal/[0.03] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px]">
            <span>LANDFILL BURDEN</span>
            <TrendingDown size={11} className="text-signal" />
          </div>
          <span className="data-value mt-1 block text-[15px] font-bold text-signal">
            {impact.landfillDeltaPct > 0 ? '+' : ''}{impact.landfillDeltaPct.toFixed(1)}%
          </span>
          <span className="mt-1 block text-[8px] text-ink-faint">
            -{formatNumber(impact.wasteDivertedT)} T / DAY DIVERTED
          </span>
        </div>

        {/* 3. Fuel */}
        <div className="border border-signal/30 bg-signal/[0.03] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px]">
            <span>DIESEL FUEL SAVED</span>
            <Flame size={11} className="text-signal" />
          </div>
          <span className="data-value mt-1 block text-[15px] font-bold text-signal">
            {impact.fuelDeltaPct > 0 ? '+' : ''}{impact.fuelDeltaPct.toFixed(1)}%
          </span>
          <span className="mt-1 block text-[8px] text-ink-faint">
            {impact.fuelDeltaLiters > 0 ? '+' : ''}{impact.fuelDeltaLiters} L / DAY
          </span>
        </div>

        {/* 4. Trips */}
        <div className="border border-signal/30 bg-signal/[0.03] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px]">
            <span>HAUL TRIPS AVOIDED</span>
            <Truck size={11} className="text-signal" />
          </div>
          <span className="data-value mt-1 block text-[15px] font-bold text-signal">
            {impact.tripsDeltaPct > 0 ? '+' : ''}{impact.tripsDeltaPct.toFixed(1)}%
          </span>
          <span className="mt-1 block text-[8px] text-ink-faint">
            {impact.tripsDeltaCount} FEWER TRIPS / DAY
          </span>
        </div>

        {/* 5. Circular Recovery */}
        <div className="border border-signal/30 bg-signal/[0.03] p-2.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px]">
            <span>CIRCULAR RECOVERY</span>
            <Recycle size={11} className="text-signal" />
          </div>
          <span className="data-value mt-1 block text-[15px] font-bold text-signal">
            +{impact.recoveryDeltaPct.toFixed(1)}%
          </span>
          <span className="mt-1 block text-[8px] text-ink-faint">
            {scenario.simulatedMetrics.recoveryRatePct}% TOTAL CIRCULARITY
          </span>
        </div>
      </div>
    </div>
  )
}
