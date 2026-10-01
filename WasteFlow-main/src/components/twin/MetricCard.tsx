import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { MetricDefinition } from '@/types'
import { useAnimatedNumber } from '@/hooks'
import { cn, formatNumber } from '@/lib/utils'
import { Sparkline } from '@/components/ui/Sparkline'

/** Deterministic mock 24h trace so the card has a data shape, not a spinner. */
function traceFor(metric: MetricDefinition): number[] {
  const seed = metric.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const out: number[] = []
  let v = metric.value * 0.94
  for (let i = 0; i < 16; i++) {
    const wobble = Math.sin((i + seed) * 0.7) * 0.018 + Math.cos((i * seed) % 5) * 0.012
    v = v * (1 + wobble)
    out.push(v)
  }
  out[out.length - 1] = metric.value
  return out
}

const TONES: Record<MetricDefinition['polarity'], string> = {
  'higher-better': '#4FE3C1',
  'lower-better': '#5FD4E3',
  neutral: '#8B939E',
}

export interface MetricCardProps {
  metric: MetricDefinition
  className?: string
  compact?: boolean
}

export function MetricCard({ metric, className, compact = false }: MetricCardProps) {
  const value = useAnimatedNumber(metric.value, 1100)
  const tone = TONES[metric.polarity]
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus
  const good =
    metric.polarity === 'neutral'
      ? null
      : metric.polarity === 'higher-better'
        ? metric.trend === 'up'
        : metric.trend === 'down'
  const deltaColor = good === null ? 'text-ink-faint' : good ? 'text-signal/85' : 'text-warn/90'

  return (
    <div
      className={cn(
        'group/metric relative overflow-hidden border border-hair bg-white/[0.018] px-3 py-2 transition-colors duration-300 ease-nexus hover:border-hair2 hover:bg-white/[0.035]',
        className,
      )}
      title={metric.hint}
    >
      <span
        className="absolute left-0 top-0 h-full w-px opacity-60 transition-opacity duration-300 group-hover/metric:opacity-100"
        style={{ background: `linear-gradient(180deg, transparent, ${tone}, transparent)` }}
        aria-hidden
      />
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-tech truncate text-[9.5px]">{metric.label}</span>
        {!compact && (
          <span className={cn('flex items-center gap-0.5 font-mono text-[9.5px] tabular-nums', deltaColor)}>
            <TrendIcon size={10} strokeWidth={2} />
            {metric.deltaPct === 0 ? 'FLAT' : `${Math.abs(metric.deltaPct).toFixed(1)}%`}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="data-value text-[21px] font-medium leading-none tracking-tight text-ink">
            {formatNumber(value, metric.digits)}
          </span>
          {metric.unit && <span className="font-mono text-[10px] tracking-[0.1em] text-ink-faint">{metric.unit}</span>}
        </div>
        {!compact && <Sparkline values={traceFor(metric)} color={tone} width={64} height={20} />}
      </div>
    </div>
  )
}
