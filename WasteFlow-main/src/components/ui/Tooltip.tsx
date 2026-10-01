import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  label: string
  hint?: string
  side?: 'right' | 'left' | 'top' | 'bottom'
  children: ReactNode
  className?: string
}

/** CSS-only tooltip — zero JS, zero layout thrash. */
export function Tooltip({ label, hint, side = 'right', children, className }: TooltipProps) {
  const sideClass =
    side === 'right'
      ? 'left-full ml-2 top-1/2 -translate-y-1/2'
      : side === 'left'
        ? 'right-full mr-2 top-1/2 -translate-y-1/2'
        : side === 'top'
          ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          : 'top-full mt-2 left-1/2 -translate-x-1/2'

  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap border border-hair bg-panel/95 px-2 py-1 opacity-0 shadow-panel backdrop-blur-md transition-all duration-150 ease-nexus group-hover/tip:opacity-100',
          sideClass,
        )}
      >
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block font-mono text-[9px] tracking-[0.08em] text-ink-faint">{hint}</span>}
      </span>
    </span>
  )
}
