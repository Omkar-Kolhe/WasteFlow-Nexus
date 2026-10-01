import React, { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

export const DataTransparencySection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const methodologies = [
    {
      title: 'CO₂e EMISSIONS CALCULATION',
      formula: 'Σ (VolumeT × DistanceKm × FactorMix) + FacilityFootprints − BiogasCredits',
      explanation: 'Calculated directly by environmentalEngine.ts. Transport factor uses fleet mix weighting (0.14 kg CO₂e / T·km for standard diesel, 0.08 kg for CNG, 0.02 kg for EV grid charging). Facility emissions apply kind-specific factors minus named biogas export credits at Trombay.',
    },
    {
      title: 'RECOVERY RATE FORMULA',
      formula: 'Recovery Rate % = (Recovered Tonnage / Total Collected Tonnage) × 100',
      explanation: 'Derived by metricsEngine.ts and primitives.ts. Represents mass of material diverted from open dumpsites through sorting screening and biological anaerobic digestion.',
    },
    {
      title: 'LANDFILL DEPENDENCY FORMULA',
      formula: 'Landfill Dependency % = (Landfill Intake / Total Collected Tonnage) × 100',
      explanation: 'Unrecovered residual waste arriving at the Deonar dumping ground divided by daily municipal collection. Measures direct dumpsite reliance.',
    },
    {
      title: 'FUEL CONSUMPTION ESTIMATION',
      formula: 'Total Fuel L = Collection Fuel (rounds × payload rate) + Transport Fuel (distance × truck factor)',
      explanation: 'Calculated in transportEngine.ts and metricsEngine.ts. Blocked corridors burn zero fuel while detours add mileage and fuel burn based on vehicle class.',
    },
  ]

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-mono text-white/50 hover:text-white/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info size={13} className="text-emerald-400" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            DATA / CALCULATION TRANSPARENCY & METHODOLOGY
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <span>{isOpen ? 'COLLAPSE' : 'EXPAND FORMULAS'}</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-in">
          {methodologies.map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.015] border border-white/5 space-y-1.5 font-mono">
              <span className="text-[10px] text-emerald-400 font-bold block">{m.title}</span>
              <div className="p-1.5 rounded bg-black/40 border border-white/5 text-[10px] text-white/90">
                <code>{m.formula}</code>
              </div>
              <p className="text-[10.5px] font-sans text-white/50 leading-relaxed pt-0.5">
                {m.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
