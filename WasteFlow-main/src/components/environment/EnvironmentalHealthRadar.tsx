import React from 'react'
import { ShieldCheck, Info } from 'lucide-react'
import type { EnvironmentalMetricSummary } from '@/engine/environmentalDashboardEngine'

interface EnvironmentalHealthRadarProps {
  summary: EnvironmentalMetricSummary
}

export const EnvironmentalHealthRadar: React.FC<EnvironmentalHealthRadarProps> = ({ summary }) => {
  const { healthDimensions } = summary

  const dimensions = [
    {
      key: 'recovery',
      label: 'RECOVERY RATE',
      score: healthDimensions.recoveryScore,
      value: `${summary.recoveryRatePct}%`,
      benchmark: '75.0% Municipal Target',
      status: summary.recoveryRatePct >= 70 ? 'GOOD' : 'IMPROVEMENT NEEDED',
      color: '#4FE3C1', // electric green
      metricNote: 'Share of collected waste recovered into circular material streams',
    },
    {
      key: 'landfill',
      label: 'LANDFILL AVERSION',
      score: healthDimensions.landfillAversionScore,
      value: `${(100 - summary.landfillDependencyPct).toFixed(1)}%`,
      benchmark: '< 25.0% Landfill Dependency',
      status: summary.landfillDependencyPct <= 30 ? 'NORMAL' : 'HIGH DEPENDENCY',
      color: '#38BDF8', // cyan
      metricNote: 'Inverse dependency on open dumping at Deonar dumpsite',
    },
    {
      key: 'carbon',
      label: 'CARBON CONTROL',
      score: healthDimensions.carbonEfficiencyScore,
      value: `${summary.totalCo2eT} T/day`,
      benchmark: '< 7.5 T/day city target',
      status: summary.totalCo2eT <= 8.5 ? 'STABLE' : 'ELEVATED',
      color: '#FBBF24', // amber
      metricNote: 'Transport haulage emissions + facility mechanical footprint',
    },
    {
      key: 'fuel',
      label: 'FUEL EFFICIENCY',
      score: healthDimensions.fuelEfficiencyScore,
      value: `${summary.fuelPerTonneLiters} L/T`,
      benchmark: '< 0.40 L/Tonne haulage',
      status: summary.fuelPerTonneLiters <= 0.45 ? 'OPTIMAL' : 'DETOUR OVERHEAD',
      color: '#A855F7', // purple
      metricNote: 'Diesel fuel burnt per collected and transferred tonne of waste',
    },
    {
      key: 'wasteflow',
      label: 'FLOW VELOCITY',
      score: healthDimensions.wasteFlowPacingScore,
      value: `${summary.backlogT} T backlog`,
      benchmark: '0 T queue backlog',
      status: summary.backlogT < 100 ? 'CLEAR' : 'SORTING BACKLOG',
      color: '#F43F5E', // controlled red/rose
      metricNote: 'Throughput velocity and absence of queue delays at processing gates',
    },
  ]

  // Calculate SVG polygon points for radar chart (5 vertices)
  const size = 260
  const center = size / 2
  const radius = 95
  const angleStep = (Math.PI * 2) / dimensions.length

  const getCoordinates = (index: number, score: number) => {
    const angle = index * angleStep - Math.PI / 2
    const dist = (score / 100) * radius
    const x = center + dist * Math.cos(angle)
    const y = center + dist * Math.sin(angle)
    return { x, y }
  }

  // Data polygon points
  const polygonPoints = dimensions
    .map((dim, i) => {
      const { x, y } = getCoordinates(i, dim.score)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  // Background grid concentric rings (20%, 40%, 60%, 80%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0]

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              SYSTEM INTEGRITY MATRIX
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/60">
              5-AXIS ENVIRONMENTAL HEALTH
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Holistic multi-dimensional evaluation. System performance is never hidden behind a single unexplained figure.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-right">
            <span className="text-[9px] font-mono text-white/40 block">COMPOSITE INDEX</span>
            <span className="text-sm font-bold font-mono text-white">
              {healthDimensions.overallCompositeScore}
              <span className="text-white/40 text-xs font-normal"> / 100</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar SVG Visualizer */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3">
          <div className="relative">
            <svg width={size} height={size} className="overflow-visible">
              {/* Concentric grid rings */}
              {gridRings.map((scale, idx) => (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius * scale}
                  fill="none"
                  stroke="rgb(var(--color-ink) / 0.08)"
                  strokeDasharray={scale === 1 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
              ))}

              {/* Axis rays */}
              {dimensions.map((_, i) => {
                const { x, y } = getCoordinates(i, 100)
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="rgb(var(--color-ink) / 0.12)"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Data Radar Polygon */}
              <polygon
                points={polygonPoints}
                fill="rgba(79, 227, 193, 0.15)"
                stroke="#4FE3C1"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Radar Data Points */}
              {dimensions.map((dim, i) => {
                const { x, y } = getCoordinates(i, dim.score)
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={dim.color}
                    stroke="rgb(var(--color-panel))"
                    strokeWidth="1.5"
                  />
                )
              })}

              {/* Center point */}
              <circle cx={center} cy={center} r="2.5" fill="rgb(var(--color-ink) / 0.4)" />
            </svg>

            {/* Micro Axis Labels */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                OPTIMAL BUFFER
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 mt-1">
            <Info size={11} />
            <span>Outer ring represents 100% policy compliance benchmark</span>
          </div>
        </div>

        {/* Dimension Breakdown Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              className="p-3 rounded-xl bg-white/[0.015] border border-white/5 hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 font-medium">
                  {dim.label}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
                  style={{
                    backgroundColor: `${dim.color}15`,
                    color: dim.color,
                  }}
                >
                  {dim.score} / 100
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-white font-mono">{dim.value}</span>
                <span className="text-[10px] text-white/40 font-mono">{dim.benchmark}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dim.score}%`,
                    backgroundColor: dim.color,
                  }}
                />
              </div>

              <p className="text-[10px] text-white/45 mt-2 line-clamp-1" title={dim.metricNote}>
                {dim.metricNote}
              </p>
            </div>
          ))}

          {/* Verification Badge */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block uppercase">
                ENGINE AUDITED
              </span>
              <p className="text-[10.5px] text-white/60">
                Calculations synchronized with real-time route mechanics & plant sensors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
