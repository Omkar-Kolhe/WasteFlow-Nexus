import { useMemo, useState } from 'react'
import {
  Columns,
  FlaskConical,
  Radar,
  Sparkles,
} from 'lucide-react'
import { useBaselineTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import {
  generateOptimizationRecommendations,
  sortRecommendationsByStrategy,
} from '@/engine/optimizationEngine'
import type {
  OptimizationRecommendation,
  SavedOptimizationScenario,
} from '@/engine/optimizationTypes'
import { ModuleShell } from '../views/ModuleShell'
import { Button } from '@/components/ui/Button'
import { SystemOptimizationSummary } from './SystemOptimizationSummary'
import { StrategySelector } from './StrategySelector'
import { RecommendationCard } from './RecommendationCard'
import { RecommendationDetailModal } from './RecommendationDetailModal'
import { InterventionComparisonModal } from './InterventionComparisonModal'
import { OptimizationHistory } from './OptimizationHistory'

export function OptimizationPage() {
  const baselineModel = useBaselineTwinModel()
  const setView = useTwinStore((s) => s.setView)
  const requestFocus = useTwinStore((s) => s.requestFocus)

  const selectedStrategy = useTwinStore((s) => s.selectedStrategy)
  const setSelectedStrategy = useTwinStore((s) => s.setSelectedStrategy)

  const activeComparisonIds = useTwinStore((s) => s.activeComparisonIds)
  const toggleComparisonId = useTwinStore((s) => s.toggleComparisonId)

  const applyRecommendationToSimulation = useTwinStore(
    (s) => s.applyRecommendationToSimulation,
  )

  const savedOptimizationScenarios = useTwinStore((s) => s.savedOptimizationScenarios)
  const saveOptimizationScenario = useTwinStore((s) => s.saveOptimizationScenario)
  const deleteOptimizationScenario = useTwinStore((s) => s.deleteOptimizationScenario)

  const [activeDetailRec, setActiveDetailRec] = useState<OptimizationRecommendation | null>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  // Generate recommendations and summary based on baseline engine run
  const { recommendations, summary } = useMemo(() => {
    return generateOptimizationRecommendations(baselineModel)
  }, [baselineModel])

  // Filter and sort recommendations by active strategy
  const sortedRecommendations = useMemo(() => {
    return sortRecommendationsByStrategy(recommendations, selectedStrategy)
  }, [recommendations, selectedStrategy])

  // Get active comparison items
  const comparisonList = useMemo(() => {
    return recommendations.filter((r) => activeComparisonIds.includes(r.id))
  }, [recommendations, activeComparisonIds])

  const handleTestScenario = (rec: OptimizationRecommendation) => {
    applyRecommendationToSimulation(rec)
  }

  const handleSaveScenario = (rec: OptimizationRecommendation) => {
    saveOptimizationScenario(rec, selectedStrategy)
  }

  const handleRetestSaved = (scen: SavedOptimizationScenario) => {
    const targetRec = recommendations.find((r) => r.id === scen.interventionId)
    if (targetRec) {
      applyRecommendationToSimulation(targetRec)
    } else {
      // Direct load
      useTwinStore.setState({
        view: 'simulation',
        simulationParameters: { ...scen.parameters },
        simulationState: 'editing',
      })
    }
  }

  const handleFocusOnMap = (facilityId: string) => {
    requestFocus(facilityId)
    setView('twin')
  }

  return (
    <ModuleShell
      icon={Sparkles}
      title="OPTIMIZATION ENGINE"
      code="PHASE 7"
      description="Turn system bottlenecks into measurable interventions."
    >
      {/* ── TOP ACTION BAR ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 border border-hair bg-white/[0.015] p-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[8px] tracking-[0.14em] text-signal uppercase">
            ● RECOMMENDATION ENGINE ACTIVE
          </span>
          <span className="font-mono text-[8.5px] text-ink-ghost">
            Grounded in live calculations & bottleneck ledgers
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeComparisonIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={<Columns size={11} className="text-signal" />}
              onClick={() => setShowComparisonModal(true)}
              className="font-mono text-[8.5px] border-signal/40 bg-signal/10 text-signal"
            >
              COMPARE MATRIX ({activeComparisonIds.length})
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            icon={<FlaskConical size={11} />}
            onClick={() => setView('simulation')}
            className="font-mono text-[8.5px]"
          >
            SIMULATION LAB
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Radar size={11} />}
            onClick={() => setView('twin')}
            className="font-mono text-[8.5px]"
          >
            DIGITAL TWIN
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {/* 1. System Recommendation Summary */}
        <SystemOptimizationSummary summary={summary} />

        {/* 2. Multi-Objective Strategy Evaluator */}
        <StrategySelector
          selectedStrategy={selectedStrategy}
          onSelectStrategy={setSelectedStrategy}
        />

        {/* 3. Generated Intervention Recommendations Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-signal" />
              <span className="label-tech text-[8.5px]">
                ACTIONABLE INTERVENTIONS (RANKED BY {selectedStrategy})
              </span>
            </div>
            <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
              {sortedRecommendations.length} DATA-DRIVEN PROPOSALS
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecommendations.map((rec, idx) => {
              const isCompared = activeComparisonIds.includes(rec.id)
              const isSaved = savedOptimizationScenarios.some(
                (s) => s.interventionId === rec.id,
              )

              return (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  selectedStrategy={selectedStrategy}
                  onTestScenario={handleTestScenario}
                  onViewDetails={setActiveDetailRec}
                  onToggleCompare={toggleComparisonId}
                  isCompared={isCompared}
                  onSave={handleSaveScenario}
                  isSaved={isSaved}
                  index={idx}
                />
              )
            })}
          </div>
        </div>

        {/* 4. Optimization History / Saved Scenarios */}
        <OptimizationHistory
          scenarios={savedOptimizationScenarios}
          onRetest={handleRetestSaved}
          onDelete={deleteOptimizationScenario}
        />
      </div>

      {/* Drill-down Explainable Detail Modal */}
      <RecommendationDetailModal
        recommendation={activeDetailRec}
        selectedStrategy={selectedStrategy}
        onClose={() => setActiveDetailRec(null)}
        onTestScenario={handleTestScenario}
        onSave={handleSaveScenario}
        isSaved={
          activeDetailRec
            ? savedOptimizationScenarios.some((s) => s.interventionId === activeDetailRec.id)
            : false
        }
        onFocusOnMap={handleFocusOnMap}
      />

      {/* Side-by-Side Comparison Matrix Modal */}
      {showComparisonModal && (
        <InterventionComparisonModal
          recommendations={comparisonList}
          selectedStrategy={selectedStrategy}
          onClose={() => setShowComparisonModal(false)}
          onTestScenario={handleTestScenario}
          onRemoveFromComparison={toggleComparisonId}
        />
      )}
    </ModuleShell>
  )
}
