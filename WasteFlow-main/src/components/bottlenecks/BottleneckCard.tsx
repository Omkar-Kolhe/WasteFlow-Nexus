import { motion } from 'framer-motion'
import { ArrowUpRight, Truck } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import type { Bottleneck } from '@/engine/bottleneckEngine'
import { CapacityGauge } from './CapacityGauge'

/**
 * BOTTLENECK CARD (Phase 5)
 *
 * Displays all key signals required by specification:
 * - Facility name and type
 * - Bottleneck classification badge (e.g. SORTING BOTTLENECK, CAPACITY BOTTLENECK)
 * - Severity (CRITICAL / WARNING)
 * - Utilization (%)
 * - Backlog (T)
 * - Waste Delayed (T/day)
 * - CO₂e Impact (kg/day)
 * - Confidence (%)
 * - Capacity Gauge & Environmental footprint
 */
export function BottleneckCard({
  bottleneck,
  index,
  onOpen,
  className,
}: {
  bottleneck: Bottleneck
  index: number
  onOpen: (b: Bottleneck) => void
  className?: string
}) {
  const color = NODE_STATE_COLOR_HEX[bottleneck.severity]
  const critical = bottleneck.severity === 'critical'
  const utilizationPct = bottleneck.utilization

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(bottleneck)}
      className={cn(
        'surface ticks group relative border-hair bg-white/[0.015] px-4 py-3.5 text-left shadow-panel transition-colors hover:bg-white/[0.035]',
        className,
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px] transition-opacity"
        style={{ background: color, opacity: critical ? 0.95 : 0.6 }}
      />

      {/* Top badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Severity */}
            <span
              className="inline-flex items-center gap-1 border px-1.5 py-[2px] font-mono text-[7.5px] tracking-[0.14em]"
              style={{ borderColor: `${color}55`, color, background: `${color}10` }}
            >
              <span
                className={cn('h-1.5 w-1.5', critical && 'animate-status-pulse')}
                style={{ background: color }}
              />
              {bottleneck.severity.toUpperCase()}
            </span>

            {/* Bottleneck Type */}
            <span className="border border-white/10 bg-white/[0.04] px-1.5 py-[2px] font-mono text-[7.5px] tracking-[0.12em] text-ink-dim">
              {bottleneck.bottleneckTypeLabel.toUpperCase()}
            </span>

            {/* Confidence */}
            <span className="font-mono text-[8px] tracking-[0.1em] text-signal/90">
              {bottleneck.confidence}% CONFIDENCE
            </span>

            <span className="ml-auto font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
              SCORE {bottleneck.pressure}/100
            </span>
          </div>

          <h3 className="mt-2 text-[14.5px] font-medium leading-tight tracking-tight text-ink">
            {bottleneck.facility.name}
          </h3>

          <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-ink-faint">
            {bottleneck.whyExplanation || bottleneck.rootCause}
          </p>
        </div>

        <CapacityGauge
          utilizationPct={utilizationPct}
          incomingT={bottleneck.incomingWaste}
          capacityT={bottleneck.capacity}
          size={72}
          label="UTIL"
          className="shrink-0"
        />
      </div>

      {/* Figures Grid */}
      <div className="mt-3.5 grid grid-cols-4 divide-x divide-white/[0.055] border-t border-hair pt-2.5">
        <Figure
          label="UTILIZATION"
          value={`${bottleneck.utilization.toFixed(0)}%`}
          unit=""
          tone={critical ? 'critical' : 'warn'}
        />
        <Figure
          label="BACKLOG"
          value={`${formatNumber(bottleneck.backlog)}`}
          unit="T"
          tone={bottleneck.backlog > 0 ? 'critical' : 'default'}
        />
        <Figure
          label="WASTE DELAYED"
          value={`${formatNumber(bottleneck.wasteDelayed)}`}
          unit="T/D"
          tone="warn"
        />
        <Figure
          label="CO₂e IMPACT"
          value={`${formatNumber(bottleneck.impact.co2eKg)}`}
          unit="KG/D"
          tone="critical"
        />
      </div>

      {/* Environmental Sub-Bar */}
      <div className="mt-2.5 flex items-center justify-between border-t border-hair/40 pt-1.5 font-mono text-[8px] tracking-[0.08em] text-ink-ghost">
        <span className="flex items-center gap-1">
          <Truck size={10} className="text-ink-faint" />
          +{bottleneck.impact.extraTripsPerDay} trips/day · +{bottleneck.impact.totalFuelLiters} L fuel/day
        </span>
        <span className="flex items-center gap-1 text-ink-faint">
          +{formatNumber(bottleneck.impact.landfillPressureT)} T/D landfill risk
        </span>
      </div>

      <span className="absolute right-3 top-3 text-ink-ghost opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight size={13} strokeWidth={1.75} />
      </span>
    </motion.button>
  )
}

function Figure({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string
  value: string
  unit: string
  tone?: 'default' | 'warn' | 'critical'
}) {
  const toneClass =
    tone === 'critical' ? 'text-critical' : tone === 'warn' ? 'text-warn' : 'text-ink-dim'

  return (
    <div className="px-2 first:pl-0">
      <span className="label-tech block text-[7px]">{label}</span>
      <span className={cn('data-value mt-0.5 block text-[12.5px] leading-none', toneClass)}>
        {value}
      </span>
      {unit && <span className="font-mono text-[7px] tracking-[0.1em] text-ink-ghost">{unit}</span>}
    </div>
  )
}
