import {
  Compass,
  Factory,
  Leaf,
  Sliders,
  Zap,
} from 'lucide-react'
import { OPTIMIZATION_STRATEGIES } from '@/engine/optimizationEngine'
import type { OptimizationStrategyId } from '@/engine/optimizationTypes'
import { cn } from '@/lib/utils'

const STRATEGY_ICONS: Record<OptimizationStrategyId, typeof Zap> = {
  BALANCED: Compass,
  ENVIRONMENT_FIRST: Leaf,
  EFFICIENCY_FIRST: Zap,
  CAPACITY_FIRST: Factory,
}

export function StrategySelector({
  selectedStrategy,
  onSelectStrategy,
  className,
}: {
  selectedStrategy: OptimizationStrategyId
  onSelectStrategy: (strategy: OptimizationStrategyId) => void
  className?: string
}) {
  const strategyList = Object.values(OPTIMIZATION_STRATEGIES)

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">MULTI-OBJECTIVE STRATEGY EVALUATOR</span>
        </div>
        <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
          SELECT PRIORITY CRITERIA
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {strategyList.map((strat) => {
          const isSelected = strat.id === selectedStrategy
          const Icon = STRATEGY_ICONS[strat.id]

          return (
            <button
              key={strat.id}
              onClick={() => onSelectStrategy(strat.id)}
              className={cn(
                'group relative flex flex-col justify-between border p-3 text-left transition-all',
                isSelected
                  ? 'border-signal/70 bg-signal/[0.07] shadow-sm'
                  : 'border-hair bg-white/[0.015] hover:border-hair2 hover:bg-white/[0.035]',
              )}
            >
              {isSelected && (
                <span className="absolute left-0 inset-y-0 w-[3px] bg-signal" />
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 font-mono text-[8.5px] font-semibold tracking-wider uppercase',
                      isSelected ? 'text-signal' : 'text-ink-dim group-hover:text-ink',
                    )}
                  >
                    <Icon size={12} className={isSelected ? 'text-signal' : 'text-ink-ghost'} />
                    {strat.label}
                  </span>

                  {isSelected && (
                    <span className="border border-signal/40 bg-signal/15 px-1 py-[1px] font-mono text-[7px] text-signal">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-faint">
                  {strat.shortDescription}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1 border-t border-hair/40 pt-2">
                {strat.focusAreas.map((focus) => (
                  <span
                    key={focus}
                    className="border border-white/[0.08] bg-white/[0.02] px-1.5 py-[1px] font-mono text-[7px] text-ink-ghost"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
