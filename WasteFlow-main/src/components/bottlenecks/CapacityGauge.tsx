import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import type { NodeState } from '@/types'

/**
 * CAPACITY GAUGE — a thin arc showing incoming vs rated capacity.
 *
 * Deliberately not a dashboard donut: it reads as a vessel filling toward a
 * rated line, with the over-capacity region extending past the seam in red.
 */
export function CapacityGauge({
  utilizationPct,
  incomingT,
  capacityT,
  size = 92,
  label = 'UTILIZATION',
  className,
}: {
  utilizationPct: number
  incomingT: number
  capacityT: number
  size?: number
  label?: string
  className?: string
}) {
  const state: NodeState =
    utilizationPct >= 90 ? 'critical' : utilizationPct >= 70 ? 'warning' : 'normal'
  const color = NODE_STATE_COLOR_HEX[state]
  const stroke = 5
  const r = (size - stroke) / 2
  const start = 135 // degrees; 270° sweep
  const sweep = 270
  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: size / 2 + r * Math.cos(rad), y: size / 2 + r * Math.sin(rad) }
  }
  const arc = (from: number, to: number) => {
    const a = polar(from)
    const b = polar(to)
    const large = to - from > 180 ? 1 : 0
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`
  }
  const clamped = Math.min(100, Math.max(0, utilizationPct))
  const filled = start + (clamped / 100) * sweep
  const over = utilizationPct > 100

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-0">
        <path d={arc(start, start + sweep)} fill="none" stroke="var(--color-hair)" strokeWidth={stroke} strokeLinecap="round" />
        <motion.path
          d={arc(start, filled)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.92 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: state === 'normal' ? undefined : `drop-shadow(0 0 6px ${color}55)` }}
        />
        {over && (
          <circle cx={size / 2} cy={size / 2} r={r - 6} fill="none" stroke="#E2595B" strokeOpacity={0.35} strokeDasharray="2 4" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="data-value text-[15px] leading-none" style={{ color }}>
          {utilizationPct.toFixed(1)}%
        </span>
        <span className="label-tech mt-1 text-[7px]">{label}</span>
      </div>
      <span className="sr-only">
        {Math.round(incomingT)} of {Math.round(capacityT)} tonnes per day
      </span>
    </div>
  )
}
