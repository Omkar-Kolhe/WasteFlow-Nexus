import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';
import { useTwinStore } from '../../state/twinStore';
import { useBaselineTwinModel } from '../../hooks/useTwinModel';
import { ScenarioDetailData } from '../../engine/scenarioTypes';
import { 
  generateCanonicalScenarios, 
  convertSnapshotToScenarioDetail, 
  duplicateScenario 
} from '../../engine/scenarioEngine';
import { ScenarioLibrary } from './ScenarioLibrary';
import { ScenarioDetailView } from './ScenarioDetailView';
import { MultiScenarioComparisonModal } from './MultiScenarioComparisonModal';

export const ScenarioLab: React.FC = () => {
  const liveModel = useBaselineTwinModel();
  const setView = useTwinStore((s) => s.setView);
  const setSimulationModel = useTwinStore((s) => s.setSimulationModel);
  const setSimulationParameters = useTwinStore((s) => s.setSimulationParameters);
  const setSimulationState = useTwinStore((s) => s.setSimulationState);
  
  const savedScenarios = useTwinStore((s) => s.savedScenarios);
  const savedOptimizationScenarios = useTwinStore((s) => s.savedOptimizationScenarios);
  const deleteScenario = useTwinStore((s) => s.deleteScenario);
  const deleteOptimizationScenario = useTwinStore((s) => s.deleteOptimizationScenario);

  // Selected scenario for detail view
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Multi-comparison selection
  const [selectedForCompareIds, setSelectedForCompareIds] = useState<string[]>([]);
  const [showMultiCompareModal, setShowMultiCompareModal] = useState(false);

  // Local copy of generated canonical / duplicated scenarios
  const [localCustomScenarios, setLocalCustomScenarios] = useState<ScenarioDetailData[]>(() => {
    try {
      const stored = localStorage.getItem('wasteflow_custom_scenarios_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save local custom scenarios to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wasteflow_custom_scenarios_v1', JSON.stringify(localCustomScenarios));
    } catch (e) {
      console.warn('Failed to save custom scenarios to localStorage', e);
    }
  }, [localCustomScenarios]);

  // Aggregate all scenarios: canonical + saved Phase 6 + saved Phase 7 + custom/duplicated
  const allScenarios = useMemo<ScenarioDetailData[]>(() => {
    const list: ScenarioDetailData[] = [];

    // 1. Converted from Phase 6 saved snapshots
    if (savedScenarios && savedScenarios.length > 0) {
      for (const snap of savedScenarios) {
        try {
          const detail = convertSnapshotToScenarioDetail(snap, liveModel);
          list.push(detail);
        } catch (e) {
          console.error('Error converting saved scenario', e);
        }
      }
    }

    // 2. Converted from Phase 7 saved optimization scenarios
    if (savedOptimizationScenarios && savedOptimizationScenarios.length > 0) {
      for (const opt of savedOptimizationScenarios) {
        try {
          const detail = convertSnapshotToScenarioDetail(opt, liveModel);
          list.push(detail);
        } catch (e) {
          console.error('Error converting saved optimization scenario', e);
        }
      }
    }

    // 3. User custom / duplicated scenarios
    list.push(...localCustomScenarios);

    // 4. If no scenarios exist, seed with canonical benchmark scenarios
    if (list.length === 0) {
      const canonicals = generateCanonicalScenarios(liveModel);
      list.push(...canonicals);
    }

    return list;
  }, [savedScenarios, savedOptimizationScenarios, localCustomScenarios, liveModel]);

  // Currently selected scenario data
  const selectedScenario = useMemo(() => {
    if (!selectedScenarioId) return null;
    return allScenarios.find((s) => s.scenarioId === selectedScenarioId) || null;
  }, [allScenarios, selectedScenarioId]);

  // Scenarios selected for multi-comparison
  const multiCompareList = useMemo(() => {
    return allScenarios.filter((s) => selectedForCompareIds.includes(s.scenarioId));
  }, [allScenarios, selectedForCompareIds]);

  // Handlers
  const handleOpenScenario = (scenario: ScenarioDetailData) => {
    setSelectedScenarioId(scenario.scenarioId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (scenarioId: string) => {
    setSelectedForCompareIds((prev) => {
      if (prev.includes(scenarioId)) {
        return prev.filter((id) => id !== scenarioId);
      } else {
        if (prev.length >= 3) {
          alert('You can compare up to 3 scenarios alongside the baseline system.');
          return prev;
        }
        return [...prev, scenarioId];
      }
    });
  };

  const handleDelete = (scenarioId: string) => {
    deleteScenario(scenarioId);
    deleteOptimizationScenario(scenarioId);
    setLocalCustomScenarios((prev) => prev.filter((s) => s.scenarioId !== scenarioId));
    if (selectedScenarioId === scenarioId) {
      setSelectedScenarioId(null);
    }
    setSelectedForCompareIds((prev) => prev.filter((id) => id !== scenarioId));
  };

  const handleDuplicate = (scenario: ScenarioDetailData) => {
    const dup = duplicateScenario(scenario);
    setLocalCustomScenarios((prev) => [dup, ...prev]);
    setSelectedScenarioId(dup.scenarioId);
  };

  const handleOpenInSimulation = (scenario: ScenarioDetailData) => {
    setSimulationParameters(scenario.simulationParameters);
    setSimulationState('editing');
    setView('simulation');
  };

  const handleResetToBaseline = () => {
    setSimulationModel(null);
  };

  const handleRestoreDefaults = () => {
    const canonicals = generateCanonicalScenarios(liveModel);
    setLocalCustomScenarios(canonicals);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* Detail View Mode */}
      {selectedScenario ? (
        <ScenarioDetailView
          scenario={selectedScenario}
          onBack={() => {
            setSelectedScenarioId(null);
            setSimulationModel(null);
          }}
          onOpenInSimulation={handleOpenInSimulation}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onResetToBaseline={handleResetToBaseline}
        />
      ) : (
        /* Library Mode */
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-xl font-bold text-white tracking-tight">Scenario Testing Library</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {allScenarios.length} SCENARIOS
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Explore how operational decisions, capacity shifts, and dynamic rerouting reshape the waste network.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Compare Button */}
              {selectedForCompareIds.length >= 2 && (
                <button
                  onClick={() => setShowMultiCompareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-lg shadow-purple-500/10 cursor-pointer"
                >
                  <Scale size={15} />
                  <span>Compare Selected ({selectedForCompareIds.length})</span>
                </button>
              )}

              {/* Reset Substrate to Live Baseline */}
              <button
                onClick={handleResetToBaseline}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                title="Ensure digital twin is showing live baseline"
              >
                <RotateCcw size={13} />
                <span>Reset Map Substrate</span>
              </button>

              {/* Seed/Reload Benchmark Scenarios */}
              <button
                onClick={handleRestoreDefaults}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Reload Benchmarks</span>
              </button>
            </div>
          </div>

          {/* Scenario Library Component */}
          <ScenarioLibrary
            scenarios={allScenarios}
            onOpenScenario={handleOpenScenario}
            onToggleCompare={handleToggleCompare}
            comparedIds={selectedForCompareIds}
            onOpenComparisonModal={() => setShowMultiCompareModal(true)}
            onDuplicateScenario={handleDuplicate}
            onDeleteScenario={handleDelete}
            onRestoreDefaults={handleRestoreDefaults}
          />
        </div>
      )}

      {/* Multi-Scenario Comparison Modal */}
      {showMultiCompareModal && (
        <MultiScenarioComparisonModal
          scenarios={multiCompareList}
          onClose={() => setShowMultiCompareModal(false)}
          onSelectScenario={(sc) => {
            setShowMultiCompareModal(false);
            handleOpenScenario(sc);
          }}
        />
      )}
    </div>
  );
};
