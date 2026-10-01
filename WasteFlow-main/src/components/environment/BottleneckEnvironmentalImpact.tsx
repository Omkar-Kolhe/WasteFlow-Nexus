import React from 'react'
import { ExternalLink, ShieldAlert } from 'lucide-react'
import type { Bottleneck } from '@/engine/bottleneckEngine'
import { useTwinStore } from '@/state/twinStore'
import { formatNumber } from '@/lib/utils'

interface BottleneckEnvironmentalImpactProps {
  bottlenecks: {
    bottleneck: Bottleneck
    delayedT: number
    co2eKg: number
    landfillPressureT: number
    facilityName: string
    severity: 'critical' | 'warning' | 'normal'
  }[]
}

export const BottleneckEnvironmentalImpact: React.FC<BottleneckEnvironmentalImpactProps> = ({
  bottlenecks,
}) => {
  const setView = useTwinStore((s) => s.setView)
  const requestFocus = useTwinStore((s) => s.requestFocus)

  const handleSelectBottleneck = (facilityId: string) => {
    requestFocus(facilityId)
    setView('bottlenecks')
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
              <ShieldAlert size={14} />
              BOTTLENECK ENVIRONMENTAL FOOTPRINT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              PHASE 5 INTEGRATION
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Measured emissions, uncontained landfill pressure, and delayed mass created by active network friction points.
          </p>
        </div>

        <button
          onClick={() => setView('bottlenecks')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/10 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Bottleneck Engine</span>
          <ExternalLink size={12} className="text-white/60" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bottlenecks.map(({ bottleneck, delayedT, co2eKg, landfillPressureT, facilityName, severity }) => (
          <div
            key={bottleneck.facilityId}
            onClick={() => handleSelectBottleneck(bottleneck.facilityId)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              severity === 'critical'
                ? 'border-red-500/30 bg-red-500/[0.03] hover:border-red-500/60'
                : 'border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/60'
            } flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider uppercase text-white/50">
                  {bottleneck.facility.kind}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    severity === 'critical'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {severity.toUpperCase()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
                <span>{facilityName}</span>
                <ExternalLink size={12} className="text-white/30 hover:text-white" />
              </h4>

              <div className="mt-1 text-[11px] text-white/50 line-clamp-1">
                Cause: {bottleneck.rootCause}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-1.5 rounded-lg bg-white/[0.02]">
                <span className="text-[9px] text-white/40 block">DELAYED</span>
                <span className="text-xs font-bold text-white">{formatNumber(delayedT)} T</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/[0.05]">
                <span className="text-[9px] text-amber-400 block">CO₂e BURDEN</span>
                <span className="text-xs font-bold text-amber-400">{co2eKg} kg</span>
              </div>
              <div className="p-1.5 rounded-lg bg-red-500/[0.05]">
                <span className="text-[9px] text-red-400 block">LANDFILL RISK</span>
                <span className="text-xs font-bold text-red-400">{formatNumber(landfillPressureT)} T</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
