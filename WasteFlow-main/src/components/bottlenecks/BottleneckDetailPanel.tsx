import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  Compass,
  Crosshair,
  FlaskConical,
  Layers,
  Leaf,
  MapPin,
  Network,
  Sparkles,
  X,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import type { Bottleneck } from '@/engine/bottleneckEngine'
import { useTwinStore } from '@/state/twinStore'
import { CapacityGauge } from './CapacityGauge'
import { ImpactMetrics } from './ImpactMetrics'
import { ChainLegend, RootCauseChain } from './RootCauseChain'
import { UpstreamDownstreamAnalysis } from './UpstreamDownstreamAnalysis'
import { BottleneckPropagation } from './BottleneckPropagation'
import { BottleneckTimeline } from './BottleneckTimeline'
import { EarlyWarningCard } from './EarlyWarningCard'
import { Button } from '@/components/ui/Button'

/**
 * BOTTLENECK DETAIL PANEL (Phase 5)
 *
 * Full-scale Explainable Intelligence Panel:
 * - Root Cause, Confidence & Evidence
 * - Upstream / Downstream Network Topology
 * - Systemic Impact & Environmental Consequences
 * - Dynamic Propagation Cascade & Early Warning
 * - 6-Stage Timeline & Actionable Interventions Preview
 */

const EASE = [0.22, 1, 0.36, 1] as const

type TabId = 'overview' | 'topology' | 'impact' | 'propagation' | 'fixes'

export function BottleneckDetailPanel({
  bottleneck,
  onClose,
  onFocusOnMap,
}: {
  bottleneck: Bottleneck | null
  onClose: () => void
  onFocusOnMap: (facilityId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [mapMode, setMapMode] = useState(false)
  const testBottleneckIntervention = useTwinStore((s) => s.testBottleneckIntervention)

  const handleTestInSimulation = () => {
    if (!bottleneck) return
    testBottleneckIntervention(bottleneck.facilityId)
    onClose()
  }

  // Reset tab on bottleneck change
  useEffect(() => {
    setActiveTab('overview')
  }, [bottleneck?.facilityId])

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onStepFocus = useCallback(
    (step: { facilityIds: string[]; routeIds: string[] } | null) => {
      if (!mapMode || !bottleneck) return
      const engine = (window as unknown as { __wasteflow?: { focusNode: (id: string) => void } }).__wasteflow
      const target = step?.facilityIds[0]
      if (engine && target) engine.focusNode(target)
    },
    [mapMode, bottleneck],
  )

  const color = bottleneck ? NODE_STATE_COLOR_HEX[bottleneck.severity] : '#4FE3C1'
  const critical = bottleneck?.severity === 'critical'

  return (
    <AnimatePresence>
      {bottleneck && (
        <motion.div
          key="bottleneck-detail"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-40 grid place-items-center bg-void/65 p-3 backdrop-blur-[4px]"
          onClick={onClose}
        >
          <motion.article
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="surface ticks atmos-noise relative flex max-h-[90vh] w-full max-w-[940px] flex-col border-hair shadow-panel"
          >
            {/* ── HEADER ────────────────────────────────────────── */}
            <header className="relative shrink-0 border-b border-hair px-5 pb-3.5 pt-4">
              <div className="flex items-start gap-4">
                <CapacityGauge
                  utilizationPct={bottleneck.utilization}
                  incomingT={bottleneck.incomingWaste}
                  capacityT={bottleneck.capacity}
                  size={84}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Severity Badge */}
                    <span
                      className="inline-flex items-center gap-1.5 border px-1.5 py-[2px] font-mono text-[7.5px] tracking-[0.16em]"
                      style={{ borderColor: `${color}55`, color, background: `${color}10` }}
                    >
                      <span
                        className={cn('h-1.5 w-1.5', critical && 'animate-status-pulse')}
                        style={{ background: color }}
                      />
                      {bottleneck.severity.toUpperCase()}
                    </span>

                    {/* Bottleneck Type Badge */}
                    <span className="border border-white/10 bg-white/[0.04] px-1.5 py-[2px] font-mono text-[7.5px] tracking-[0.12em] text-ink-dim">
                      {bottleneck.bottleneckTypeLabel.toUpperCase()}
                    </span>

                    {/* Confidence */}
                    <span className="border border-signal/30 bg-signal/10 px-1.5 py-[2px] font-mono text-[7.5px] tracking-[0.1em] text-signal">
                      {bottleneck.confidence}% CONFIDENCE
                    </span>

                    <span className="ml-auto font-mono text-[8px] tracking-[0.12em] text-ink-ghost">
                      PRESSURE SCORE {bottleneck.pressure} / 100
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-[17px] font-medium tracking-tight text-ink">
                    {bottleneck.facility.name}
                  </h2>

                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">
                    {bottleneck.observed}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="focus-ring grid h-6 w-6 place-items-center text-ink-faint transition-colors hover:text-ink"
                  aria-label="Close bottleneck detail"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-3.5 flex flex-wrap gap-1 border-t border-hair/60 pt-2.5">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<Compass size={11} />}
                  label="Overview & Root Cause"
                />
                <TabButton
                  active={activeTab === 'topology'}
                  onClick={() => setActiveTab('topology')}
                  icon={<Network size={11} />}
                  label="Upstream / Downstream"
                  count={bottleneck.upstreamSources.length + bottleneck.downstreamEffects.length}
                />
                <TabButton
                  active={activeTab === 'impact'}
                  onClick={() => setActiveTab('impact')}
                  icon={<Leaf size={11} />}
                  label="Environmental Impact"
                />
                <TabButton
                  active={activeTab === 'propagation'}
                  onClick={() => setActiveTab('propagation')}
                  icon={<Layers size={11} />}
                  label="Propagation & Timeline"
                />
                <TabButton
                  active={activeTab === 'fixes'}
                  onClick={() => setActiveTab('fixes')}
                  icon={<Sparkles size={11} />}
                  label="Interventions Preview"
                  count={bottleneck.fixes.length}
                />
              </div>
            </header>

            {/* ── BODY ──────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {/* TAB 1: OVERVIEW & ROOT CAUSE */}
              {activeTab === 'overview' && (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                  {/* Left Column: Why & Root Cause Chain */}
                  <div className="space-y-4">
                    {/* Why is this happening */}
                    <div className="border border-hair bg-white/[0.015] p-3.5">
                      <div className="flex items-center gap-1.5 pb-2">
                        <Activity size={12} className="text-signal" />
                        <h3 className="label-tech text-[8.5px]">WHY IS THIS HAPPENING?</h3>
                      </div>
                      <p className="border-l-2 pl-3 text-[12.5px] font-medium leading-relaxed text-ink" style={{ borderColor: color }}>
                        {bottleneck.whyExplanation}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between border-t border-hair/50 pt-2 font-mono text-[8px] text-ink-ghost">
                        <span>ROOT CAUSE CLASSIFICATION</span>
                        <span className="font-semibold text-ink-faint">{bottleneck.rootCause}</span>
                      </div>
                    </div>

                    {/* Root Cause Chain */}
                    <div className="border border-hair bg-white/[0.015] p-3.5">
                      <div className="flex items-center justify-between pb-2">
                        <h3 className="label-tech text-[8.5px]">DEPENDENCY CAUSE → EFFECT CASCADE</h3>
                        <ChainLegend />
                      </div>
                      <div className="mt-2">
                        <RootCauseChain steps={bottleneck.chain} onStepFocus={onStepFocus} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Evidence & Pressure Breakdown */}
                  <div className="space-y-4">
                    {/* Concrete Evidence */}
                    <div className="border border-hair bg-white/[0.015] p-3.5">
                      <div className="flex items-center justify-between border-b border-hair pb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-signal" />
                          <h3 className="label-tech text-[8.5px]">EMPIRICAL EVIDENCE ({bottleneck.confidence}% CONFIDENCE)</h3>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                        <EvidenceRow label="INCOMING WASTE" value={`${formatNumber(bottleneck.evidence.incomingT)} T/DAY`} />
                        <EvidenceRow label="RATED CAPACITY" value={`${formatNumber(bottleneck.evidence.capacityT)} T/DAY`} />
                        <EvidenceRow
                          label="CAPACITY GAP"
                          value={`${bottleneck.evidence.capacityGapT > 0 ? `+${formatNumber(bottleneck.evidence.capacityGapT)} T/D` : 'NONE'}`}
                          tone={bottleneck.evidence.capacityGapT > 0 ? 'critical' : 'signal'}
                        />
                        <EvidenceRow
                          label="BACKLOG TONNAGE"
                          value={`${formatNumber(bottleneck.evidence.backlogT)} T`}
                          tone={bottleneck.evidence.backlogT > 0 ? 'critical' : 'default'}
                        />
                        <EvidenceRow
                          label="AVERAGE WAITING"
                          value={`${bottleneck.evidence.waitingMin} MIN`}
                          tone={bottleneck.evidence.waitingMin >= 20 ? 'warn' : 'default'}
                        />
                        <EvidenceRow
                          label="PROCESSING DURATION"
                          value={`${bottleneck.evidence.processingTimeMin} MIN`}
                        />
                        <EvidenceRow
                          label="CONGESTED CORRIDORS"
                          value={`${bottleneck.evidence.congestedRoutesCount} LINK(S)`}
                          tone={bottleneck.evidence.congestedRoutesCount > 0 ? 'warn' : 'default'}
                        />
                        <EvidenceRow
                          label="DOWNSTREAM HEADROOM"
                          value={`${formatNumber(bottleneck.evidence.downstreamHeadroomT)} T/D`}
                          tone={bottleneck.evidence.downstreamHeadroomT < 100 ? 'warn' : 'signal'}
                        />
                      </div>
                    </div>

                    {/* Pressure Score Components */}
                    <div className="border border-hair bg-white/[0.015] p-3.5">
                      <div className="flex items-center justify-between border-b border-hair pb-2">
                        <h3 className="label-tech text-[8.5px]">PRESSURE SCORE BREAKDOWN ({bottleneck.pressure}/100)</h3>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        <PressureBar label="Capacity Overload" value={bottleneck.scoreBreakdown.capacityPressure} color="#E2595B" />
                        <PressureBar label="Backlog Accumulation" value={bottleneck.scoreBreakdown.backlogPressure} color="#E2595B" />
                        <PressureBar label="Queue & Waiting Time" value={bottleneck.scoreBreakdown.waitingPressure} color="#E5B44C" />
                        <PressureBar label="Transport Corridor Friction" value={bottleneck.scoreBreakdown.transportPressure} color="#6C9BFF" />
                        <PressureBar label="Upstream Inflow Pressure" value={bottleneck.scoreBreakdown.upstreamInflowPressure} color="#C084FC" />
                      </div>
                    </div>

                    {/* Early Warning Preview */}
                    <EarlyWarningCard warning={bottleneck.earlyWarning} facilityName={bottleneck.facility.shortName} />
                  </div>
                </div>
              )}

              {/* TAB 2: TOPOLOGY */}
              {activeTab === 'topology' && (
                <UpstreamDownstreamAnalysis
                  upstreamSources={bottleneck.upstreamSources}
                  downstreamEffects={bottleneck.downstreamEffects}
                  facilityName={bottleneck.facility.name}
                  facilityKind={bottleneck.facility.kind}
                />
              )}

              {/* TAB 3: ENVIRONMENTAL IMPACT */}
              {activeTab === 'impact' && (
                <div className="space-y-4">
                  <ImpactMetrics
                    data={[
                      {
                        label: 'WASTE DELAYED',
                        value: bottleneck.impact.delayedT,
                        unit: 'T/DAY',
                        tone: critical ? 'critical' : 'warn',
                        hint: 'Accumulating at reception hoppers or held behind congested approaches',
                      },
                      {
                        label: 'QUEUE DWELL TIME',
                        value: bottleneck.impact.queueMin,
                        unit: 'MIN / VEHICLE',
                        tone: bottleneck.impact.queueMin >= 20 ? 'warn' : 'default',
                        hint: 'Mean gate dwell before hauler discharge slot is allocated',
                      },
                      {
                        label: 'ADDITIONAL FLEET TRIPS',
                        value: bottleneck.impact.extraTripsPerDay,
                        unit: 'TRIPS / DAY',
                        tone: 'critical',
                        hint: 'Unproductive rework cycles caused by queue overflow & turnaround delays',
                      },
                      {
                        label: 'SURPLUS FUEL BURN',
                        value: bottleneck.impact.totalFuelLiters,
                        unit: 'L DIESEL-EQ / DAY',
                        tone: 'warn',
                        hint: 'Combustion during idling queues + rework diversion mileage',
                      },
                      {
                        label: 'TOTAL CO₂e FOOTPRINT',
                        value: bottleneck.impact.co2eKg,
                        unit: 'KG CO₂e / DAY',
                        tone: 'critical',
                        hint: 'Combined emissions from idling, rerouting and backlog leakage risk',
                      },
                      {
                        label: 'LANDFILL PRESSURE',
                        value: bottleneck.impact.landfillPressureT,
                        unit: 'T/DAY',
                        tone: 'critical',
                        hint: 'Excess volume risking unsegregated landfill disposal bypass',
                      },
                      {
                        label: 'POTENTIAL RECOVERABLE LOST',
                        value: bottleneck.impact.recoverableLostT,
                        unit: 'T/DAY',
                        tone: 'warn',
                        hint: 'High-value recyclable/organic fractions at risk of landfill contamination',
                      },
                      {
                        label: 'RECOVERY DIVERSION POTENTIAL',
                        value: bottleneck.impact.landfillDiversionPotentialT,
                        unit: 'T/DAY',
                        tone: 'signal',
                        hint: 'Estimated volume recoverable if plant throughput is restored to 85%',
                      },
                    ]}
                  />

                  {/* Impact narrative */}
                  <div className="border border-hair bg-white/[0.015] p-3.5">
                    <div className="flex items-center gap-1.5 pb-2">
                      <Leaf size={12} className="text-signal" />
                      <h4 className="label-tech text-[8.5px]">ENVIRONMENTAL ASSESSMENT SUMMARY</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-ink-faint">
                      Bottleneck friction at <strong className="text-ink">{bottleneck.facility.name}</strong> forces{' '}
                      <strong className="text-ink">+{bottleneck.impact.extraTripsPerDay} extra haulage trips/day</strong> and burns{' '}
                      <strong className="text-ink">+{bottleneck.impact.totalFuelLiters} L diesel-equivalenT/day</strong>, emitting{' '}
                      <strong className="text-critical">{formatNumber(bottleneck.impact.co2eKg)} kg CO₂e/day</strong>.
                      Additionally, <strong className="text-warn">{formatNumber(bottleneck.impact.recoverableLostT)} T/day</strong> of potentially recoverable material risks landfill disposal.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: PROPAGATION & TIMELINE */}
              {activeTab === 'propagation' && (
                <div className="space-y-5">
                  <BottleneckPropagation steps={bottleneck.propagation} />
                  <BottleneckTimeline timeline={bottleneck.timeline} />
                  <EarlyWarningCard warning={bottleneck.earlyWarning} facilityName={bottleneck.facility.shortName} />
                </div>
              )}

              {/* TAB 5: FIXES PREVIEW */}
              {activeTab === 'fixes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border border-signal/20 bg-signal/[0.02] p-3.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-signal" />
                        <h3 className="label-tech text-[8.5px] text-signal">RECOMMENDED INTERVENTIONS (SIMULATION READY)</h3>
                      </div>
                      <p className="mt-1 text-[10.5px] leading-relaxed text-ink-faint">
                        These targeted actions can eliminate capacity deficits and queue friction. Launch directly into the What-If Simulation Lab to simulate outcomes.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<FlaskConical size={11} />}
                      onClick={handleTestInSimulation}
                      className="shrink-0 font-mono text-[9px] tracking-wider"
                    >
                      TEST THIS BOTTLENECK
                    </Button>
                  </div>

                  <div className="grid gap-2.5 md:grid-cols-2">
                    {bottleneck.fixes.map((fix, i) => (
                      <motion.div
                        key={fix.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.06 }}
                        className="border border-hair bg-white/[0.015] p-3 transition-colors hover:bg-white/[0.035]"
                      >
                        <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink">
                          {fix.label}
                        </span>
                        <p className="mt-1 text-[10px] leading-relaxed text-ink-faint">{fix.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {fix.effects.map((eff) => (
                            <span
                              key={eff.label}
                              className={cn(
                                'border px-1.5 py-[1px] font-mono text-[7.5px] tracking-[0.1em]',
                                eff.direction === 'down'
                                  ? 'border-signal/30 text-signal'
                                  : 'border-cyan-400/30 text-cyan-400',
                              )}
                            >
                              {eff.direction === 'down' ? '↓' : '↑'} {eff.label}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER ────────────────────────────────────────── */}
            <footer className="flex shrink-0 items-center justify-between border-t border-hair px-5 py-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={mapMode ? 'primary' : 'outline'}
                  icon={<MapPin size={11} strokeWidth={1.75} />}
                  onClick={() => setMapMode((v) => !v)}
                >
                  {mapMode ? 'Map link highlight on' : 'Link highlight on map'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Crosshair size={11} strokeWidth={1.75} />}
                  onClick={() => onFocusOnMap(bottleneck.facilityId)}
                >
                  Focus on Twin
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<FlaskConical size={11} strokeWidth={1.75} />}
                  onClick={handleTestInSimulation}
                  className="font-mono text-[9px] tracking-wider"
                >
                  Test This Bottleneck
                </Button>
              </div>
              <span className="font-mono text-[8px] tracking-[0.12em] text-ink-ghost">
                ESC TO CLOSE
              </span>
            </footer>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'focus-ring flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[8.5px] tracking-[0.08em] transition-all',
        active
          ? 'border-signal/60 bg-signal/10 text-signal shadow-sm'
          : 'border-hair bg-white/[0.01] text-ink-faint hover:border-hair2 hover:text-ink',
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="rounded bg-white/[0.08] px-1 py-[0.5px] text-[7.5px] text-ink-dim">
          {count}
        </span>
      )}
    </button>
  )
}

function EvidenceRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warn' | 'critical' | 'signal'
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'signal'
          ? 'text-signal'
          : 'text-ink'

  return (
    <div className="border border-hair/50 bg-white/[0.01] p-2">
      <span className="label-tech block text-[7px] text-ink-ghost">{label}</span>
      <span className={cn('data-value mt-0.5 block text-[11px] leading-none', toneClass)}>
        {value}
      </span>
    </div>
  )
}

function PressureBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[8px]">
        <span className="text-ink-faint">{label}</span>
        <span className="data-value text-[9.5px] text-ink">{value} / 100</span>
      </div>
      <div className="mt-1 h-1 w-full bg-white/[0.05]">
        <div className="h-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  )
}
