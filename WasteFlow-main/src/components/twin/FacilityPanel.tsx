import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Lock, Truck, TriangleAlert, X } from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useMediaQuery } from '@/hooks'
import { dailySeries } from '@/data/series'
import { FACILITY_KIND_LABEL, SUBSTREAM_LABEL, UTILIZATION_THRESHOLDS } from '@/config/network'
import { cn, formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX, STREAM_COLOR_HEX } from '@/twin/palette'
import type { FacilityDerived } from '@/data/metrics'
import type { Facility, SubstreamId } from '@/types'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { LabeledValue } from './LabeledValue'
import { useNodeScreenPosition, useTwinEngine } from './TwinContext'

const PANEL_W = 348
const PANEL_H_FALLBACK = 560

const STATE_LABEL: Record<FacilityDerived['state'], string> = {
  normal: 'NORMAL',
  warning: 'WARNING',
  critical: 'CRITICAL',
}

/**
 * FACILITY PANEL — the inspection instrument.
 *
 * Rather than a modal, it grows out of the node it describes: positioned against
 * the node's live screen projection, connected by a leader, and scaling from the
 * node's side. Pan or zoom the twin and it stays attached.
 *
 * Collection zones and process facilities share one panel shell: a zone reports
 * its service record (generated / collected / uncollected / rate), a facility
 * reports its plant record (input / output / queue / processing time). Both
 * report their utilisation and state from the same derived model.
 */
export function FacilityPanel() {
  const selectedId = useTwinStore((s) => s.selectedId)
  const select = useTwinStore((s) => s.select)
  const model = useTwinModel()
  const engine = useTwinEngine()
  const anchor = useNodeScreenPosition(selectedId)
  const viewport = engine?.getViewport() ?? { w: 1440, h: 800 }
  const isNarrow = useMediaQuery('(max-width: 1023px)')
  const ref = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState(PANEL_H_FALLBACK)

  const measureRef = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el
      if (!el) return
      const h = el.offsetHeight
      if (h && Math.abs(h - height) > 1) setHeight(h)
    },
    [height],
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight
      if (h && Math.abs(h - height) > 1) setHeight(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [selectedId, height])

  useEffect(() => {
    setHeight(PANEL_H_FALLBACK)
  }, [selectedId])

  if (!selectedId || !anchor) return null
  const derived = model.derivedById[selectedId]
  if (!derived) return null

  const body = (
    <PanelBody
      ref={measureRef}
      derived={derived}
      onClose={() => select(null)}
      onFocus={() => engine?.focusNode(derived.facility.id)}
    />
  )

  if (isNarrow) {
    return (
      <AnimatePresence>
        <motion.div
          key={selectedId}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 max-h-[56vh]"
        >
          {body}
        </motion.div>
      </AnimatePresence>
    )
  }

  const placeRight = anchor.x + 46 + PANEL_W < viewport.w - 24
  const left = placeRight ? anchor.x + 46 : Math.max(12, anchor.x - 46 - PANEL_W)
  const top = Math.max(56, Math.min(anchor.y - height * 0.42, viewport.h - height - 18))
  const edgeX = placeRight ? left - 14 : left + PANEL_W + 14
  const edgeY = Math.max(top + 22, Math.min(anchor.y, top + height - 22))

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full">
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <path
            d={`M ${anchor.x} ${anchor.y} L ${placeRight ? anchor.x + 22 : anchor.x - 22} ${anchor.y} L ${edgeX} ${edgeY} L ${placeRight ? left : left + PANEL_W} ${edgeY}`}
            fill="none"
            stroke="rgba(79,227,193,0.45)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <circle cx={anchor.x} cy={anchor.y} r={3} fill="#4FE3C1" />
          <circle cx={anchor.x} cy={anchor.y} r={7} fill="none" stroke="rgba(79,227,193,0.35)" strokeWidth={1} />
        </motion.g>
      </svg>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, scale: 0.94, x: placeRight ? -14 : 14 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.97, x: placeRight ? -8 : 8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ left, top, width: PANEL_W, transformOrigin: placeRight ? 'left center' : 'right center' }}
          className="pointer-events-auto absolute z-30"
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

interface PanelBodyProps {
  derived: FacilityDerived
  onClose: () => void
  onFocus: () => void
}

const PanelBody = forwardRef<HTMLDivElement, PanelBodyProps>(function PanelBody({ derived, onClose, onFocus }, ref) {
  const facility: Facility = derived.facility
  const stateColor = NODE_STATE_COLOR_HEX[derived.state]
  const isZone = facility.kind === 'zone'
  const utilization = derived.utilizationPct
  const series = dailySeries(facility.id, isZone ? derived.inflow : facility.input, 16)
  const maxSeries = Math.max(...series, 1)
  const mix = Object.entries(facility.mix) as [SubstreamId, number][]
  const totalMix = mix.reduce((s, [, v]) => s + v, 0) || 1
  const collection = derived.collection

  return (
    <div
      ref={ref}
      className="surface ticks border-hair shadow-panel atmos-noise flex max-h-[min(78vh,660px)] flex-col"
    >
      <header className="relative border-b border-hair px-3.5 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink-faint">{facility.code}</span>
          <span className="h-px flex-1 bg-hair" />
          <span className="label-tech text-[9px]">{FACILITY_KIND_LABEL[facility.kind]}</span>
          <button
            onClick={onClose}
            className="focus-ring -mr-1 grid h-5 w-5 place-items-center text-ink-faint transition-colors hover:text-ink"
            aria-label="Close facility panel"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>

        <h2 className="mt-2 text-[15px] font-medium leading-tight tracking-tight text-ink">{facility.name}</h2>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em]"
            style={{ borderColor: `${stateColor}55`, color: stateColor, background: `${stateColor}12` }}
          >
            <span className="h-1.5 w-1.5 animate-status-pulse" style={{ background: stateColor }} />
            {STATE_LABEL[derived.state]}
          </span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-ink-ghost">
            UPTIME {facility.uptimePct.toFixed(1)}% · CREW {facility.crew}
          </span>
        </div>

        {derived.state !== 'normal' && (
          <div
            className="mt-2.5 flex items-start gap-2 border px-2 py-1.5"
            style={{ borderColor: `${stateColor}44`, background: `${stateColor}0F` }}
          >
            <TriangleAlert size={12} className="mt-[1px] shrink-0" style={{ color: stateColor }} strokeWidth={1.75} />
            <p className="font-mono text-[9.5px] leading-relaxed tracking-[0.06em]" style={{ color: stateColor }}>
              {derived.state === 'critical' ? 'ABOVE 90% CAPACITY' : `ABOVE ${UTILIZATION_THRESHOLDS.warning}% CAPACITY`} —{' '}
              {facility.waiting} min queue{isZone ? ' risk' : ''}. Detection and root-cause analysis arrive in Phase 4.
            </p>
          </div>
        )}
      </header>

      {/* Zone: service record. Facility: plant record. */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.055] border-b border-hair">
        {isZone && collection ? (
          <>
            <LabeledValue label="GENERATED" value={formatNumber(collection.generatedT)} unit="T/DAY" />
            <LabeledValue label="COLLECTED" value={formatNumber(collection.collectedT)} unit="T/DAY" />
            <LabeledValue
              label="UNCOLLECTED"
              value={formatNumber(collection.uncollectedT)}
              unit="T/DAY"
              tone={collection.uncollectedPct > 8 ? 'warn' : 'default'}
            />
          </>
        ) : (
          <>
            <LabeledValue label="INCOMING" value={formatNumber(derived.inflow)} unit="T/DAY" />
            <LabeledValue
              label="PROCESSED"
              value={formatNumber(derived.processedT)}
              unit="T/DAY"
            />
            <LabeledValue
              label={derived.overCapacity ? 'BACKLOG' : 'WAITING'}
              value={derived.overCapacity ? formatNumber(derived.backlogT) : String(facility.waiting)}
              unit={derived.overCapacity ? 'T/DAY' : 'MIN'}
              tone={derived.overCapacity || facility.waiting >= 20 ? 'critical' : facility.waiting >= 12 ? 'warn' : 'default'}
            />
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="label-tech text-[9px]">{isZone ? 'COLLECTION RATE' : 'UTILIZATION'}</span>
            <span className="data-value text-[12px] text-ink">
              {utilization.toFixed(1)}%
              <span className="ml-1.5 font-mono text-[9px] text-ink-faint">
                OF {formatNumber(facility.capacity)} T/DAY
              </span>
            </span>
          </div>
          <Meter
            value={utilization}
            tone={derived.state === 'critical' ? 'critical' : derived.state === 'warning' ? 'warn' : 'signal'}
            thresholds={isZone ? [] : [UTILIZATION_THRESHOLDS.warning, UTILIZATION_THRESHOLDS.critical]}
            className="mt-2"
          />
          <div className="mt-1.5 flex justify-between font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            <span>{isZone ? `SERVICE GAP ${collection ? collection.uncollectedT : 0} T/DAY` : derived.overCapacity ? `BACKLOG ${formatNumber(derived.backlogT)} T/DAY` : `HEADROOM ${formatNumber(derived.headroomT)} T/DAY`}</span>
            <span>{isZone ? 'GENERATION = CAPACITY' : `PROCESS ${facility.processingTimeMin} MIN`}</span>
          </div>
        </div>

        {!isZone && derived.overCapacity && (
          <div className="border border-critical/35 bg-critical/[0.08] px-2 py-1.5">
            <p className="font-mono text-[9.5px] leading-relaxed tracking-[0.06em] text-critical/90">
              OVER CAPACITY — intake {formatNumber(derived.inflow)} T/day exceeds the{' '}
              {formatNumber(facility.capacity)} T/day processing rate; {formatNumber(derived.backlogT)} T/day accumulates.
            </p>
          </div>
        )}

        {!isZone && derived.heldAtSourceT > 0 && (
          <div className="border border-warn/35 bg-warn/[0.08] px-2 py-1.5">
            <p className="font-mono text-[9.5px] leading-relaxed tracking-[0.06em] text-warn/90">
              SUPPLY GAP — scheduled corridors commit {formatNumber(Math.max(0, derived.outflow - derived.inflow))} T/day more
              than intake; the yard buffer covers it.
            </p>
          </div>
        )}

        {isZone && (derived.heldAtSourceT ?? 0) > 0 && (
          <div className="border border-critical/35 bg-critical/[0.08] px-2 py-1.5">
            <p className="font-mono text-[9.5px] leading-relaxed tracking-[0.06em] text-critical/90">
              HELD AT ZONE — {formatNumber(derived.heldAtSourceT)} T/day stranded: its outbound
              corridor is closed. Collected but not moving.
            </p>
          </div>
        )}

        {isZone && collection && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border border-hair bg-white/[0.015] px-3 py-2.5">
            <Telemetry label="FREQUENCY" value={facility.collection?.frequency ?? '—'} wide />
            <Telemetry label="ASSIGNED VEHICLES" value={`${collection.vehicleCount} UNITS`} />
            <Telemetry label="AVG CAPACITY" value={`${collection.avgVehicleCapacityT} T`} />
            <Telemetry label="TONNES / VEHICLE" value={`${collection.perVehicleT.toFixed(1)} T`} />
            <Telemetry label="ROUND LENGTH" value={`${facility.collection?.routeLengthMin ?? 0} MIN`} />
            <Telemetry label="COLLECTION TRIPS/DAY" value={`${derived.tripsPerDay ?? '—'}`} />
            <Telemetry label="FUEL / DAY" value={`${formatNumber(derived.fuelLiters ?? 0)} L`} />
          </div>
        )}

        <div>
          <div className="flex items-baseline justify-between">
            <span className="label-tech text-[9px]">{isZone ? '24H COLLECTED' : '24H THROUGHPUT'}</span>
            <span className="font-mono text-[9px] tracking-[0.1em] text-ink-faint">PEAK {formatNumber(maxSeries)} T</span>
          </div>
          <div className="mt-1.5 flex h-9 items-end gap-[2px]">
            {series.map((v, i) => (
              <motion.span
                key={i}
                initial={{ height: 2, opacity: 0 }}
                animate={{ height: `${Math.max(6, (v / maxSeries) * 100)}%`, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.02 * i, ease: [0.22, 1, 0.36, 1] }}
                className={cn('flex-1', i === series.length - 1 ? 'bg-signal/80' : 'bg-white/[0.14] hover:bg-white/25')}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="label-tech text-[9px]">{isZone ? 'GENERATION MIX' : 'MATERIAL MIX'}</span>
          <div className="mt-2 flex h-1.5 w-full overflow-hidden">
            {mix.map(([key, value]) => (
              <span key={key} style={{ width: `${(value / totalMix) * 100}%`, background: `${STREAM_COLOR_HEX[key]}cc` }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {mix.map(([key, value]) => (
              <span key={key} className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] text-ink-dim">
                <span className="h-1.5 w-1.5" style={{ background: STREAM_COLOR_HEX[key] }} />
                {SUBSTREAM_LABEL[key]} {Math.round((value / totalMix) * 100)}%
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair pt-3">
          <Telemetry label="INBOUND LINKS" value={`${derived.inboundRouteIds.length}`} />
          <Telemetry label="OUTBOUND LINKS" value={`${derived.outboundRouteIds.length}`} />
          {!isZone && <Telemetry label="PROCESSING TIME" value={`${facility.processingTimeMin} MIN`} />}
          {!isZone && <Telemetry label="ELEVATION" value={`${facility.elevation} M`} />}
          {!isZone && <Telemetry label="OUTGOING" value={`${formatNumber(derived.outflow)} T/DAY`} />}
          {!isZone && facility.kind === 'recovery' && <Telemetry label="PRODUCT EXIT" value={`${formatNumber(Math.max(0, derived.processedT - derived.outflow))} T/DAY`} />}
          <Telemetry label="COMMISSIONED" value={facility.commissioned} />
          <Telemetry label="DAILY CO₂e" value={`${Math.round(derived.co2eKg).toLocaleString('en-US')} KG`} />
          {!isZone && <Telemetry label="NETWORK SHARE" value={`${(derived.throughputShare * 100).toFixed(1)}%`} />}
          <Telemetry label="HEALTH SCORE" value={`${derived.healthScore.toFixed(0)} / 100`} />
        </div>

        <p className="border-l border-hair2 pl-2.5 text-[11px] leading-relaxed text-ink-dim">{facility.note}</p>

        <div className="flex flex-wrap gap-1">
          {facility.tags.map((tag) => (
            <span key={tag} className="border border-hair px-1.5 py-[2px] font-mono text-[8.5px] tracking-[0.12em] text-ink-ghost">
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-hair px-3 py-2.5">
        <Button size="sm" variant="primary" icon={<Crosshair size={11} strokeWidth={1.75} />} onClick={onFocus}>
          Focus
        </Button>
        <span className="flex items-center gap-1.5 border border-hair px-2 py-[5px] font-mono text-[9px] tracking-[0.12em] text-ink-ghost">
          {isZone ? <Truck size={9.5} strokeWidth={1.75} /> : <Lock size={9.5} strokeWidth={1.75} />}
          {isZone ? 'ROUTE PLAN · PHASE 6' : 'ROOT CAUSE · PHASE 4'}
        </span>
      </footer>
    </div>
  )
})

function Telemetry({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-2', wide && 'col-span-2')}>
      <span className="label-tech text-[8.5px]">{label}</span>
      <span className="data-value text-[10.5px] text-ink-dim">{value}</span>
    </div>
  )
}
