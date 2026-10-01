import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BottleneckChainStep } from '@/engine/bottleneckEngine'

/**
 * ROOT CAUSE CHAIN — the dependency waterfall (§4).
 *
 * An animated cause → effect sequence: observed signals first, then the
 * mechanism, then the environmental consequences. Each step lands in sequence
 * and offers its facility/route handles so the map can highlight what the step
 * is talking about. A replay control restarts the cascade (§7).
 */

const STEP_GAP = 340 // ms between steps
const EASE = [0.22, 1, 0.36, 1] as const

const KIND_META = {
  signal: { label: 'OBSERVED SIGNAL', color: '#6C9BFF' },
  cause: { label: 'LIKELY CAUSE', color: '#E5B44C' },
  consequence: { label: 'ENVIRONMENTAL CONSEQUENCE', color: '#E2595B' },
} as const

export function RootCauseChain({
  steps,
  onStepFocus,
  autoPlay = true,
}: {
  steps: BottleneckChainStep[]
  /** Called as each step appears, so the map can highlight its handles. */
  onStepFocus?: (step: BottleneckChainStep | null) => void
  autoPlay?: boolean
}) {
  const [visible, setVisible] = useState(autoPlay ? 0 : steps.length)
  const [running, setRunning] = useState(autoPlay)

  useEffect(() => {
    setVisible(autoPlay ? 0 : steps.length)
    setRunning(autoPlay)
  }, [steps, autoPlay])

  useEffect(() => {
    if (!running) return
    if (visible >= steps.length) {
      setRunning(false)
      return
    }
    const id = window.setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 120 : STEP_GAP)
    return () => window.clearTimeout(id)
  }, [running, visible, steps.length])

  // Report the newest visible step so the map can highlight along.
  useEffect(() => {
    if (!running) return
    onStepFocus?.(visible > 0 ? steps[visible - 1] ?? null : null)
  }, [running, visible, steps, onStepFocus])

  const replay = () => {
    setVisible(0)
    setRunning(true)
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="label-tech text-[8.5px]">DEPENDENCY TRACE</span>
        <span className="h-px flex-1 bg-hair" />
        <button
          onClick={replay}
          className="focus-ring flex items-center gap-1.5 border border-hair px-1.5 py-[3px] font-mono text-[8.5px] tracking-[0.12em] text-ink-ghost transition-colors hover:border-hair2 hover:text-ink"
        >
          <RotateCcw size={9.5} strokeWidth={1.75} />
          REPLAY
        </button>
      </div>

      <ol className="relative space-y-0">
        {steps.map((step, i) => {
          const shown = i < visible
          const meta = KIND_META[step.kind]
          const isLast = i === steps.length - 1
          return (
            <li key={`${step.label}-${i}`} className="relative">
              {/* connector */}
              {i > 0 && (
                <span className="absolute left-[7px] top-[-14px] h-[14px] w-px bg-gradient-to-b from-transparent via-white/15 to-white/25" />
              )}
              <AnimatePresence>
                {shown && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="pb-3.5 pl-0"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="mt-[5px] h-[7px] w-[7px] shrink-0 rotate-45"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}66` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10.5px] tracking-[0.08em] text-ink">{step.label}</span>
                          <span
                            className="border px-1 py-[1px] font-mono text-[7px] tracking-[0.14em]"
                            style={{ borderColor: `${meta.color}44`, color: `${meta.color}` }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[10.5px] leading-relaxed text-ink-faint">{step.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!shown && <div className="pb-3.5" aria-hidden />}
              {!isLast && null}
            </li>
          )
        })}
      </ol>

      {visible < steps.length && (
        <p className="mt-1 font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
          TRACING…
        </p>
      )}
    </div>
  )
}

/** Legend distinguishing the three epistemic tiers (§4). */
export function ChainLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-1.5', className)}>
      {Object.entries(KIND_META).map(([kind, meta]) => (
        <span key={kind} className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-ink-ghost">
          <span className="h-[6px] w-[6px] rotate-45" style={{ background: meta.color }} />
          {meta.label}
        </span>
      ))}
    </div>
  )
}
