import React from 'react';
import { 
  Cpu, 
  Activity, 
  HardDrive, 
  Zap, 
  Clock, 
  CheckCircle, 
  WifiOff,
  Server
} from 'lucide-react';
import { SystemTelemetry } from '../types/astra';

interface EdgeTelemetryBarProps {
  telemetry: SystemTelemetry;
}

export const EdgeTelemetryBar: React.FC<EdgeTelemetryBarProps> = ({ telemetry }) => {
  return (
    <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2.5 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
      {/* Edge Hardware Spec */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">EDGE ENGINE:</span>
          <span>{telemetry.edgeDevice}</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">•</span>
        <div className="hidden sm:flex items-center gap-1 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>INFERENCE:</span>
          <span className="font-bold text-emerald-400">{telemetry.inferenceLatencyMs} ms</span>
        </div>
        <span className="text-slate-700 hidden md:inline">•</span>
        <div className="hidden md:flex items-center gap-1 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>FPS:</span>
          <span className="font-bold text-cyan-300">{telemetry.fps} FPS</span>
        </div>
      </div>

      {/* Utilization and Runtime */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>NPU LOAD:</span>
          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${telemetry.npuUtilization}%` }}
            />
          </div>
          <span className="font-bold text-amber-300 text-[11px]">{telemetry.npuUtilization}%</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
          <HardDrive className="w-3.5 h-3.5 text-purple-400" />
          <span>MEM:</span>
          <span className="font-bold text-purple-300">{telemetry.gpuMemoryMb} MB (INT8 Quantized)</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">ZERO CLOUD DEPENDENCY</span>
          <span className="sm:hidden">OFFLINE</span>
        </div>
      </div>
    </div>
  );
};
