import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Factory,
  Layers,
  Recycle,
  TrendingDown,
  Truck,
} from 'lucide-react'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'
import { cn, formatNumber } from '@/lib/utils'

export function FlowTransformation({
  scenario,
  className,
}: {
  scenario: ScenarioDetailData
  className?: string
}) {
  const [activeMode, setActiveMode] = useState<'current' | 'scenario'>('scenario')

  const isScenario = activeMode === 'scenario'
  const stages = isScenario ? scenario.flowStages.scenario : scenario.flowStages.current
  const metrics = isScenario ? scenario.simulatedMetrics : scenario.baselineMetrics

  return (
    <div
      className={cn(
        'surface ticks border border-hair bg-white/[0.015] p-4 shadow-panel',
        className,
      )}
    >
      {/* Header and Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hair/60">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-signal" />
          <span className="label-tech text-[8.5px]">NETWORK FLOW TRANSFORMATION</span>
        </div>

        {/* Current vs Scenario Segmented Toggle */}
        <div className="flex items-center border border-hair p-0.5 bg-void">
          <button
            onClick={() => setActiveMode('current')}
            className={cn(
              'px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider transition-all',
              !isScenario
                ? 'bg-critical/20 text-critical border border-critical/40 font-semibold'
                : 'text-ink-ghost hover:text-ink',
            )}
          >
            ● BASELINE FLOW
          </button>
          <button
            onClick={() => setActiveMode('scenario')}
            className={cn(
              'px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider transition-all',
              isScenario
                ? 'bg-signal/20 text-signal border border-signal/40 font-semibold shadow-sm'
                : 'text-ink-ghost hover:text-ink',
            )}
          >
            ● SCENARIO FLOW
          </button>
        </div>
      </div>

      {/* Interactive Flow Diagram */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid gap-2 sm:grid-cols-5"
          >
            {/* Step 1: Collection */}
            <FlowStep
              icon={Truck}
              title="1. COLLECTION"
              tonnage={`${formatNumber(metrics.wasteCollectedT)} T/D`}
              status={stages.collectionStatus}
              tone="default"
              subNote="8 municipal wards"
            />

            {/* Step 2: Transfer */}
            <FlowStep
              icon={Layers}
              title="2. TRANSFER"
              tonnage={`${formatNumber(Math.round(metrics.wasteCollectedT * 0.72))} T/D`}
              status={stages.transferStatus}
              tone="default"
              subNote="Mulund & Deonar"
            />

            {/* Step 3: Sorting */}
            <FlowStep
              icon={Factory}
              title="3. SORTING"
              tonnage={`${formatNumber(metrics.wasteProcessedT)} T/D`}
              status={stages.sortingNote}
              tone={stages.sortingStatus}
              highlight={stages.sortingStatus === 'normal' ? 'BALANCED' : 'OVERLOAD'}
              subNote="Kanjurmarg & Deonar"
            />

            {/* Step 4: Recovery */}
            <FlowStep
              icon={Recycle}
              title="4. RECOVERY"
              tonnage={`${formatNumber(metrics.wasteRecoveredT)} T/D`}
              status={`${metrics.recoveryRatePct}% circularity`}
              tone={isScenario ? 'signal' : 'default'}
              highlight={isScenario ? `+${scenario.environmentalImpact.recoveryDeltaPct}% LIFT` : undefined}
              subNote="MRF & Composting"
            />

            {/* Step 5: Landfill */}
            <FlowStep
              icon={TrendingDown}
              title="5. LANDFILL DUMPING"
              tonnage={`${formatNumber(metrics.wasteToLandfillT)} T/D`}
              status={isScenario ? `Slashing dumpsite intake` : `High dependency`}
              tone={isScenario ? 'signal' : 'critical'}
              highlight={isScenario ? `${scenario.environmentalImpact.landfillDeltaPct}%` : 'HEAVY'}
              subNote="Deonar Dumpsite"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flow Transformation Explanatory Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-hair/40 pt-2 font-mono text-[8px] text-ink-ghost">
        <span>
          MASS BALANCE: {formatNumber(metrics.wasteRecoveredT)} T RECOVERED +{' '}
          {formatNumber(metrics.wasteToLandfillT)} T LANDFILLED ={' '}
          {formatNumber(metrics.wasteProcessedT)} T PROCESSED
        </span>
        <span className={isScenario ? 'text-signal' : 'text-warn'}>
          {isScenario ? '✓ CIRCULAR RECOVERY MAXIMIZED' : '⚠ LANDFILL BURDEN DOMINANT'}
        </span>
      </div>
    </div>
  )
}

function FlowStep({
  icon: Icon,
  title,
  tonnage,
  status,
  tone,
  highlight,
  subNote,
}: {
  icon: typeof Truck
  title: string
  tonnage: string
  status: string
  tone: 'default' | 'critical' | 'warning' | 'normal' | 'signal'
  highlight?: string
  subNote: string
}) {
  const toneBorder =
    tone === 'critical'
      ? 'border-critical/60 bg-critical/[0.04]'
      : tone === 'warning'
        ? 'border-warn/60 bg-warn/[0.04]'
        : tone === 'signal' || tone === 'normal'
          ? 'border-signal/60 bg-signal/[0.04]'
          : 'border-hair bg-white/[0.01]'

  const badgeColor =
    tone === 'critical'
      ? 'border-critical/40 bg-critical/15 text-critical'
      : tone === 'warning'
        ? 'border-warn/40 bg-warn/15 text-warn'
        : 'border-signal/40 bg-signal/15 text-signal'

  return (
    <div className={cn('surface border p-3 flex flex-col justify-between', toneBorder)}>
      <div>
        <div className="flex items-center justify-between">
          <Icon size={12} className="text-ink-faint" />
          {highlight && (
            <span className={cn('border px-1 py-[1px] font-mono text-[6.5px] font-bold uppercase', badgeColor)}>
              {highlight}
            </span>
          )}
        </div>

        <span className="label-tech mt-2 block text-[7.5px] text-ink-ghost truncate">
          {title}
        </span>
        <span className="data-value mt-0.5 block text-[13px] font-semibold text-ink">
          {tonnage}
        </span>
      </div>

      <div className="mt-2.5 pt-1.5 border-t border-hair/30 font-mono text-[8px]">
        <span className="block text-ink-faint truncate">{status}</span>
        <span className="block text-[7px] text-ink-ghost truncate">{subNote}</span>
      </div>
    </div>
  )
}
