import React from 'react'
import { Leaf, Fuel, ArrowRight, Info } from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface CarbonFuelIntelligenceProps {
  summary: EnvironmentalMetricSummary
}

export const CarbonFuelIntelligence: React.FC<CarbonFuelIntelligenceProps> = ({ summary }) => {
  const co2Sources = [
    {
      label: 'TRANSPORT HAULAGE',
      valueKg: summary.transportCo2eKg,
      valueT: summary.transportCo2eT,
      pctOfTotal: Math.round((summary.transportCo2eKg / summary.totalCo2eKg) * 100),
      color: 'bg-amber-400',
      textColor: 'text-amber-400',
      description: 'Diesel combustion across collection rounds & transfer corridors',
      isEstimated: false,
    },
    {
      label: 'FACILITY OPERATIONS',
      valueKg: summary.facilityCo2eKg,
      valueT: summary.facilityCo2eT,
      pctOfTotal: Math.round((summary.facilityCo2eKg / summary.totalCo2eKg) * 100),
      color: 'bg-teal-400',
      textColor: 'text-teal-400',
      description: 'Stationary power, mechanical sorting & thermal units minus biogas credits',
      isEstimated: false,
    },
    {
      label: 'IDLING & QUEUE DELAYS',
      valueKg: summary.idlingWaitingCo2eKg,
      valueT: Number((summary.idlingWaitingCo2eKg / 1000).toFixed(2)),
      pctOfTotal: Math.round((summary.idlingWaitingCo2eKg / summary.totalCo2eKg) * 100),
      color: 'bg-red-400',
      textColor: 'text-red-400',
      description: 'Truck engine idling during congestion at facility intake gates',
      isEstimated: true,
    },
    {
      label: 'AVOIDABLE EMISSIONS',
      valueKg: summary.avoidableCo2eKg,
      valueT: summary.avoidableCo2eT,
      pctOfTotal: Math.round((summary.avoidableCo2eKg / summary.totalCo2eKg) * 100),
      color: 'bg-emerald-400',
      textColor: 'text-emerald-400',
      description: 'Abatable through unblocking Sion corridor & queue elimination',
      isEstimated: true,
    },
  ]

  const fuelBreakdown = [
    { label: 'Total Diesel Burned', val: `${formatNumber(summary.totalFuelLiters)} L/day`, sub: 'Combined fleet consumption' },
    { label: 'Fuel per Trip', val: `${summary.fuelPerTripLiters} L`, sub: 'Average haul dispatch efficiency' },
    { label: 'Fuel per Tonne', val: `${summary.fuelPerTonneLiters} L/T`, sub: 'Specific logistics intensity' },
    { label: 'Avoidable Fuel Waste', val: `${formatNumber(summary.avoidableFuelLiters)} L/day`, sub: 'Lost to congestion & idling' },
    { label: 'Haulage Distance', val: `${formatNumber(summary.totalTonneKm)} T·km`, sub: 'Fleet-weighted payload movement' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 7. CO₂e INTELLIGENCE PANEL */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Leaf size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">CO₂e Emission Sources</h3>
                <p className="text-[11px] text-white/50">Attributed greenhouse gas emissions across municipal operations</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-amber-400">{summary.totalCo2eT} T/day</span>
              <span className="text-[9px] text-white/40 block">TOTAL CO₂e</span>
            </div>
          </div>

          {/* Stacked Share Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>Emissions Proportion</span>
              <span>100% Total Impact</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
              <div className="h-full bg-amber-400" style={{ width: `${(summary.transportCo2eKg / summary.totalCo2eKg) * 100}%` }} title="Transport" />
              <div className="h-full bg-teal-400" style={{ width: `${(summary.facilityCo2eKg / summary.totalCo2eKg) * 100}%` }} title="Facility" />
            </div>
          </div>

          {/* Detailed Sources List */}
          <div className="space-y-2.5 mt-4">
            {co2Sources.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.015] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs font-mono font-semibold text-white uppercase">{s.label}</span>
                    {s.isEstimated && (
                      <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">
                        ESTIMATED
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-white/45 mt-0.5 ml-4">{s.description}</p>
                </div>

                <div className="text-right font-mono shrink-0 ml-3">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-base font-bold ${s.textColor}`}>{s.valueT}</span>
                    <span className="text-[10px] text-white/40">T/day</span>
                  </div>
                  <span className="text-[9.5px] text-white/40">{formatNumber(s.valueKg)} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 pt-2 border-t border-white/5">
          <Info size={11} />
          <span>Transport factor: 0.14 kg CO₂e / T·km diesel. Facility footprints include biogas displacement credit.</span>
        </div>
      </div>

      {/* 8. FUEL INTELLIGENCE PANEL */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Fuel size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Fuel & Logistics Efficiency</h3>
                <p className="text-[11px] text-white/50">Collection round and transfer corridor fuel expenditure</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-cyan-400">{formatNumber(summary.totalFuelLiters)} L</span>
              <span className="text-[9px] text-white/40 block">DAILY FLEET FUEL</span>
            </div>
          </div>

          {/* Relationship Chain Diagram: DISTANCE ↑ -> FUEL ↑ -> CO₂e ↑ */}
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/20 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-semibold block">
              LOGISTICS CAUSAL CASCADE
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-white/80 py-1">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-amber-400">DETOUR DISTANCE ↑</span>
                <span className="text-[10px] text-white/40">RT-06</span>
              </div>
              <ArrowRight size={14} className="text-cyan-400 shrink-0" />
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-cyan-400">FUEL BURN ↑</span>
                <span className="text-[10px] text-white/40">+18%</span>
              </div>
              <ArrowRight size={14} className="text-cyan-400 shrink-0" />
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-red-400">CO₂e ↑</span>
                <span className="text-[10px] text-white/40">+840 kg</span>
              </div>
            </div>
            <p className="text-[10.5px] text-white/50">
              The blocked Sion Circle corridor forces heavy compactor trucks into congested detour routes through Kurla, inflating citywide transport fuel burn by an estimated {formatNumber(summary.avoidableFuelLiters)} L daily.
            </p>
          </div>

          {/* Fuel Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
            {fuelBreakdown.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.015] border border-white/5">
                <span className="text-[9.5px] font-mono uppercase text-white/40 block truncate">{f.label}</span>
                <span className="text-base font-bold text-white font-mono block mt-1">{f.val}</span>
                <span className="text-[9.5px] text-white/40 mt-1 block truncate" title={f.sub}>{f.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 border-t border-white/5">
          <span>Split: {formatNumber(summary.collectionFuelLiters)} L Collection · {formatNumber(summary.transferFuelLiters)} L Transfer</span>
          <span className="text-cyan-400">Zero-Emission Fleet: 2 EV Units</span>
        </div>
      </div>
    </div>
  )
}
