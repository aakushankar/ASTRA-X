import React, { useState } from 'react';
import { 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Filter, 
  Search, 
  Volume2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MissionEventLog, ProtocolStatus } from '../types/astra';

interface MissionReplayScrubberProps {
  logs: MissionEventLog[];
  currentTimeSec: number;
  totalTimeSec: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onReset: () => void;
  onSelectLog: (log: MissionEventLog) => void;
}

export const MissionReplayScrubber: React.FC<MissionReplayScrubberProps> = ({
  logs,
  currentTimeSec,
  totalTimeSec,
  isPlaying,
  onTogglePlay,
  onSeek,
  onReset,
  onSelectLog,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter(log => {
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesSearch = 
      log.observedStepName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.observedStepCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.audioDispatched.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ASTRA_MISSION_REPLAY_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "MissionSec", "Status", "Expected", "Observed", "Confidence", "DeviationType", "VoiceDispatched", "Explanation"];
    const rows = logs.map(l => [
      `"${l.timestamp}"`,
      l.missionTimeSec,
      l.status,
      `"${l.expectedStepCode}"`,
      `"${l.observedStepCode}"`,
      `${l.confidence}%`,
      l.deviationType,
      `"${l.audioDispatched.replace(/"/g, '""')}"`,
      `"${l.explanation.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `ASTRA_MISSION_REPLAY_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatMET = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>04 — MISSION REPLAY & STRUCTURED BLACKBOX RECORDER</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic flight review timeline for space-agency flight directors and principal investigators
            </p>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
            title="Export CSV telemetry"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition active:scale-95"
            title="Export JSON Flight Log"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Interactive Time Scrubber Bar */}
      <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition"
              title={isPlaying ? 'Pause Replay' : 'Play Replay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Timeline to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="font-tech font-bold text-slate-200 text-sm ml-1">
              MET: <span className="text-cyan-400">{formatMET(currentTimeSec)}</span> / {formatMET(totalTimeSec)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Nominal ({logs.filter(l => l.status === 'NOMINAL').length})
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Deviation ({logs.filter(l => l.status === 'DEVIATION').length})
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Uncertain ({logs.filter(l => l.status === 'UNCERTAIN').length})
            </span>
          </div>
        </div>

        {/* Timeline Slider with Event Markers */}
        <div className="relative w-full pt-1 pb-2">
          {/* Background Track */}
          <div className="relative h-2 bg-slate-800 rounded-full cursor-pointer">
            {/* Filled Progress */}
            <div 
              className="h-full bg-cyan-500/60 rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentTimeSec / Math.max(1, totalTimeSec)) * 100)}%` }}
            />

            {/* Event Markers along scrubber */}
            {logs.map((log) => {
              const posPercent = (log.missionTimeSec / Math.max(1, totalTimeSec)) * 100;
              return (
                <div
                  key={log.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(log.missionTimeSec);
                    onSelectLog(log);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-slate-900 cursor-pointer transition hover:scale-150 z-10 ${
                    log.status === 'DEVIATION' ? 'bg-rose-500 animate-pulse' :
                    log.status === 'UNCERTAIN' ? 'bg-amber-400' :
                    'bg-emerald-400'
                  }`}
                  style={{ left: `${Math.max(2, Math.min(98, posPercent))}%` }}
                  title={`[${formatMET(log.missionTimeSec)}] ${log.observedStepCode}: ${log.status}`}
                />
              );
            })}
          </div>

          {/* Actual HTML range slider for scrubbing */}
          <input
            type="range"
            min={0}
            max={totalTimeSec}
            step={0.5}
            value={currentTimeSec}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-slate-500 font-mono text-[11px]">Filter:</span>
          {(['ALL', 'NOMINAL', 'DEVIATION', 'UNCERTAIN'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterStatus(mode)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] transition ${
                filterStatus === mode
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search telemetry events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Structured Flight Event Log Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3">MET</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Expected</th>
              <th className="py-2.5 px-3">Observed Action</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Voice Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition ${
                    log.status === 'DEVIATION' ? 'bg-rose-950/20' : 
                    log.status === 'UNCERTAIN' ? 'bg-amber-950/20' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-cyan-400 font-bold whitespace-nowrap">
                    {formatMET(log.missionTimeSec)}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'NOMINAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' :
                      log.status === 'DEVIATION' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                      'bg-amber-950 text-amber-300 border border-amber-800/60'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                    <span className="font-bold text-slate-100">{log.expectedStepCode}</span>
                    <span className="text-[10px] text-slate-400 ml-1 hidden sm:inline">
                      ({log.expectedStepName})
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-100">{log.observedStepCode}</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      — {log.observedStepName}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`font-bold ${
                      log.confidence >= 75 ? 'text-emerald-400' :
                      log.confidence >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {log.confidence}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 max-w-xs truncate" title={log.audioDispatched}>
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="italic text-slate-300 truncate">“{log.audioDispatched}”</span>
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                  No mission events matching filter. Run or simulate protocol steps above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
