import { cn } from '@/lib/utils'

/**
 * The mark: a hexagonal containment boundary with a flow line bending through
 * it — waste entering a controlled system. Vector, so it stays crisp at any size.
 */
export function NexusMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn('shrink-0', className)} aria-hidden>
      <polygon
        points="16,2.5 28,9.25 28,22.75 16,29.5 4,22.75 4,9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.55"
      />
      <polygon points="16,8 22.5,11.75 22.5,19.25 16,23 9.5,19.25 9.5,11.75" fill="currentColor" opacity="0.08" />
      <path
        d="M7.5 20.5c3.2 0 3.6-4 6.6-4s3.3 4 6.4 4 3.1-3.4 4.4-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="20.5" r="1.4" fill="currentColor" />
      <circle cx="24.9" cy="17.1" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.34em] text-ink">
        WASTEFLOW
      </span>
      {!compact && (
        <span className="font-mono text-[11.5px] font-light uppercase tracking-[0.34em] text-signal/85">NEXUS</span>
      )}
    </span>
  )
}
