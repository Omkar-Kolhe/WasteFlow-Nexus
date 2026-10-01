import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTwinStore } from '@/state/twinStore'
import { Landing } from '@/components/landing/Landing'
import { AppShell } from '@/components/shell/AppShell'

/** LANDING → APPLICATION. The entry wipe is the product's handshake. */
export default function App() {
  const phase = useTwinStore((s) => s.phase)

  // The shell mounts immediately on entry; the wipe covers the cut, so the
  // transition never depends on an animation completing.
  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      {phase === 'app' ? <AppShell /> : <Landing />}
      <AnimatePresence>{phase === 'app' && <EntryWipe key="entry-wipe" />}</AnimatePresence>
    </div>
  )
}

const EASE = [0.76, 0, 0.24, 1] as const

/**
 * ENTRY WIPE — the hatch. Two panels open along a signal hairline while the
 * console boots behind them, so entering the twin feels like a system
 * acknowledging an operator rather than a page navigation.
 */
function EntryWipe() {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), 1500)
    return () => window.clearTimeout(id)
  }, [])
  if (done) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-101%' }}
        transition={{ duration: 0.95, delay: 0.35, ease: EASE }}
        className="absolute inset-x-0 top-0 h-1/2 bg-void"
      />
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '101%' }}
        transition={{ duration: 0.95, delay: 0.35, ease: EASE }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-void"
      />
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-signal/70"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.35, 1] }}
        className="absolute inset-0 grid place-items-center"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-signal/80">
          Entering Nordhavn mesh
        </span>
      </motion.div>
    </div>
  )
}
