import React from 'react'
import {
  GitBranch,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import type { EnvironmentalOpportunity, EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { useTwinStore } from '@/state/twinStore'
import { formatNumber } from '@/lib/utils'

interface ScenarioEnvironmentalComparisonProps {
  scenarios: ScenarioDetailData[]
  selectedScenario: ScenarioDetailData | null
  onSelectScenario: (scenario: ScenarioDetailData) => void
  isScenarioOverlayActive: boolean
  onToggleScenarioOverlay: () => void
  opportunities: EnvironmentalOpportunity[]
  summary: EnvironmentalMetricSummary
}

export const ScenarioEnvironmentalComparison: React.FC<ScenarioEnvironmentalComparisonProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  isScenarioOverlayActive,
  onToggleScenarioOverlay,
  opportunities,
  summary,
}) => {
  const setView = useTwinStore((s) => s.setView)

  if (!selectedScenario && scenarios.length > 0) {
    selectedScenario = scenarios[0]
  }

  const baselineCo2eT = summary.totalCo2eT
  const scenarioCo2eT = selectedScenario
    ? Number((selectedScenario.simulatedMetrics.co2eKg / 1000).toFixed(2))
    : baselineCo2eT
  const co2eDeltaT = Number((baselineCo2eT - scenarioCo2eT).toFixed(2))

  const baselineLandfillT = summary.totalLandfillT
  const scenarioLandfillT = selectedScenario
    ? selectedScenario.simulatedMetrics.wasteToLandfillT
    : baselineLandfillT
  const landfillDeltaT = baselineLandfillT - scenarioLandfillT

  const baselineFuelL = summary.totalFuelLiters
  const scenarioFuelL = selectedScenario
    ? selectedScenario.simulatedMetrics.fuelLiters
    : baselineFuelL
  const fuelDeltaL = baselineFuelL - scenarioFuelL

  const baselineTrips = summary.totalTrips
  const scenarioTrips = selectedScenario
    ? selectedScenario.simulatedMetrics.tripsToday
    : baselineTrips
  const tripsDelta = baselineTrips - scenarioTrips

  const timelineSteps = [
    { stage: 'PHASE 01-04', title: 'BASELINE', desc: `${formatNumber(summary.totalCollectedT)} T/day collected under standard routes`, tone: 'text-white' },
    { stage: 'PHASE 05', title: 'BOTTLENECK DETECTED', desc: 'Kanjurmarg Sorting gate queues + Sion corridor congestion', tone: 'text-red-400' },
    { stage: 'PHASE 06-07', title: 'INTERVENTION TESTED', desc: `${selectedScenario?.changedVariables.map((v) => v.name).join(', ') || 'Targeted adjustments'}`, tone: 'text-cyan-400' },
    { stage: 'PHASE 08', title: 'SIMULATION PROOF', desc: 'Mass flow recalculation confirms throughput relief', tone: 'text-purple-400' },
    { stage: 'PHASE 09', title: 'ENVIRONMENTAL GAIN', desc: `${co2eDeltaT > 0 ? '-' : ''}${Math.abs(co2eDeltaT)} T CO₂e abated daily`, tone: 'text-emerald-400' },
  ]

  return (
    <div className="space-y-6">
      {/* 13 & 18. Scenario Comparison Box */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold flex items-center gap-1.5">
                <GitBranch size={14} />
                SCENARIO ENVIRONMENTAL ARBITRAGE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                PHASE 8 COMPARISON
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Compare current network environmental output against saved policy scenarios and operational interventions.
            </p>
          </div>

          {/* Scenario Selector & Overlay Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedScenario?.scenarioId || ''}
              onChange={(e) => {
                const found = scenarios.find((s) => s.scenarioId === e.target.value)
                if (found) onSelectScenario(found)
              }}
              className="bg-black/60 border border-white/15 text-white text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              {scenarios.map((sc) => (
                <option key={sc.scenarioId} value={sc.scenarioId}>
                  {sc.scenarioName}
                </option>
              ))}
            </select>

            <button
              onClick={onToggleScenarioOverlay}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isScenarioOverlayActive
                  ? 'bg-purple-500 text-black border-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
              }`}
            >
              <span>{isScenarioOverlayActive ? '● OVERLAY APPLIED' : 'APPLY OVERLAY'}</span>
            </button>

            <button
              onClick={() => setView('scenarios')}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs transition-colors"
              title="Open full Scenario Lab"
            >
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Selected Scenario Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
          {/* CO2e */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">CO₂e EMISSIONS</span>
            <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-white">
              <span>{baselineCo2eT} T</span>
              <ArrowRight size={11} className="text-white/30" />
              <span className="text-emerald-400">{scenarioCo2eT} T</span>
            </div>
            <div className="mt-2 text-[10.5px] text-emerald-400 flex items-center gap-1 font-semibold">
              <TrendingDown size={11} />
              <span>-{co2eDeltaT > 0 ? co2eDeltaT : 0} T/day (-{selectedScenario?.environmentalImpact.co2eDeltaPct || 0}%)</span>
            </div>
          </div>

          {/* Landfill Waste */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">LANDFILL WASTE</span>
            <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-white">
              <span>{formatNumber(baselineLandfillT)} T</span>
              <ArrowRight size={11} className="text-white/30" />
              <span className="text-emerald-400">{formatNumber(scenarioLandfillT)} T</span>
            </div>
            <div className="mt-2 text-[10.5px] text-emerald-400 flex items-center gap-1 font-semibold">
              <TrendingDown size={11} />
              <span>-{formatNumber(landfillDeltaT > 0 ? landfillDeltaT : 0)} T/day</span>
            </div>
          </div>

          {/* Recovery Rate */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">RECOVERY RATE</span>
            <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-white">
              <span>{summary.recoveryRatePct}%</span>
              <ArrowRight size={11} className="text-white/30" />
              <span className="text-teal-400">{selectedScenario?.simulatedMetrics.recoveryRatePct || summary.recoveryRatePct}%</span>
            </div>
            <div className="mt-2 text-[10.5px] text-teal-400 flex items-center gap-1 font-semibold">
              <TrendingUp size={11} />
              <span>+{(selectedScenario?.environmentalImpact.recoveryDeltaPct || 0).toFixed(1)}% yield</span>
            </div>
          </div>

          {/* Fuel Consumption */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">FLEET FUEL BURN</span>
            <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-white">
              <span>{formatNumber(baselineFuelL)} L</span>
              <ArrowRight size={11} className="text-white/30" />
              <span className="text-cyan-400">{formatNumber(scenarioFuelL)} L</span>
            </div>
            <div className="mt-2 text-[10.5px] text-cyan-400 flex items-center gap-1 font-semibold">
              <TrendingDown size={11} />
              <span>-{formatNumber(fuelDeltaL > 0 ? fuelDeltaL : 0)} L/day</span>
            </div>
          </div>

          {/* Trips */}
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5 col-span-2 md:col-span-1">
            <span className="text-[10px] text-white/40 uppercase block">VEHICLE DISPATCHES</span>
            <div className="flex items-baseline gap-1 mt-1 text-sm font-bold text-white">
              <span>{baselineTrips}</span>
              <ArrowRight size={11} className="text-white/30" />
              <span className="text-purple-300">{scenarioTrips}</span>
            </div>
            <div className="mt-2 text-[10.5px] text-purple-300 flex items-center gap-1 font-semibold">
              <TrendingDown size={11} />
              <span>-{tripsDelta > 0 ? tripsDelta : 0} trips avoided</span>
            </div>
          </div>
        </div>

        {/* 14. Environmental Impact Timeline */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-2 font-medium">
            END-TO-END PLATFORM RESOLUTION TIMELINE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-mono text-white/40 block">{step.stage}</span>
                  <h5 className={`text-xs font-bold font-mono mt-1 ${step.tone}`}>{step.title}</h5>
                </div>
                <p className="text-[10.5px] text-white/50 mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 15. "WHERE CAN WE IMPROVE?" OPPORTUNITIES SECTION */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles size={14} />
                MEASURABLE ENVIRONMENTAL OPPORTUNITIES
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRESCRIPTIVE INSIGHTS
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Highest-yield operational modifications grounded in active bottleneck and root-cause intelligence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-4 rounded-xl bg-white/[0.015] border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9.5px] px-2 py-0.5 rounded font-mono font-bold bg-white/5 text-white/60">
                    {opp.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {opp.metricBadge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">{opp.title}</h4>
                <p className="text-xs text-white/60 mt-1">{opp.action}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between font-mono text-[10px] text-white/40">
                <span>Source: {opp.source}</span>
                <span className="text-white/60 font-medium">Timeframe: {opp.timeframe}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
