import { BarChart3, Lock } from 'lucide-react'
import { useTwinModel } from '@/hooks/useTwinModel'
import { dailySeries } from '@/data/series'
import { TODAY_INDEX } from '@/engine/metricsEngine'
import { cn, formatNumber } from '@/lib/utils'
import { Sparkline } from '@/components/ui/Sparkline'
import { MetricCard } from '@/components/twin/MetricCard'
import { ModuleShell, SectionTitle } from './ModuleShell'

/** ANALYTICS — headline telemetry with long-run series scaffolded for Phase 2. */
export function AnalyticsView() {
  const model = useTwinModel()

  const panels = [
    { id: 'flow', title: 'NETWORK FLOW', unit: 'T/DAY', base: model.totals.wasteToday, color: '#4FE3C1' },
    { id: 'recovery', title: 'RECOVERY RATE', unit: '%', base: (model.totals.recovered / model.totals.wasteToday) * 100, color: '#5FD4E3' },
    { id: 'landfill', title: 'LANDFILL INTAKE', unit: 'T/DAY', base: model.totals.toLandfill, color: '#E2595B' },
    { id: 'co2e', title: 'CO₂e', unit: 'KG', base: model.totals.co2eKg, color: '#E5B44C' },
  ]

  return (
    <ModuleShell
      icon={BarChart3}
      title="Analytics"
      code="MOD-08"
      description="System-level performance across the mesh, computed by the calculation engine: live-window figures, the 7-day deterministic ledger and the chart surface. The history store and comparative analytics arrive with the time-series pipeline."
      phase="CALCULATION ENGINE · PHASE 3"
    >
      <div className="grid grid-cols-2 gap-px border border-hair bg-white/[0.045] lg:grid-cols-3 xl:grid-cols-6">
        {model.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} className="border-0 bg-void/40" />
        ))}
      </div>

      <section className="mt-5">
        <SectionTitle code="24H STEPS · MOCK HISTORY">LONG-RUN SERIES</SectionTitle>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {panels.map((p) => {
            const series = dailySeries(`${p.id}-analytics`, p.base, 24)
            const min = Math.min(...series)
            const max = Math.max(...series)
            const latest = series[series.length - 1]
            const prev = series[series.length - 2] ?? latest
            const delta = ((latest - prev) / prev) * 100
            return (
              <article key={p.id} className="border border-hair bg-white/[0.015] px-3.5 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="label-tech text-[8.5px]">{p.title}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-ink-ghost">{p.unit}</span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <span className="data-value text-[20px] leading-none text-ink">{formatNumber(latest, 1)}</span>
                  <span
                    className={`data-value text-[10px] ${delta >= 0 ? 'text-signal/85' : 'text-warn/90'}`}
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}%
                  </span>
                </div>
                <Sparkline values={series} color={p.color} width={250} height={44} className="mt-3 w-full" />
                <div className="mt-2 flex justify-between font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
                  <span>MIN {formatNumber(min)}</span>
                  <span>MAX {formatNumber(max)}</span>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-5">
        <SectionTitle code="ENGINE LEDGER · DETERMINISTIC DEMO WEEK · THURSDAY = LIVE">
          7-DAY CALCULATION
        </SectionTitle>
        <div className="overflow-x-auto border border-hair">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hair bg-white/[0.02]">
                {['DAY', 'GENERATED', 'COLLECTED', 'PROCESSED', 'RECOVERED', 'LANDFILL', 'BACKLOG', 'TRIPS', 'FUEL L', 'CO₂e KG'].map((h) => (
                  <th key={h} className="px-3 py-2 font-mono text-[8.5px] font-normal uppercase tracking-[0.14em] text-ink-ghost">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.daily.map((d, i) => {
                const isToday = i === TODAY_INDEX
                return (
                  <tr
                    key={d.day}
                    className={cn(
                      'border-b border-hair/60 transition-colors last:border-0',
                      isToday ? 'bg-signal/[0.06]' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5"
                          style={{ background: isToday ? '#4FE3C1' : 'rgba(var(--color-ink) / 0.22)' }}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink">
                          {d.day} · {d.label}
                        </span>
                        {isToday && <span className="label-tech text-[7.5px] text-signal/90">LIVE</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">{formatNumber(d.wasteGeneratedT)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-dim">{formatNumber(d.wasteCollectedT)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-dim">{formatNumber(d.wasteProcessedT)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-signal/85">{formatNumber(d.wasteRecoveredT)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">{formatNumber(d.wasteLandfillT)}</td>
                    <td
                      className={cn(
                        'px-3 py-2 font-mono text-[9.5px] tabular-nums',
                        d.backlogT > 0 ? 'text-warn' : 'text-ink-ghost',
                      )}
                    >
                      {d.backlogT > 0 ? `${formatNumber(d.backlogT)} T` : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">{formatNumber(d.trips)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">{formatNumber(d.fuelLiters)}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-warn/85">{formatNumber(d.co2eKg)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[8.5px] leading-relaxed tracking-[0.08em] text-ink-ghost">
          Every column is recomputed by the facility and transport engines at that day's scaled demand — the
          Friday/Saturday market surge genuinely pushes Kanjurmarg Sorting over capacity. No random values: the
          same week on every load. Forecast bands replace this demo week in Phase 5.
        </p>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="border border-hair bg-white/[0.015] px-4 py-3.5">
          <SectionTitle code="SCOPE">SYSTEM TOTALS</SectionTitle>
          <dl className="grid grid-cols-2 gap-y-2.5">
            {[
              ['CITY', model.snapshot.city.name],
              ['POPULATION', formatNumber(model.snapshot.city.population)],
              ['HOUSEHOLDS', formatNumber(model.snapshot.city.households)],
              ['AREA', `${model.snapshot.city.areaKm2} KM²`],
              ['GENERATION', `${formatNumber(model.totals.wasteToday)} T/DAY`],
              ['NODES', String(model.derivedList.length)],
              ['LINKS', String(model.snapshot.routes.length)],
              ['FLEET', `${model.totals.activeVehicles}/${model.totals.fleetSize} ACTIVE`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-hair/50 pb-1.5">
                <dt className="label-tech text-[8.5px]">{k}</dt>
                <dd className="data-value text-[11px] text-ink-dim">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border border-hair bg-white/[0.015] px-4 py-3.5">
          <SectionTitle code="PHASE 2">PLANNED ANALYTICS</SectionTitle>
          <ul className="space-y-2.5">
            {[
              ['Historical comparison', 'Week-over-week tonnage, diversion and emissions with change attribution.'],
              ['Cost model', 'Collection, transfer, processing and disposal cost per tonne by node.'],
              ['Forecast band', 'Generation forecast with confidence intervals feeding the simulation engine.'],
              ['Impact attribution', 'Which nodes caused a change in recovery rate or emissions.'],
            ].map(([title, detail]) => (
              <li key={title} className="flex items-start gap-2.5">
                <Lock size={11} strokeWidth={1.75} className="mt-[3px] shrink-0 text-ink-ghost" />
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim">{title}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink-faint">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ModuleShell>
  )
}
