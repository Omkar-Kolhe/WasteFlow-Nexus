import { Crosshair, Maximize2, Minus, Plus } from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { useTwinEngine, useZoomScale } from './TwinContext'

/** CAMERA — pan is direct manipulation, zoom is on the wheel; these are the controls. */
export function ViewportControls({ className }: { className?: string }) {
  const engine = useTwinEngine()
  const scale = useZoomScale()
  const selectedId = useTwinStore((s) => s.selectedId)
  const selectedRouteId = useTwinStore((s) => s.selectedRouteId)

  const focusSelection = () => {
    if (selectedId) engine?.focusNode(selectedId)
    else if (selectedRouteId) engine?.focusRoute(selectedRouteId)
  }

  const actions = [
    { icon: Plus, label: 'Zoom in', hint: '+', onClick: () => engine?.zoomBy(1.3), disabled: false },
    { icon: Minus, label: 'Zoom out', hint: '−', onClick: () => engine?.zoomBy(1 / 1.3), disabled: false },
    {
      icon: Crosshair,
      label: 'Focus selection',
      hint: 'DOUBLE-CLICK A NODE OR ROUTE',
      onClick: focusSelection,
      disabled: !selectedId && !selectedRouteId,
    },
    { icon: Maximize2, label: 'Reset view', hint: '0 · FULL MUMBAI NETWORK', onClick: () => engine?.resetView(), disabled: false },
  ]

  return (
    <div className={cn('surface flex items-center gap-0.5 border-hair px-1 py-1 shadow-panel', className)}>
      {actions.map(({ icon: Icon, label, hint, onClick, disabled }) => (
        <Tooltip key={label} label={label} hint={hint} side="left">
          <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="focus-ring grid h-7 w-7 place-items-center text-ink-dim transition-all duration-200 ease-nexus hover:bg-white/[0.06] hover:text-signal disabled:pointer-events-none disabled:opacity-30"
          >
            <Icon size={13} strokeWidth={1.75} />
          </button>
        </Tooltip>
      ))}
      <span className="ml-1 border-l border-hair pl-2 pr-1.5 font-mono text-[9px] tabular-nums tracking-[0.12em] text-ink-faint">
        {(scale * 100).toFixed(0)}%
      </span>
    </div>
  )
}
