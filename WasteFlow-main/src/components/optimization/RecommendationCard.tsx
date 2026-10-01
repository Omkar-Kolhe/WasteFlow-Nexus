import { motion } from 'framer-motion'
import {
  Bookmark,
  ChevronRight,
  Columns,
  FlaskConical,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import type {
  OptimizationRecommendation,
  OptimizationStrategyId,
} from '@/engine/optimizationTypes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function RecommendationCard({
  recommendation,
  selectedStrategy,
  onTestScenario,
  onViewDetails,
  onToggleCompare,
  isCompared,
  onSave,
  isSaved,
  index,
  className,
}: {
  recommendation: OptimizationRecommendation
  selectedStrategy: OptimizationStrategyId
  onTestScenario: (rec: OptimizationRecommendation) => void
  onViewDetails: (rec: OptimizationRecommendation) => void
  onToggleCompare: (id: string) => void
  isCompared: boolean
  onSave: (rec: OptimizationRecommendation) => void
  isSaved: boolean
  index: number
  className?: string
}) {
  const { simulationResult, confidence, tradeoffs } = recommendation
  const impact = simulationResult.environmentalImpact
  const score = recommendation.strategyScores[selectedStrategy]

  const categoryColor =
    recommendation.category === 'CAPACITY'
      ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10'
      : recommendation.category === 'FLEET'
        ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
        : recommendation.category === 'ROUTING'
          ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
          : recommendation.category === 'OPERATING_HOURS'
            ? 'text-purple-400 border-purple-400/30 bg-purple-400/10'
            : 'text-signal border-signal/30 bg-signal/10'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={cn(
        'surface ticks group relative flex flex-col justify-between border border-hair bg-white/[0.015] p-4 shadow-panel transition-all hover:border-hair2 hover:bg-white/[0.03]',
        isCompared && 'border-signal/50 bg-signal/[0.02]',
        className,
      )}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'border px-1.5 py-[2px] font-mono text-[7.5px] font-semibold tracking-wider uppercase',
                categoryColor,
              )}
            >
              {recommendation.category}
            </span>

            <span className="border border-white/10 bg-white/[0.04] px-1.5 py-[2px] font-mono text-[7.5px] text-ink-dim">
              {recommendation.targetFacilityName || recommendation.targetRouteName}
            </span>

            {recommendation.targetBottleneckSeverity && (
              <span
                className={cn(
                  'border px-1.5 py-[2px] font-mono text-[7px] tracking-wider uppercase',
                  recommendation.targetBottleneckSeverity === 'critical'
                    ? 'border-critical/40 bg-critical/10 text-critical'
                    : 'border-warn/40 bg-warn/10 text-warn',
                )}
              >
                TARGETS {recommendation.targetBottleneckSeverity} BOTTLENECK
              </span>
            )}
          </div>

          {/* Strategy Score Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[8px] text-ink-ghost">SCORE</span>
            <span className="border border-signal/40 bg-signal/15 px-2 py-[2px] font-mono text-[11px] font-bold text-signal">
              {score}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2.5 text-[15px] font-medium leading-snug tracking-tight text-ink group-hover:text-signal transition-colors">
          {recommendation.title}
        </h3>

        {/* Why this recommendation */}
        <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
          {recommendation.reason}
        </p>

        {/* Current vs Proposed Change Box */}
        <div className="mt-3 border border-hair/70 bg-white/[0.01] p-2.5 font-mono text-[9px]">
          <div className="flex items-center justify-between text-ink-ghost">
            <span>BASELINE CONDITION</span>
            <span>PROPOSED INTERVENTION</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-medium text-ink">
            <span className="text-ink-dim line-through decoration-white/20">
              {recommendation.currentCondition}
            </span>
            <span className="text-signal">{recommendation.proposedChange}</span>
          </div>
        </div>

        {/* Simulated Impact Metrics Grid */}
        <div className="mt-3.5 grid grid-cols-4 gap-1.5 border-t border-hair/60 pt-3">
          <ImpactMetric
            label="CO₂e EMISSIONS"
            pct={impact.co2eDeltaPct}
            polarity="lower-better"
          />
          <ImpactMetric
            label="LANDFILL DUMPING"
            pct={impact.landfillDeltaPct}
            polarity="lower-better"
          />
          <ImpactMetric
            label="RECOVERY RATE"
            pct={impact.recoveryDeltaPct}
            polarity="higher-better"
          />
          <ImpactMetric
            label="BACKLOG TONNAGE"
            pct={impact.backlogDeltaPct}
            polarity="lower-better"
          />
        </div>

        {/* Confidence & Trade-Off Snippet */}
        <div className="mt-3 flex items-center justify-between border-t border-hair/40 pt-2 text-[9.5px]">
          <div className="flex items-center gap-1.5 font-mono text-ink-faint">
            <ShieldCheck size={11} className="text-signal" />
            <span>CONFIDENCE: {confidence.score}% ({confidence.level})</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-ink-ghost text-[8px]">
            <Scale size={10} className="text-warn" />
            <span>CAPEX: {tradeoffs.capitalRequirement} · DEPLOY: {tradeoffs.timeToDeploy}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hair pt-3">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="primary"
            icon={<FlaskConical size={11} strokeWidth={1.8} />}
            onClick={() => onTestScenario(recommendation)}
            className="font-mono text-[8.5px] tracking-wider font-semibold"
          >
            TEST SCENARIO
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<ChevronRight size={11} />}
            onClick={() => onViewDetails(recommendation)}
            className="font-mono text-[8.5px]"
          >
            DETAILS
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleCompare(recommendation.id)}
            className={cn(
              'focus-ring flex items-center gap-1 border px-2 py-1 font-mono text-[8px] tracking-wider transition-colors',
              isCompared
                ? 'border-signal/60 bg-signal/15 text-signal font-semibold'
                : 'border-hair bg-white/[0.02] text-ink-faint hover:text-ink',
            )}
            title="Add to side-by-side comparison"
          >
            <Columns size={10} />
            <span>{isCompared ? 'COMPARED' : 'COMPARE'}</span>
          </button>

          <button
            onClick={() => onSave(recommendation)}
            className={cn(
              'focus-ring flex items-center gap-1 border px-2 py-1 font-mono text-[8px] tracking-wider transition-colors',
              isSaved
                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-400 font-semibold'
                : 'border-hair bg-white/[0.02] text-ink-faint hover:text-ink',
            )}
            title="Save scenario snapshot for Phase 8"
          >
            <Bookmark size={10} />
            <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function ImpactMetric({
  label,
  pct,
  polarity,
}: {
  label: string
  pct: number
  polarity: 'higher-better' | 'lower-better'
}) {
  const isPositive = polarity === 'higher-better' ? pct > 0 : pct < 0
  const isNeutral = Math.abs(pct) < 0.1

  const toneClass = isNeutral
    ? 'text-ink-ghost'
    : isPositive
      ? 'text-signal'
      : 'text-critical'

  return (
    <div className="border border-hair/40 bg-white/[0.01] p-1.5 text-center">
      <span className="label-tech block text-[6.5px] truncate text-ink-ghost">{label}</span>
      <span className={cn('data-value mt-0.5 block text-[11px] font-semibold leading-none', toneClass)}>
        {pct > 0 ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}
