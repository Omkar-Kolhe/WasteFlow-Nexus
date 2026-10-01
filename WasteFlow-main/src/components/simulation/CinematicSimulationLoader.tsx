import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Cpu, Factory, Leaf, Network, Sparkles } from 'lucide-react'

const STEPS = [
  { label: 'ANALYZING NETWORK TOPOLOGY…', icon: Network },
  { label: 'RECALCULATING CORRIDOR FLOWS…', icon: Activity },
  { label: 'UPDATING FACILITY CAPACITIES & QUEUES…', icon: Factory },
  { label: 'RECALCULATING ENVIRONMENTAL IMPACT & CO₂e…', icon: Leaf },
  { label: 'SIMULATION COMPLETE — COMPOSING TWIN…', icon: Sparkles },
]

export function CinematicSimulationLoader({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
      }, 260)
      return () => clearTimeout(timer)
    } else {
      const endTimer = setTimeout(() => {
        onComplete()
      }, 320)
      return () => clearTimeout(endTimer)
    }
  }, [currentStep, onComplete])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-void/80 backdrop-blur-[5px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="surface ticks border border-signal/40 bg-void p-6 shadow-panel max-w-md w-full"
      >
        <div className="flex items-center justify-between border-b border-hair pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center bg-signal/15 text-signal">
              <Cpu size={14} className="animate-spin" />
            </span>
            <span className="label-tech text-[9px] text-signal">WHAT-IF SIMULATION ENGINE ACTIVE</span>
          </div>
          <span className="font-mono text-[8px] text-ink-ghost">STAGE {currentStep + 1} OF 5</span>
        </div>

        <div className="mt-5 space-y-2.5">
          {STEPS.map((step, idx) => {
            const isPast = idx < currentStep
            const isCurrent = idx === currentStep
            const Icon = step.icon

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 p-2 font-mono text-[9.5px] tracking-[0.06em] transition-all ${
                  isCurrent
                    ? 'border border-signal/50 bg-signal/[0.08] text-signal'
                    : isPast
                      ? 'text-ink-faint opacity-60'
                      : 'text-ink-ghost opacity-30'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 size={13} className="text-signal shrink-0" />
                ) : (
                  <Icon size={13} className={`shrink-0 ${isCurrent ? 'animate-pulse' : ''}`} />
                )}
                <span>{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-1 w-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-signal shadow-glow-sm"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </motion.div>
    </div>
  )
}
