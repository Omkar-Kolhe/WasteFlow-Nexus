import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import type { BottleneckTimelinePoint } from '@/engine/bottleneckEngine'
import { cn, formatNumber } from '@/lib/utils'

/**
 * BOTTLENECK TIMELINE COMPONENT (Phase 5)
 *
 * Renders the lifecycle progression:
 * NORMAL -> LOAD INCREASE -> WARNING -> CAPACITY EXCEEDED -> BACKLOG -> CRITICAL
 */
export function BottleneckTimeline({
  timeline,
  className,
}: {
  timeline: BottleneckTimelinePoint[]
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">BOTTLENECK EVOLUTION TIMELINE</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          6 EVOLUTIONARY STAGES
        </span>
      </div>

      <div className="relative border border-hair bg-white/[0.015] p-3.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {timeline.map((point, idx) => {
            const isReached = point.reached
            const isActive = point.active
            const isCriticalStage =
              point.stage === 'CAPACITY EXCEEDED' || point.stage === 'BACKLOG' || point.stage === 'CRITICAL'

            const stageColor = !isReached
              ? '#5A606A'
              : isCriticalStage
                ? '#E2595B'
                : point.stage === 'WARNING'
                  ? '#E5B44C'
                  : '#4FE3C1'

            return (
              <motion.div
                key={point.stage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={cn(
                  'relative flex flex-col justify-between border p-2.5 transition-all',
                  isActive
                    ? 'border-signal/60 bg-signal/[0.05] ring-1 ring-signal/30'
                    : isReached
                      ? 'border-hair bg-white/[0.01]'
                      : 'border-hair/40 bg-white/[0.005] opacity-50',
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[7px] tracking-[0.12em] text-ink-ghost">
                      STAGE {idx + 1}
                    </span>
                    {isReached && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: stageColor }}
                      />
                    )}
                  </div>
                  <h4 className="mt-1 font-mono text-[9.5px] font-medium leading-tight text-ink">
                    {point.label}
                  </h4>
                </div>

                <div className="mt-2.5 border-t border-hair/50 pt-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[7px] text-ink-ghost">UTILIZATION</span>
                    <span className="data-value text-[10px]" style={{ color: stageColor }}>
                      {point.utilizationPct}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between font-mono text-[7px] text-ink-ghost">
                    <span>DAILY LOAD</span>
                    <span>{formatNumber(point.volumeT)} T/D</span>
                  </div>
                </div>

                {isActive && (
                  <span className="absolute -top-1.5 right-2 border border-signal/80 bg-void px-1 font-mono text-[6.5px] tracking-[0.14em] text-signal">
                    CURRENT STATE
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
