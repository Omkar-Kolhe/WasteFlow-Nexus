import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Cpu,
  Factory,
  Leaf,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const REPLAY_STAGES = [
  {
    id: 1,
    title: 'STAGE 1: BASELINE NETWORK TOPOLOGY',
    subtitle: 'Current system under baseline load with active bottlenecks and queue friction.',
    icon: Activity,
    tone: 'warn',
  },
  {
    id: 2,
    title: 'STAGE 2: IDENTIFYING BOTTLENECK CHOKEPOINTS',
    subtitle: 'Telemetry detects critical capacity threshold exceedance and backlog accumulation.',
    icon: AlertTriangle,
    tone: 'critical',
  },
  {
    id: 3,
    title: 'STAGE 3: INJECTING INTERVENTION PARAMETERS',
    subtitle: 'Applying operational adjustments across capacity, fleet, and routing schedules.',
    icon: Cpu,
    tone: 'signal',
  },
  {
    id: 4,
    title: 'STAGE 4: RECALCULATING MULTI-STREAM FLOWS',
    subtitle: 'Mass-balance and logistics engine re-routes flows and drains reception hoppers.',
    icon: Factory,
    tone: 'signal',
  },
  {
    id: 5,
    title: 'STAGE 5: TRANSITIONING TO SCENARIO EQUILIBRIUM',
    subtitle: 'Digital Twin settles into balanced state with cleared gate queues and normalized velocities.',
    icon: Sparkles,
    tone: 'cyan',
  },
  {
    id: 6,
    title: 'STAGE 6: REAPING ENVIRONMENTAL DIVIDENDS',
    subtitle: 'Emissions slashed, landfill dependency diverted, and city circularity maximized.',
    icon: Leaf,
    tone: 'signal',
  },
]

export function ScenarioReplayModal({
  scenario,
  onClose,
}: {
  scenario: ScenarioDetailData
  onClose: () => void
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      if (currentStageIndex < REPLAY_STAGES.length - 1) {
        setCurrentStageIndex((prev) => prev + 1)
      } else {
        setIsPlaying(false)
      }
    }, 1800)

    return () => clearTimeout(timer)
  }, [isPlaying, currentStageIndex])

  const stage = REPLAY_STAGES[currentStageIndex]
  const Icon = stage.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-void/80 p-4 backdrop-blur-[6px]"
        onClick={onClose}
      >
        <motion.article
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="surface ticks border border-signal/50 bg-void p-6 shadow-panel max-w-xl w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-hair">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center bg-signal/15 text-signal">
                <Play size={13} />
              </span>
              <span className="label-tech text-[9px] text-signal">
                CINEMATIC SCENARIO REPLAY · {scenario.scenarioName}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-ink-ghost hover:text-ink transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Center Stage Animation Display */}
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-ink-ghost font-mono text-[8px]">
              <span>PROGRESSION</span>
              <span>
                STEP {currentStageIndex + 1} OF {REPLAY_STAGES.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full bg-signal"
                initial={{ width: '0%' }}
                animate={{
                  width: `${((currentStageIndex + 1) / REPLAY_STAGES.length) * 100}%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Active Stage Card */}
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="border border-hair bg-white/[0.02] p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-signal animate-pulse" />
                <h3 className="font-mono text-[12px] font-bold text-ink">
                  {stage.title}
                </h3>
              </div>
              <p className="text-[11.5px] leading-relaxed text-ink-faint">
                {stage.subtitle}
              </p>

              {/* Dynamic context data based on current step */}
              <div className="mt-3 pt-3 border-t border-hair/40 font-mono text-[9px] text-ink-dim">
                {currentStageIndex === 0 && (
                  <span>
                    Baseline: {formatNumber(scenario.baselineMetrics.wasteCollectedT)} T/day input ·{' '}
                    {scenario.baselineMetrics.criticalBottlenecksCount} Critical Bottlenecks
                  </span>
                )}
                {currentStageIndex === 1 && (
                  <span className="text-critical">
                    Overload at {scenario.targetFacilityName}: 38 min gate queue · 70 T backlog
                  </span>
                )}
                {currentStageIndex === 2 && (
                  <span className="text-signal">
                    Injecting: {scenario.interventionSummary}
                  </span>
                )}
                {currentStageIndex === 3 && (
                  <span className="text-cyan-400">
                    Recalculating 35 routes and 14 processing nodes in memory...
                  </span>
                )}
                {currentStageIndex === 4 && (
                  <span className="text-signal">
                    Zero Backlog achieved · Gate queue reduced to{' '}
                    {scenario.simulatedMetrics.meanQueueMin} minutes
                  </span>
                )}
                {currentStageIndex === 5 && (
                  <span className="text-signal font-bold">
                    Result: {scenario.environmentalImpact.co2eDeltaPct}% CO₂e ·{' '}
                    {scenario.environmentalImpact.landfillDeltaPct}% Landfill Dumping
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between border-t border-hair pt-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? 'outline' : 'primary'}
                icon={isPlaying ? <Pause size={11} /> : <Play size={11} />}
                onClick={() => setIsPlaying((p) => !p)}
                className="font-mono text-[8.5px]"
              >
                {isPlaying ? 'PAUSE' : 'RESUME'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw size={11} />}
                onClick={() => {
                  setCurrentStageIndex(0)
                  setIsPlaying(true)
                }}
                className="font-mono text-[8.5px]"
              >
                RESTART
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="font-mono text-[8.5px]"
            >
              CLOSE
            </Button>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}
