import { motion } from 'framer-motion'
import {
  ChevronRight,
  Columns,
  Copy,
  Trash2,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function ScenarioCard({
  scenario,
  onOpen,
  onToggleCompare,
  isCompared,
  onDuplicate,
  onDelete,
  index,
  className,
}: {
  scenario: ScenarioDetailData
  onOpen: (s: ScenarioDetailData) => void
  onToggleCompare: (id: string) => void
  isCompared: boolean
  onDuplicate: (s: ScenarioDetailData) => void
  onDelete: (id: string) => void
  index: number
  className?: string
}) {
  const impact = scenario.environmentalImpact

  const categoryColor =
    scenario.category === 'CAPACITY'
      ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10'
      : scenario.category === 'ROUTING'
        ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
        : scenario.category === 'FLEET'
          ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
          : scenario.category === 'RECOVERY'
            ? 'text-signal border-signal/30 bg-signal/10'
            : 'text-purple-400 border-purple-400/30 bg-purple-400/10'

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
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'border px-1.5 py-[2px] font-mono text-[7.5px] font-semibold tracking-wider uppercase',
                categoryColor,
              )}
            >
              {scenario.category}
            </span>

            <span className="border border-white/10 bg-white/[0.04] px-1.5 py-[2px] font-mono text-[7.5px] text-ink-dim truncate max-w-[170px]">
              {scenario.targetFacilityName || scenario.targetRouteName}
            </span>

            <span className="border border-white/10 bg-white/[0.02] px-1.5 py-[1px] font-mono text-[7px] text-ink-ghost uppercase">
              {scenario.status}
            </span>
          </div>

          <span className="font-mono text-[8px] text-ink-ghost shrink-0">
            {new Date(scenario.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpen(scenario)}
          className="mt-2.5 text-[15px] font-medium leading-snug tracking-tight text-ink group-hover:text-signal transition-colors cursor-pointer"
        >
          {scenario.scenarioName}
        </h3>

        {/* Intervention Summary */}
        <div className="mt-2 border border-hair/70 bg-white/[0.01] px-2.5 py-1.5 font-mono text-[9px] text-ink-dim">
          <span className="text-ink-ghost block text-[7px] uppercase tracking-wider mb-0.5">
            INTERVENTION MOVE
          </span>
          <span className="text-signal font-medium line-clamp-1">
            {scenario.interventionSummary}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-3.5 grid grid-cols-4 gap-1.5 border-t border-hair/60 pt-3">
          <MetricCell
            label="CO₂e"
            pct={impact.co2eDeltaPct}
            polarity="lower-better"
          />
          <MetricCell
            label="LANDFILL"
            pct={impact.landfillDeltaPct}
            polarity="lower-better"
          />
          <MetricCell
            label="RECOVERY"
            pct={impact.recoveryDeltaPct}
            polarity="higher-better"
          />
          <MetricCell
            label="TRIPS"
            pct={impact.tripsDeltaPct}
            polarity="lower-better"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-hair pt-3">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="primary"
            icon={<ChevronRight size={11} strokeWidth={1.8} />}
            onClick={() => onOpen(scenario)}
            className="font-mono text-[8.5px] tracking-wider font-semibold"
          >
            OPEN LAB
          </Button>

          <button
            onClick={() => onToggleCompare(scenario.scenarioId)}
            className={cn(
              'focus-ring flex items-center gap-1 border px-2 py-1 font-mono text-[8px] tracking-wider transition-colors',
              isCompared
                ? 'border-signal/60 bg-signal/15 text-signal font-semibold'
                : 'border-hair bg-white/[0.02] text-ink-faint hover:text-ink',
            )}
            title="Toggle side-by-side comparison"
          >
            <Columns size={10} />
            <span>{isCompared ? 'COMPARED' : 'COMPARE'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(scenario)}
            className="text-ink-ghost hover:text-ink transition-colors p-1"
            title="Duplicate scenario"
          >
            <Copy size={11} />
          </button>

          <button
            onClick={() => onDelete(scenario.scenarioId)}
            className="text-ink-ghost hover:text-critical transition-colors p-1"
            title="Delete scenario"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function MetricCell({
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
