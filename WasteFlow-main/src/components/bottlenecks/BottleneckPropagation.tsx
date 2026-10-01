import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import type { BottleneckPropagationStep } from '@/engine/bottleneckEngine'
import { cn } from '@/lib/utils'

/**
 * BOTTLENECK PROPAGATION COMPONENT (Phase 5)
 *
 * Visualizes how an intake excess ripples across the entire municipal ecosystem:
 * Excess Inflow -> Reception Backlog -> Fleet Gate Queue -> Collection Cycle Delay -> Haulage Emissions -> Landfill Spillover
 */
export function BottleneckPropagation({
  steps,
  className,
}: {
  steps: BottleneckPropagationStep[]
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">CASCADE PROPAGATION DYNAMICS</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          6-STAGE SYSTEMIC IMPACT
        </span>
      </div>

      <div className="grid gap-2">
        {steps.map((step, idx) => {
          const toneClass =
            step.tone === 'critical'
              ? 'border-critical/30 bg-critical/[0.04]'
              : step.tone === 'warn'
                ? 'border-warn/30 bg-warn/[0.04]'
                : 'border-hair bg-white/[0.015]'

          const badgeColor =
            step.tone === 'critical'
              ? '#E2595B'
              : step.tone === 'warn'
                ? '#E5B44C'
                : '#4FE3C1'

          return (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.07 }}
              className={cn(
                'relative flex flex-col justify-between border p-2.5 sm:flex-row sm:items-center',
                toneClass,
              )}
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[7.5px] uppercase tracking-[0.14em]"
                    style={{ color: badgeColor }}
                  >
                    {step.stage}
                  </span>
                  <span className="font-mono text-[10.5px] font-medium tracking-[0.04em] text-ink">
                    {step.title}
                  </span>
                </div>
                <p className="mt-0.5 text-[9.5px] leading-relaxed text-ink-faint">
                  {step.description}
                </p>
              </div>

              <div className="mt-2 flex shrink-0 items-center justify-between border-t border-hair/50 pt-1.5 sm:mt-0 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <span className="font-mono text-[7.5px] tracking-[0.1em] text-ink-ghost">
                  {step.metric}
                </span>
                <span
                  className="data-value text-[13px] leading-none"
                  style={{ color: badgeColor }}
                >
                  {step.value}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
