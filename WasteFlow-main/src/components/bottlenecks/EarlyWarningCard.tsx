import { AlertTriangle, Radio } from 'lucide-react'
import type { EarlyWarningForecast } from '@/engine/bottleneckEngine'
import { cn } from '@/lib/utils'

/**
 * EARLY WARNING FORECAST CARD (Phase 5)
 *
 * Uses trend rate forecasting to alert operators when a facility is approaching capacity limit.
 * e.g. "Current utilization: 88%. Trend: +3.8% per day. Estimated to exceed capacity in approximately 3 days."
 */
export function EarlyWarningCard({
  warning,
  className,
}: {
  warning: EarlyWarningForecast
  facilityName?: string
  className?: string
}) {
  const isCriticalNow = warning.status === 'critical_now'
  const isApproaching = warning.status === 'approaching'

  const borderClass = isCriticalNow
    ? 'border-critical/50 bg-critical/[0.04]'
    : isApproaching
      ? 'border-warn/50 bg-warn/[0.04]'
      : 'border-hair bg-white/[0.015]'

  const badgeColor = isCriticalNow ? '#E2595B' : isApproaching ? '#E5B44C' : '#4FE3C1'

  return (
    <div className={cn('border p-3.5', borderClass, className)}>
      <div className="flex items-center justify-between border-b border-hair pb-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-5 w-5 place-items-center"
            style={{ background: `${badgeColor}18`, color: badgeColor }}
          >
            {isCriticalNow || isApproaching ? (
              <AlertTriangle size={12} strokeWidth={2} />
            ) : (
              <Radio size={12} strokeWidth={2} />
            )}
          </span>
          <span className="label-tech text-[8.5px]">CAPACITY EARLY WARNING FORECAST</span>
        </div>
        <span
          className="border px-1.5 py-[1px] font-mono text-[7.5px] uppercase tracking-[0.14em]"
          style={{ borderColor: `${badgeColor}55`, color: badgeColor }}
        >
          {warning.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-2.5">
        <p className="text-[11.5px] font-medium leading-relaxed text-ink">
          {warning.message}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.06] border-t border-hair pt-2">
        <div className="pr-2">
          <span className="label-tech block text-[7.5px]">CURRENT LOAD</span>
          <span
            className="data-value mt-0.5 block text-[13px] leading-none"
            style={{ color: badgeColor }}
          >
            {warning.currentUtilizationPct}%
          </span>
        </div>

        <div className="px-2">
          <span className="label-tech block text-[7.5px]">DAILY TREND</span>
          <span className="data-value mt-0.5 block text-[13px] leading-none text-ink">
            +{warning.trendPctPerDay.toFixed(1)}% <span className="font-mono text-[7px] text-ink-ghost">/ DAY</span>
          </span>
        </div>

        <div className="pl-2">
          <span className="label-tech block text-[7.5px]">EST. 72H OUTLOOK</span>
          <span className="data-value mt-0.5 block text-[13px] leading-none text-warn">
            {warning.forecastUtilizationIn3Days}%
          </span>
        </div>
      </div>
    </div>
  )
}
