import React, { useState } from 'react'
import { MapPin, ArrowUpRight, Crosshair } from 'lucide-react'
import type { EnvironmentalHotspot } from '@/engine/environmentalDashboardEngine'
import { useTwinStore } from '@/state/twinStore'

interface EnvironmentalHotspotsProps {
  hotspots: EnvironmentalHotspot[]
}

export const EnvironmentalHotspots: React.FC<EnvironmentalHotspotsProps> = ({ hotspots }) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(hotspots[0]?.id || '')
  const setView = useTwinStore((s) => s.setView)
  const requestFocus = useTwinStore((s) => s.requestFocus)

  const selectedHotspot = hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0]

  const handleFocusOnTwin = (hotspot: EnvironmentalHotspot) => {
    // Map hotspot to facility ID if applicable
    if (hotspot.id === 'HOT-01') requestFocus('P-DE')
    else if (hotspot.id === 'HOT-02') requestFocus('SF-KJ')
    else if (hotspot.id === 'HOT-03') requestFocus('TF-KL')
    else if (hotspot.id === 'HOT-04') requestFocus('Z-KU')
    
    // Switch to digital twin view
    setView('twin')
  }

  const categoryLabels: Record<string, { label: string; color: string }> = {
    LANDFILL_PRESSURE: { label: 'LANDFILL PRESSURE', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    EXCESSIVE_WAITING: { label: 'EXCESSIVE QUEUE / WAITING', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    HIGH_EMISSIONS: { label: 'TRANSPORT EMISSIONS', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    LOW_RECOVERY: { label: 'SEGREGATION GAP', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
              <MapPin size={14} />
              DIGITAL TWIN ENVIRONMENTAL HOTSPOTS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
              SPATIAL MAPPING
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Geographic concentration of dumpsite pressure, idling queue emissions, and logistics chokepoints.
          </p>
        </div>

        <button
          onClick={() => handleFocusOnTwin(selectedHotspot)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10 cursor-pointer self-start sm:self-auto"
        >
          <Crosshair size={13} className="text-emerald-400" />
          <span>Inspect on Digital Twin</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Hotspots List (Left) */}
        <div className="lg:col-span-5 space-y-2">
          {hotspots.map((h) => {
            const isSelected = h.id === selectedHotspot.id
            const cat = categoryLabels[h.category]

            return (
              <div
                key={h.id}
                onClick={() => setSelectedHotspotId(h.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/[0.04] shadow-lg'
                    : 'border-white/5 bg-white/[0.015] hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">{h.metricValue}</span>
                </div>

                <h4 className="text-sm font-semibold text-white tracking-tight">{h.name}</h4>
                <p className="text-[11px] text-white/50 mt-0.5">{h.location}</p>
              </div>
            )
          })}
        </div>

        {/* Selected Hotspot Detailed Dossier (Right) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-white/[0.015] border border-white/5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">{selectedHotspot.id}</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-xs font-mono text-white/60">{selectedHotspot.location}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{selectedHotspot.name}</h3>
            </div>

            <div className="text-right font-mono">
              <span className="text-[9px] uppercase text-white/40 block">HOTSPOT INTENSITY</span>
              <span className="text-sm font-bold text-amber-400">{selectedHotspot.metricValue}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
            {/* 1. Problem */}
            <div>
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider block mb-0.5">
                IDENTIFIED PROBLEM
              </span>
              <p className="text-white/80 leading-relaxed">{selectedHotspot.problemDescription}</p>
            </div>

            {/* 2. Environmental Impact */}
            <div className="p-3 rounded-lg bg-red-500/[0.03] border border-red-500/20">
              <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider block mb-0.5 font-semibold">
                MEASURED ENVIRONMENTAL IMPACT
              </span>
              <p className="text-white/70 leading-relaxed text-[11.5px]">{selectedHotspot.environmentalImpact}</p>
            </div>

            {/* 3. Related Bottleneck & Intervention */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider block mb-0.5">
                  RELATED BOTTLENECK
                </span>
                <span className="font-mono text-xs text-amber-300 font-semibold">
                  {selectedHotspot.relatedBottleneckId || 'General Corridor Congestion'}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider block mb-0.5 font-semibold">
                  RECOMMENDED INTERVENTION
                </span>
                <span className="text-xs text-white/80">
                  {selectedHotspot.possibleIntervention}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40">
              Coordinates anchored in Digital Twin mesh
            </span>
            <button
              onClick={() => handleFocusOnTwin(selectedHotspot)}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Pan Map to {selectedHotspot.name.split(' ')[0]}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
