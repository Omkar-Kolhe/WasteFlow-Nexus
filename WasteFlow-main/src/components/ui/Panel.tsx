import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  code?: string
  action?: ReactNode
  /** Adds the instrumented corner ticks. */
  ticks?: boolean
  elevated?: boolean
  bodyClassName?: string
}

/**
 * The reusable surface for every floating module. No large radii, no heavy
 * glass: one hairline, a faint vertical wash and instrumented corners.
 */
export function Panel({
  title,
  code,
  action,
  ticks = true,
  elevated = true,
  className,
  bodyClassName,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        'relative',
        ticks && 'ticks',
        elevated ? 'surface border-hair shadow-panel' : 'surface-flat',
        className,
      )}
      {...rest}
    >
      {title && (
        <header className="flex items-center gap-2 border-b border-hair px-3 py-2">
          <span className="label-tech text-ink-faint">{title}</span>
          {code && <span className="font-mono text-[9.5px] tracking-[0.14em] text-ink-ghost">{code}</span>}
          <div className="ml-auto flex items-center gap-1.5">{action}</div>
        </header>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  )
}

export function PanelDivider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-hair', className)} />
}
