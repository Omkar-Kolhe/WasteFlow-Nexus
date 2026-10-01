import { AnimatePresence, motion } from 'framer-motion'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { FACILITY_KIND_LABEL } from '@/config/network'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import { useNodeScreenPosition, useNodeScreenRadius, useTwinEngine } from './TwinContext'

const STATE_LABEL = { normal: 'NORMAL', warning: 'WARNING', critical: 'CRITICAL' } as const

/**
 * HOVER READOUT — a quiet label that follows the pointer, not a floating card.
 * Name, type, state and utilisation: the four things an operator needs before
 * deciding to open the full panel.
 */
export function NodeTooltip() {
  const hoveredId = useTwinStore((s) => s.hoveredId)
  const selectedId = useTwinStore((s) => s.selectedId)
  const selectedRouteId = useTwinStore((s) => s.selectedRouteId)
  const model = useTwinModel()
  const engine = useTwinEngine()
  const anchor = useNodeScreenPosition(hoveredId)
  const radius = useNodeScreenRadius(hoveredId)
  const viewport = engine?.getViewport() ?? { w: 1440, h: 800 }

  // Suppress while a panel is already describing this node, or while inspecting a corridor.
  const visible = Boolean(hoveredId && anchor) && hoveredId !== selectedId && !selectedRouteId
  const derived = hoveredId ? model.derivedById[hoveredId] : undefined

  if (!hoveredId || !anchor || !derived) return null

  const color = NODE_STATE_COLOR_HEX[derived.state]
  const isZone = derived.facility.kind === 'zone'
  const width = 232
  const left = Math.min(Math.max(anchor.x + radius + 14, 12), viewport.w - width - 12)
  const top = Math.min(Math.max(anchor.y - radius - 8, 10), viewport.h - 132)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={hoveredId}
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -2, scale: 0.99 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ left, top, width }}
          className="pointer-events-none absolute z-30"
        >
          <div className="surface border-hair bg-panel/95 px-3 py-2 shadow-panel">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5" style={{ background: color }} />
              <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink">
                {derived.facility.shortName}
              </span>
              <span className="ml-auto font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
                {derived.facility.code}
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="label-tech text-[8px]">{FACILITY_KIND_LABEL[derived.facility.kind]}</span>
              <span className="font-mono text-[9px] tracking-[0.12em]" style={{ color }}>
                {STATE_LABEL[derived.state]}
              </span>
            </div>

            <div className="mt-2 flex items-end justify-between gap-3 border-t border-hair pt-2">
              <span>
                <span className="label-tech block text-[8px]">{isZone ? 'COLLECTION RATE' : 'UTILIZATION'}</span>
                <span className="data-value mt-0.5 block text-[14px] leading-none text-ink">
                  {derived.utilizationPct.toFixed(1)}%
                </span>
              </span>
              <span className="text-right">
                <span className="label-tech block text-[8px]">{isZone ? 'COLLECTED' : 'INTAKE'}</span>
                <span className="data-value mt-0.5 block text-[11px] leading-none text-ink-dim">
                  {Math.round(derived.inflow).toLocaleString('en-US')} T/D
                </span>
              </span>
              <span className="text-right">
                <span className="label-tech block text-[8px]">QUEUE</span>
                <span className="data-value mt-0.5 block text-[11px] leading-none text-ink-dim">
                  {derived.facility.waiting} MIN
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
