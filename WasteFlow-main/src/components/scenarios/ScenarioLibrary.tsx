import { useState } from 'react'
import {
  Columns,
  RotateCcw,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react'
import type {
  ScenarioDetailData,
  ScenarioFilterOptions,
} from '@/engine/scenarioTypes'
import { filterScenarios } from '@/engine/scenarioEngine'
import { ScenarioCard } from './ScenarioCard'
import { Button } from '@/components/ui/Button'

export function ScenarioLibrary({
  scenarios,
  onOpenScenario,
  onToggleCompare,
  comparedIds,
  onOpenComparisonModal,
  onDuplicateScenario,
  onDeleteScenario,
  onRestoreDefaults,
  className,
}: {
  scenarios: ScenarioDetailData[]
  onOpenScenario: (s: ScenarioDetailData) => void
  onToggleCompare: (id: string) => void
  comparedIds: string[]
  onOpenComparisonModal: () => void
  onDuplicateScenario: (s: ScenarioDetailData) => void
  onDeleteScenario: (id: string) => void
  onRestoreDefaults: () => void
  className?: string
}) {
  const [filters, setFilters] = useState<ScenarioFilterOptions>({
    searchQuery: '',
    categoryFilter: 'ALL',
    statusFilter: 'ALL',
    impactFilter: 'ALL',
  })

  const filteredList = filterScenarios(scenarios, filters)

  const categories = ['ALL', 'CAPACITY', 'ROUTING', 'FLEET', 'RECOVERY', 'OPERATING_HOURS']

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {/* ── FILTER & SEARCH BAR ──────────────────────────────── */}
      <div className="flex flex-col gap-2.5 border border-hair bg-white/[0.015] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-ghost"
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Search scenarios by name, target, or move..."
              className="w-full border border-hair bg-void/80 pl-8 pr-3 py-1 font-mono text-[9.5px] text-ink focus:border-signal/60 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, categoryFilter: cat }))
                }
                className={`border px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider transition-colors ${
                  filters.categoryFilter === cat
                    ? 'border-signal/60 bg-signal/15 text-signal font-semibold'
                    : 'border-hair bg-white/[0.01] text-ink-faint hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {comparedIds.length >= 2 && (
            <Button
              size="sm"
              variant="primary"
              icon={<Columns size={11} />}
              onClick={onOpenComparisonModal}
              className="font-mono text-[8.5px] tracking-wider"
            >
              COMPARE SELECTED ({comparedIds.length})
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw size={10} />}
            onClick={onRestoreDefaults}
            className="font-mono text-[8px]"
            title="Load standard benchmark scenarios"
          >
            BENCHMARKS
          </Button>
        </div>
      </div>

      {/* ── SCENARIO GRID OR EMPTY STATE ──────────────────────── */}
      {filteredList.length === 0 ? (
        <div className="surface border border-hair bg-white/[0.01] p-10 text-center">
          <Wand2 size={24} className="mx-auto text-ink-ghost mb-2 animate-pulse" />
          <h3 className="font-mono text-[13px] font-semibold text-ink">
            No Scenarios Found
          </h3>
          <p className="mt-1 text-[11px] text-ink-faint max-w-md mx-auto">
            {scenarios.length === 0
              ? 'No saved scenarios are present in your local library. You can generate canonical strategic scenarios or create custom runs from the Simulation Lab or Optimization Engine.'
              : 'No scenarios match your active search and category filters.'}
          </p>
          {scenarios.length === 0 && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="primary"
                icon={<Sparkles size={11} />}
                onClick={onRestoreDefaults}
                className="font-mono text-[9px]"
              >
                GENERATE CANONICAL BENCHMARKS
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((scen, idx) => (
            <ScenarioCard
              key={scen.scenarioId}
              scenario={scen}
              onOpen={onOpenScenario}
              onToggleCompare={onToggleCompare}
              isCompared={comparedIds.includes(scen.scenarioId)}
              onDuplicate={onDuplicateScenario}
              onDelete={onDeleteScenario}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  )
}
