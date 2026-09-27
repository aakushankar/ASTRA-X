import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Radio, 
  AlertCircle, 
  ArrowRight, 
  Rocket, 
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth, UserProfileData } from '../services/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'login' 
}) => {
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [role, setRole] = useState<UserProfileData['role']>('astronaut');
  
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName, callsign, role);
      }
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setLocalError(null);
    clearError();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60 shrink-0">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">
              ASTRA-X SPACE TERMINAL ACCESS
            </div>
            <h2 className="text-lg font-tech font-bold text-white">
              {mode === 'login' ? 'Mission Operator Sign In' : 'Register Crew / Specialist'}
            </h2>
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`py-2 text-xs font-mono font-bold rounded-lg transition ${
              mode === 'login' 
                ? 'bg-slate-800 text-cyan-300 shadow border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('signup')}
            className={`py-2 text-xs font-mono font-bold rounded-lg transition ${
              mode === 'signup' 
                ? 'bg-slate-800 text-cyan-300 shadow border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Notice */}
        {(localError || error) && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-start gap-2.5 text-rose-200 text-xs font-mono animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
              Astronaut / Operator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="astronaut@mission.isro.gov.in"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
              Security Passphrase
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Sign Up extra fields */}
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Callsign / ID
                  </label>
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    placeholder="GAGAN-01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Crew Station Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserProfileData['role'])}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
                >
                  <option value="astronaut">Astronaut (IVA Glovebox Operator)</option>
                  <option value="payload_specialist">Payload Specialist (BAS Science Team)</option>
                  <option value="flight_director">Flight Director (Mission Control)</option>
                  <option value="supervisor">Experiment Supervisor (Principal Investigator)</option>
                </select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating with Mission Vault...</span>
              </span>
            ) : mode === 'login' ? (
              <>
                <span>Access Experiment Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create Operator Credentials</span>
                <CheckCircle className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs font-mono text-slate-400">
          {mode === 'login' ? (
            <span>
              Don't have an operator account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="text-cyan-400 hover:underline font-bold"
              >
                Sign up here
              </button>
            </span>
          ) : (
            <span>
              Already registered in flight roster?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-cyan-400 hover:underline font-bold"
              >
                Log in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
