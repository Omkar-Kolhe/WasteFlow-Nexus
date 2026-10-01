import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import { StatusIndicator } from './StatusIndicator'

/**
 * SYSTEM HEALTH — the status readout wired to the network itself.
 * Presenter, diversion ring and the node-health matrix are all computed from the
 * same derived records the twin renders, so HUD and map can never disagree.
 */
export function SystemStatus({ className }: { className?: string }) {
  const model = useTwinModel()
  const select = useTwinStore((s) => s.select)
  const selectedId = useTwinStore((s) => s.selectedId)

  const processNodes = model.derivedList.filter((d) => d.facility.kind !== 'zone')
  const recoveryPct = (model.totals.recovered / model.totals.wasteToday) * 100
  const criticalNodes = processNodes.filter((d) => d.state === 'critical')
  const warningNodes = processNodes.filter((d) => d.state === 'warning')
  const openAlerts = useTwinStore((s) => s.notifications.filter((n) => !n.read && n.severity !== 'info').length)
  const unread = useTwinStore((s) => s.notifications.filter((n) => !n.read).length)

  const circumference = 2 * Math.PI * 34
  const dash = (recoveryPct / 100) * circumference
  const landfill = model.derivedList.find((d) => d.facility.kind === 'landfill')
  const landfillPct = landfill ? (landfill.inflow / landfill.facility.capacity) * 100 : 0

  const detail =
    criticalNodes.length > 0
      ? `${criticalNodes.length} node${criticalNodes.length > 1 ? 's' : ''} above 90% — ${criticalNodes
          .map((d) => d.facility.shortName)
          .join(', ')}`
      : warningNodes.length > 0
        ? `${warningNodes.length} nodes in the warning band`
        : `All ${processNodes.length} infrastructure nodes within envelope`

  return (
    <div className={className}>
      <div className="surface ticks border-hair shadow-panel">
        <header className="flex items-center gap-2 border-b border-hair px-3 py-2">
          <span className="label-tech text-[9px]">SYSTEM HEALTH</span>
          <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-ink-ghost">
            {openAlerts} OPEN · {unread} NEW
          </span>
        </header>

        <div className="px-3 py-2.5">
          <StatusIndicator state={model.systemState} detail={detail} />
        </div>

        <div className="flex items-center gap-3 border-t border-hair px-3 py-3">
          <div className="relative grid h-[78px] w-[78px] shrink-0 place-items-center">
            <svg width={78} height={78} className="-rotate-90">
              <circle cx={39} cy={39} r={34} fill="none" stroke="var(--color-hair)" strokeWidth={5} />
              <circle
                cx={39}
                cy={39}
                r={34}
                fill="none"
                stroke="#4FE3C1"
                strokeWidth={5}
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="butt"
                opacity={0.9}
              />
              <circle
                cx={39}
                cy={39}
                r={26}
                fill="none"
                stroke="rgba(226,89,91,0.55)"
                strokeWidth={2}
                strokeDasharray={`${(landfillPct / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                strokeLinecap="butt"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="data-value text-[15px] leading-none text-ink">{recoveryPct.toFixed(1)}%</div>
                <div className="mt-0.5 font-mono text-[7.5px] tracking-[0.14em] text-ink-ghost">DIVERTED</div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <Bar label="RECOVERED" value={model.totals.recovered} total={model.totals.wasteToday} color="#4FE3C1" />
            <Bar label="TO LANDFILL" value={model.totals.toLandfill} total={model.totals.wasteToday} color="#E2595B" />
            <Bar
              label="DEONAR INTAKE"
              value={model.totals.toLandfill}
              total={landfill?.facility.capacity ?? 1}
              color="#E5B44C"
            />
          </div>
        </div>

        <div className="border-t border-hair px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="label-tech text-[8.5px]">NODE HEALTH</span>
            <span className="font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">CLICK TO INSPECT</span>
          </div>
          <div className="mt-2 flex items-end gap-1">
            {model.derivedList.map((d) => {
              const color = NODE_STATE_COLOR_HEX[d.state]
              const isSelected = selectedId === d.facility.id
              return (
                <button
                  key={d.facility.id}
                  onClick={() => select(d.facility.id)}
                  title={`${d.facility.shortName} — ${d.utilizationPct.toFixed(1)}% utilised, ${d.facility.waiting} min queue`}
                  className="group/pip focus-ring relative flex-1"
                  style={{ height: 26 }}
                >
                  <span
                    className="absolute bottom-0 left-0 w-full transition-all duration-300 ease-nexus group-hover/pip:opacity-100"
                    style={{
                      height: `${Math.max(12, Math.min(100, d.utilizationPct))}%`,
                      background: color,
                      opacity: isSelected ? 1 : 0.45,
                      boxShadow: isSelected ? `0 0 10px ${color}` : 'none',
                    }}
                  />
                </button>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[8px] tracking-[0.08em] text-ink-ghost">
            <span>8 ZONES</span>
            <span>10 INFRASTRUCTURE NODES</span>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/[0.055] border-t border-hair">
          <Tally label="CRITICAL" value={String(criticalNodes.length)} color="#E2595B" />
          <Tally label="WARNING" value={String(warningNodes.length)} color="#E5B44C" />
          <Tally label="NORMAL" value={String(processNodes.length - criticalNodes.length - warningNodes.length)} color="#4FE3C1" />
        </div>
      </div>
    </div>
  )
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[8.5px] tracking-[0.12em] text-ink-faint">{label}</span>
        <span className="data-value text-[9.5px] text-ink-dim">
          {formatNumber(value)} T
          <span className="ml-1 text-ink-ghost">{pct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="mt-1 h-[3px] w-full bg-white/[0.055]">
        <div
          className="h-full transition-[width] duration-700 ease-nexus"
          style={{ width: `${Math.min(100, pct)}%`, background: color, opacity: 0.8 }}
        />
      </div>
    </div>
  )
}

function Tally({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="px-3 py-2">
      <span className="label-tech block text-[8px]">{label}</span>
      <span className="data-value mt-0.5 flex items-baseline gap-1.5 text-[13px] leading-none" style={{ color }}>
        {value}
        <span className="h-1.5 w-1.5" style={{ background: color }} />
      </span>
    </div>
  )
}
