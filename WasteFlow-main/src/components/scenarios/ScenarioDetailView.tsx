import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  BookOpen, 
  RotateCcw, 
  Copy, 
  Trash2, 
  ExternalLink,
} from 'lucide-react';
import { ScenarioDetailData } from '../../engine/scenarioTypes';
import { ScenarioChangeSummary } from './ScenarioChangeSummary';
import { BeforeAfterDigitalTwin } from './BeforeAfterDigitalTwin';
import { FlowTransformation } from './FlowTransformation';
import { BeforeAfterMetricTable } from './BeforeAfterMetricTable';
import { BottleneckTransformation } from './BottleneckTransformation';
import { RootCauseTransformation } from './RootCauseTransformation';
import { EnvironmentalImpactPanel } from './EnvironmentalImpactPanel';
import { TradeoffPanel } from './TradeoffPanel';
import { ScenarioTimeline } from './ScenarioTimeline';
import { ScenarioReplayModal } from './ScenarioReplayModal';
import { ScenarioStoryModal } from './ScenarioStoryModal';

interface ScenarioDetailViewProps {
  scenario: ScenarioDetailData;
  onBack: () => void;
  onOpenInSimulation: (scenario: ScenarioDetailData) => void;
  onDuplicate: (scenario: ScenarioDetailData) => void;
  onDelete: (scenarioId: string) => void;
  onResetToBaseline: () => void;
}

export const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({
  scenario,
  onBack,
  onOpenInSimulation,
  onDuplicate,
  onDelete,
  onResetToBaseline,
}) => {
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Library</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{scenario.scenarioName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {scenario.status}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Scenario ID: <span className="font-mono text-white/40">{scenario.scenarioId}</span> • Target:{' '}
              <span className="text-white/80">{scenario.targetFacilityName || 'System-wide'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Replay Button */}
          <button
            onClick={() => setShowReplayModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play size={14} className="fill-black" />
            <span>Replay Scenario</span>
          </button>

          {/* Story Mode */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <BookOpen size={14} className="text-purple-400" />
            <span>Story Mode</span>
          </button>

          {/* Open in Simulation Lab */}
          <button
            onClick={() => onOpenInSimulation(scenario)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <ExternalLink size={14} className="text-blue-400" />
            <span>Open in Simulation</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={() => onDuplicate(scenario)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Duplicate scenario"
          >
            <Copy size={14} />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Reset To Baseline */}
          <button
            onClick={onResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Clear simulation overrides on Digital Twin"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete scenario "${scenario.scenarioName}"?`)) {
                onDelete(scenario.scenarioId);
                onBack();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer"
            title="Delete scenario"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 1. SCENARIO CHANGE SUMMARY ("WHAT CHANGED?", "WHY?", "RESULT") */}
      <ScenarioChangeSummary scenario={scenario} />

      {/* 2. CENTERPIECE: BEFORE vs AFTER DIGITAL TWIN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Digital Twin Dynamic Substrate</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                CURRENT vs SCENARIO
              </span>
            </h3>
            <p className="text-xs text-white/50">
              Interactive split / slider comparison of live network vs scenario interventions.
            </p>
          </div>
        </div>
        <BeforeAfterDigitalTwin scenario={scenario} />
      </div>

      {/* 3. FLOW TRANSFORMATION (ANIMATED PIPELINE) */}
      <FlowTransformation scenario={scenario} />

      {/* 4. 11-METRIC SYSTEM COMPARISON & VISUAL IMPACT BARS */}
      <BeforeAfterMetricTable scenario={scenario} />

      {/* 5. BOTTLENECK & ROOT-CAUSE TRANSFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BottleneckTransformation scenario={scenario} />
        <RootCauseTransformation scenario={scenario} />
      </div>

      {/* 6. ENVIRONMENTAL IMPACT & TRADEOFF PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnvironmentalImpactPanel scenario={scenario} />
        <TradeoffPanel scenario={scenario} />
      </div>

      {/* 7. SCENARIO TIMELINE */}
      <ScenarioTimeline scenario={scenario} />

      {/* MODALS */}
      {showReplayModal && (
        <ScenarioReplayModal
          scenario={scenario}
          onClose={() => setShowReplayModal(false)}
        />
      )}

      {showStoryModal && (
        <ScenarioStoryModal
          scenario={scenario}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </div>
  );
};
