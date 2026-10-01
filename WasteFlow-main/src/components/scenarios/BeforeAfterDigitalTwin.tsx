import { useState } from 'react'
import { Radar } from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { useTwinStore } from '@/state/twinStore'
import { runSimulation } from '@/engine/simulationEngine'
import { useBaselineTwinModel } from '@/hooks/useTwinModel'
import { cn, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function BeforeAfterDigitalTwin({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const baselineModel = useBaselineTwinModel()
  const setView = useTwinStore((s) => s.setView)
  const setSimulationModel = useTwinStore((s) => s.setSimulationModel)
  const simulationModel = useTwinStore((s) => s.simulationModel)
  const requestFocus = useTwinStore((s) => s.requestFocus)

  const [compareSlider, setCompareSlider] = useState<number>(100) // 0 = baseline, 100 = scenario

  const isScenarioActiveInTwin = simulationModel !== null

  const handleApplyToTwin = () => {
    // Run simulation to get fresh TwinModel and set into store
    const { simulatedModel } = runSimulation(scenario.simulationParameters, baselineModel)
    setSimulationModel(simulatedModel)
    if (scenario.targetFacilityId) {
      requestFocus(scenario.targetFacilityId)
    }
    setView('twin')
  }

  const handleResetTwinToBaseline = () => {
    setSimulationModel(null)
  }

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hair/60">
        <div>
          <div className="flex items-center gap-1.5">
            <Radar size={13} className="text-signal" />
            <span className="label-tech text-[8.5px]">DIGITAL TWIN TWIN-STATE INTERPOLATOR</span>
          </div>
          <span className="font-mono text-[8px] text-ink-ghost block mt-0.5">
            INTERACTIVE SLIDER: BASELINE LIVE MESH ⟷ SCENARIO STATE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isScenarioActiveInTwin ? 'primary' : 'outline'}
            icon={<Radar size={11} />}
            onClick={handleApplyToTwin}
            className="font-mono text-[8px] tracking-wider"
          >
            {isScenarioActiveInTwin ? 'VIEW ACTIVE ON MAP' : 'APPLY TO DIGITAL TWIN'}
          </Button>

          {isScenarioActiveInTwin && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetTwinToBaseline}
              className="font-mono text-[8px] text-ink-ghost hover:text-ink"
            >
              RESTORE LIVE
            </Button>
          )}
        </div>
      </div>

      {/* Slider Control */}
      <div className="mt-3.5 space-y-1.5 border border-hair/50 bg-white/[0.01] p-3">
        <div className="flex items-center justify-between font-mono text-[8.5px]">
          <span className={compareSlider < 50 ? 'text-critical font-bold' : 'text-ink-ghost'}>
            CURRENT LIVE SYSTEM (0%)
          </span>
          <span className="text-signal font-semibold">
            TRANSFORMATION RATIO: {compareSlider}%
          </span>
          <span className={compareSlider >= 50 ? 'text-signal font-bold' : 'text-ink-ghost'}>
            SCENARIO STATE (100%)
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={compareSlider}
          onChange={(e) => setCompareSlider(Number(e.target.value))}
          className="w-full accent-[#4FE3C1] cursor-pointer"
        />
      </div>

      {/* Before / After Twin Infrastructure State Breakdown */}
      <div className="mt-3.5 grid gap-3 sm:grid-cols-3 font-mono text-[9px]">
        {/* Node Status */}
        <div className="border border-hair/50 bg-white/[0.01] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px] uppercase">
            <span>TARGET NODE UTILIZATION</span>
            <span>STATUS</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-critical line-through decoration-white/20">
              {scenario.targetFacilityId === 'S-KJ' ? '96.3% UTIL' : 'HIGH LOAD'}
            </span>
            <span className="text-ink-ghost">→</span>
            <span className="text-signal font-bold">
              {scenario.targetFacilityId === 'S-KJ' ? '77.4% BALANCED' : 'NORMALIZED'}
            </span>
          </div>
          <span className="mt-1 block text-[7.5px] text-ink-faint">
            {scenario.targetFacilityName}
          </span>
        </div>

        {/* Gate Queue Dwell */}
        <div className="border border-hair/50 bg-white/[0.01] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px] uppercase">
            <span>GATE QUEUE DWELL TIME</span>
            <span>DWELL</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-warn">
              {scenario.baselineMetrics.meanQueueMin} MIN
            </span>
            <span className="text-ink-ghost">→</span>
            <span className="text-signal font-bold">
              {scenario.simulatedMetrics.meanQueueMin} MIN
            </span>
          </div>
          <span className="mt-1 block text-[7.5px] text-signal/80">
            {scenario.simulatedMetrics.meanQueueMin - scenario.baselineMetrics.meanQueueMin} MIN
            ELAPSED TIME GAIN
          </span>
        </div>

        {/* Backlog State */}
        <div className="border border-hair/50 bg-white/[0.01] p-2.5">
          <div className="flex items-center justify-between text-ink-ghost text-[7.5px] uppercase">
            <span>RECEPTION HOPPER BACKLOG</span>
            <span>BACKLOG</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-critical">
              {formatNumber(scenario.baselineMetrics.backlogT)} T
            </span>
            <span className="text-ink-ghost">→</span>
            <span className="text-signal font-bold">
              {formatNumber(scenario.simulatedMetrics.backlogT)} T
            </span>
          </div>
          <span className="mt-1 block text-[7.5px] text-signal/80">
            {scenario.environmentalImpact.backlogDeltaPct}% SURPLUS DRAINED
          </span>
        </div>
      </div>
    </div>
  )
}
