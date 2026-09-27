import React from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Sliders, 
  Crosshair, 
  Activity, 
  Layers, 
  Clock, 
  Check, 
  AlertCircle,
  HelpCircle as QuestionIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MultiEvidence } from '../types/astra';

interface MultiEvidenceInspectorProps {
  evidence: MultiEvidence;
  confidenceThreshold: number;
  onThresholdChange: (value: number) => void;
  onTriggerConfirmationModal: () => void;
}

export const MultiEvidenceInspector: React.FC<MultiEvidenceInspectorProps> = ({
  evidence,
  confidenceThreshold,
  onThresholdChange,
  onTriggerConfirmationModal,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>03 — MULTI-EVIDENCE VERIFICATION FUSION</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cross-modality consensus prevents false positives from single-sensor occlusions
            </p>
          </div>
        </div>

        {/* Confidence Tier Tag */}
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
            evidence.decisionTier === 'HIGH_CONFIDENCE_AUTO' 
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
              : evidence.decisionTier === 'UNCERTAIN_CONFIRM'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>{evidence.decisionTier.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* 5 Evidence Streams Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Stream 1: YOLO Object Detection */}
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              1. YOLO Obj
            </span>
            <span className="font-bold text-cyan-400">{evidence.objectDetectionScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evidence.objectDetectionScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Red Container</span>
            <span className="text-emerald-400">IoU 0.88</span>
          </div>
        </div>

        {/* Stream 2: MediaPipe Pose */}
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              2. MP Pose
            </span>
            <span className="font-bold text-emerald-400">{evidence.poseConfidenceScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evidence.poseConfidenceScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>21 Hand Points</span>
            <span className="text-emerald-400">Flex 0.85</span>
          </div>
        </div>

        {/* Stream 3: Hand-Object Interaction (HOI) */}
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              3. HOI Grip
            </span>
            <span className="font-bold text-indigo-400">{evidence.handInteractionScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-indigo-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evidence.handInteractionScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Proximity &lt;15mm</span>
            <span className="text-emerald-400">Grasp: Contact</span>
          </div>
        </div>

        {/* Stream 4: Temporal Action Model (TCN) */}
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              4. TCN Action
            </span>
            <span className="font-bold text-purple-400">{evidence.temporalTcnScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-purple-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${evidence.temporalTcnScore}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Window 32f</span>
            <span className="text-purple-300">Class Match</span>
          </div>
        </div>

        {/* Stream 5: Protocol Graph Gate */}
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              5. Graph Gate
            </span>
            <span className={`font-bold ${evidence.protocolGraphMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evidence.protocolGraphMatch ? 'VALID' : 'BLOCKED'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                evidence.protocolGraphMatch ? 'bg-emerald-400 w-full' : 'bg-rose-500 w-full'
              }`}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>State Machine</span>
            <span className={evidence.protocolGraphMatch ? 'text-emerald-400' : 'text-rose-400'}>
              {evidence.protocolGraphMatch ? 'Transition OK' : 'Deviation'}
            </span>
          </div>
        </div>
      </div>

      {/* 02 — CONFIDENCE-AWARE DECISION CONTROLLER */}
      <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-950/60 border border-amber-500/30 text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
              02 — CONFIDENCE-AWARE DECISION ENGINE
            </div>
            <div className="text-[11px] text-slate-400">
              Autonomous Fail-Safe: Low-confidence mismatches trigger astronaut confirmation instead of blind alarms.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Threshold Slider */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Threshold:</span>
            <input
              type="range"
              min={40}
              max={90}
              value={confidenceThreshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-300 font-bold w-8">{confidenceThreshold}%</span>
          </div>

          {/* Test Astronaut Confirmation Button */}
          <button
            onClick={onTriggerConfirmationModal}
            className="px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/50 border border-amber-600/50 text-amber-200 text-xs font-mono flex items-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <QuestionIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulate Confirmation Dialog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
