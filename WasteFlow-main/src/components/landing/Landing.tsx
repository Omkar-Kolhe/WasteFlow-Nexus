import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'
import { useTwinModel } from '@/hooks/useTwinModel'
import { StreamPreview } from './StreamPreview'
import { AmbientField } from './AmbientField'
import { NexusMark, Wordmark } from '@/components/shell/Logo'
import { Button } from '@/components/ui/Button'
import { formatNumber } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

const line = (delay: number) => ({
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.9, delay, ease: EASE },
})

/** Boot state is read from the derived model, never typed in by hand. */
const bootLog = (infrastructureNodes: number, trackedUnits: number, collectedT: number) => [
  `MESH HANDSHAKE · ${infrastructureNodes} NODES ACKNOWLEDGED`,
  `FLEET TELEMETRY · ${trackedUnits} UNITS REPORTING`,
  `MASS BALANCE VERIFIED · ${formatNumber(collectedT)} T/DAY`,
]

/**
 * ENTRY EXPERIENCE — the product's thesis, in one screen.
 *
 * A slow material field drifts through a dim perspective floor while the
 * promise, the live network preview and the boot state reveal in sequence.
 */
export function Landing() {
  const entry = useTwinStore((s) => s.enterTwin)
  const model = useTwinModel()
  const boot = bootLog(
    model.derivedList.filter((d) => d.facility.kind !== 'zone').length,
    model.totals.trackedVehicles,
    model.totals.wasteToday,
  )

  // Mouse parallax, sprung so it trails the pointer rather than snapping to it.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 })
  const heroX = useTransform(sx, [-0.5, 0.5], [-10, 10])
  const heroY = useTransform(sy, [-0.5, 0.5], [-6, 6])
  const fieldX = useTransform(sx, [-0.5, 0.5], [14, -14])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') entry()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [entry, mx, my])

  const stats = [
    { label: 'GENERATION', value: `${formatNumber(model.totals.wasteToday)} T/DAY` },
    { label: 'DIVERSION', value: `${((model.totals.recovered / model.totals.wasteToday) * 100).toFixed(1)}%` },
    { label: 'NETWORK NODES', value: String(model.derivedList.length) },
    { label: 'FLEET', value: `${model.totals.activeVehicles} UNITS` },
  ]

  return (
    <motion.main
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative h-full w-full overflow-hidden bg-void"
    >
      <motion.div style={{ x: fieldX }} className="absolute -inset-x-16 inset-y-0">
        <AmbientField className="h-full w-full" />
      </motion.div>

      {/* atmosphere + framing */}
      <div className="pointer-events-none absolute inset-0 hair-grid opacity-[0.35] [mask-image:radial-gradient(circle_at_30%_45%,#000_10%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-0 atmos-noise" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      {/* viewfinder corners */}
      <Corner className="right-5 top-5 border-r border-t" label="PHASE 2 · MOCK TELEMETRY" align="right" />
      <Corner className="left-5 bottom-5 border-b border-l" label="MESH SYNC · 100%" />
      <Corner className="right-5 bottom-5 border-b border-r" label="TWIN v0.1.0" align="right" />

      <div className="relative z-10 flex h-full flex-col">
        {/* top identity */}
        <motion.header
          {...line(0.1)}
          className="flex items-center gap-3 px-10 pt-8 text-signal"
        >
          <NexusMark size={24} />
          <Wordmark />
          <span className="ml-2 hidden items-center gap-2 border border-hair px-2 py-[3px] font-mono text-[8.5px] tracking-[0.16em] text-ink-ghost sm:flex">
            <span className="h-1 w-1 animate-status-pulse bg-signal" />
            WASTE DIGITAL TWIN PLATFORM
          </span>
          <span className="hidden font-mono text-[8.5px] tracking-[0.16em] text-ink-ghost lg:inline">
            19.07°N 72.88°E · MUMBAI MESH
          </span>
        </motion.header>

        <div className="flex min-h-0 flex-1 items-center px-10 pb-14">
          <div className="grid w-full items-center gap-10 xl:grid-cols-[1.35fr_0.65fr]">
            {/* HERO */}
            <motion.div style={{ x: heroX, y: heroY }} className="max-w-[820px]">
              <motion.div {...line(0.2)} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 animate-status-pulse bg-signal" />
                <span className="label-tech text-[9.5px] text-signal/90">ENVIRONMENTAL DIGITAL TWIN · LIVE MESH</span>
              </motion.div>

              <h1 className="mt-6 font-sans text-[clamp(2.4rem,5.2vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.035em]">
                <motion.span {...line(0.32)} className="block text-ink">
                  WHAT IS WASTEFLOW NEXUS?
                </motion.span>
                <motion.span
                  {...line(0.5)}
                  className="mt-2 block text-2xl tracking-normal bg-gradient-to-b from-ink to-[#93A8A2] bg-clip-text text-transparent"
                >
                  A digital decision system for understanding and optimizing urban waste flows.
                </motion.span>
              </h1>

              <motion.div {...line(0.72)} className="mt-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-signal/80 font-semibold">
                <span>OBSERVE</span>
                <ArrowRight size={10} className="text-ink-ghost" />
                <span>DIAGNOSE</span>
                <ArrowRight size={10} className="text-ink-ghost" />
                <span>SIMULATE</span>
                <ArrowRight size={10} className="text-ink-ghost" />
                <span>OPTIMIZE</span>
                <ArrowRight size={10} className="text-ink-ghost" />
                <span>MEASURE</span>
              </motion.div>

              <motion.div {...line(0.88)} className="mt-12 flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={entry}
                  iconRight={<ArrowRight size={15} strokeWidth={1.75} />}
                  className="px-7"
                >
                  Enter digital twin
                </Button>
                <span className="font-mono text-[9.5px] tracking-[0.16em] text-ink-ghost">
                  OR PRESS <span className="text-ink-dim">ENTER ↵</span>
                </span>
              </motion.div>

              {/* live figures */}
              <motion.dl {...line(1.05)} className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="label-tech text-[8.5px]">{s.label}</dt>
                    <dd className="data-value mt-1 text-[17px] leading-none text-ink">{s.value}</dd>
                  </div>
                ))}
              </motion.dl>

              {/* boot log */}
              <div className="mt-10 space-y-1.5 border-l border-hair pl-3.5">
                {boot.map((row, i) => (
                  <motion.div
                    key={row}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.35 + i * 0.22, ease: EASE }}
                    className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.1em] text-ink-faint"
                  >
                    <Check size={10} strokeWidth={2.5} className="text-signal/80" />
                    {row}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* NETWORK PREVIEW */}
            <StreamPreview delay={0.95} className="hidden xl:block" />
          </div>
        </div>
      </div>
    </motion.main>
  )
}

function Corner({
  className,
  label,
  align = 'left',
}: {
  className: string
  label: string
  align?: 'left' | 'right'
}) {
  return (
    <div className={`pointer-events-none absolute select-none ${className}`}>
      <div className={`px-2.5 py-2 ${align === 'right' ? 'text-right' : ''}`}>
        <span className="block font-mono text-[8px] tracking-[0.16em] text-ink-ghost">{label}</span>
      </div>
      <span className="absolute h-6 w-6 border-inherit" />
    </div>
  )
}
