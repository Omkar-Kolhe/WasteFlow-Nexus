import React, { useState, useMemo } from 'react'
import {
  Presentation,
  RotateCcw,
  MapPin,
  GitBranch,
} from 'lucide-react'
import { useTwinModel, useBaselineTwinModel } from '@/hooks/useTwinModel'
import { useTwinStore } from '@/state/twinStore'
import { calculateEnvironmentalIntelligence } from '@/engine/environmentalDashboardEngine'
import { generateCanonicalScenarios, convertSnapshotToScenarioDetail } from '@/engine/scenarioEngine'
import type { ScenarioDetailData } from '@/engine/scenarioTypes'

import { ExecutiveMetrics } from './ExecutiveMetrics'
import { EnvironmentalHealthRadar } from './EnvironmentalHealthRadar'
import { WasteDestinationFlow } from './WasteDestinationFlow'
import { RecoveryPanel } from './RecoveryPanel'
import { LandfillPanel } from './LandfillPanel'
import { CarbonFuelIntelligence } from './CarbonFuelIntelligence'
import { BottleneckEnvironmentalImpact } from './BottleneckEnvironmentalImpact'
import { EnvironmentalTrends } from './EnvironmentalTrends'
import { EnvironmentalHotspots } from './EnvironmentalHotspots'
import { ScenarioEnvironmentalComparison } from './ScenarioEnvironmentalComparison'
import { EnvironmentalKPIPrioritizedGrid } from './EnvironmentalKPIPrioritizedGrid'
import { EnvironmentalStoryModal } from './EnvironmentalStoryModal'
import { DataTransparencySection } from './DataTransparencySection'

export const EnvironmentalDashboard: React.FC = () => {
  const liveModel = useTwinModel()
  const baselineModel = useBaselineTwinModel()
  const setView = useTwinStore((s) => s.setView)
  const setSimulationModel = useTwinStore((s) => s.setSimulationModel)
  const savedScenarios = useTwinStore((s) => s.savedScenarios)
  const savedOptimizationScenarios = useTwinStore((s) => s.savedOptimizationScenarios)

  // Presentation Story Modal state
  const [showStoryModal, setShowStoryModal] = useState(false)

  // Scenario Overlay Toggle state
  const [isScenarioOverlayActive, setIsScenarioOverlayActive] = useState(false)

  // Load scenarios for comparison
  const allScenarios = useMemo<ScenarioDetailData[]>(() => {
    const list: ScenarioDetailData[] = []

    if (savedScenarios && savedScenarios.length > 0) {
      for (const snap of savedScenarios) {
        try {
          list.push(convertSnapshotToScenarioDetail(snap, baselineModel))
        } catch (e) {
          console.error(e)
        }
      }
    }

    if (savedOptimizationScenarios && savedOptimizationScenarios.length > 0) {
      for (const opt of savedOptimizationScenarios) {
        try {
          list.push(convertSnapshotToScenarioDetail(opt, baselineModel))
        } catch (e) {
          console.error(e)
        }
      }
    }

    if (list.length === 0) {
      list.push(...generateCanonicalScenarios(baselineModel))
    }

    return list
  }, [savedScenarios, savedOptimizationScenarios, baselineModel])

  const [selectedScenario, setSelectedScenario] = useState<ScenarioDetailData | null>(
    allScenarios[0] || null
  )

  // Run Environmental Intelligence Engine on live model
  const intelligence = useMemo(() => {
    return calculateEnvironmentalIntelligence(liveModel)
  }, [liveModel])

  // If scenario overlay is active, adjust displayed summary metrics to reflect scenario outcome
  const effectiveSummary = useMemo(() => {
    if (!isScenarioOverlayActive || !selectedScenario) {
      return intelligence.summary
    }

    const sim = selectedScenario.simulatedMetrics
    const impact = selectedScenario.environmentalImpact

    return {
      ...intelligence.summary,
      totalCollectedT: sim.wasteCollectedT,
      totalProcessedT: sim.wasteProcessedT,
      totalRecoveredT: sim.wasteRecoveredT,
      totalLandfillT: sim.wasteToLandfillT,
      recoveryRatePct: Number(sim.recoveryRatePct.toFixed(1)),
      landfillDependencyPct: Number(((sim.wasteToLandfillT / sim.wasteCollectedT) * 100).toFixed(1)),
      totalCo2eKg: sim.co2eKg,
      totalCo2eT: Number((sim.co2eKg / 1000).toFixed(2)),
      transportCo2eKg: sim.transportCo2eKg,
      transportCo2eT: Number((sim.transportCo2eKg / 1000).toFixed(2)),
      facilityCo2eKg: sim.facilityCo2eKg,
      facilityCo2eT: Number((sim.facilityCo2eKg / 1000).toFixed(2)),
      totalFuelLiters: sim.fuelLiters,
      totalTrips: sim.tripsToday,
      backlogT: sim.backlogT,
      periodChanges: {
        recoveryPctDelta: Number(impact.recoveryDeltaPct.toFixed(1)),
        landfillTDeltaPct: Number(impact.landfillDeltaPct.toFixed(1)),
        co2eDeltaPct: Number(impact.co2eDeltaPct.toFixed(1)),
        fuelDeltaPct: Number(impact.fuelDeltaPct.toFixed(1)),
        tripsDeltaPct: Number(impact.tripsDeltaPct.toFixed(1)),
        waitingDeltaPct: Number(impact.backlogDeltaPct.toFixed(1)),
      },
    }
  }, [isScenarioOverlayActive, selectedScenario, intelligence.summary])

  const handleToggleScenarioOverlay = () => {
    setIsScenarioOverlayActive(!isScenarioOverlayActive)
  }

  const handleResetToBaseline = () => {
    setIsScenarioOverlayActive(false)
    setSimulationModel(null)
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 animate-fade-in font-sans pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold text-white tracking-tight">ENVIRONMENTAL INTELLIGENCE</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              EXECUTIVE CONSOLE
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            See the environmental consequences of every movement in the waste network.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Story Mode */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Presentation size={14} className="text-emerald-400" />
            <span>Story Mode</span>
          </button>

          {/* Scenario Overlay Toggle */}
          <button
            onClick={handleToggleScenarioOverlay}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
              isScenarioOverlayActive
                ? 'bg-purple-500 text-black border-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
            }`}
          >
            <GitBranch size={13} />
            <span>{isScenarioOverlayActive ? '● SCENARIO ACTIVE' : 'OVERLAY SCENARIO'}</span>
          </button>

          {/* Inspect on Digital Twin */}
          <button
            onClick={() => setView('twin')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <MapPin size={13} className="text-teal-400" />
            <span>Digital Twin</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Reset to live baseline state"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 2. Executive Summary Cards */}
      <ExecutiveMetrics
        summary={effectiveSummary}
        scenarioActive={isScenarioOverlayActive}
        scenarioName={selectedScenario?.scenarioName}
      />

      {/* 3. Central 5-Axis Environmental Health Matrix */}
      <EnvironmentalHealthRadar summary={effectiveSummary} />

      {/* 4. Waste Destination Flow (Mass Balance Cascade) */}
      <WasteDestinationFlow stages={intelligence.wasteFlowStages} />

      {/* 5 & 6. Recovery Analytics & Landfill Dependency Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryPanel summary={effectiveSummary} />
        <LandfillPanel summary={effectiveSummary} />
      </div>

      {/* 7 & 8. CO₂e & Fuel Intelligence */}
      <CarbonFuelIntelligence summary={effectiveSummary} />

      {/* 9. Top Bottlenecks with Environmental Impact */}
      <BottleneckEnvironmentalImpact bottlenecks={intelligence.topBottlenecks} />

      {/* 10 & 11. Temporal Trends & Observations */}
      <EnvironmentalTrends
        trendData={intelligence.trendData}
        insights={intelligence.trendInsights}
      />

      {/* 12. Digital Twin Environmental Hotspots */}
      <EnvironmentalHotspots hotspots={intelligence.hotspots} />

      {/* 13, 14, 15 & 18. Scenario Arbitrage, Timeline & Opportunities */}
      <ScenarioEnvironmentalComparison
        scenarios={allScenarios}
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
        isScenarioOverlayActive={isScenarioOverlayActive}
        onToggleScenarioOverlay={handleToggleScenarioOverlay}
        opportunities={intelligence.opportunities}
        summary={intelligence.summary}
      />

      {/* 16 & 17. Prioritized KPI Scorecard & Historical Period Deltas */}
      <EnvironmentalKPIPrioritizedGrid summary={effectiveSummary} />

      {/* 20. Calculation Transparency & Methodology */}
      <DataTransparencySection />

      {/* Story Mode Modal */}
      {showStoryModal && (
        <EnvironmentalStoryModal
          summary={effectiveSummary}
          scenario={selectedScenario}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </div>
  )
}
