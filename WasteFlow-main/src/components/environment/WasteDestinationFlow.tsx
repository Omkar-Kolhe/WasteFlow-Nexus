import React from 'react'
import {
  ArrowDown,
  Recycle,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { WasteFlowStageQuantity } from '@/engine/environmentalDashboardEngine'
import { formatNumber } from '@/lib/utils'

interface WasteDestinationFlowProps {
  stages: WasteFlowStageQuantity[]
}

export const WasteDestinationFlow: React.FC<WasteDestinationFlowProps> = ({ stages }) => {
  // Find key stages from input
  const generated = stages.find((s) => s.stage === 'GENERATED') || stages[0]
  const collected = stages.find((s) => s.stage === 'COLLECTED') || stages[1]
  const transferred = stages.find((s) => s.stage === 'TRANSFERRED') || stages[2]
  const sorted = stages.find((s) => s.stage === 'SORTED') || stages[3]
  const processed = stages.find((s) => s.stage === 'PROCESSED') || stages[4]
  const recovered = stages.find((s) => s.stage === 'RECOVERED') || stages[5]
  const landfill = stages.find((s) => s.stage === 'LANDFILL') || stages[6]

  const linearPipeline = [generated, collected, transferred, sorted, processed]

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">
              PHYSICAL STREAM DYNAMICS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
              MASS BALANCE CASCADE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Stage-by-stage mass conservation from municipal source generation to circular recovery and landfill disposal.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-white/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Mass Flow Engine</span>
        </div>
      </div>

      {/* Main Cascade Pipeline Layout */}
      <div className="flex flex-col items-center space-y-3 py-2">
        {/* Step 1 to 5 (Linear Cascade) */}
        {linearPipeline.map((step, idx) => {
          const isBottleneck = step.status === 'critical' || step.status === 'warn'

          return (
            <React.Fragment key={step.stage}>
              {/* Step Card */}
              <div
                className={`w-full max-w-2xl p-4 rounded-xl border transition-all ${
                  isBottleneck
                    ? 'border-amber-500/30 bg-amber-500/[0.03]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                } flex items-center justify-between shadow-md`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
                      isBottleneck
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-white/5 text-white/80 border border-white/10'
                    }`}
                  >
                    0{idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                        {step.stage}
                      </span>
                      {isBottleneck && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 flex items-center gap-1">
                          <AlertTriangle size={9} />
                          CAPACITY STRAIN
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white">{step.label}</h4>
                    <p className="text-[10.5px] text-white/40 mt-0.5">{step.note}</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-xl font-bold text-white tracking-tight">
                      {formatNumber(step.quantityT)}
                    </span>
                    <span className="text-xs text-white/50 font-normal">T/day</span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    {step.pctOfGenerated}% of total generation
                  </span>
                </div>
              </div>

              {/* Animated Connector Arrow */}
              {idx < linearPipeline.length - 1 && (
                <div className="flex flex-col items-center -my-1 text-white/20">
                  <div className="w-[1.5px] h-3 bg-gradient-to-b from-white/20 to-white/10" />
                  <ArrowDown size={14} className="text-white/30 animate-bounce" />
                </div>
              )}
            </React.Fragment>
          )
        })}

        {/* Transition Fork to Dual Endpoints (Recovered vs Landfill) */}
        <div className="flex flex-col items-center w-full max-w-2xl pt-1">
          <div className="w-[1.5px] h-4 bg-white/20" />
          <div className="w-full max-w-md h-[1.5px] bg-white/20 relative">
            <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-white/40" />
          </div>
          <div className="flex justify-between w-full max-w-md">
            <div className="w-[1.5px] h-4 bg-emerald-500/40" />
            <div className="w-[1.5px] h-4 bg-red-500/40" />
          </div>
        </div>

        {/* Final Bifurcation Cards (Recovered vs Landfill) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl pt-1">
          {/* Recovered Endpoint */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] flex flex-col justify-between shadow-lg hover:border-emerald-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Recycle size={13} />
                  CIRCULAR RECOVERY
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                  {recovered.pctOfGenerated}% YIELD
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Recovered & Diverted</h4>
              <p className="text-[10.5px] text-white/50 mt-1">{recovered.note}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-baseline justify-between font-mono">
              <span className="text-xs text-emerald-400 font-semibold">Tonnage Recovered</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-400">
                  {formatNumber(recovered.quantityT)}
                </span>
                <span className="text-xs text-emerald-400/70">T/day</span>
              </div>
            </div>
          </div>

          {/* Landfill Endpoint */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/[0.04] flex flex-col justify-between shadow-lg hover:border-red-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Trash2 size={13} />
                  RESIDUAL LANDFILL
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-red-500/20 text-red-300 font-bold">
                  {landfill.pctOfGenerated}% RESIDUE
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Deonar Landfill Intake</h4>
              <p className="text-[10.5px] text-white/50 mt-1">{landfill.note}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-red-500/20 flex items-baseline justify-between font-mono">
              <span className="text-xs text-red-400 font-semibold">Tonnage to Landfill</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-red-400">
                  {formatNumber(landfill.quantityT)}
                </span>
                <span className="text-xs text-red-400/70">T/day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
