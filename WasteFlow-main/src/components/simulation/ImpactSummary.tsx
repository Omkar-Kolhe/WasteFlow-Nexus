import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'
import type { SimulationScenarioSnapshot } from '@/engine/simulationTypes'
import { cn } from '@/lib/utils'

export function ImpactSummary({
  impact,
  className,
}: {
  impact: SimulationScenarioSnapshot['environmentalImpact']
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">SIMULATION ENVIRONMENTAL IMPACT</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          SYSTEMIC DELTA SUMMARY
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <ImpactBadge
          label="CO₂e EMISSIONS"
          pct={impact.co2eDeltaPct}
          detail={`${impact.co2eDeltaKg > 0 ? '+' : ''}${impact.co2eDeltaKg.toLocaleString()} kg/day`}
          polarity="lower-better"
        />

        <ImpactBadge
          label="LANDFILL INTAKE"
          pct={impact.landfillDeltaPct}
          detail={`${impact.landfillDeltaT > 0 ? '+' : ''}${impact.landfillDeltaT.toLocaleString()} T/day`}
          polarity="lower-better"
        />

        <ImpactBadge
          label="FLEET HAULAGE TRIPS"
          pct={impact.tripsDeltaPct}
          detail="Total daily trips"
          polarity="lower-better"
        />

        <ImpactBadge
          label="RECOVERY RATE"
          pct={impact.recoveryDeltaPct}
          detail="Diversion efficiency"
          polarity="higher-better"
          isAbsoluteRate
        />

        <ImpactBadge
          label="SYSTEM BACKLOG"
          pct={impact.backlogDeltaPct}
          detail="Unprocessed accumulation"
          polarity="lower-better"
        />
      </div>
    </div>
  )
}

function ImpactBadge({
  label,
  pct,
  detail,
  polarity,
  isAbsoluteRate = false,
}: {
  label: string
  pct: number
  detail: string
  polarity: 'higher-better' | 'lower-better'
  isAbsoluteRate?: boolean
}) {
  const isGood = polarity === 'higher-better' ? pct > 0 : pct < 0
  const isZero = pct === 0

  const colorClass = isZero
    ? 'text-ink-dim border-hair bg-white/[0.01]'
    : isGood
      ? 'text-signal border-signal/40 bg-signal/[0.06]'
      : 'text-critical border-critical/40 bg-critical/[0.06]'

  const Icon = pct > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className={cn('border p-2.5 flex flex-col justify-between transition-all', colorClass)}>
      <span className="label-tech block text-[7px] text-ink-ghost">{label}</span>

      <div className="mt-1 flex items-baseline gap-1">
        {!isZero && <Icon size={14} className="shrink-0" />}
        <span className="data-value text-[18px] leading-none font-semibold">
          {pct > 0 ? `+${pct.toFixed(1)}` : `${pct.toFixed(1)}`}
          {isAbsoluteRate ? '%' : '%'}
        </span>
      </div>

      <p className="mt-1 font-mono text-[7.5px] leading-tight text-ink-faint">{detail}</p>
    </div>
  )
}
