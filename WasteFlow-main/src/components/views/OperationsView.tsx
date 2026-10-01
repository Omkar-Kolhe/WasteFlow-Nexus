import { Truck } from 'lucide-react'
import { useTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { MODULE_BRIEFS } from '@/data/briefs'
import { VEHICLE_KIND_LABEL, VEHICLE_STATUS_LABEL } from '@/config/network'
import { formatNumber } from '@/lib/utils'
import { NODE_STATE_COLOR_HEX } from '@/twin/palette'
import { Meter } from '@/components/ui/Meter'
import { ModuleCard, ModuleShell, SectionTitle } from './ModuleShell'

const STATUS_TONE: Record<string, string> = {
  collecting: 'text-signal',
  'en-route': 'text-flow',
  waiting: 'text-warn',
  'at-facility': 'text-ink-dim',
  returning: 'text-ink-dim',
}

/** OPERATIONS — what the network is doing right now, unit by unit and ward by ward. */
export function OperationsView() {
  const model = useTwinModel()
  const select = useTwinStore((s) => s.select)
  const setView = useTwinStore((s) => s.setView)

  const zones = model.derivedList.filter((d) => d.facility.kind === 'zone')
  const processNodes = model.derivedList.filter((d) => d.facility.kind !== 'zone')
  const openZone = (id: string) => {
    select(id)
    setView('twin')
  }

  return (
    <ModuleShell
      icon={Truck}
      title="Operations"
      code="MOD-02"
      description={MODULE_BRIEFS.operations.description}
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <ModuleCard
          label="FLEET ACTIVE"
          value={`${model.totals.activeVehicles}/${model.totals.fleetSize}`}
          hint={`${model.totals.trackedVehicles} units tracked individually on the twin`}
          tone="signal"
        />
        <ModuleCard
          label="COLLECTED TODAY"
          value={formatNumber(model.totals.wasteToday)}
          unit="T"
          hint={`of ${formatNumber(model.totals.generatedToday)} t generated · ${formatNumber(model.totals.uncollectedToday)} t uncollected`}
        />
        <ModuleCard
          label="MEAN NODE QUEUE"
          value={model.totals.meanQueueMin.toFixed(1)}
          unit="MIN"
          hint="Across the 10 infrastructure nodes"
          tone={model.totals.meanQueueMin > 12 ? 'warn' : 'default'}
        />
        <ModuleCard
          label="FLEET FUEL TODAY"
          value={formatNumber(model.totals.fuelLiters)}
          unit="L"
          hint={`${formatNumber(model.totals.collectionFuelLiters)} L collection · ${formatNumber(model.totals.transferFuelLiters)} L transfer`}
          tone="default"
        />
        <ModuleCard
          label="BLOCKED CORRIDORS"
          value={String(model.snapshot.routes.filter((r) => r.status === 'blocked').length)}
          hint="Flow stopped; held tonnage is reported in the corridor panel"
          tone="critical"
        />
      </div>

      <section className="mt-5">
        <SectionTitle code={`${model.totals.trackedVehicles} TRACKED OF ${model.totals.fleetSize} ASSIGNED`}>
          FLEET DISPOSITION
        </SectionTitle>
        <div className="overflow-x-auto border border-hair">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hair bg-white/[0.02]">
                {['UNIT', 'TYPE', 'STATUS', 'LOAD', 'CAPACITY', 'CORRIDOR', 'DESTINATION', 'ETA', 'FUEL'].map((h) => (
                  <th key={h} className="px-3 py-2 font-mono text-[8.5px] font-normal uppercase tracking-[0.14em] text-ink-ghost">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.snapshot.vehicles.map((v) => {
                const route = model.routeDerivedById[v.routeId]
                return (
                  <tr key={v.id} className="border-b border-hair/60 transition-colors last:border-0 hover:bg-white/[0.03]">
                    <td className="px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-ink">{v.code}</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tracking-[0.08em] text-ink-faint">
                      {VEHICLE_KIND_LABEL[v.kind]}
                    </td>
                    <td className={`px-3 py-2 font-mono text-[9.5px] tracking-[0.12em] ${STATUS_TONE[v.status]}`}>
                      {VEHICLE_STATUS_LABEL[v.status]}
                    </td>
                    <td className="w-[132px] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Meter value={v.utilization * 100} tone={v.utilization > 0.9 ? 'warn' : 'signal'} className="w-16" showHead={false} />
                        <span className="data-value text-[9.5px] text-ink-dim">{Math.round(v.utilization * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">
                      {v.loadT.toFixed(1)} / {v.capacityT} T
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tracking-[0.08em] text-ink-faint">
                      {v.routeId}
                      {route && (
                        <span
                          className="ml-1.5"
                          style={{ color: route.status === 'blocked' ? '#E2595B' : route.status === 'congested' ? '#E5B44C' : '#8B939E' }}
                        >
                          {route.status.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tracking-[0.08em] text-ink-faint">
                      {model.derivedById[v.destinationId]?.facility.shortName ?? v.destinationId}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-dim">
                      {v.etaMin === 0 ? 'ON SITE' : `${v.etaMin} MIN`}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-ghost">{v.fuel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle code="8 ZONES">COLLECTION SERVICE</SectionTitle>
        <div className="overflow-x-auto border border-hair">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hair bg-white/[0.02]">
                {['ZONE', 'GENERATED', 'COLLECTED', 'UNCOLLECTED', 'RATE', 'FREQUENCY', 'VEHICLES', 'AVG CAP'].map((h) => (
                  <th key={h} className="px-3 py-2 font-mono text-[8.5px] font-normal uppercase tracking-[0.14em] text-ink-ghost">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => {
                const c = z.collection
                return (
                  <tr
                    key={z.facility.id}
                    onClick={() => openZone(z.facility.id)}
                    className="cursor-pointer border-b border-hair/60 transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5" style={{ background: NODE_STATE_COLOR_HEX[z.state] }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink">{z.facility.shortName}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">{formatNumber(c?.generatedT ?? 0)} T</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-dim">{formatNumber(c?.collectedT ?? 0)} T</td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-warn/90">{formatNumber(c?.uncollectedT ?? 0)} T</td>
                    <td className="w-[140px] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Meter
                          value={z.utilizationPct}
                          tone={z.state === 'critical' ? 'critical' : z.state === 'warning' ? 'warn' : 'signal'}
                          className="w-14"
                          showHead={false}
                        />
                        <span className="data-value text-[9.5px] text-ink-dim">{z.utilizationPct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[9px] tracking-[0.08em] text-ink-ghost">
                      {z.facility.collection?.frequency}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">
                      {z.facility.collection?.vehicleCount}
                    </td>
                    <td className="px-3 py-2 font-mono text-[9.5px] tabular-nums text-ink-faint">
                      {z.facility.collection?.avgVehicleCapacityT} T
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle code="10 NODES">FACILITY STATE</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {processNodes.map((d) => (
            <button
              key={d.facility.id}
              onClick={() => openZone(d.facility.id)}
              className="focus-ring group border border-hair bg-white/[0.015] px-3 py-2.5 text-left transition-colors hover:border-hair2 hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5" style={{ background: NODE_STATE_COLOR_HEX[d.state] }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink">{d.facility.shortName}</span>
                <span className="ml-auto font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">{d.facility.code}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="data-value text-[14px] text-ink-dim">
                  {formatNumber(d.inflow)}
                  <span className="ml-1 font-mono text-[8.5px] text-ink-ghost">T/DAY IN</span>
                </span>
                <span className="data-value text-[11px] text-ink-faint">{d.utilizationPct.toFixed(1)}% UTIL</span>
              </div>
              <Meter
                value={d.utilizationPct}
                tone={d.state === 'critical' ? 'critical' : d.state === 'warning' ? 'warn' : 'signal'}
                className="mt-2"
              />
              <div className="mt-1.5 flex justify-between font-mono text-[8.5px] tracking-[0.1em] text-ink-ghost">
                <span>QUEUE {d.facility.waiting} MIN</span>
                <span>PROCESS {d.facility.processingTimeMin} MIN</span>
              </div>
              {d.overCapacity && (
                <div className="mt-1.5 flex items-center gap-1.5 border border-critical/35 bg-critical/[0.08] px-2 py-1">
                  <span className="h-1.5 w-1.5 animate-status-pulse bg-critical" />
                  <span className="font-mono text-[8.5px] tracking-[0.1em] text-critical/90">
                    BACKLOG {formatNumber(d.backlogT)} T/DAY — OVER CAPACITY
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </ModuleShell>
  )
}
