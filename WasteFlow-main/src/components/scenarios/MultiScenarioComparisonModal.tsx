import React from 'react';
import { X, Scale } from 'lucide-react';
import { ScenarioDetailData } from '../../engine/scenarioTypes';

interface MultiScenarioComparisonModalProps {
  scenarios: ScenarioDetailData[];
  onClose: () => void;
  onSelectScenario: (scenario: ScenarioDetailData) => void;
}

export const MultiScenarioComparisonModal: React.FC<MultiScenarioComparisonModalProps> = ({
  scenarios,
  onClose,
  onSelectScenario
}) => {
  if (scenarios.length === 0) return null;

  const baseline = scenarios[0].baselineMetrics;

  const metricsList = [
    { label: 'CO₂e Emissions', unit: 'T/day', baselineVal: Number((baseline.co2eKg / 1000).toFixed(1)), lowerIsBetter: true, getValue: (s: ScenarioDetailData) => Number((s.simulatedMetrics.co2eKg / 1000).toFixed(1)) },
    { label: 'Landfill Waste', unit: 'T/day', baselineVal: baseline.wasteToLandfillT, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.wasteToLandfillT },
    { label: 'Recovery Rate', unit: '%', baselineVal: baseline.recoveryRatePct, lowerIsBetter: false, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.recoveryRatePct },
    { label: 'Vehicle Trips', unit: 'trips/day', baselineVal: baseline.tripsToday, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.tripsToday },
    { label: 'Queue Backlog', unit: 'T/day', baselineVal: baseline.backlogT, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.backlogT },
    { label: 'Vehicle Waiting Time', unit: 'min', baselineVal: baseline.meanQueueMin, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.meanQueueMin },
    { label: 'System Throughput', unit: 'T/day', baselineVal: baseline.wasteProcessedT, lowerIsBetter: false, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.wasteProcessedT },
    { label: 'Fuel Consumed', unit: 'L/day', baselineVal: baseline.fuelLiters, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.fuelLiters },
    { label: 'Critical Bottlenecks', unit: 'nodes', baselineVal: baseline.criticalBottlenecksCount, lowerIsBetter: true, getValue: (s: ScenarioDetailData) => s.simulatedMetrics.criticalBottlenecksCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0b0f17] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Multi-Scenario Matrix Comparison</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                  {scenarios.length} SCENARIOS SELECTED
                </span>
              </div>
              <p className="text-xs text-white/50">
                Measurable performance divergence and trade-off comparison against baseline system.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scenario Overview Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Baseline Column Header */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-white/40 uppercase block mb-1">
                  Reference Baseline
                </span>
                <h3 className="text-base font-bold text-white">Current Waste System</h3>
                <p className="text-xs text-white/50 mt-1">Live digital twin operational baseline</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40 font-mono">
                STATUS: LIVE NETWORK
              </div>
            </div>

            {/* Compared Scenarios Cards */}
            {scenarios.map((sc) => (
              <div
                key={sc.scenarioId}
                className="p-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/20 flex flex-col justify-between hover:border-blue-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono tracking-wider text-blue-400 uppercase">
                      Target: {sc.targetFacilityName || 'System'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      {sc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{sc.scenarioName}</h3>
                  <div className="mt-2 text-xs text-white/60 bg-white/5 p-2 rounded-lg line-clamp-2">
                    {sc.changedVariables.map((cv) => `${cv.name}: ${cv.simulated}`).join(' • ')}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400">
                    CO₂e {sc.environmentalImpact.co2eDeltaPct > 0 ? '+' : ''}{sc.environmentalImpact.co2eDeltaPct.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => {
                      onSelectScenario(sc);
                      onClose();
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
                  >
                    View Detail
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Comparison Table */}
          <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40">
            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider uppercase text-white/50">
                Performance Divergence Matrix
              </span>
              <span className="text-[11px] text-white/40 italic">
                *Colored badges represent measurable changes relative to current system
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01] text-white/50 font-mono">
                    <th className="py-3 px-4 font-normal">Metric Parameter</th>
                    <th className="py-3 px-4 font-normal">Current System</th>
                    {scenarios.map((sc) => (
                      <th key={sc.scenarioId} className="py-3 px-4 font-normal text-white">
                        {sc.scenarioName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {metricsList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white/80">
                        {m.label}
                        <span className="text-[10px] text-white/40 ml-1.5 font-mono">({m.unit})</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/60">
                        {typeof m.baselineVal === 'number' ? m.baselineVal.toLocaleString() : m.baselineVal}
                      </td>
                      {scenarios.map((sc) => {
                        const val = m.getValue(sc);
                        const diff = val - m.baselineVal;
                        const pct = m.baselineVal !== 0 ? (diff / m.baselineVal) * 100 : 0;
                        const isBetter = m.lowerIsBetter ? diff < 0 : diff > 0;
                        const isWorse = m.lowerIsBetter ? diff > 0 : diff < 0;

                        return (
                          <td key={sc.scenarioId} className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{val.toLocaleString()}</span>
                              {diff !== 0 && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5 ${
                                    isBetter
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                      : isWorse
                                      ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                      : 'bg-white/10 text-white/60'
                                  }`}
                                >
                                  {diff > 0 ? '+' : ''}
                                  {pct.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tradeoffs Matrix Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((sc) => (
              <div key={sc.scenarioId} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">{sc.scenarioName} Trade-offs</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider block mb-1">
                        Measurable Benefits
                      </span>
                      <ul className="space-y-1">
                        {sc.tradeoffs.benefits.map((b, bIdx) => (
                          <li key={bIdx} className="text-xs text-white/70 flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider block mb-1">
                        Downsides & Demands
                      </span>
                      <ul className="space-y-1">
                        {sc.tradeoffs.downsides.map((d, dIdx) => (
                          <li key={dIdx} className="text-xs text-white/70 flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">⚠</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectScenario(sc);
                    onClose();
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Open Full Detail
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <p className="text-xs text-white/40 font-mono">
            WasteFlow Nexus Scenario Matrix • Direct engine parameters and measured trade-offs
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
