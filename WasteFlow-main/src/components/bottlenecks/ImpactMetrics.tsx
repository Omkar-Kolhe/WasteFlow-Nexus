import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * IMPACT METRICS — the six-figure consequence ledger, with numbers that ease
 * up from zero when the panel opens (§5: animated numbers).
 *
 * Not a stat grid: each row is a sentence the flow tells — delayed tonnage,
 * queue, rework trips, idle fuel, CO₂e, and what relief could divert.
 */
export interface ImpactDatum {
  label: string
  value: number
  digits?: number
  unit: string
  tone?: 'default' | 'warn' | 'critical' | 'signal'
  hint?: string
}

export function ImpactMetrics({ data, className }: { data: ImpactDatum[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-px border border-hair bg-white/[0.05]', className)}>
      {data.map((d, i) => (
        <ImpactCell key={d.label} datum={d} delay={i * 0.06} />
      ))}
    </dl>
  )
}

function ImpactCell({ datum, delay }: { datum: ImpactDatum; delay: number }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay * 1000
    const duration = 750
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(datum.value * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [datum.value, delay])

  const toneClass =
    datum.tone === 'critical'
      ? 'text-critical'
      : datum.tone === 'warn'
        ? 'text-warn'
        : datum.tone === 'signal'
          ? 'text-signal'
          : 'text-ink'

  return (
    <div className="bg-void/60 px-3 py-2.5">
      <dt className="label-tech text-[8px]">{datum.label}</dt>
      <dd className={cn('data-value mt-1 text-[15px] leading-none', toneClass)}>
        {formatNumber(shown, datum.digits ?? 0)}
        <span className="ml-1 font-mono text-[8.5px] tracking-[0.08em] text-ink-faint">{datum.unit}</span>
      </dd>
      {datum.hint && <p className="mt-1 text-[9.5px] leading-snug text-ink-ghost">{datum.hint}</p>}
    </div>
  )
}
