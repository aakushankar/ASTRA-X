import React from 'react';
import { 
  GitCommit, 
  ArrowRight, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Volume2, 
  Info,
  Zap,
  Sparkles
} from 'lucide-react';
import { Protocol, ProtocolStep, ProtocolStatus, DeviationType } from '../types/astra';

interface ProtocolGraphVisualizerProps {
  protocol: Protocol;
  currentStepIndex: number;
  completedStepCodes: string[];
  status: ProtocolStatus;
  deviationType: DeviationType;
  deviationStepCode: string | null;
  deviationReason: string;
  expectedStepCode: string | null;
  observedSequence: string[];
  onSelectStep: (step: ProtocolStep) => void;
  selectedStep: ProtocolStep | null;
}

export const ProtocolGraphVisualizer: React.FC<ProtocolGraphVisualizerProps> = ({
  protocol,
  currentStepIndex,
  completedStepCodes,
  status,
  deviationType,
  deviationStepCode,
  deviationReason,
  expectedStepCode,
  observedSequence,
  onSelectStep,
  selectedStep,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header and Core Philosophy Equation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>01 — PROTOCOL STATE MACHINE GRAPH</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {protocol.code}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic finite state automaton enforcing chronological SOP compliance
            </p>
          </div>
        </div>

        {/* Core Protocol Intelligence Model Equation */}
        <div className="bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="text-rose-400 line-through mr-1 font-semibold">Activity Recognition Alone</span>
          <span className="text-slate-500 mx-1">→</span>
          <span className="text-cyan-300 font-bold">
            ASTRA = ACTION + STATE + REASON + GUIDANCE + REPLAY
          </span>
        </div>
      </div>

      {/* Protocol State Flow Nodes */}
      <div className="relative overflow-x-auto py-2">
        <div className="flex items-center min-w-max gap-2 px-1">
          {protocol.steps.map((step, idx) => {
            const isCompleted = completedStepCodes.includes(step.code);
            const isCurrent = idx === currentStepIndex && status !== 'COMPLETED';
            const isDeviationTarget = status === 'DEVIATION' && deviationStepCode === step.code;
            const isExpected = expectedStepCode === step.code;
            const isSelected = selectedStep?.id === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Step Node Card */}
                <div
                  onClick={() => onSelectStep(step)}
                  className={`cursor-pointer transition-all duration-300 rounded-xl p-3 w-44 shrink-0 border relative ${
                    isDeviationTarget
                      ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/80'
                      : isCompleted
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : isCurrent
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-400/50'
                      : isExpected && status === 'DEVIATION'
                      ? 'bg-amber-950/60 border-amber-500/70 text-amber-200 ring-1 ring-amber-400/60'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  } ${isSelected ? 'outline outline-2 outline-cyan-400' : ''}`}
                >
                  {/* Top Status & Code Badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      isDeviationTarget ? 'bg-rose-900/80 text-rose-200' :
                      isCompleted ? 'bg-emerald-900/60 text-emerald-300' :
                      isCurrent ? 'bg-cyan-900/80 text-cyan-200' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {step.code}
                    </span>

                    {isDeviationTarget && (
                      <span className="flex items-center gap-1 text-[10px] font-tech font-bold text-rose-400 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-600/50 animate-pulse">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        DEVIATION
                      </span>
                    )}

                    {isCompleted && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        VERIFIED
                      </span>
                    )}

                    {isCurrent && status !== 'DEVIATION' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        ACTIVE
                      </span>
                    )}

                    {isExpected && status === 'DEVIATION' && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-1 rounded border border-amber-600/40">
                        EXPECTED
                      </span>
                    )}
                  </div>

                  {/* Step Title */}
                  <div className="font-tech font-bold text-xs line-clamp-1 mb-1 text-slate-100">
                    {step.name}
                  </div>

                  {/* Target Object */}
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    Obj: <span className="text-slate-200">{step.targetObject}</span>
                  </div>

                  {/* Safety Indicator */}
                  {step.safetyCritical && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-amber-400/90">
                      <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                      Critical SOP Step
                    </div>
                  )}
                </div>

                {/* Arrow Connector */}
                {idx < protocol.steps.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-1">
                    <ArrowRight className={`w-4 h-4 transition ${
                      completedStepCodes.includes(protocol.steps[idx + 1].code)
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-cyan-400 animate-pulse'
                        : 'text-slate-700'
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Concrete Example Visualizer Card (WHAT ASTRA CATCHES) */}
      <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800">
        <div className="text-xs font-tech font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Zap className="w-4 h-4 text-cyan-400" />
            WHAT ASTRA CATCHES — PROTOCOL STATE COMPARISON
          </span>
          <span className="text-[11px] font-mono text-slate-500">Autonomous State Verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Box 1: Observed Sequence */}
          <div className="bg-slate-900/90 border border-cyan-900/50 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 mb-1">
              Observed Sequence
            </div>
            <div className="font-mono text-sm font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
              {observedSequence.length > 0 ? (
                observedSequence.map((code, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                      {code}
                    </span>
                    {i < observedSequence.length - 1 && <span className="text-slate-500">→</span>}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">Sequence pending...</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Temporal TCN tracker output
            </div>
          </div>

          {/* Box 2: Expected Step */}
          <div className="bg-slate-900/90 border border-emerald-900/50 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/80 mb-1">
              Expected Step
            </div>
            <div className="font-tech text-sm font-bold text-emerald-300 flex items-center gap-1.5">
              <span>{expectedStepCode || 'S1'}</span>
              <span className="text-slate-300 font-normal truncate">
                — {protocol.steps.find(s => s.code === (expectedStepCode || 'S1'))?.name || 'Initiation'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              State graph deterministic node
            </div>
          </div>

          {/* Box 3: Protocol Deviation */}
          <div className={`rounded-lg p-2.5 flex flex-col justify-between border ${
            status === 'DEVIATION' 
              ? 'bg-rose-950/70 border-rose-500/80 text-rose-200' 
              : 'bg-slate-900/90 border-slate-800 text-slate-400'
          }`}>
            <div className="text-[10px] uppercase font-mono tracking-wider text-rose-400 mb-1 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              Protocol Deviation
            </div>
            <div className="font-tech text-sm font-bold">
              {status === 'DEVIATION' ? (
                <span className="text-rose-300">Detected: {deviationStepCode || 'S4'} ({deviationType})</span>
              ) : (
                <span className="text-slate-500 font-normal">None (Transition Valid)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {status === 'DEVIATION' ? deviationReason : 'Zero sequence violations'}
            </div>
          </div>

          {/* Box 4: Voice + Event Log */}
          <div className="bg-slate-900/90 border border-indigo-900/50 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 mb-1 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-indigo-400" />
              Voice + Event Log
            </div>
            <div className="text-xs text-indigo-200 italic font-mono line-clamp-2">
              {status === 'DEVIATION'
                ? `“${protocol.steps.find(s => s.code === deviationStepCode)?.deviationCorrection || 'Please follow protocol order.'}”`
                : status === 'NOMINAL'
                ? `“${protocol.steps[currentStepIndex]?.nominalFeedback || 'Step nominal.'}”`
                : '“Awaiting action execution.”'}
            </div>
            <div className="text-[9px] text-slate-500 mt-1 font-mono">
              Log: t, expected, observed, confidence
            </div>
          </div>
        </div>
      </div>

      {/* Selected Step Inspection Drawer */}
      {selectedStep && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-slate-800 text-cyan-400 font-tech font-bold text-sm">
              {selectedStep.code}
            </div>
            <div>
              <div className="font-tech font-bold text-slate-200 text-sm">
                {selectedStep.name}
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                {selectedStep.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-500">Duration: </span>
              <span className="text-slate-300 font-semibold">{selectedStep.expectedDurationSec}s</span>
            </div>
            <div>
              <span className="text-slate-500">Target: </span>
              <span className="text-cyan-300 font-semibold">{selectedStep.targetObject}</span>
            </div>
            <div className="text-emerald-400">
              Next: {selectedStep.allowedNextSteps.join(', ') || 'End'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
