import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Bookmark,
  CheckCircle2,
  Crosshair,
  FlaskConical,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  OptimizationRecommendation,
  OptimizationStrategyId,
} from '@/engine/optimizationTypes'
import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function RecommendationDetailModal({
  recommendation,
  selectedStrategy,
  onClose,
  onTestScenario,
  onSave,
  isSaved,
  onFocusOnMap,
}: {
  recommendation: OptimizationRecommendation | null
  selectedStrategy: OptimizationStrategyId
  onClose: () => void
  onTestScenario: (rec: OptimizationRecommendation) => void
  onSave: (rec: OptimizationRecommendation) => void
  isSaved: boolean
  onFocusOnMap: (facilityId: string) => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!recommendation) return null

  const { simulationResult, confidence, tradeoffs, reasoningChain } = recommendation
  const score = recommendation.strategyScores[selectedStrategy]
  const deltas = Object.values(simulationResult.deltas)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-void/70 p-3 backdrop-blur-[4px]"
        onClick={onClose}
      >
        <motion.article
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="surface ticks atmos-noise relative flex max-h-[92vh] w-full max-w-[980px] flex-col border border-hair bg-void shadow-panel overflow-hidden"
        >
          {/* Header */}
          <header className="relative border-b border-hair px-5 py-3.5 bg-white/[0.015]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-signal/40 bg-signal/15 px-2 py-[2px] font-mono text-[8px] font-bold text-signal uppercase tracking-wider">
                    {recommendation.category} INTERVENTION
                  </span>

                  <span className="border border-white/10 bg-white/[0.04] px-2 py-[2px] font-mono text-[8px] text-ink-dim">
                    TARGET: {recommendation.targetFacilityName || recommendation.targetRouteName}
                  </span>

                  <span className="border border-cyan-400/40 bg-cyan-400/10 px-2 py-[2px] font-mono text-[8px] text-cyan-400 font-semibold">
                    STRATEGY SCORE: {score} / 100
                  </span>
                </div>

                <h2 className="mt-2 text-[17px] font-medium tracking-tight text-ink">
                  {recommendation.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-ink-faint leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              <button
                onClick={onClose}
                className="focus-ring grid h-7 w-7 place-items-center text-ink-faint hover:text-ink transition-colors"
                aria-label="Close detail modal"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          {/* Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. WHY THIS INTERVENTION? REASONING CHAIN */}
            <div className="border border-hair bg-white/[0.015] p-4">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-hair/60">
                <Sparkles size={12} className="text-signal" />
                <h3 className="label-tech text-[8.5px] text-signal">
                  WHY THIS INTERVENTION? (EVIDENCE REASONING CHAIN)
                </h3>
              </div>

              <div className="mt-3.5 grid gap-3 md:grid-cols-5 font-mono text-[9.5px]">
                <ChainStep
                  stepNumber="1"
                  label="OBSERVED PROBLEM"
                  content={reasoningChain.observedProblem}
                  tone="critical"
                />
                <ChainStep
                  stepNumber="2"
                  label="ROOT CAUSE"
                  content={reasoningChain.rootCause}
                  tone="warn"
                />
                <ChainStep
                  stepNumber="3"
                  label="PROPOSED MOVE"
                  content={reasoningChain.intervention}
                  tone="signal"
                />
                <ChainStep
                  stepNumber="4"
                  label="SIMULATION PROOF"
                  content={reasoningChain.simulationProof}
                  tone="signal"
                />
                <ChainStep
                  stepNumber="5"
                  label="MEASURED IMPACT"
                  content={reasoningChain.measuredImpact}
                  tone="cyan"
                />
              </div>
            </div>

            {/* 2. CONFIDENCE & TRADE-OFFS (Two Columns) */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Confidence & Evidence */}
              <div className="border border-hair bg-white/[0.015] p-4">
                <div className="flex items-center justify-between pb-2 border-b border-hair/60">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-signal" />
                    <h3 className="label-tech text-[8.5px]">CONFIDENCE & EMPIRICAL EVIDENCE</h3>
                  </div>
                  <span className="font-mono text-[8px] font-bold text-signal">
                    {confidence.score}% ({confidence.level})
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {confidence.evidence.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10.5px] text-ink-dim">
                      <CheckCircle2 size={12} className="text-signal shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade-Off Analysis */}
              <div className="border border-hair bg-white/[0.015] p-4">
                <div className="flex items-center justify-between pb-2 border-b border-hair/60">
                  <div className="flex items-center gap-1.5">
                    <Scale size={12} className="text-warn" />
                    <h3 className="label-tech text-[8.5px]">TRADE-OFF & FEASIBILITY ANALYSIS</h3>
                  </div>
                  <span className="font-mono text-[8px] text-ink-ghost">
                    CAPEX: {tradeoffs.capitalRequirement} · DEPLOY: {tradeoffs.timeToDeploy}
                  </span>
                </div>

                <div className="mt-3 space-y-3 text-[10.5px]">
                  <div>
                    <span className="font-mono text-[7.5px] tracking-wider text-signal font-semibold uppercase block">
                      SYSTEMIC BENEFITS
                    </span>
                    <ul className="mt-1 space-y-1 text-ink-dim">
                      {tradeoffs.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-signal">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-mono text-[7.5px] tracking-wider text-warn font-semibold uppercase block">
                      DOWNSIDES & CONSTRAINTS
                    </span>
                    <ul className="mt-1 space-y-1 text-ink-faint">
                      {tradeoffs.downsides.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-warn">⚠</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SIMULATED 10-METRIC IMPACT TABLE */}
            <div className="border border-hair bg-white/[0.015] p-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-hair/60">
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-signal" />
                  <h3 className="label-tech text-[8.5px]">
                    SIMULATED OUTCOME (PHASE 6 ENGINE RECALCULATION)
                  </h3>
                </div>
                <span className="font-mono text-[8px] text-ink-ghost">
                  AUTHENTIC FLOW & EMISSION METRICS
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {deltas.map((delta) => {
                  const isPositive = delta.isPositive
                  const isNeutral = Math.abs(delta.deltaPct) < 0.1
                  const toneColor = isNeutral
                    ? 'text-ink-ghost'
                    : isPositive
                      ? 'text-signal'
                      : 'text-critical'

                  return (
                    <div
                      key={delta.label}
                      className="border border-hair/40 bg-white/[0.01] p-2"
                    >
                      <span className="label-tech block text-[7px] truncate text-ink-ghost">
                        {delta.label.toUpperCase()}
                      </span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-mono text-[10px] text-ink-dim">
                          {formatNumber(delta.baselineValue)} {delta.unit}
                        </span>
                        <span className="font-mono text-[9px] text-ink-ghost">→</span>
                        <span className="font-mono text-[10px] font-semibold text-ink">
                          {formatNumber(delta.simulatedValue)} {delta.unit}
                        </span>
                      </div>
                      <span className={cn('data-value mt-1 block text-[11px] font-bold leading-none', toneColor)}>
                        {delta.deltaPct > 0 ? '+' : ''}
                        {delta.deltaPct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="flex flex-wrap items-center justify-between border-t border-hair px-5 py-3 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                icon={<FlaskConical size={12} strokeWidth={1.8} />}
                onClick={() => {
                  onTestScenario(recommendation)
                  onClose()
                }}
                className="font-mono text-[9px] tracking-wider font-semibold"
              >
                TEST SCENARIO IN SIMULATION LAB
              </Button>

              <Button
                size="sm"
                variant={isSaved ? 'outline' : 'outline'}
                icon={<Bookmark size={11} />}
                onClick={() => onSave(recommendation)}
                className="font-mono text-[8.5px]"
              >
                {isSaved ? 'SAVED TO SCENARIOS' : 'SAVE SCENARIO'}
              </Button>

              {recommendation.targetFacilityId && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Crosshair size={11} />}
                  onClick={() => {
                    if (recommendation.targetFacilityId) {
                      onFocusOnMap(recommendation.targetFacilityId)
                      onClose()
                    }
                  }}
                  className="font-mono text-[8.5px]"
                >
                  FOCUS ON DIGITAL TWIN
                </Button>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="font-mono text-[8.5px]"
            >
              CLOSE
            </Button>
          </footer>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}

function ChainStep({
  stepNumber,
  label,
  content,
  tone,
}: {
  stepNumber: string
  label: string
  content: string
  tone: 'critical' | 'warn' | 'signal' | 'cyan'
}) {
  const borderTone =
    tone === 'critical'
      ? 'border-critical/50 text-critical'
      : tone === 'warn'
        ? 'border-warn/50 text-warn'
        : tone === 'cyan'
          ? 'border-cyan-400/50 text-cyan-400'
          : 'border-signal/50 text-signal'

  return (
    <div className="border border-hair/60 bg-white/[0.01] p-2.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-hair/40">
          <span className={cn('font-bold text-[7.5px] tracking-wider', borderTone)}>
            {label}
          </span>
          <span className="text-[7.5px] text-ink-ghost">STAGE 0{stepNumber}</span>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-ink-dim font-sans">
          {content}
        </p>
      </div>
    </div>
  )
}
