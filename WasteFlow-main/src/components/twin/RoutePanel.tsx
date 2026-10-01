import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Crosshair, Route as RouteIcon, X } from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useMediaQuery } from '@/hooks'
import { dailySeries } from '@/data/series'
import { EMISSION_FACTORS, ROUTE_STATUS_LABEL, SUBSTREAM_LABEL, VEHICLE_KIND_LABEL } from '@/config/network'
import { cn, formatNumber } from '@/lib/utils'
import { STREAM_COLOR_HEX } from '@/twin/palette'
import { ROUTE_STATUS_COLOR_HEX, FLOW_TIER_ALPHA } from '@/twin/palette'
import type { RouteFlow } from '@/engine/wasteFlowEngine'
import type { TransportResult } from '@/engine/types'
import type { Route } from '@/types'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { useRouteScreenPosition, useTwinEngine } from './TwinContext'

const PANEL_W = 344
const PANEL_H_FALLBACK = 520

const TIER_LABEL = { low: 'LOW FLOW', medium: 'MEDIUM FLOW', high: 'HIGH FLOW' } as const

/**
 * ROUTE PANEL — flow inspection for a single corridor.
 *
 * Every figure comes from the route record and the flow model: distance, travel
 * time, tonnage, capacity, assigned fleet, utilisation, state, fuel mix and the
 * emissions that follow from it. Nothing here is recomputed by hand.
 */
export function RoutePanel() {
  const selectedRouteId = useTwinStore((s) => s.selectedRouteId)
  const selectRoute = useTwinStore((s) => s.selectRoute)
  const openReroute = useTwinStore((s) => s.openReroute)
  const model = useTwinModel()
  const transport = selectedRouteId ? model.engine.transport[selectedRouteId] : undefined
  const engine = useTwinEngine()
  const anchor = useRouteScreenPosition(selectedRouteId)
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
  }, [selectedRouteId, height])

  useEffect(() => {
    setHeight(PANEL_H_FALLBACK)
  }, [selectedRouteId])

  if (!selectedRouteId || !anchor) return null
  const flow = model.routeDerivedById[selectedRouteId]
  if (!flow) return null

  const route = flow.route
  const from = model.derivedById[route.from]?.facility
  const to = model.derivedById[route.to]?.facility
  if (!from || !to) return null

  const assigned = model.snapshot.vehicles.filter((v) => v.routeId === route.id)
  const fleetLabel = assigned.length
    ? `${VEHICLE_KIND_LABEL[assigned[0].kind]}${assigned.length > 1 ? ` +${assigned.length - 1}` : ''}`
    : `${route.vehicleCount} UNITS`

  const body = (
    <RouteBody
      ref={measureRef}
      route={route}
      flow={flow}
      fromName={from.shortName}
      toName={to.shortName}
      fleetLabel={fleetLabel}
      transport={transport!}
      onClose={() => selectRoute(null)}
      onFocus={() => engine?.focusRoute(route.id)}
      onReroute={() => openReroute(route.id, model)}
    />
  )

  if (isNarrow) {
    return (
      <AnimatePresence>
        <motion.div
          key={selectedRouteId}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 max-h-[58vh]"
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
            d={`M ${anchor.x} ${anchor.y} L ${placeRight ? anchor.x + 24 : anchor.x - 24} ${anchor.y} L ${edgeX} ${edgeY} L ${placeRight ? left : left + PANEL_W} ${edgeY}`}
            fill="none"
            stroke="rgba(108,155,255,0.5)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <circle cx={anchor.x} cy={anchor.y} r={3} fill="#6C9BFF" />
          <circle cx={anchor.x} cy={anchor.y} r={7} fill="none" stroke="rgba(108,155,255,0.35)" strokeWidth={1} />
        </motion.g>
      </svg>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={selectedRouteId}
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

interface RouteBodyProps {
  route: Route
  flow: RouteFlow
  fromName: string
  toName: string
  /** Tracked units serving this corridor, labelled for the panel. */
  fleetLabel: string
  /** Transport-engine output for this corridor (trips, fuel, held). */
  transport: TransportResult
  onClose: () => void
  onFocus: () => void
  onReroute: () => void
}

const RouteBody = forwardRef<HTMLDivElement, RouteBodyProps>(function RouteBody(
  { route, flow, fromName, toName, fleetLabel, transport, onClose, onFocus, onReroute },
  ref,
) {
  const statusColor = ROUTE_STATUS_COLOR_HEX[flow.status]
  const series = dailySeries(route.id, route.volumeT, 16)
  const maxSeries = Math.max(...series, 1)
  const blocked = flow.status === 'blocked'

  // Flow strip cadence reflects the data: more, faster dashes for bigger flows.
  const stripDuration = Math.max(0.55, 2.6 - flow.magnitude * 1.9) * (blocked ? 12 : 1)

  return (
    <div
      ref={ref}
      className="surface ticks border-hair shadow-panel atmos-noise flex max-h-[min(78vh,620px)] flex-col"
    >
      <header className="relative border-b border-hair px-3.5 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <RouteIcon size={12} strokeWidth={1.75} className="text-flow/80" />
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink-faint">{route.id}</span>
          <span className="h-px flex-1 bg-hair" />
          <span className="label-tech text-[9px]">ROUTE</span>
          <button
            onClick={onClose}
            className="focus-ring -mr-1 grid h-5 w-5 place-items-center text-ink-faint transition-colors hover:text-ink"
            aria-label="Close route panel"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[13px] uppercase tracking-[0.1em] text-ink">{fromName}</span>
          <ArrowRight size={13} strokeWidth={1.75} className="text-ink-ghost" />
          <span className="font-mono text-[13px] uppercase tracking-[0.1em] text-ink">{toName}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em]"
            style={{ borderColor: `${statusColor}55`, color: statusColor, background: `${statusColor}12` }}
          >
            <span className="h-1.5 w-1.5 animate-status-pulse" style={{ background: statusColor }} />
            {ROUTE_STATUS_LABEL[flow.status]}
          </span>
          <span className="font-mono text-[9px] tracking-[0.12em] text-ink-ghost">
            {route.label} · {SUBSTREAM_LABEL[route.substream]}
          </span>
        </div>

        {blocked && (
          <div className="mt-2.5 border border-critical/35 bg-critical/[0.08] px-2 py-1.5">
            <p className="font-mono text-[9.5px] leading-relaxed tracking-[0.06em] text-critical/90">
              CORRIDOR CLOSED — flow on this link is stopped. Use Reroute Planner (Phase 6) to model and execute real-time diversions.
            </p>
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="label-tech block text-[8.5px]">WASTE FLOW</span>
            <span className="data-value mt-1 block text-[24px] leading-none text-ink">
              {formatNumber(route.volumeT)}
              <span className="ml-1.5 font-mono text-[10px] tracking-[0.1em] text-ink-faint">T/DAY</span>
            </span>
          </div>
          <span
            className="font-mono text-[9px] tracking-[0.14em]"
            style={{ color: flow.tier === 'high' ? '#4FE3C1' : flow.tier === 'medium' ? '#6C9BFF' : '#8B939E' }}
          >
            {TIER_LABEL[flow.tier]}
          </span>
        </div>

        {/* Flow strip: cadence and opacity are the flow model, drawn compactly */}
        <div
          className="h-[7px] w-full overflow-hidden border border-hair"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            backgroundImage: `repeating-linear-gradient(90deg, ${
              blocked ? '#E2595B' : STREAM_COLOR_HEX[route.substream]
            } 0 12px, transparent 12px 26px)`,
            backgroundSize: '26px 100%',
            opacity: blocked ? 0.45 : 0.35 + FLOW_TIER_ALPHA[flow.tier] * 0.55,
            animation: `route-flow ${stripDuration}s linear infinite`,
          }}
        />

        <div className="grid grid-cols-3 divide-x divide-white/[0.055] border border-hair">
          <Reading label="DISTANCE" value={route.distanceKm.toFixed(1)} unit="KM" />
          <Reading label="AVG TRAVEL" value={String(route.travelTimeMin)} unit="MIN" />
          <Reading label="VEHICLES" value={String(route.vehicleCount)} unit="UNITS" />
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/[0.055] border border-hair">
          <Reading label="TRIPS" value={String(transport?.tripsPerDay ?? '—')} unit="/DAY" />
          <Reading
            label="FUEL"
            value={blocked ? 'HELD' : formatNumber(transport?.fuelLiters ?? 0)}
            unit={blocked ? '' : 'L/DAY'}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="label-tech text-[9px]">UTILIZATION</span>
            <span className="data-value text-[12px] text-ink">
              {flow.utilizationPct.toFixed(1)}%
              <span className="ml-1.5 font-mono text-[9px] text-ink-faint">
                OF {formatNumber(route.capacityT)} T/DAY
              </span>
            </span>
          </div>
          <Meter
            value={flow.utilizationPct}
            tone={flow.status === 'blocked' ? 'critical' : flow.status === 'congested' ? 'warn' : 'flow'}
            thresholds={[70, 85]}
            className="mt-2"
          />
          <div className="mt-2 flex items-center justify-between font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            <span>LOAD {formatNumber(route.volumeT)} T</span>
            <span>HEADROOM {formatNumber(Math.max(0, route.capacityT - route.volumeT))} T</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="label-tech text-[9px]">24H FLOW PROFILE</span>
            <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">PEAK {formatNumber(maxSeries)} T</span>
          </div>
          <div className="mt-1.5 flex h-8 items-end gap-[2px]">
            {series.map((v, i) => (
              <motion.span
                key={i}
                initial={{ height: 2, opacity: 0 }}
                animate={{ height: `${Math.max(6, (v / maxSeries) * 100)}%`, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.02 * i, ease: [0.22, 1, 0.36, 1] }}
                className={cn('flex-1', i === series.length - 1 ? 'bg-flow/80' : 'bg-white/[0.13] hover:bg-white/25')}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="label-tech text-[9px]">ASSIGNED FLEET · DRIVETRAIN</span>
          <div className="mt-2 flex h-1.5 w-full overflow-hidden">
            {Object.entries(route.fuelMix).map(([fuel, share]) => (
              <span
                key={fuel}
                style={{
                  width: `${share * 100}%`,
                  background:
                    fuel === 'electric' ? '#4FE3C1' : fuel === 'cng' ? '#6C9BFF' : fuel === 'hybrid' ? '#5FD4E3' : '#8B939E',
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(route.fuelMix).map(([fuel, share]) => (
              <span key={fuel} className="font-mono text-[9px] tracking-[0.1em] text-ink-dim">
                {fuel.toUpperCase()} {Math.round(share * 100)}%
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair pt-3">
          <Telemetry label="CO₂e / DAY" value={`${formatNumber(flow.emissionsKg)} KG`} />
          <Telemetry label="FACTOR" value={`${flow.emissionFactor.toFixed(3)} KG/T·KM`} />
          <Telemetry label="LOAD FACTOR" value={`${flow.loadFactor.toFixed(2)}`} />
          <Telemetry label="PARTICLES" value={`${flow.particles} MARKERS`} />
          <Telemetry label="DAILY T·KM" value={formatNumber(route.volumeT * route.distanceKm)} />
          <Telemetry label="TRACKED FLEET" value={fleetLabel} />
        </div>

        {route.note && <p className="border-l border-hair2 pl-2.5 text-[11px] leading-relaxed text-ink-dim">{route.note}</p>}

        <div className="flex items-center gap-2 font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
          <span>CARBON INTENSITY {EMISSION_FACTORS.transport.diesel.toFixed(2)} KG/T·KM DIESEL BASELINE</span>
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-hair px-3 py-2.5">
        <Button size="sm" variant="primary" icon={<Crosshair size={11} strokeWidth={1.75} />} onClick={onFocus}>
          Focus corridor
        </Button>
        <button
          onClick={onReroute}
          className={cn(
            'flex items-center gap-1.5 border px-2.5 py-[5px] font-mono text-[9px] font-semibold tracking-[0.12em] transition-colors duration-150',
            blocked
              ? 'border-signal/70 bg-signal/15 text-signal hover:bg-signal/25 hover:border-signal cursor-pointer shadow-sm'
              : 'border-hair text-ink-ghost cursor-pointer hover:border-white/25 hover:text-ink-dim',
          )}
        >
          <RouteIcon size={9.5} strokeWidth={2} />
          REROUTE · PHASE 6
        </button>
      </footer>
    </div>
  )
})

function Reading({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-3 py-2.5">
      <span className="label-tech block text-[8px]">{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="data-value text-[16px] leading-none text-ink">{value}</span>
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-faint">{unit}</span>
      </div>
    </div>
  )
}

function Telemetry({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="label-tech text-[8.5px]">{label}</span>
      <span className="data-value text-[10.5px] text-ink-dim">{value}</span>
    </div>
  )
}
