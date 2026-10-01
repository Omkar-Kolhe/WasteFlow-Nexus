import type { SystemState } from '@/types'
import { cn } from '@/lib/utils'

const STATE_COLOR: Record<SystemState, string> = {
  optimal: '#4FE3C1',
  warning: '#E5B44C',
  critical: '#E2595B',
}

const STATE_LABEL: Record<SystemState, string> = {
  optimal: 'OPTIMAL',
  warning: 'WARNING',
  critical: 'CRITICAL',
}

export interface StatusIndicatorProps {
  state: SystemState
  /** `block` renders the SYSTEM STATUS / value stack; `inline` renders a dot + label. */
  variant?: 'block' | 'inline'
  label?: string
  detail?: string
  className?: string
}

/**
 * SYSTEM STATUS — the twin's single most important signal.
 * Colour, pulse rate and label always move together so the state is legible
 * from across a room.
 */
export function StatusIndicator({ state, variant = 'block', label = 'SYSTEM STATUS', detail, className }: StatusIndicatorProps) {
  const color = STATE_COLOR[state]
  // Every state pulses; rate and colour carry the severity.
  const pulse = state === 'critical' ? 'animate-status-pulse' : 'animate-status-pulse'

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <span className="relative grid h-2.5 w-2.5 place-items-center">
          <span className={cn('absolute inset-0 rounded-full', pulse)} style={{ background: color }} />
          <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>
          {STATE_LABEL[state]}
        </span>
      </span>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div>
        <span className="label-tech block text-[8.5px]">{label}</span>
        <span className="mt-1 flex items-center gap-2">
          <span className="relative grid h-3 w-3 place-items-center">
            <span className={cn('absolute inset-0 rounded-full', pulse)} style={{ background: color, opacity: 0.55 }} />
            <span className="relative h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
          </span>
          <span className="data-value text-[15px] leading-none tracking-[0.06em]" style={{ color }}>
            {STATE_LABEL[state]}
          </span>
        </span>
      </div>
      {detail && <span className="max-w-[150px] text-right font-mono text-[9px] leading-relaxed tracking-[0.06em] text-ink-faint">{detail}</span>}
    </div>
  )
}
