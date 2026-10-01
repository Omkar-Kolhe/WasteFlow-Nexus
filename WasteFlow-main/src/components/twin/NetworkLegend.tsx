import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { substreams } from '@/data/city'
import { FACILITY_KIND_LEGEND, ROUTE_STATUS_LEGEND } from '@/data/briefs'
import { NODE_STATE_COLOR_HEX, ROUTE_STATUS_COLOR_HEX } from '@/twin/palette'

/** Glyph previews drawn with the same vocabulary as the twin's node layer. */
const GLYPHS: Record<string, ReactNode> = {
  cluster: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <circle cx="9" cy="9" r="6.4" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 2" />
      <circle cx="9" cy="9" r="3.4" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  hex: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <polygon points="9,2.5 14.6,5.75 14.6,12.25 9,15.5 3.4,12.25 3.4,5.75" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M6.6 7l2 2-2 2M9.8 7l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <rect x="3.4" y="3.4" width="11.2" height="11.2" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M5.6 7h6.6M5.6 9h6.6M5.6 11h6.6" stroke="currentColor" strokeWidth="0.7" opacity="0.8" />
    </svg>
  ),
  disc: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M9 3.6v2.2M9 12.2v2.2M3.6 9h2.2M12.2 9h2.2M5.2 5.2l1.6 1.6M11.2 11.2l1.6 1.6M12.8 5.2l-1.6 1.6M6.8 11.2l-1.6 1.6" stroke="currentColor" strokeWidth="0.7" opacity="0.85" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  cycle: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <polygon points="9,5.4 12.2,11.5 5.8,11.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  ),
  mound: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <polygon points="2.5,14 6,6.5 12,6 15.5,14" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M5 11.5h8M6 9h6" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
    </svg>
  ),
  vehicle: (
    <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]">
      <rect x="3.5" y="6.5" width="8" height="4" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <path d="M11.5 8h2.4l1.1 1.4v1.1h-3.5z" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="6" cy="12" r="1.1" fill="currentColor" />
      <circle cx="12.6" cy="12" r="1.1" fill="currentColor" />
    </svg>
  ),
}

/**
 * NETWORK LEGEND — the twin's decoder ring.
 * Glyph shapes, node states, corridor states, flow tiers and material streams,
 * all reading from the same configuration the renderer uses.
 */
export function NetworkLegend({ className }: { className?: string }) {
  return (
    <div className={cn('surface ticks border-hair shadow-panel', className)}>
      <header className="flex items-center gap-2 border-b border-hair px-3 py-1.5">
        <span className="label-tech text-[8.5px]">NETWORK LEGEND</span>
        <span className="ml-auto font-mono text-[8px] tracking-[0.12em] text-ink-ghost">MUMBAI MESH</span>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2.5">
        {FACILITY_KIND_LEGEND.map((item) => (
          <span key={item.kind} className="flex items-center gap-2">
            <span className="text-signal/70">{GLYPHS[item.glyph]}</span>
            <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-faint">{item.label}</span>
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="text-flow/80">{GLYPHS.vehicle}</span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-faint">Tracked vehicle</span>
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 18 18" className="h-[15px] w-[15px] text-ink-dim">
            <path d="M2 13h14" stroke="currentColor" strokeWidth="0.9" />
            <path d="M5 9.5l2 2-2 2M10 9.5l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </svg>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-faint">Waste flow</span>
        </span>
      </div>

      <div className="border-t border-hair px-3 py-2">
        <span className="label-tech text-[8px]">NODE STATE · UTILISATION</span>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {(['normal', 'warning', 'critical'] as const).map((state) => (
            <span key={state} className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-dim">
              <span className="h-1.5 w-1.5" style={{ background: NODE_STATE_COLOR_HEX[state] }} />
              {state} {state === 'normal' ? '<70%' : state === 'warning' ? '70–90%' : '>90%'}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-hair px-3 py-2">
        <span className="label-tech text-[8px]">CORRIDOR STATE</span>
        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
          {ROUTE_STATUS_LEGEND.map((item) => (
            <span key={item.status} className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.08em] text-ink-dim">
              <span className="h-[3px] w-5" style={{ background: ROUTE_STATUS_COLOR_HEX[item.status] }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-hair px-3 py-2">
        <span className="label-tech text-[8px]">MATERIAL STREAMS</span>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {substreams.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-dim">
              <span className="h-[3px] w-4" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <footer className="flex flex-wrap gap-x-3 gap-y-1 border-t border-hair px-3 py-2 font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
        <span>DRAG · PAN</span>
        <span>WHEEL · ZOOM</span>
        <span>CLICK NODE · INSPECT</span>
        <span>CLICK ROUTE · FLOW</span>
      </footer>
    </div>
  )
}
