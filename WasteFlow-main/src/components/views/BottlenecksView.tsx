import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertOctagon,
  Leaf,
  ScanSearch,
  Search,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { formatNumber } from '@/lib/utils'
import type { Bottleneck } from '@/engine/bottleneckEngine'
import type { FacilityKind } from '@/types'
import { BottleneckCard } from '@/components/bottlenecks/BottleneckCard'
import { StageFlow, type StageNode } from '@/components/bottlenecks/StageFlow'
import { BottleneckDetailPanel } from '@/components/bottlenecks/BottleneckDetailPanel'
import { ModuleShell, SectionTitle } from './ModuleShell'

/**
 * BOTTLENECK INTELLIGENCE (Phase 5)
 *
 * Header: BOTTLENECK INTELLIGENCE
 * Subtitle: "Understand where waste flow slows down — and why."
 *
 * Automatically determines:
 * 1. WHERE the waste-management system is getting stuck
 * 2. WHY it is happening
 * 3. WHAT upstream/downstream parts are affected
 * 4. WHAT environmental impact it creates
 */

const EASE = [0.22, 1, 0.36, 1] as const

const STAGE_ORDER: { kind: FacilityKind; label: string; sublabel: string }[] = [
  { kind: 'zone', label: 'COLLECTION', sublabel: '8 WARDS' },
  { kind: 'transfer', label: 'TRANSFER', sublabel: '3 STATIONS' },
  { kind: 'sorting', label: 'SORTING', sublabel: '2 FACILITIES' },
  { kind: 'processing', label: 'PROCESSING', sublabel: '2 PLANTS' },
  { kind: 'recovery', label: 'RECOVERY', sublabel: '2 WORKS' },
  { kind: 'landfill', label: 'LANDFILL', sublabel: 'DEONAR' },
]

type SeverityFilter = 'ALL' | 'CRITICAL' | 'WARNING'
type SortBy = 'pressure' | 'delayed' | 'co2' | 'utilization' | 'name'

export function BottlenecksView() {
  const model = useTwinModel()
  const requestFocus = useTwinStore((s) => s.requestFocus)
  const setView = useTwinStore((s) => s.setView)
  const [openBottleneck, setOpenBottleneck] = useState<Bottleneck | null>(null)

  // Filters and search state
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<SortBy>('pressure')
  const [searchQuery, setSearchQuery] = useState('')

  const bottlenecks = model.bottlenecks
  const critical = bottlenecks.filter((b) => b.severity === 'critical')
  const warning = bottlenecks.filter((b) => b.severity === 'warning')

  const delayedTotal = model.bottleneckTotals.delayedT
  const co2eTotal = model.bottleneckTotals.co2eKg

  // Filtered and sorted bottlenecks
  const filteredBottlenecks = useMemo(() => {
    return bottlenecks
      .filter((b) => {
        if (severityFilter === 'CRITICAL' && b.severity !== 'critical') return false
        if (severityFilter === 'WARNING' && b.severity !== 'warning') return false
        if (typeFilter !== 'ALL' && b.bottleneckType !== typeFilter) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = b.facility.name.toLowerCase().includes(q)
          const matchType = b.bottleneckTypeLabel.toLowerCase().includes(q)
          const matchCause = b.rootCause.toLowerCase().includes(q)
          if (!matchName && !matchType && !matchCause) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'pressure') return b.pressure - a.pressure
        if (sortBy === 'delayed') return b.impact.delayedT - a.impact.delayedT
        if (sortBy === 'co2') return b.impact.co2eKg - a.impact.co2eKg
        if (sortBy === 'utilization') return b.utilization - a.utilization
        if (sortBy === 'name') return a.facility.name.localeCompare(b.facility.name)
        return 0
      })
  }, [bottlenecks, severityFilter, typeFilter, sortBy, searchQuery])

  // Aggregate ledgers by stage; utilisation is intake-weighted
  const stages: StageNode[] = useMemo(() => {
    return STAGE_ORDER.map(({ kind, label, sublabel }) => {
      const nodes = model.derivedList.filter((d) => d.facility.kind === kind)
      const weight = nodes.reduce((s, d) => s + d.inflow, 0)
      const utilizationPct =
        weight > 0 ? nodes.reduce((s, d) => s + d.utilizationPct * d.inflow, 0) / weight : 0
      const bn = bottlenecks.filter((b) => b.facility.kind === kind)
      const worst = bn.sort((a, b) => b.pressure - a.pressure)[0]
      const accumulatingT = bn.reduce((s, b) => s + b.impact.delayedT + b.impact.heldUpstreamT, 0)
      return {
        id: kind,
        label,
        sublabel,
        utilizationPct,
        bottleneckId: worst?.facilityId ?? null,
        accumulatingT,
        onClick: (stageId: string) => {
          const target = bottlenecks.find((b) => b.facility.kind === stageId)
          if (target) setOpenBottleneck(target)
          else if (nodes[0]) {
            requestFocus(nodes[0].facility.id)
            setView('twin')
          }
        },
      }
    })
  }, [model, bottlenecks, requestFocus, setView])

  const openOnMap = (facilityId: string) => {
    setOpenBottleneck(null)
    requestFocus(facilityId)
    setView('twin')
  }

  return (
    <ModuleShell
      icon={ScanSearch}
      title="BOTTLENECK INTELLIGENCE"
      code="PHASE 5"
      description="Understand where waste flow slows down — and why."
    >
      {/* ── TOP SUMMARY METRICS (§6) ───────────────────────── */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard
          icon={<TriangleAlert size={13} strokeWidth={1.75} />}
          label="ACTIVE BOTTLENECKS"
          value={String(bottlenecks.length)}
          hint={`${critical.length} critical · ${warning.length} warning watchpoints`}
          tone={critical.length > 0 ? 'critical' : 'warn'}
          delay={0}
        />
        <KpiCard
          icon={<AlertOctagon size={13} strokeWidth={1.75} />}
          label="CRITICAL BOTTLENECKS"
          value={String(critical.length)}
          hint={
            critical.length > 0
              ? critical.map((b) => b.facility.shortName).join(' · ')
              : 'Zero nodes exceeding critical threshold'
          }
          tone="critical"
          delay={0.06}
        />
        <KpiCard
          icon={<Timer size={13} strokeWidth={1.75} />}
          label="WASTE DELAYED"
          value={formatNumber(delayedTotal)}
          unit="T/DAY"
          hint="Accumulating in plant hoppers and stranded behind corridor blocks"
          tone="warn"
          delay={0.12}
        />
        <KpiCard
          icon={<Leaf size={13} strokeWidth={1.75} />}
          label="CO₂e IMPACT"
          value={formatNumber(co2eTotal)}
          unit="KG/DAY"
          hint={`Combustion from vehicle queue idling & detour rework trips`}
          tone="critical"
          delay={0.18}
        />
      </div>

      {/* ── STAGE FLOW SECTION ──────────────────────────────── */}
      <section className="mt-5">
        <SectionTitle code="NETWORK THROUGHPUT CURRENT">HORIZONTAL STAGE FLOW</SectionTitle>
        <div className="surface ticks border-hair bg-white/[0.01] shadow-panel">
          <StageFlow stages={stages} />
        </div>
        <p className="mt-2 font-mono text-[8.5px] leading-relaxed tracking-[0.08em] text-ink-ghost">
          Stage color indicates intake-weighted utilization. Dynamic particles slow and waste accumulates behind constrained processing stages — click any stage to open its intelligence panel.
        </p>
      </section>

      {/* ── BOTTLENECK LIST & FILTER TOOLBAR (§7) ────────────── */}
      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle code="EXPLAINABLE INTELLIGENCE">DETECTED BOTTLENECK NODES</SectionTitle>

          {/* Quick Counter */}
          <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
            SHOWING {filteredBottlenecks.length} OF {bottlenecks.length} DETECTED
          </span>
        </div>

        {/* Filter and search bar */}
        <div className="mt-2 flex flex-wrap items-center gap-2 border border-hair bg-white/[0.015] p-2.5">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-ghost" />
            <input
              type="text"
              placeholder="Search facility or cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-hair bg-void/80 py-1 pl-7 pr-2 font-mono text-[9px] text-ink placeholder:text-ink-ghost focus:border-signal/60 focus:outline-none"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            {(['ALL', 'CRITICAL', 'WARNING'] as SeverityFilter[]).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`border px-2 py-1 font-mono text-[7.5px] tracking-[0.12em] transition-colors ${
                  severityFilter === sev
                    ? 'border-signal/60 bg-signal/10 text-signal'
                    : 'border-hair bg-white/[0.01] text-ink-faint hover:text-ink'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-hair bg-void/80 px-2 py-1 font-mono text-[8px] tracking-[0.06em] text-ink focus:border-signal/60 focus:outline-none"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="CAPACITY_BOTTLENECK">CAPACITY</option>
            <option value="SORTING_BOTTLENECK">SORTING</option>
            <option value="TRANSFER_BOTTLENECK">TRANSFER</option>
            <option value="PROCESSING_BOTTLENECK">PROCESSING</option>
            <option value="RECOVERY_BOTTLENECK">RECOVERY</option>
            <option value="TRANSPORT_BOTTLENECK">TRANSPORT</option>
            <option value="SCHEDULING_BOTTLENECK">SCHEDULING</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[7.5px] text-ink-ghost">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="border border-hair bg-void/80 px-2 py-1 font-mono text-[8px] tracking-[0.06em] text-ink focus:border-signal/60 focus:outline-none"
            >
              <option value="pressure">SCORE</option>
              <option value="delayed">DELAYED TONNAGE</option>
              <option value="co2">CO₂e FOOTPRINT</option>
              <option value="utilization">UTILIZATION</option>
              <option value="name">NAME</option>
            </select>
          </div>
        </div>

        {/* Bottleneck Grid */}
        <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
          {filteredBottlenecks.map((b, i) => (
            <BottleneckCard key={b.facilityId} bottleneck={b} index={i} onOpen={setOpenBottleneck} />
          ))}
        </div>

        {filteredBottlenecks.length === 0 && (
          <div className="border border-hair bg-white/[0.015] p-5 text-center font-mono text-[10px] text-ink-faint">
            No bottlenecks matching the active filters.
          </div>
        )}
      </section>

      {/* ── UPSTREAM COLLECTION SERVICE GAPS ────────────────── */}
      <section className="mt-6">
        <SectionTitle code="WARD SERVICE · FEEDING ARTERIALS">UPSTREAM COLLECTION INTAKE</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {model.derivedList
            .filter((d) => d.facility.kind === 'zone')
            .map((z) => {
              const isShortfall = z.state !== 'normal'
              const color = isShortfall ? (z.state === 'critical' ? '#E2595B' : '#E5B44C') : '#4FE3C1'

              return (
                <button
                  key={z.facility.id}
                  onClick={() => openOnMap(z.facility.id)}
                  className="focus-ring border border-hair bg-white/[0.015] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5" style={{ background: color }} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
                      {z.facility.shortName}
                    </span>
                    <span className="ml-auto font-mono text-[8px] tracking-[0.06em]" style={{ color }}>
                      {z.utilizationPct.toFixed(0)}% RATE
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between font-mono text-[8px] text-ink-ghost">
                    <span>GEN: {formatNumber(z.generatedT ?? z.inflow)} T/D</span>
                    <span>{formatNumber(z.backlogT)} T UNCOLLECTED</span>
                  </div>
                </button>
              )
            })}
        </div>
      </section>

      <BottleneckDetailPanel
        bottleneck={openBottleneck}
        onClose={() => setOpenBottleneck(null)}
        onFocusOnMap={openOnMap}
      />
    </ModuleShell>
  )
}

function KpiCard({
  icon,
  label,
  value,
  unit,
  hint,
  tone,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  hint: string
  tone: 'default' | 'signal' | 'warn' | 'critical'
  delay: number
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'warn'
        ? 'text-warn'
        : tone === 'signal'
          ? 'text-signal'
          : 'text-ink'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="surface ticks border-hair bg-white/[0.015] px-3.5 py-3 shadow-panel"
    >
      <div className="flex items-center gap-2">
        <span className="text-ink-faint">{icon}</span>
        <span className="label-tech text-[8px]">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`data-value text-[21px] leading-none ${toneClass}`}>{value}</span>
        {unit && <span className="font-mono text-[9px] tracking-[0.08em] text-ink-faint">{unit}</span>}
      </div>
      <p className="mt-1.5 font-mono text-[8.5px] leading-relaxed tracking-[0.06em] text-ink-ghost">{hint}</p>
    </motion.div>
  )
}
