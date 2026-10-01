import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
  /** Fills the available width — used in panel action rows. */
  block?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'border-signal/60 bg-signal/12 text-signal hover:bg-signal/20 hover:border-signal/80 hover:shadow-glow active:bg-signal/25',
  outline:
    'border-hair2 bg-white/[0.02] text-ink hover:bg-white/[0.055] hover:border-white/25 active:bg-white/[0.07]',
  ghost: 'border-transparent bg-transparent text-ink-dim hover:text-ink hover:bg-white/[0.05]',
  danger:
    'border-critical/50 bg-critical/10 text-critical hover:bg-critical/18 hover:border-critical/70',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[10.5px] gap-1.5',
  md: 'h-9 px-3.5 text-[11px] gap-2',
  lg: 'h-12 px-6 text-xs gap-2.5',
}

/**
 * The single button primitive. Sharp corners, hairline borders, and a sheen
 * that sweeps once on hover — feedback without decoration.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', icon, iconRight, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'group/btn focus-ring relative inline-flex items-center justify-center overflow-hidden border font-mono uppercase tracking-[0.14em] transition-all duration-200 ease-nexus',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {variant === 'primary' && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-signal/25 to-transparent opacity-0 transition-opacity duration-300 group-hover/btn:animate-sweep group-hover/btn:opacity-100" />
      )}
      {icon && <span className="relative shrink-0 opacity-90">{icon}</span>}
      <span className="relative">{children}</span>
      {iconRight && (
        <span className="relative shrink-0 opacity-80 transition-transform duration-200 ease-nexus group-hover/btn:translate-x-0.5">
          {iconRight}
        </span>
      )}
    </button>
  )
})
