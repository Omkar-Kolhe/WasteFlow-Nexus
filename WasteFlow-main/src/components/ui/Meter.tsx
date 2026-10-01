import { cn } from '@/lib/utils'

export interface MeterProps {
  /** 0..100 */
  value: number
  thresholds?: number[]
  tone?: 'signal' | 'warn' | 'critical' | 'flow'
  className?: string
  showHead?: boolean
}

const TONES: Record<NonNullable<MeterProps['tone']>, string> = {
  signal: 'bg-signal',
  warn: 'bg-warn',
  critical: 'bg-critical',
  flow: 'bg-flow',
}

/** Utilisation is the twin's most important single number — it gets a meter. */
export function Meter({ value, thresholds = [70, 88], tone = 'signal', className, showHead = true }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative h-[5px] w-full bg-white/[0.055]', className)}>
      <div
        className={cn('absolute inset-y-0 left-0 transition-[width] duration-700 ease-nexus', TONES[tone])}
        style={{ width: `${clamped}%`, opacity: 0.85 }}
      />
      {thresholds.map((t) => (
        <span
          key={t}
          className="absolute top-[-2px] h-[9px] w-px bg-white/25"
          style={{ left: `${t}%` }}
          aria-hidden
        />
      ))}
      {showHead && (
        <span
          className={cn('absolute -top-[2px] h-[9px] w-[2px] shadow-glow', TONES[tone])}
          style={{ left: `calc(${clamped}% - 1px)` }}
          aria-hidden
        />
      )}
    </div>
  )
}
