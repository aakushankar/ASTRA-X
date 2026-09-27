import React from 'react';
import { 
  HelpCircle, 
  Check, 
  RotateCcw, 
  ShieldAlert, 
  Activity, 
  AlertTriangle,
  X
} from 'lucide-react';
import { ProtocolStep } from '../types/astra';

interface ConfidenceDecisionModalProps {
  isOpen: boolean;
  step: ProtocolStep | null;
  confidence: number;
  reason: string;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const ConfidenceDecisionModal: React.FC<ConfidenceDecisionModalProps> = ({
  isOpen,
  step,
  confidence,
  reason,
  onConfirm,
  onReject,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-950/40 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <HelpCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
              02 — CONFIDENCE-AWARE INTERVENTION
            </div>
            <h3 className="text-base font-tech font-bold text-slate-100">
              Low-Confidence Verification Required
            </h3>
          </div>
        </div>

        {/* Description & Scientific Justification */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-slate-300">
            <span>Observed Action:</span>
            <span className="font-bold text-amber-400">
              {step ? `${step.code} — ${step.name}` : 'Ambiguous Hand Kinematics'}
            </span>
          </div>

          <div className="flex items-center justify-between font-mono text-slate-300">
            <span>Perception Confidence:</span>
            <span className="font-bold text-rose-400">{confidence}% (Below 75% threshold)</span>
          </div>

          <div className="flex items-center justify-between font-mono text-slate-300">
            <span>Intervention Reason:</span>
            <span className="text-slate-400 text-right">{reason || 'Severe glove occlusion / partial line-of-sight blockage'}</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 font-tech">ASTRA Fail-Safe Rule:</strong> Rather than issuing a false deviation alarm that disrupts astronaut workflow, the on-board system queries quick tactical confirmation.
          </div>
        </div>

        {/* Astronaut Decision Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Retry Step Action</span>
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-tech font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Confirm: Step Succeeded</span>
          </button>
        </div>
      </div>
    </div>
  );
};
