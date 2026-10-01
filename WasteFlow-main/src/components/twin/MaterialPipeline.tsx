import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { cn, formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import type { FacilityKind } from '@/types'

const STAGES: { kind: FacilityKind; label: string }[] = [
  { kind: 'zone', label: 'COLLECTION' },
  { kind: 'transfer', label: 'TRANSFER' },
  { kind: 'sorting', label: 'SORTING' },
  { kind: 'processing', label: 'PROCESSING' },
  { kind: 'recovery', label: 'RECOVERY' },
  { kind: 'landfill', label: 'LANDFILL' },
]

/**
 * MATERIAL PATH — the pipeline the product exists to explain, as a live readout.
 * Each stage shows the tonnage entering it, a bar normalised across stages, and
 * the worst-off node's state. Clicking a stage inspects its most loaded facility.
 */
export function MaterialPipeline({ className }: { className?: string }) {
  const model = useTwinModel()
  const select = useTwinStore((s) => s.select)
  const selectedId = useTwinStore((s) => s.selectedId)
  const hover = useTwinStore((s) => s.hover)

  const stageData = STAGES.map((stage) => {
    const nodes = model.derivedList.filter((d) => d.facility.kind === stage.kind)
    const volume = nodes.reduce((s, d) => s + d.inflow, 0)
    const worst = nodes.reduce((acc, d) => (d.utilizationPct > (acc?.utilizationPct ?? -1) ? d : acc), nodes[0])
    return { ...stage, volume, worst, count: nodes.length }
  })

  const max = Math.max(...stageData.map((s) => s.volume), 1)

  return (
    <div className={cn('surface ticks border-hair shadow-panel', className)}>
      <header className="flex items-center gap-2 border-b border-hair px-3 py-1.5">
        <span className="label-tech text-[8.5px]">MATERIAL PATH</span>
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
          T/DAY THROUGH EACH STAGE · {formatNumber(model.totals.wasteToday)} T COLLECTED
        </span>
      </header>

      <div className="flex items-stretch gap-0 overflow-hidden px-2 py-2">
        {stageData.map((stage, i) => {
          const isSelected = Boolean(stage.worst && stage.worst.facility.id === selectedId)
          const stateColor = stage.worst ? NODE_STATE_COLOR_HEX[stage.worst.state] : '#8B939E'
          return (
            <div key={stage.kind} className="flex items-stretch">
              <button
                onClick={() => stage.worst && select(stage.worst.facility.id)}
                onMouseEnter={() => stage.worst && hover(stage.worst.facility.id)}
                onMouseLeave={() => hover(null)}
                className={cn(
                  'focus-ring group/stage relative w-[104px] px-2 py-1.5 text-left transition-colors duration-200 ease-nexus',
                  isSelected ? 'bg-signal/[0.08]' : 'hover:bg-white/[0.04]',
                )}
              >
                <span
                  className="absolute left-0 top-0 h-full w-px"
                  style={{ background: isSelected ? '#4FE3C1' : 'var(--color-hair)' }}
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5" style={{ background: stateColor }} />
                  <span className="font-mono text-[8px] tracking-[0.16em] text-ink-ghost">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </span>
                <span
                  className={cn('mt-0.5 block font-mono text-[9px] tracking-[0.12em]', isSelected ? 'text-signal' : 'text-ink-dim')}
                >
                  {stage.label}
                </span>
                <span className="data-value mt-1 block text-[15px] leading-none text-ink">
                  {formatNumber(stage.volume)}
                </span>
                <span className="mt-1.5 block h-[2px] w-full bg-white/[0.06]">
                  <span
                    className="block h-full transition-[width] duration-700 ease-nexus"
                    style={{ width: `${Math.max(6, (stage.volume / max) * 100)}%`, background: stateColor, opacity: 0.85 }}
                  />
                </span>
                <span className="mt-1 block font-mono text-[8px] tracking-[0.1em] text-ink-ghost">
                  {stage.count} NODE{stage.count === 1 ? '' : 'S'}
                </span>
              </button>

              {i < stageData.length - 1 && (
                <span className="relative flex w-6 items-center justify-center">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-white/[0.09]" />
                  <span className="relative block h-1 w-1 animate-sweep bg-signal/70" />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
