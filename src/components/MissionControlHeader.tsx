import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Volume2, 
  VolumeX, 
  WifiOff, 
  Cpu, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Radio, 
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  Sparkles,
  ChevronDown,
  Activity
} from 'lucide-react';
import { ScenarioPreset } from '../types/astra';
import { useAuth } from '../services/AuthContext';

interface MissionControlHeaderProps {
  onSelectScenario: (preset: ScenarioPreset) => void;
  activeScenario: ScenarioPreset;
  onResetExperiment: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
}

export const MissionControlHeader: React.FC<MissionControlHeaderProps> = ({
  onSelectScenario,
  activeScenario,
  onResetExperiment,
  isMuted,
  onToggleMute,
  onOpenAuthModal,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const { user, userProfile, signOut, loading } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-2xl backdrop-blur-md bg-slate-900/95">
      {/* Top Banner: Autonomous Spacecraft Telemetry Header */}
      <div className="bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 px-4 py-1.5 border-b border-cyan-900/30 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            BIO-ASTRONAUTICS SCIENCE (BAS) EXPERIMENT PAYLOAD
          </span>
          <span className="text-slate-600">|</span>
          <span>SYSTEM: <strong className="text-slate-200">ASTRA-X PROTOCOL ENGINE</strong></span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline">SPEC: <strong className="text-slate-200">BAS-EXP-2026</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 text-[10px]">
            <WifiOff className="w-3 h-3 text-emerald-400" />
            <span>OFFLINE-FIRST ON-BOARD AI (ZERO NETWORK DEPENDENCY)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-300">
            <span>STATION UTC:</span>
            <span className="text-cyan-300 font-bold">{utcTime}</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img 
              src="/src/assets/images/astra_mission_badge_1790510230812.jpg" 
              alt="ASTRA-X Bio-Astronautics Science Mission Patch"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-cyan-400/50 shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 pointer-events-none ring-1 ring-inset ring-cyan-400/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-tech font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400">
                ASTRA-X
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 uppercase">
                BAS On-Board AI
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md hidden sm:block">
              AI Activity Recognition & Protocol Intelligence for Microgravity Science Experiments
            </p>
          </div>
        </div>

        {/* Center: Scenario Quick-Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Flight Scenarios:</span>
          </div>

          <button
            onClick={() => onSelectScenario('nominal_run')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeScenario === 'nominal_run'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-md shadow-emerald-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Nominal (S1→S6)</span>
          </button>

          <button
            onClick={() => onSelectScenario('s3_skip_deviation')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeScenario === 's3_skip_deviation'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold shadow-md shadow-rose-950 animate-pulse'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
            title="Deviation scenario: S1 -> S2 -> S4 (Skips S3 Remove Sample)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Skip S3 (Sample)</span>
          </button>

          <button
            onClick={() => onSelectScenario('wrong_object_deviation')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeScenario === 'wrong_object_deviation'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-md shadow-amber-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Wrong Object</span>
          </button>

          <button
            onClick={() => onSelectScenario('low_confidence_uncertain')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
              activeScenario === 'low_confidence_uncertain'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-bold shadow-md shadow-indigo-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Uncertain / Occlusion</span>
          </button>
        </div>

        {/* Right: Actions & User Auth Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Audio Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isMuted
                ? 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isMuted ? 'Unmute Spacecraft Audio Voice' : 'Mute Spacecraft Audio Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Experiment */}
          <button
            onClick={onResetExperiment}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Reset Protocol State Machine"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* User Authentication Status & Trigger */}
          {loading ? (
            <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-cyan-500/40 text-slate-200 text-xs font-mono flex items-center gap-2 transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] border border-cyan-400/50">
                  {userProfile?.callsign?.slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'OP'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-[11px] text-cyan-300 truncate max-w-[100px]">
                    {userProfile?.callsign || userProfile?.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">
                    {userProfile?.role?.replace('_', ' ') || 'Crew'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs font-mono animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Authenticated Operator</div>
                    <div className="font-tech font-bold text-slate-100 text-sm mt-0.5">
                      {userProfile?.displayName || user.displayName || 'Flight Specialist'}
                    </div>
                    <div className="text-cyan-400 text-[11px] truncate mt-0.5">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {userProfile?.role?.replace('_', ' ').toUpperCase() || 'ASTRONAUT'}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{userProfile?.callsign || 'CALLSIGN-01'}</span>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-b border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <div>Station ID: <strong className="text-slate-200">ISS / Gaganyaan BAS Rack</strong></div>
                    <div>Session: <strong className="text-emerald-400">Persistent Firestore Token</strong></div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await signOut();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-950/50 flex items-center gap-2 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out Operator</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer hidden sm:flex"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
