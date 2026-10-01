import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  Cpu,
  MapPin,
  Play,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useBaselineTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { runSimulation, validateSimulationParameters } from '@/engine/simulationEngine'
import { ModuleShell } from '../views/ModuleShell'
import { Button } from '@/components/ui/Button'
import { ScenarioControls } from './ScenarioControls'
import { SimulationPresets } from './SimulationPresets'
import { BeforeAfterComparison } from './BeforeAfterComparison'
import { ImpactSummary } from './ImpactSummary'
import { SimulationBottleneckDiff } from './SimulationBottleneckDiff'
import { SimulationHistory } from './SimulationHistory'
import { CinematicSimulationLoader } from './CinematicSimulationLoader'
import { SimulationValidationBanner } from './SimulationValidationBanner'

export function SimulationLab() {
  const baselineModel = useBaselineTwinModel()
  const setView = useTwinStore((s) => s.setView)
  const setSimulationModel = useTwinStore((s) => s.setSimulationModel)
  const simulationParameters = useTwinStore((s) => s.simulationParameters)
  const setSimulationParameters = useTwinStore((s) => s.setSimulationParameters)
  const simulationResult = useTwinStore((s) => s.simulationResult)
  const setSimulationResult = useTwinStore((s) => s.setSimulationResult)
  const simulationState = useTwinStore((s) => s.simulationState)
  const setSimulationState = useTwinStore((s) => s.setSimulationState)
  const selectedPresetId = useTwinStore((s) => s.selectedPresetId)
  const applySimulationPreset = useTwinStore((s) => s.applySimulationPreset)
  const resetSimulation = useTwinStore((s) => s.resetSimulation)
  const savedScenarios = useTwinStore((s) => s.savedScenarios)
  const saveCurrentScenario = useTwinStore((s) => s.saveCurrentScenario)
  const deleteScenario = useTwinStore((s) => s.deleteScenario)
  const loadScenario = useTwinStore((s) => s.loadScenario)

  const [scenarioName, setScenarioName] = useState('Custom Operational Intervention')
  const [showLoader, setShowLoader] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Validation
  const validation = useMemo(
    () => validateSimulationParameters(simulationParameters),
    [simulationParameters],
  )

  // Live lightweight preview of Kanjurmarg & Deonar
  const previewStatus = useMemo(() => {
    const sKjCap = simulationParameters.kanjurmargSortingCapacity
    const sKjUtil = (3369 / sKjCap) * 100
    const sKjState = sKjUtil >= 90 ? 'CRITICAL' : sKjUtil >= 70 ? 'WARNING' : 'HEALTHY'

    return {
      kanjurmargUtil: sKjUtil.toFixed(0),
      kanjurmargState: sKjState,
      fleetDelta: simulationParameters.fleetCountDelta,
      sionCleared: simulationParameters.unblockSionCircleRoute,
    }
  }, [simulationParameters])

  // Trigger simulation run with cinematic loader
  const handleRunSimulation = () => {
    if (!validation.isValid) return
    setSimulationState('simulating')
    setShowLoader(true)
  }

  const handleLoaderComplete = () => {
    setShowLoader(false)
    const { simulatedModel, result } = runSimulation(simulationParameters, baselineModel)
    setSimulationModel(simulatedModel)
    setSimulationResult(result)
    setSimulationState('completed')
  }

  const handleSave = () => {
    if (!simulationResult) return
    saveCurrentScenario(scenarioName)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  return (
    <ModuleShell
      icon={Cpu}
      title="SIMULATION LAB"
      code="PHASE 6"
      description="Test operational changes before deploying them."
    >
      {/* ── TOP ACTION & STATUS BAR ─────────────────────────── */}
      <div className="flex flex-col gap-3 border border-hair bg-white/[0.015] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <span
            className={`border px-2 py-0.5 font-mono text-[8px] tracking-[0.14em] uppercase ${
              simulationState === 'completed'
                ? 'border-signal/50 bg-signal/10 text-signal'
                : simulationState === 'editing'
                  ? 'border-warn/50 bg-warn/10 text-warn'
                  : 'border-white/10 bg-white/[0.04] text-ink-ghost'
            }`}
          >
            {simulationState === 'completed' ? '● SIMULATION ACTIVE' : simulationState === 'editing' ? '● PARAMETERS MODIFIED' : '● BASELINE SYSTEM'}
          </span>

          {/* Scenario Name Input */}
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="border border-hair bg-void/90 px-2.5 py-1 font-mono text-[9.5px] text-ink focus:border-signal/60 focus:outline-none min-w-[200px]"
            placeholder="Scenario Name..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw size={11} strokeWidth={1.75} />}
            onClick={resetSimulation}
          >
            Reset
          </Button>

          {simulationState === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              icon={saveSuccess ? <CheckCircle2 size={11} /> : <Save size={11} />}
              onClick={handleSave}
            >
              {saveSuccess ? 'Saved!' : 'Save Scenario'}
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<Play size={11} strokeWidth={2} />}
            onClick={handleRunSimulation}
            disabled={!validation.isValid}
          >
            Run Simulation
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      <SimulationValidationBanner validation={validation} className="mt-3" />

      {/* ── PRESETS SECTION ─────────────────────────────────── */}
      <section className="mt-4">
        <SimulationPresets
          selectedPresetId={selectedPresetId}
          onSelectPreset={applySimulationPreset}
        />
      </section>

      {/* ── TWO-PART WORKSPACE (Phase 6 §2) ─────────────────── */}
      <section className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* LEFT: SCENARIO CONTROLS */}
        <div className="border border-hair bg-white/[0.015] p-3.5">
          <ScenarioControls
            parameters={simulationParameters}
            onChange={setSimulationParameters}
            onReset={resetSimulation}
          />
        </div>

        {/* RIGHT: LIVE SIMULATION PREVIEW & DIGITAL TWIN ANCHOR */}
        <div className="space-y-3.5">
          {/* Live Preview Card */}
          <div className="border border-hair bg-white/[0.015] p-3.5">
            <div className="flex items-center justify-between border-b border-hair pb-2">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-signal" />
                <span className="label-tech text-[8.5px]">LIVE PARAMETER IMPACT PREVIEW</span>
              </div>
              <span className="border border-warn/30 bg-warn/10 px-1 py-[1px] font-mono text-[7px] text-warn">
                PRE-CALCULATION PREVIEW
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[9px]">
              <div className="border border-hair/50 bg-white/[0.01] p-2">
                <span className="label-tech block text-[7px] text-ink-ghost">KANJURMARG SORTING</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-ink-faint">EST. LOAD:</span>
                  <span className="data-value text-signal font-semibold">{previewStatus.kanjurmargUtil}%</span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="text-ink-faint">PROJECTED:</span>
                  <span className={previewStatus.kanjurmargState === 'HEALTHY' ? 'text-signal' : 'text-warn'}>
                    {previewStatus.kanjurmargState}
                  </span>
                </div>
              </div>

              <div className="border border-hair/50 bg-white/[0.01] p-2">
                <span className="label-tech block text-[7px] text-ink-ghost">SION ARTERIAL (RT-06)</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-ink-faint">CORRIDOR:</span>
                  <span className={previewStatus.sionCleared ? 'text-signal font-semibold' : 'text-critical'}>
                    {previewStatus.sionCleared ? 'RESTORED' : 'BLOCKED'}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="text-ink-faint">FLEET DELTA:</span>
                  <span className="text-ink font-semibold">
                    {previewStatus.fleetDelta >= 0 ? `+${previewStatus.fleetDelta}` : previewStatus.fleetDelta} UNITS
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2.5 font-mono text-[8px] leading-relaxed text-ink-ghost">
              Modify sliders and toggles on the left, then click <strong className="text-signal font-normal">Run Simulation</strong> to compute the complete mass-balanced city ledger across all engines.
            </p>
          </div>

          {/* Digital Twin View Link */}
          <div className="border border-hair bg-white/[0.015] p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-signal" />
                <span className="label-tech text-[8.5px]">DIGITAL TWIN REACTION</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<MapPin size={10} />}
                onClick={() => setView('twin')}
              >
                Inspect on Twin
              </Button>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-faint">
              When a simulation is executed, the entire digital twin mesh transforms live: congested corridors clear, particle speeds adapt, and facility beacons update in real time.
            </p>
          </div>
        </div>
      </section>

      {/* ── SIMULATION RESULTS SECTION (When completed) ────── */}
      {simulationResult && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 space-y-5"
        >
          {/* Impact Summary Badges */}
          <ImpactSummary impact={simulationResult.environmentalImpact} />

          {/* Bottleneck Resolution Diff */}
          <SimulationBottleneckDiff resolvedBottlenecks={simulationResult.resolvedBottlenecks} />

          {/* Detailed 10-Metric Before/After Comparison */}
          <BeforeAfterComparison deltas={simulationResult.deltas} />
        </motion.div>
      )}

      {/* ── SAVED SCENARIO HISTORY ──────────────────────────── */}
      <section className="mt-6">
        <SimulationHistory
          scenarios={savedScenarios}
          onLoad={(id) => {
            loadScenario(id)
            const target = savedScenarios.find((s) => s.scenarioId === id)
            if (target) {
              const { simulatedModel, result } = runSimulation(target.simulationParameters, baselineModel)
              setSimulationModel(simulatedModel)
              setSimulationResult(result)
            }
          }}
          onDelete={deleteScenario}
        />
      </section>

      {/* Cinematic Transition Overlay */}
      {showLoader && <CinematicSimulationLoader onComplete={handleLoaderComplete} />}
    </ModuleShell>
  )
}
