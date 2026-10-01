import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTwinStore } from '@/state/twinStore'

export interface ModuleShellProps {
  icon: LucideIcon
  title: string
  code: string
  description: string
  phase?: string
  children: ReactNode
}

/**
 * MODULE SHELL — non-twin modules open over the live map rather than replacing
 * it, so the digital twin always remains the substrate of the product.
 */
export function ModuleShell({ icon: Icon, title, code, description, phase, children }: ModuleShellProps) {
  const setView = useTwinStore((s) => s.setView)

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-30 flex flex-col bg-void pl-16"
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-hair px-5 py-3.5">
        <span className="mt-0.5 grid h-7 w-7 place-items-center border border-hair text-signal/85">
          <Icon size={14} strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-[12.5px] uppercase tracking-[0.22em] text-ink">{title}</h1>
            <span className="font-mono text-[9px] tracking-[0.14em] text-ink-ghost">{code}</span>
            {phase && (
              <span className="flex items-center gap-1 border border-hair px-1.5 py-[2px] font-mono text-[8.5px] tracking-[0.12em] text-ink-ghost">
                <Lock size={9} strokeWidth={1.75} />
                {phase}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-[720px] text-[11.5px] leading-relaxed text-ink-faint">{description}</p>
        </div>
        <button
          onClick={() => setView('twin')}
          className="focus-ring flex h-7 items-center gap-1.5 border border-hair px-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-dim transition-colors hover:border-hair2 hover:text-ink"
        >
          <ArrowLeft size={11} strokeWidth={1.75} />
          Digital twin
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </motion.section>
  )
}

export function ModuleCard({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  tone?: 'default' | 'signal' | 'warn' | 'critical'
}) {
  const toneClass =
    tone === 'signal'
      ? 'text-signal'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'critical'
          ? 'text-critical'
          : 'text-ink'
  return (
    <div className="border border-hair bg-white/[0.015] px-3 py-2.5">
      <span className="label-tech text-[8.5px]">{label}</span>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`data-value text-[19px] leading-none ${toneClass}`}>{value}</span>
        {unit && <span className="font-mono text-[9px] tracking-[0.1em] text-ink-faint">{unit}</span>}
      </div>
      {hint && <p className="mt-1.5 font-mono text-[8.5px] leading-relaxed tracking-[0.06em] text-ink-ghost">{hint}</p>}
    </div>
  )
}

export function SectionTitle({ children, code }: { children: ReactNode; code?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="label-tech text-[9px]">{children}</span>
      {code && <span className="font-mono text-[8.5px] tracking-[0.12em] text-ink-ghost">{code}</span>}
      <span className="h-px flex-1 bg-hair" />
    </div>
  )
}
