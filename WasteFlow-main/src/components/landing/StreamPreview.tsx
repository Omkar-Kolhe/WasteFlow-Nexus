import { motion } from 'framer-motion'
import { useTwinModel } from '@/hooks/useTwinModel'
import { cn, formatNumber } from '@/lib/utils'

const STAGES = [
  { kind: 'zone', label: 'COLLECTION ZONES' },
  { kind: 'transfer', label: 'TRANSFER STATIONS' },
  { kind: 'sorting', label: 'SORTING FACILITIES' },
  { kind: 'processing', label: 'PROCESSING PLANTS' },
  { kind: 'recovery', label: 'RECOVERY WORKS' },
  { kind: 'landfill', label: 'SANITARY LANDFILL' },
] as const

/**
 * NETWORK PREVIEW — a quiet, live readout of the pipeline the twin models.
 * It exists so the entry screen states the system's shape before the map opens.
 */
export function StreamPreview({ className, delay = 0 }: { className?: string; delay?: number }) {
  const model = useTwinModel()
  const totalIn = model.totals.wasteToday
  const max = Math.max(
    ...STAGES.map((s) => model.derivedList.filter((d) => d.facility.kind === s.kind).reduce((sum, d) => sum + d.inflow, 0)),
    1,
  )

  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('border border-hair bg-white/[0.015] px-4 py-3.5 backdrop-blur-sm', className)}
    >
      <header className="flex items-center gap-2 border-b border-hair pb-2">
        <span className="label-tech text-[8.5px]">SYSTEM MAP</span>
        <span className="ml-auto font-mono text-[8px] tracking-[0.14em] text-ink-ghost">
          {formatNumber(totalIn)} T/DAY IN
        </span>
      </header>

      <ol className="mt-3 space-y-2.5">
        {STAGES.map((stage, i) => {
          const nodes = model.derivedList.filter((d) => d.facility.kind === stage.kind)
          const volume = nodes.reduce((sum, d) => sum + d.inflow, 0)
          const pressure = nodes.some((d) => d.state !== 'normal')
          return (
            <motion.li
              key={stage.kind}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.15 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[8.5px] tracking-[0.14em] text-ink-ghost">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-dim">{stage.label}</span>
                <span className="ml-auto data-value text-[11px] text-ink">{formatNumber(volume)}</span>
                <span className="w-4 text-right font-mono text-[8.5px] text-ink-ghost">{nodes.length}</span>
              </div>
              <div className="mt-1.5 h-[2px] w-full bg-white/[0.06]">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, (volume / max) * 100)}%` }}
                  transition={{ duration: 0.9, delay: delay + 0.3 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('block h-full', pressure ? 'bg-warn/80' : 'bg-signal/70')}
                />
              </div>
            </motion.li>
          )
        })}
      </ol>

      <footer className="mt-4 flex items-center gap-2 border-t border-hair pt-2.5">
        <span className="h-1.5 w-1.5 bg-warn" />
        <span className="font-mono text-[8px] tracking-[0.12em] text-ink-ghost">
          CAPACITY PRESSURE · MUMBAI MESH
        </span>
      </footer>
    </motion.aside>
  )
}
