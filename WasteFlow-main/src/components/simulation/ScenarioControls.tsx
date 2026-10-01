import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Factory,
  Layers,
  Leaf,
  Network,
  RotateCcw,
  Sliders,
  Truck,
  Zap,
} from 'lucide-react'
import type { SimulationParameters } from '@/engine/simulationTypes'
import { cn, formatNumber } from '@/lib/utils'

interface ScenarioControlsProps {
  parameters: SimulationParameters
  onChange: (params: Partial<SimulationParameters>) => void
  onReset: () => void
}

export function ScenarioControls({
  parameters,
  onChange,
  onReset,
}: ScenarioControlsProps) {
  // Accordion section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fleet: true,
    sorting: true,
    processing: false,
    recovery: false,
    transfer: false,
    routes: true,
    collection: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-3">
      {/* Control Header with Reset */}
      <div className="flex items-center justify-between border-b border-hair pb-2">
        <div className="flex items-center gap-1.5">
          <Sliders size={12} className="text-signal" />
          <span className="label-tech text-[8.5px]">SCENARIO OPERATIONAL CONTROLS</span>
        </div>
        <button
          onClick={onReset}
          className="focus-ring flex items-center gap-1 border border-hair px-2 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-ink-ghost transition-colors hover:border-hair2 hover:text-ink"
        >
          <RotateCcw size={9} />
          RESET ALL
        </button>
      </div>

      {/* ── SECTION A: FLEET & VEHICLES ──────────────────────── */}
      <ControlSection
        title="FLEET & VEHICLES"
        icon={<Truck size={12} className="text-signal" />}
        isOpen={openSections.fleet}
        onToggle={() => toggleSection('fleet')}
        badge={`${parameters.fleetCountDelta >= 0 ? '+' : ''}${parameters.fleetCountDelta} TRUCKS`}
      >
        <SliderControl
          label="Active Fleet Units Delta"
          baseline="0 trucks (89 total)"
          simulated={`${parameters.fleetCountDelta >= 0 ? '+' : ''}${parameters.fleetCountDelta} trucks (${89 + parameters.fleetCountDelta} total)`}
          value={parameters.fleetCountDelta}
          min={-15}
          max={30}
          step={1}
          onChange={(val) => onChange({ fleetCountDelta: val })}
        />

        <SliderControl
          label="Vehicle Payload Multiplier"
          baseline="1.00x nominal (12T–20T)"
          simulated={`${parameters.vehiclePayloadMultiplier.toFixed(2)}x nominal (${Math.round(12 * parameters.vehiclePayloadMultiplier)}T–${Math.round(20 * parameters.vehiclePayloadMultiplier)}T)`}
          value={parameters.vehiclePayloadMultiplier}
          min={0.8}
          max={1.5}
          step={0.05}
          onChange={(val) => onChange({ vehiclePayloadMultiplier: val })}
        />

        <SliderControl
          label="Electric Fleet Share"
          baseline="15% electric / hybrid"
          simulated={`${parameters.electricFleetSharePct}% electric haulage`}
          value={parameters.electricFleetSharePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(val) => onChange({ electricFleetSharePct: val })}
        />
      </ControlSection>

      {/* ── SECTION B: SORTING FACILITIES ────────────────────── */}
      <ControlSection
        title="SORTING INFRASTRUCTURE"
        icon={<Factory size={12} className="text-critical" />}
        isOpen={openSections.sorting}
        onToggle={() => toggleSection('sorting')}
        badge={`${formatNumber(parameters.kanjurmargSortingCapacity)} T/D S-KJ`}
      >
        <SliderControl
          label="Kanjurmarg Sorting Capacity"
          baseline="3,500 T/day (Currently Overloaded)"
          simulated={`${formatNumber(parameters.kanjurmargSortingCapacity)} T/day (${parameters.kanjurmargSortingCapacity > 3500 ? `+${Math.round(((parameters.kanjurmargSortingCapacity - 3500) / 3500) * 100)}%` : 'Base'})`}
          value={parameters.kanjurmargSortingCapacity}
          min={2500}
          max={5500}
          step={50}
          onChange={(val) => onChange({ kanjurmargSortingCapacity: val })}
        />

        <SliderControl
          label="Deonar Sorting Capacity"
          baseline="3,600 T/day"
          simulated={`${formatNumber(parameters.deonarSortingCapacity)} T/day`}
          value={parameters.deonarSortingCapacity}
          min={2500}
          max={5500}
          step={50}
          onChange={(val) => onChange({ deonarSortingCapacity: val })}
        />

        <SliderControl
          label="Sorting Operating Hours (Shifts)"
          baseline="8 hours / day (Single Shift)"
          simulated={`${parameters.sortingOperatingHours} hours / day (${parameters.sortingOperatingHours >= 16 ? 'Double/Triple Shift' : parameters.sortingOperatingHours > 8 ? 'Extended Shift' : 'Single Shift'})`}
          value={parameters.sortingOperatingHours}
          min={8}
          max={24}
          step={2}
          unit="hrs"
          onChange={(val) => onChange({ sortingOperatingHours: val })}
        />
      </ControlSection>

      {/* ── SECTION C: PROCESSING & AD PLANTS ─────────────────── */}
      <ControlSection
        title="ORGANIC PROCESSING & BIOGAS"
        icon={<Leaf size={12} className="text-signal" />}
        isOpen={openSections.processing}
        onToggle={() => toggleSection('processing')}
        badge={`${formatNumber(parameters.kanjurmargProcessingCapacity)} T/D AD`}
      >
        <SliderControl
          label="Kanjurmarg Anaerobic Digestion Capacity"
          baseline="1,150 T/day"
          simulated={`${formatNumber(parameters.kanjurmargProcessingCapacity)} T/day`}
          value={parameters.kanjurmargProcessingCapacity}
          min={800}
          max={2200}
          step={50}
          onChange={(val) => onChange({ kanjurmargProcessingCapacity: val })}
        />

        <SliderControl
          label="Trombay Processing Capacity"
          baseline="1,200 T/day"
          simulated={`${formatNumber(parameters.trombayProcessingCapacity)} T/day`}
          value={parameters.trombayProcessingCapacity}
          min={800}
          max={2200}
          step={50}
          onChange={(val) => onChange({ trombayProcessingCapacity: val })}
        />
      </ControlSection>

      {/* ── SECTION D: RECOVERY & CIRCULARITY ─────────────────── */}
      <ControlSection
        title="RECOVERY & CIRCULARITY"
        icon={<Zap size={12} className="text-amber-400" />}
        isOpen={openSections.recovery}
        onToggle={() => toggleSection('recovery')}
        badge={`${parameters.targetRecoveryRatePct.toFixed(1)}% RECOVERY`}
      >
        <SliderControl
          label="Target Material Recovery Rate"
          baseline="55.9% diversion"
          simulated={`${parameters.targetRecoveryRatePct.toFixed(1)}% diversion`}
          value={parameters.targetRecoveryRatePct}
          min={40}
          max={85}
          step={1}
          unit="%"
          onChange={(val) => onChange({ targetRecoveryRatePct: val })}
        />

        <SliderControl
          label="Kanjurmarg Recovery Works Capacity"
          baseline="1,900 T/day"
          simulated={`${formatNumber(parameters.kanjurmargRecoveryCapacity)} T/day`}
          value={parameters.kanjurmargRecoveryCapacity}
          min={1200}
          max={3200}
          step={50}
          onChange={(val) => onChange({ kanjurmargRecoveryCapacity: val })}
        />

        <SliderControl
          label="Deonar Recovery Works Capacity"
          baseline="2,600 T/day"
          simulated={`${formatNumber(parameters.deonarRecoveryCapacity)} T/day`}
          value={parameters.deonarRecoveryCapacity}
          min={1500}
          max={3800}
          step={50}
          onChange={(val) => onChange({ deonarRecoveryCapacity: val })}
        />
      </ControlSection>

      {/* ── SECTION E: ROUTES & LOGISTICS ────────────────────── */}
      <ControlSection
        title="ROUTES & ARTERIAL CORRIDORS"
        icon={<Network size={12} className="text-cyan-400" />}
        isOpen={openSections.routes}
        onToggle={() => toggleSection('routes')}
        badge={parameters.unblockSionCircleRoute ? 'SION CLEARED' : 'SION BLOCKED'}
      >
        <ToggleControl
          label="Unblock Sion Circle Corridor (RT-06)"
          description="Drain waterlogging and restore Kurla ward haulage corridor directly to Kanjurmarg."
          checked={parameters.unblockSionCircleRoute}
          onChange={(checked) => onChange({ unblockSionCircleRoute: checked })}
        />

        <ToggleControl
          label="Arterial Congestion Relief"
          description="Enforce dedicated green signal corridors for bulk transfer haulers during morning peak tides."
          checked={parameters.routeCongestionRelief}
          onChange={(checked) => onChange({ routeCongestionRelief: checked })}
        />

        <SliderControl
          label="Transit Route Distance Optimization"
          baseline="0% detour reduction"
          simulated={`${parameters.routeDistanceOptimizationPct}% distance savings`}
          value={parameters.routeDistanceOptimizationPct}
          min={0}
          max={25}
          step={1}
          unit="%"
          onChange={(val) => onChange({ routeDistanceOptimizationPct: val })}
        />
      </ControlSection>

      {/* ── SECTION F: TRANSFER STATIONS ─────────────────────── */}
      <ControlSection
        title="BULK TRANSFER STATIONS"
        icon={<Layers size={12} className="text-purple-400" />}
        isOpen={openSections.transfer}
        onToggle={() => toggleSection('transfer')}
      >
        <SliderControl
          label="Mulund Transfer Station"
          baseline="1,500 T/day"
          simulated={`${formatNumber(parameters.mulundTransferCapacity)} T/day`}
          value={parameters.mulundTransferCapacity}
          min={1000}
          max={2500}
          step={50}
          onChange={(val) => onChange({ mulundTransferCapacity: val })}
        />

        <SliderControl
          label="Kanjurmarg Central Transfer Station"
          baseline="4,600 T/day"
          simulated={`${formatNumber(parameters.kanjurmargTransferCapacity)} T/day`}
          value={parameters.kanjurmargTransferCapacity}
          min={3000}
          max={6500}
          step={50}
          onChange={(val) => onChange({ kanjurmargTransferCapacity: val })}
        />

        <SliderControl
          label="Deonar Southern Transfer Station"
          baseline="2,200 T/day"
          simulated={`${formatNumber(parameters.deonarTransferCapacity)} T/day`}
          value={parameters.deonarTransferCapacity}
          min={1500}
          max={3500}
          step={50}
          onChange={(val) => onChange({ deonarTransferCapacity: val })}
        />
      </ControlSection>
    </div>
  )
}

function ControlSection({
  title,
  icon,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-hair bg-white/[0.01]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-2.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-mono text-[9.5px] font-medium tracking-[0.06em] text-ink">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="border border-white/10 bg-white/[0.04] px-1.5 py-[1px] font-mono text-[7px] text-ink-ghost">
              {badge}
            </span>
          )}
          {isOpen ? <ChevronDown size={12} className="text-ink-ghost" /> : <ChevronRight size={12} className="text-ink-ghost" />}
        </div>
      </button>

      {isOpen && <div className="space-y-3.5 border-t border-hair/60 p-3">{children}</div>}
    </div>
  )
}

function SliderControl({
  label,
  baseline,
  simulated,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  baseline: string
  simulated: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between font-mono text-[8.5px]">
        <span className="text-ink">{label}</span>
        <span className="data-value text-[10px] text-signal font-semibold">
          {simulated}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none bg-white/[0.1] accent-signal focus:outline-none"
        />
        <span className="w-10 text-right font-mono text-[8px] text-ink-ghost">
          {value}
          {unit}
        </span>
      </div>

      <div className="flex justify-between font-mono text-[7px] text-ink-ghost">
        <span>Base: {baseline}</span>
        <span>Range: {min}–{max}</span>
      </div>
    </div>
  )
}

function ToggleControl({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 border border-hair/50 bg-white/[0.005] p-2">
      <div>
        <span className="font-mono text-[9px] font-medium text-ink">{label}</span>
        <p className="mt-0.5 text-[8px] leading-relaxed text-ink-faint">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          checked ? 'bg-signal' : 'bg-white/15',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-void shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
