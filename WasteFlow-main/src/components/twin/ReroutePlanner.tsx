/**
 * REROUTE PLANNER (Phase 6)
 *
 * Dedicated, professional operations-grade rerouting panel.
 * Connects directly to the live WasteFlow Nexus network data model,
 * valid alternatives, multi-route distribution, vehicle fleet assignments,
 * impact preview, and reversible network application.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Route as RouteIcon,
  X,
  Zap,
  RotateCcw,
  Play,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { AlternativeRoute, ReroutePlan } from '@/engine/rerouteEngine'

// ─── Micro helpers ────────────────────────────────────────────────────────────

function fmt1(n: number) {
  return Number.isFinite(n) ? n.toFixed(1) : '0.0'
}

function fmt0(n: number) {
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : '0'
}

function StatusPill({
  label,
  variant,
}: {
  label: string
  variant: 'blocked' | 'ok' | 'warn' | 'info' | 'cyan'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-[2px] font-mono text-[9px] font-medium tracking-[0.14em] border',
        variant === 'blocked' && 'border-critical/60 bg-critical/10 text-critical',
        variant === 'ok' && 'border-signal/50 bg-signal/10 text-signal',
        variant === 'cyan' && 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400',
        variant === 'warn' && 'border-amber-400/50 bg-amber-400/10 text-amber-400',
        variant === 'info' && 'border-white/20 bg-white/5 text-ink-dim',
      )}
    >
      {label}
    </span>
  )
}

function DataRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-[4.5px]">
      <span className="font-mono text-[9px] tracking-[0.1em] text-ink-ghost uppercase">{label}</span>
      <span className={cn('font-mono text-[10.5px] tabular-nums', dim ? 'text-ink-dim' : 'text-ink')}>
        {value}
      </span>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-3.5">
      <span className="font-mono text-[8.5px] font-semibold tracking-[0.18em] text-ink-dim uppercase">
        {children}
      </span>
      <span className="flex-1 h-px bg-white/10" />
    </div>
  )
}

function ImpactCompare({
  label,
  current,
  rerouted,
  unit,
  better,
}: {
  label: string
  current: number
  rerouted: number
  unit: string
  better?: 'lower' | 'higher'
}) {
  const improved = better === 'lower' ? rerouted < current : rerouted > current
  const changed = Math.abs(rerouted - current) > 0.01

  return (
    <div className="grid grid-cols-[110px_1fr_1fr] gap-x-2 items-center py-[5px] border-b border-white/[0.04] last:border-0">
      <span className="font-mono text-[8.5px] tracking-[0.08em] text-ink-ghost uppercase truncate">{label}</span>
      <span className="font-mono text-[10.5px] text-ink-dim tabular-nums text-right">
        {fmt1(current)} <span className="text-[8px] text-ink-ghost">{unit}</span>
      </span>
      <span
        className={cn(
          'font-mono text-[10.5px] font-medium tabular-nums text-right',
          !changed ? 'text-ink-dim' : improved ? 'text-signal' : 'text-amber-400',
        )}
      >
        {fmt1(rerouted)} <span className="text-[8px] text-ink-ghost">{unit}</span>
      </span>
    </div>
  )
}

// ─── Alternative route card ───────────────────────────────────────────────────

function AltCard({
  alt,
  selected,
  allocatedT,
  onToggle,
}: {
  alt: AlternativeRoute
  selected: boolean
  allocatedT: number
  onToggle: () => void
}) {
  const cap = alt.isSufficient ? 'SUFFICIENT' : 'PARTIAL'
  const capVariant = alt.isSufficient ? 'ok' : 'warn'

  return (
    <div
      onClick={onToggle}
      className={cn(
        'w-full text-left border transition-all duration-150 p-3 cursor-pointer select-none',
        selected
          ? 'border-signal/70 bg-[#0c1c18]'
          : 'border-white/10 bg-[#0E131A] hover:border-white/20 hover:bg-[#121922]',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'grid h-4 w-4 place-items-center border text-[9px] transition-colors',
              selected ? 'border-signal bg-signal text-black font-bold' : 'border-white/20 bg-black/40 text-transparent',
            )}
          >
            <Check size={10} strokeWidth={3} />
          </div>
          <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-ink">{alt.id}</span>
        </div>
        <StatusPill label={cap} variant={capVariant} />
      </div>

      <div className="font-mono text-[9px] text-ink-dim mb-1.5 flex items-center gap-1.5">
        <span className="text-signal/90 font-medium truncate">{alt.pathDescription}</span>
      </div>

      {alt.note && (
        <p className="font-mono text-[8.5px] text-ink-ghost mb-2.5 leading-relaxed">{alt.note}</p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/[0.06] pt-2">
        <DataRow label="Avail. Capacity" value={`${fmt0(alt.availableCapacityT)} T/DAY`} />
        <DataRow label="Can Absorb" value={`${fmt0(alt.absorbableT)} T/DAY`} />
        <DataRow label="+Distance" value={alt.additionalKm > 0 ? `+${fmt1(alt.additionalKm)} KM` : 'SAME'} dim />
        <DataRow label="+Travel Time" value={alt.additionalMin > 0 ? `+${alt.additionalMin} MIN` : 'SAME'} dim />
        <DataRow label="Est. Fuel" value={`+${fmt0(alt.estimatedFuelLiters)} L/DAY`} dim />
        <DataRow label="Est. CO₂" value={`+${fmt0(alt.estimatedCo2Kg)} KG/DAY`} dim />
      </div>

      {selected && allocatedT > 0 && (
        <div className="mt-2.5 flex items-center justify-between border-t border-signal/30 pt-2 font-mono text-[9.5px]">
          <span className="text-signal uppercase tracking-[0.1em]">Allocated Flow</span>
          <span className="text-signal font-bold tabular-nums">{fmt0(allocatedT)} T/DAY</span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/10 overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', selected ? 'bg-signal' : 'bg-white/30')}
            style={{ width: `${Math.min(100, alt.utilizationPct)}%` }}
          />
        </div>
        <span className="font-mono text-[8.5px] text-ink-ghost shrink-0">{fmt1(alt.utilizationPct)}% UTIL</span>
      </div>
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  plan,
  onConfirm,
  onCancel,
}: {
  plan: ReroutePlan
  onConfirm: () => void
  onCancel: () => void
}) {
  const addCo2 = Math.max(0, plan.impact.reroutedCo2Kg - plan.impact.currentCo2Kg)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-[2px] p-4">
      <div className="surface border border-hair2 w-[380px] p-5 shadow-2xl bg-[#0A0D12]">
        <div className="flex items-center gap-2.5 mb-3 border-b border-hair pb-2.5">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" strokeWidth={2} />
          <div>
            <h3 className="font-mono text-[12px] font-bold tracking-[0.14em] text-ink">APPLY REROUTE?</h3>
            <span className="font-mono text-[9px] text-ink-ghost uppercase">Operations Control Protocol</span>
          </div>
        </div>

        <div className="border border-hair bg-white/[0.02] p-3 mb-4 space-y-1.5">
          <DataRow label="Blocked corridor" value={plan.blockedRouteId} />
          <DataRow label="Affected volume" value={`${fmt0(plan.affectedFlowT)} T/DAY`} />
          <div className="py-1">
            <span className="block font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost uppercase mb-1">
              Diversion allocation
            </span>
            {plan.allocations.map((a) => (
              <div key={a.routeId} className="flex justify-between font-mono text-[10px] text-signal pl-2">
                <span>{a.routeId}</span>
                <span>{fmt0(a.allocatedT)} T/DAY ({fmt1(a.sharePct)}%)</span>
              </div>
            ))}
          </div>
          <DataRow label="Est. addl. CO₂" value={`+${fmt0(addCo2)} KG/DAY`} />
          <DataRow label="Vehicles reassigned" value={`${plan.vehiclesRequired} / ${plan.vehiclesAvailable} UNITS`} />
          {plan.unresolvedT > 0 && (
            <div className="flex justify-between font-mono text-[10px] text-critical font-bold border-t border-hair pt-1">
              <span>UNRESOLVED LOAD</span>
              <span>{fmt0(plan.unresolvedT)} T/DAY</span>
            </div>
          )}
        </div>

        <div className="flex gap-2.5">
          <Button variant="danger" size="sm" onClick={onConfirm} block>
            Confirm & Apply Reroute
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel} block>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ReroutePlanner() {
  const rerouteState = useTwinStore((s) => s.rerouteState)
  const closeReroute = useTwinStore((s) => s.closeReroute)
  const selectRerouteAlternatives = useTwinStore((s) => s.selectRerouteAlternatives)
  const simulateReroute = useTwinStore((s) => s.simulateReroute)
  const applyReroute = useTwinStore((s) => s.applyReroute)
  const restoreOriginalRoute = useTwinStore((s) => s.restoreOriginalRoute)
  const model = useTwinModel()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const { status, activeRouteId, plan } = rerouteState

  if (status === 'idle' || !activeRouteId) return null

  const blocked = model.snapshot.routes.find((r) => r.id === activeRouteId)
  if (!blocked) return null

  const fromFacility = model.derivedById[blocked.from]?.facility
  const toFacility = model.derivedById[blocked.to]?.facility

  function toggleAlt(id: string) {
    if (!plan) return
    const current = plan.selectedAlternativeIds
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
    selectRerouteAlternatives(next, model)
  }

  function getAllocatedT(routeId: string): number {
    return plan?.allocations.find((a) => a.routeId === routeId)?.allocatedT ?? 0
  }

  const isApplied = status === 'applied'
  const isSimulated = status === 'simulated' || isApplied
  const canSimulate = (plan?.selectedAlternativeIds.length ?? 0) > 0
  const canApply = (plan?.totalDivertedT ?? 0) > 0

  return (
    <AnimatePresence>
      <motion.div
        key="reroute-planner-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeReroute()
        }}
      >
        <motion.div
          initial={{ y: 20, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 15, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="surface ticks border-hair shadow-2xl relative flex w-[820px] max-h-[92vh] flex-col overflow-hidden bg-[#0A0D12]"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmOpen && plan && (
            <ConfirmDialog
              plan={plan}
              onConfirm={() => {
                applyReroute(model)
                setConfirmOpen(false)
              }}
              onCancel={() => setConfirmOpen(false)}
            />
          )}

          {/* ── Header ───────────────────────────────────────────── */}
          <header className="flex items-center justify-between border-b border-hair px-4 py-3 bg-[#0E131A]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RouteIcon size={13} strokeWidth={2} className="text-signal" />
                <span className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-ink">
                  REROUTE PLANNER
                </span>
                <StatusPill
                  label={isApplied ? 'APPLIED · ACTIVE' : isSimulated ? 'SIMULATION ACTIVE' : 'ANALYZING ALTERNATIVES'}
                  variant={isApplied ? 'ok' : isSimulated ? 'cyan' : 'info'}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-bold text-ink">{activeRouteId}</span>
                <span className="font-mono text-[11px] text-ink-ghost">·</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-dim">
                  {fromFacility?.shortName ?? blocked.from}
                </span>
                <ArrowRight size={12} className="text-ink-ghost" />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-dim">
                  {toFacility?.shortName ?? blocked.to}
                </span>
              </div>
            </div>
            <button
              onClick={closeReroute}
              className="focus-ring -mr-1 grid h-7 w-7 place-items-center text-ink-faint hover:text-ink transition-colors"
              aria-label="Close reroute planner"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Left column: Blocked Corridor + Alternatives ────── */}
            <div className="flex w-[400px] shrink-0 flex-col border-r border-hair overflow-y-auto px-4 py-3 bg-[#0A0D12]">
              {/* Blocked corridor facts */}
              <SectionHeader>Blocked Corridor Telemetry</SectionHeader>
              <div className="mb-2 flex items-center justify-between">
                <StatusPill label="STATUS: BLOCKED" variant="blocked" />
                <span className="font-mono text-[9px] text-critical/90 font-medium">
                  {plan?.cause ?? 'WATERLOGGING · SION CIRCLE'}
                </span>
              </div>

              <div className="grid grid-cols-3 border border-hair divide-x divide-y divide-hair bg-white/[0.015] mb-2">
                {[
                  ['AFFECTED FLOW', `${fmt0(blocked.volumeT)} T/DAY`],
                  ['HELD LOADS', `${fmt0(plan?.unresolvedT ?? blocked.volumeT)} T/DAY`],
                  ['DISTANCE', `${fmt1(blocked.distanceKm)} KM`],
                  ['AVG TRAVEL', `${blocked.travelTimeMin} MIN`],
                  ['VEHICLES', `${plan?.vehiclesAvailable ?? blocked.vehicleCount} UNITS`],
                  ['CAPACITY', `${fmt0(blocked.capacityT)} T/DAY`],
                ].map(([l, v]) => (
                  <div key={l} className="px-2.5 py-1.5">
                    <span className="block font-mono text-[7.5px] tracking-[0.12em] text-ink-ghost">{l}</span>
                    <span className="block font-mono text-[10.5px] text-ink mt-0.5 tabular-nums font-semibold">
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Alternatives Selection */}
              <SectionHeader>Candidate Alternative Routes</SectionHeader>
              {!plan || plan.alternatives.length === 0 ? (
                <div className="border border-critical/40 bg-critical/5 px-3 py-4 text-center my-2">
                  <AlertTriangle size={18} className="text-critical mx-auto mb-2" />
                  <p className="font-mono text-[10.5px] font-bold text-critical uppercase tracking-[0.12em]">
                    No Feasible Reroute
                  </p>
                  <p className="font-mono text-[9px] text-ink-ghost mt-1.5 leading-relaxed">
                    Available network capacity cannot absorb {fmt0(blocked.volumeT)} T/DAY of affected waste.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plan.alternatives.map((alt) => (
                    <AltCard
                      key={alt.id}
                      alt={alt}
                      selected={plan.selectedAlternativeIds.includes(alt.id)}
                      allocatedT={getAllocatedT(alt.id)}
                      onToggle={() => toggleAlt(alt.id)}
                    />
                  ))}
                </div>
              )}

              {/* Capacity validation */}
              {plan && (
                <>
                  <SectionHeader>Capacity Validation</SectionHeader>
                  <div className="border border-hair p-2.5 space-y-1 bg-white/[0.015]">
                    <DataRow label="Affected Flow" value={`${fmt0(plan.affectedFlowT)} T/DAY`} />
                    <DataRow label="Total Diverted" value={`${fmt0(plan.totalDivertedT)} T/DAY`} />
                    {plan.unresolvedT > 0 ? (
                      <div className="flex items-center justify-between py-1 border-t border-hair">
                        <span className="font-mono text-[9px] tracking-[0.1em] text-critical uppercase font-medium">
                          Unresolved Volume
                        </span>
                        <span className="font-mono text-[11px] text-critical font-bold">
                          {fmt0(plan.unresolvedT)} T/DAY
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1 border-t border-hair pt-1.5">
                        <CheckCircle2 size={12} className="text-signal" />
                        <span className="font-mono text-[9.5px] text-signal font-bold tracking-[0.1em]">
                          CAPACITY SUFFICIENT (100% ABSORBED)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle assignment */}
                  <SectionHeader>Vehicle & Trip Assignment</SectionHeader>
                  <div className="border border-hair p-2.5 space-y-1 bg-white/[0.015]">
                    <DataRow label="Affected Fleet" value={`${plan.vehiclesAvailable} UNITS`} />
                    <DataRow label="Fleet Required" value={`${plan.vehiclesRequired} UNITS`} />
                    <DataRow label="Additional Trips" value={`${plan.additionalTrips} /DAY`} />
                    {plan.fleetConstrained && (
                      <div className="flex items-center gap-1.5 mt-1 border-t border-hair pt-1 text-amber-400">
                        <AlertTriangle size={11} />
                        <span className="font-mono text-[9px] font-bold tracking-[0.1em]">
                          FLEET CAPACITY CONSTRAINT
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Right column: Distribution + Impact Preview + Actions ── */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3 bg-[#080B0F]">
              {/* Multi-route distribution */}
              {plan && plan.allocations.length > 0 && (
                <>
                  <SectionHeader>Multi-Route Flow Distribution</SectionHeader>
                  <div className="space-y-2 mb-2">
                    {plan.allocations.map((alloc) => {
                      return (
                        <div key={alloc.routeId} className="border border-hair p-2.5 bg-white/[0.015]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10.5px] font-semibold text-ink">
                              {alloc.routeId}
                            </span>
                            <span className="font-mono text-[10.5px] text-signal font-bold tabular-nums">
                              {fmt0(alloc.allocatedT)} T/DAY
                              <span className="ml-1.5 text-[8.5px] text-ink-ghost">({fmt1(alloc.sharePct)}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-signal" style={{ width: `${alloc.sharePct}%` }} />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between font-mono text-[8.5px] text-ink-ghost">
                            <span>{alloc.additionalTripsPerDay} trips/day</span>
                            <span>{alloc.vehiclesReassigned} vehicles</span>
                          </div>
                        </div>
                      )
                    })}

                    <div className="border border-signal/40 bg-signal/10 px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-[9.5px] font-bold text-signal tracking-[0.1em]">
                        TOTAL DIVERTED
                      </span>
                      <span className="font-mono text-[11px] font-bold text-signal">
                        {fmt0(plan.totalDivertedT)} / {fmt0(plan.affectedFlowT)} T/DAY
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Impact Preview */}
              {plan && (
                <>
                  <SectionHeader>Live Impact Preview (Current vs Rerouted)</SectionHeader>
                  <div className="border border-hair bg-white/[0.015] mb-3">
                    <div className="grid grid-cols-[110px_1fr_1fr] border-b border-hair px-3 py-1.5 bg-white/[0.03]">
                      <span className="font-mono text-[8px] text-ink-ghost uppercase">METRIC</span>
                      <span className="font-mono text-[8px] text-ink-ghost text-right uppercase">CURRENT</span>
                      <span
                        className={cn(
                          'font-mono text-[8px] text-right uppercase font-bold',
                          isApplied ? 'text-signal' : isSimulated ? 'text-cyan-400' : 'text-ink-ghost',
                        )}
                      >
                        {isApplied ? 'APPLIED' : isSimulated ? 'SIMULATED' : 'PROJECTED'}
                      </span>
                    </div>
                    <div className="px-3 py-1">
                      <ImpactCompare
                        label="Waste Delivered"
                        current={0}
                        rerouted={plan.impact.wasteDeliveredT}
                        unit="T/DAY"
                        better="higher"
                      />
                      <ImpactCompare
                        label="Waste Held"
                        current={plan.affectedFlowT}
                        rerouted={plan.impact.wasteHeldT}
                        unit="T/DAY"
                        better="lower"
                      />
                      <ImpactCompare
                        label="Transit Dist."
                        current={plan.impact.currentDistanceKm}
                        rerouted={plan.impact.reroutedDistanceKm}
                        unit="KM"
                        better="lower"
                      />
                      <ImpactCompare
                        label="Transit Time"
                        current={plan.impact.currentTravelMin}
                        rerouted={plan.impact.reroutedTravelMin}
                        unit="MIN"
                        better="lower"
                      />
                      <ImpactCompare
                        label="CO₂e Footprint"
                        current={plan.impact.currentCo2Kg}
                        rerouted={plan.impact.reroutedCo2Kg}
                        unit="KG/DAY"
                        better="lower"
                      />
                      <ImpactCompare
                        label="Fuel Burn"
                        current={plan.impact.currentFuelLiters}
                        rerouted={plan.impact.reroutedFuelLiters}
                        unit="L/DAY"
                        better="lower"
                      />
                      <ImpactCompare
                        label="Dest. Intake"
                        current={0}
                        rerouted={plan.impact.destinationUtilizationPct}
                        unit="%"
                        better="lower"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Map visual explanation banner */}
              {isSimulated && !isApplied && (
                <div className="border border-cyan-400/40 bg-cyan-400/10 p-3 mb-3 flex items-start gap-2.5">
                  <Zap size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] font-bold text-cyan-400 tracking-[0.12em]">
                      SIMULATION ACTIVE ON DIGITAL TWIN
                    </p>
                    <p className="font-mono text-[9px] text-ink-ghost mt-0.5 leading-relaxed">
                      {activeRouteId} remains visibly BLOCKED in red. Alternative route
                      {plan!.allocations.length > 1 ? 's are' : ' is'} highlighted in cyan with active flow particles and diversion labels.
                    </p>
                  </div>
                </div>
              )}

              {isApplied && (
                <div className="border border-signal/50 bg-signal/10 p-3 mb-3 flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-signal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-mono text-[10.5px] font-bold text-signal tracking-[0.12em]">
                      DIVERSION COMMITTED TO LIVE NETWORK
                    </p>
                    <p className="font-mono text-[9px] text-ink-ghost mt-0.5 leading-relaxed">
                      {fmt0(plan!.totalDivertedT)} T/DAY diverted. Fleet assignments and downstream intakes recalculated across the twin.
                    </p>
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1 min-h-[12px]" />

              {/* Action footer */}
              <div className="border-t border-hair pt-3 space-y-2 bg-[#080B0F]">
                {!isApplied ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canSimulate}
                      icon={<Play size={11} strokeWidth={2} />}
                      onClick={() => simulateReroute(model)}
                    >
                      {isSimulated ? 'Re-simulate Reroute' : 'Simulate Reroute'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canApply}
                      icon={<ChevronRight size={12} strokeWidth={2} />}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Apply Reroute
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    block
                    icon={<RotateCcw size={11} strokeWidth={2} />}
                    onClick={restoreOriginalRoute}
                  >
                    Restore Original Route
                  </Button>
                )}

                <Button variant="ghost" size="sm" block onClick={closeReroute}>
                  Close Planner
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
