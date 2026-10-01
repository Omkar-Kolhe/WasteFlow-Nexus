import { ArrowDown, Factory, Truck } from 'lucide-react'
import type { BottleneckDownstreamEffect, BottleneckUpstreamSource } from '@/engine/bottleneckEngine'
import { formatNumber } from '@/lib/utils'
import { Meter } from '@/components/ui/Meter'

/**
 * UPSTREAM / DOWNSTREAM ANALYSIS COMPONENT (Phase 5)
 *
 * Renders the structural context of the bottleneck:
 * - Upstream Feeders: Where is the pressure coming from? (Wards, Transfer nodes, corridors)
 * - Downstream Receivers: Where does the waste flow next and what is the landfill spillover risk?
 */
export function UpstreamDownstreamAnalysis({
  upstreamSources,
  downstreamEffects,
  facilityName,
  className,
}: {
  upstreamSources: BottleneckUpstreamSource[]
  downstreamEffects: BottleneckDownstreamEffect[]
  facilityName: string
  facilityKind?: string
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {/* ── UPSTREAM SECTION ─────────────────────────────────── */}
      <div className="border border-hair bg-white/[0.015] p-3.5">
        <div className="flex items-center justify-between border-b border-hair pb-2">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center bg-signal/10 text-signal">
              <Truck size={12} strokeWidth={2} />
            </span>
            <span className="label-tech text-[8.5px]">UPSTREAM FEED SOURCES</span>
          </div>
          <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
            {upstreamSources.length} CORRIDOR{upstreamSources.length === 1 ? '' : 'S'} FEEDING
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {upstreamSources.map((src) => {
            const isCongested = src.status === 'congested' || src.status === 'blocked'
            const statusColor = isCongested ? '#E2595B' : src.status === 'busy' ? '#E5B44C' : '#4FE3C1'

            return (
              <div
                key={src.routeId}
                className="border border-hair/60 bg-white/[0.01] p-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5" style={{ background: statusColor }} />
                    <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-ink">
                      {src.facility.name}
                    </span>
                    <span className="font-mono text-[8px] text-ink-ghost">({src.routeId})</span>
                  </div>
                  <span className="data-value text-[11px] text-ink">
                    {formatNumber(src.volumeT)} <span className="font-mono text-[8px] text-ink-ghost">T/D</span>
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between font-mono text-[8px] tracking-[0.08em] text-ink-faint">
                  <span>{src.sharePct.toFixed(1)}% OF TOTAL INFLOW</span>
                  <span>{src.distanceKm.toFixed(1)} KM · {src.travelTimeMin} MIN TRANSIT</span>
                  <span className="uppercase" style={{ color: statusColor }}>
                    {src.status}
                  </span>
                </div>

                <div className="mt-1 h-1 w-full bg-white/[0.04]">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, src.sharePct)}%`,
                      background: statusColor,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── FLOW NODE CENTER INDICATOR ──────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-0.5">
        <ArrowDown size={14} className="text-signal animate-pulse" />
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-signal/80">
          Intake Concentration at {facilityName}
        </span>
        <ArrowDown size={14} className="text-signal animate-pulse" />
      </div>

      {/* ── DOWNSTREAM SECTION ───────────────────────────────── */}
      <div className="border border-hair bg-white/[0.015] p-3.5">
        <div className="flex items-center justify-between border-b border-hair pb-2">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center bg-cyan-500/10 text-cyan-400">
              <Factory size={12} strokeWidth={2} />
            </span>
            <span className="label-tech text-[8.5px]">DOWNSTREAM OUTLET NODES</span>
          </div>
          <span className="font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
            {downstreamEffects.length} DESTINATION{downstreamEffects.length === 1 ? '' : 'S'}
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {downstreamEffects.map((dst) => {
            const isLandfill = dst.facility.kind === 'landfill'
            const nodeColor = isLandfill ? '#E2595B' : dst.capacityHeadroomT < 100 ? '#E5B44C' : '#4FE3C1'

            return (
              <div
                key={dst.routeId}
                className="border border-hair/60 bg-white/[0.01] p-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5" style={{ background: nodeColor }} />
                    <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-ink">
                      {dst.facility.name}
                    </span>
                    {isLandfill && (
                      <span className="border border-critical/40 bg-critical/10 px-1 py-[1px] font-mono text-[7px] text-critical">
                        DISPOSAL SINK
                      </span>
                    )}
                  </div>
                  <span className="data-value text-[11px] text-ink">
                    {formatNumber(dst.volumeT)} <span className="font-mono text-[8px] text-ink-ghost">T/D</span>
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between font-mono text-[8px] tracking-[0.08em] text-ink-faint">
                  <span>CAPACITY: {formatNumber(dst.capacityT)} T/D</span>
                  <span>
                    HEADROOM:{' '}
                    <strong className={dst.capacityHeadroomT < 100 ? 'text-warn' : 'text-signal'}>
                      {formatNumber(dst.capacityHeadroomT)} T/D
                    </strong>
                  </span>
                  <span>{dst.utilizationPct.toFixed(0)}% UTILIZED</span>
                </div>

                <div className="mt-1.5">
                  <Meter
                    value={dst.utilizationPct}
                    tone={dst.utilizationPct >= 90 ? 'critical' : dst.utilizationPct >= 70 ? 'warn' : 'flow'}
                    showHead={false}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
