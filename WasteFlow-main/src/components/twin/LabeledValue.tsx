import { cn } from '@/lib/utils'

export interface LabeledValueProps {
  label: string
  value: string
  unit?: string
  tone?: 'default' | 'warn' | 'critical' | 'signal'
  className?: string
}

const TONES = {
  default: 'text-ink',
  warn: 'text-warn',
  critical: 'text-critical',
  signal: 'text-signal',
} as const

export function LabeledValue({ label, value, unit, tone = 'default', className }: LabeledValueProps) {
  return (
    <div className={cn('px-3 py-2.5', className)}>
      <span className="label-tech block text-[8.5px]">{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('data-value text-[17px] leading-none', TONES[tone])}>{value}</span>
        {unit && <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-faint">{unit}</span>}
      </div>
    </div>
  )
}
