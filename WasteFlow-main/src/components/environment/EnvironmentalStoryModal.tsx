import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Presentation,
  X,
} from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { formatNumber } from '@/lib/utils'

interface EnvironmentalStoryModalProps {
  summary: EnvironmentalMetricSummary
  scenario: ScenarioDetailData | null
  onClose: () => void
}

export const EnvironmentalStoryModal: React.FC<EnvironmentalStoryModalProps> = ({
  summary,
  scenario,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      stage: 'STAGE 1',
      title: 'THE SYSTEM TODAY',
      subtitle: 'Baseline municipal waste operations and network stress',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-white/70 leading-relaxed">
            Greater Mumbai generates over <strong>{formatNumber(summary.totalGeneratedT)} tonnes</strong> of municipal solid waste daily across its 8 ward zones. Although {formatNumber(summary.totalCollectedT)} tonnes are collected, critical structural friction limits material circularity.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 block">GENERATED</span>
              <span className="text-xl font-bold text-white mt-1 block">{formatNumber(summary.totalGeneratedT)} T</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block">RECOVERED</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{formatNumber(summary.totalRecoveredT)} T ({summary.recoveryRatePct}%)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-500/[0.04] border border-red-500/20">
              <span className="text-[10px] text-red-400 block">TO LANDFILL</span>
              <span className="text-xl font-bold text-red-400 mt-1 block">{formatNumber(summary.totalLandfillT)} T ({summary.landfillDependencyPct}%)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20">
              <span className="text-[10px] text-amber-400 block">CRITICAL BOTTLENECK</span>
              <span className="text-sm font-bold text-amber-300 mt-1 block truncate">SF-KJ Sorting Overload</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      stage: 'STAGE 2',
      title: 'THE INTERVENTION',
      subtitle: 'Targeted policy choices and capacity realignment',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-white/70 leading-relaxed">
            Rather than relying on uncoordinated manual adjustments, WasteFlow Nexus evaluated targeted operational interventions:
          </p>
          <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-bold uppercase">
              <span>ACTIVE STRATEGY:</span>
              <span className="text-white">{scenario?.scenarioName || 'Kanjurmarg MRF Expansion & Sion Reroute'}</span>
            </div>
            <div className="space-y-2 text-white/80">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Expanded mechanical screening throughput by +100 T/day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Unblocked Sion arterial corridor (RT-06) for heavy transfer compactors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Optimized haul transit distances by 15% across central zones</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      stage: 'STAGE 3',
      title: 'THE SIMULATED EFFECT',
      subtitle: 'Immediate flow balancing across the digital twin mesh',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-white/70 leading-relaxed">
            The Digital Twin recalculated mass velocity across all 14 facilities and 20 transport links without delay:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 block">QUEUE DELAYS</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">45m → 0m</span>
              <span className="text-[10px] text-white/40 mt-1 block">Gate backlog eliminated</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 block">DETOUR MILEAGE</span>
              <span className="text-xl font-bold text-teal-400 mt-1 block">-1,200 km</span>
              <span className="text-[10px] text-white/40 mt-1 block">Direct corridor transit</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-[10px] text-white/40 block">SORTING INTAKE</span>
              <span className="text-xl font-bold text-purple-300 mt-1 block">100% Buffered</span>
              <span className="text-[10px] text-white/40 mt-1 block">Zero uncontained spill</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      stage: 'STAGE 4',
      title: 'THE ENVIRONMENTAL RESULT',
      subtitle: 'Measurable decarbonization and dumpsite relief',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-white/70 leading-relaxed">
            Sustainable operational excellence delivers immediate, verifiable environmental dividends:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-center">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block">CO₂e ABATEMENT</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">
                ↓ 1.5 T/day
              </span>
              <span className="text-[10px] text-white/40 mt-1 block">-18% Daily Emissions</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">LANDFILL DIVERSION</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                ↓ 310 T/day
              </span>
              <span className="text-[10px] text-white/40 mt-1 block">Kept out of Deonar dumpsite</span>
            </div>

            <div className="p-4 rounded-xl bg-teal-500/[0.04] border border-teal-500/20 text-center">
              <span className="text-[10px] text-teal-400 uppercase tracking-wider block">RECOVERY BOOST</span>
              <span className="text-2xl font-bold text-teal-400 mt-1 block">
                ↑ 13% Yield
              </span>
              <span className="text-[10px] text-white/40 mt-1 block">Expanded circular RDF & compost</span>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const active = slides[currentSlide]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f17] border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Presentation size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Environmental Story Mode</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                  {active.stage} OF {slides.length}
                </span>
              </div>
              <p className="text-xs text-white/50">Presentation-ready network narrative</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-8 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              {active.stage}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">{active.title}</h2>
            <p className="text-xs text-white/50 mt-0.5">{active.subtitle}</p>
          </div>

          <div className="min-h-[180px]">{active.content}</div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === i ? 'bg-emerald-400 w-5' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                if (currentSlide < slides.length - 1) {
                  setCurrentSlide((prev) => prev + 1)
                } else {
                  onClose()
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{currentSlide === slides.length - 1 ? 'Finish' : 'Next Step'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
