import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Columns,
  FlaskConical,
  X,
} from 'lucide-react'
import type {
  OptimizationRecommendation,
  OptimizationStrategyId,
} from '@/engine/optimizationTypes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function InterventionComparisonModal({
  recommendations,
  selectedStrategy,
  onClose,
  onTestScenario,
  onRemoveFromComparison,
}: {
  recommendations: OptimizationRecommendation[]
  selectedStrategy: OptimizationStrategyId
  onClose: () => void
  onTestScenario: (rec: OptimizationRecommendation) => void
  onRemoveFromComparison: (id: string) => void
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (recommendations.length === 0) return null

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
          className="surface ticks atmos-noise relative flex max-h-[92vh] w-full max-w-[1040px] flex-col border border-hair bg-void shadow-panel overflow-hidden"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-hair px-5 py-3.5 bg-white/[0.015]">
            <div className="flex items-center gap-2">
              <Columns size={14} className="text-signal" />
              <h2 className="label-tech text-[10px] text-ink">
                INTERVENTION COMPARISON MATRIX ({recommendations.length} SELECTED)
              </h2>
            </div>

            <button
              onClick={onClose}
              className="focus-ring grid h-7 w-7 place-items-center text-ink-faint hover:text-ink transition-colors"
              aria-label="Close comparison modal"
            >
              <X size={15} />
            </button>
          </header>

          {/* Matrix Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-5">
            <div
              className="grid gap-3 min-w-[700px]"
              style={{
                gridTemplateColumns: `170px repeat(${recommendations.length}, minmax(180px, 1fr))`,
              }}
            >
              {/* Row: Headers */}
              <div className="p-2 font-mono text-[8.5px] text-ink-ghost self-end">
                INTERVENTION CANDIDATE
              </div>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="surface border border-hair/70 bg-white/[0.02] p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="border border-signal/40 bg-signal/15 px-1.5 py-[1px] font-mono text-[7px] font-bold text-signal uppercase">
                        {rec.category}
                      </span>
                      <button
                        onClick={() => onRemoveFromComparison(rec.id)}
                        className="text-ink-ghost hover:text-critical"
                        title="Remove from comparison"
                      >
                        <X size={11} />
                      </button>
                    </div>

                    <h4 className="mt-1.5 text-[11px] font-medium leading-tight text-ink">
                      {rec.title}
                    </h4>
                    <span className="mt-0.5 block font-mono text-[7.5px] text-ink-ghost truncate">
                      {rec.targetFacilityName || rec.targetRouteName}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-hair/40">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<FlaskConical size={10} />}
                      onClick={() => {
                        onTestScenario(rec)
                        onClose()
                      }}
                      className="w-full font-mono text-[8px] tracking-wider py-1"
                    >
                      TEST SCENARIO
                    </Button>
                  </div>
                </div>
              ))}

              {/* Row: Strategy Score */}
              <MetricLabel label="STRATEGY SCORE" unit={`(${selectedStrategy})`} />
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-hair/40 bg-white/[0.01] p-2 text-center">
                  <span className="font-mono text-[13px] font-bold text-signal">
                    {rec.strategyScores[selectedStrategy]} / 100
                  </span>
                </div>
              ))}

              {/* Row: CO2e */}
              <MetricLabel label="CO₂e EMISSIONS" unit="DELTA %" />
              {recommendations.map((rec) => {
                const pct = rec.simulationResult.environmentalImpact.co2eDeltaPct
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
                    subValue={`${rec.simulationResult.environmentalImpact.co2eDeltaKg.toLocaleString()} kg/d`}
                    polarity="lower-better"
                    isPositive={pct < 0}
                  />
                )
              })}

              {/* Row: Landfill */}
              <MetricLabel label="LANDFILL INTAKE" unit="DELTA %" />
              {recommendations.map((rec) => {
                const pct = rec.simulationResult.environmentalImpact.landfillDeltaPct
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
                    subValue={`${rec.simulationResult.environmentalImpact.landfillDeltaT > 0 ? '+' : ''}${rec.simulationResult.environmentalImpact.landfillDeltaT.toLocaleString()} T/d`}
                    polarity="lower-better"
                    isPositive={pct < 0}
                  />
                )
              })}

              {/* Row: Recovery Rate */}
              <MetricLabel label="RECOVERY RATE" unit="ABSOLUTE %" />
              {recommendations.map((rec) => {
                const rate = rec.simulationResult.simulatedMetrics.recoveryRatePct
                const gain = rec.simulationResult.environmentalImpact.recoveryDeltaPct
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${rate.toFixed(1)}%`}
                    subValue={`${gain > 0 ? '+' : ''}${gain.toFixed(1)}% lift`}
                    polarity="higher-better"
                    isPositive={gain > 0}
                  />
                )
              })}

              {/* Row: Trips */}
              <MetricLabel label="FLEET TRIPS" unit="DELTA %" />
              {recommendations.map((rec) => {
                const pct = rec.simulationResult.environmentalImpact.tripsDeltaPct
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
                    subValue={`${rec.simulationResult.simulatedMetrics.tripsToday} trips/d`}
                    polarity="lower-better"
                    isPositive={pct <= 0}
                  />
                )
              })}

              {/* Row: Backlog */}
              <MetricLabel label="SYSTEM BACKLOG" unit="REDUCTION %" />
              {recommendations.map((rec) => {
                const pct = rec.simulationResult.environmentalImpact.backlogDeltaPct
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
                    subValue={`${rec.simulationResult.simulatedMetrics.backlogT} T remaining`}
                    polarity="lower-better"
                    isPositive={pct <= 0}
                  />
                )
              })}

              {/* Row: Queue Dwell */}
              <MetricLabel label="QUEUE DWELL" unit="MINUTES" />
              {recommendations.map((rec) => {
                const dwell = rec.simulationResult.simulatedMetrics.meanQueueMin
                const diff = rec.simulationResult.deltas.meanQueue?.deltaAbsolute ?? 0
                return (
                  <ComparisonCell
                    key={rec.id}
                    value={`${dwell} MIN`}
                    subValue={`${diff > 0 ? '+' : ''}${diff} min`}
                    polarity="lower-better"
                    isPositive={diff <= 0}
                  />
                )
              })}

              {/* Row: Tradeoffs */}
              <MetricLabel label="FEASIBILITY & CAPEX" unit="ESTIMATE" />
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-hair/40 bg-white/[0.01] p-2 text-[9.5px] font-mono">
                  <div className="flex justify-between text-ink-ghost">
                    <span>CAPEX:</span>
                    <span className="font-semibold text-ink">{rec.tradeoffs.capitalRequirement}</span>
                  </div>
                  <div className="flex justify-between text-ink-ghost mt-1">
                    <span>DEPLOY:</span>
                    <span className="text-ink-faint truncate">{rec.tradeoffs.timeToDeploy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-end border-t border-hair px-5 py-3 bg-white/[0.02]">
            <Button size="sm" variant="outline" onClick={onClose} className="font-mono text-[8.5px]">
              CLOSE MATRIX
            </Button>
          </footer>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}

function MetricLabel({ label, unit }: { label: string; unit?: string }) {
  return (
    <div className="flex flex-col justify-center border-l-2 border-hair px-2 py-1 font-mono">
      <span className="text-[8px] font-semibold tracking-wider text-ink-dim uppercase">
        {label}
      </span>
      {unit && <span className="text-[7px] text-ink-ghost">{unit}</span>}
    </div>
  )
}

function ComparisonCell({
  value,
  subValue,
  isPositive,
}: {
  value: string
  subValue?: string
  polarity: 'higher-better' | 'lower-better'
  isPositive: boolean
}) {
  return (
    <div className="border border-hair/40 bg-white/[0.01] p-2 text-center flex flex-col justify-center">
      <span
        className={cn(
          'data-value text-[12px] font-bold leading-none',
          isPositive ? 'text-signal' : 'text-critical',
        )}
      >
        {value}
      </span>
      {subValue && (
        <span className="mt-1 font-mono text-[7.5px] text-ink-ghost truncate">
          {subValue}
        </span>
      )}
    </div>
  )
}
