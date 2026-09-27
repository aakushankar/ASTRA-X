import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Camera, 
  Video, 
  Eye, 
  Crosshair, 
  Activity, 
  Layers, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  Sparkles,
  Zap,
  Cpu
} from 'lucide-react';
import { BoundingBox, HandLandmark, HandObjectInteraction, MultiEvidence, ProtocolStep } from '../types/astra';

interface GloveboxVisionFeedProps {
  currentStep: ProtocolStep | null;
  expectedStep: ProtocolStep | null;
  simulatedAction: string;
  status: 'IDLE' | 'NOMINAL' | 'DEVIATION' | 'UNCERTAIN' | 'COMPLETED';
  deviationReason: string;
  confidence: number;
  multiEvidence: MultiEvidence;
  isLiveCamera: boolean;
  onToggleLiveCamera: (enabled: boolean) => void;
  onSimulateAction: (actionKey: string) => void;
  activePreset: string;
}

export const GloveboxVisionFeed: React.FC<GloveboxVisionFeedProps> = ({
  currentStep,
  expectedStep,
  simulatedAction,
  status,
  deviationReason,
  confidence,
  multiEvidence,
  isLiveCamera,
  onToggleLiveCamera,
  onSimulateAction,
  activePreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Vision overlay toggles
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showInteractionRay, setShowInteractionRay] = useState(true);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState(true);
  const [visionFilter, setVisionFilter] = useState<'normal' | 'thermal' | 'edge'>('normal');

  // Animation state for canvas
  const stateRef = useRef({
    handX: 320,
    handY: 340,
    targetX: 320,
    targetY: 340,
    handGrip: 0, // 0 = open, 1 = closed
    lidOpen: false,
    sampleInContainer: true,
    sampleInHand: false,
    sampleInChamber: false,
    chamberClosed: false,
    measurementActive: false,
    particles: Array.from({ length: 18 }, () => ({
      x: Math.random() * 640,
      y: Math.random() * 400,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    })),
    tick: 0,
  });

  // Handle webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isLiveCamera) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 400 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        })
        .catch(err => {
          console.warn('Webcam permission not granted or camera unavailable:', err);
          onToggleLiveCamera(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isLiveCamera, onToggleLiveCamera]);

  // Update animated physical positions based on current step / simulation action
  useEffect(() => {
    const s = stateRef.current;
    if (simulatedAction === 'pick_red_container') {
      s.targetX = 180;
      s.targetY = 240;
      s.handGrip = 0.85;
    } else if (simulatedAction === 'open_container') {
      s.targetX = 200;
      s.targetY = 220;
      s.lidOpen = true;
      s.handGrip = 0.6;
    } else if (simulatedAction === 'remove_sample') {
      s.targetX = 200;
      s.targetY = 200;
      s.sampleInContainer = false;
      s.sampleInHand = true;
      s.handGrip = 0.95;
    } else if (simulatedAction === 'place_sample') {
      s.targetX = 460;
      s.targetY = 230;
      s.sampleInHand = false;
      s.sampleInChamber = true;
      s.handGrip = 0.3;
    } else if (simulatedAction === 'close_chamber') {
      s.targetX = 460;
      s.targetY = 190;
      s.chamberClosed = true;
      s.handGrip = 0.7;
    } else if (simulatedAction === 'record_measurement') {
      s.targetX = 540;
      s.targetY = 320;
      s.measurementActive = true;
      s.handGrip = 0.4;
    } else if (simulatedAction === 'pick_blue_container') {
      s.targetX = 110;
      s.targetY = 280;
      s.handGrip = 0.85;
    } else if (simulatedAction === 'reset') {
      s.targetX = 320;
      s.targetY = 340;
      s.lidOpen = false;
      s.sampleInContainer = true;
      s.sampleInHand = false;
      s.sampleInChamber = false;
      s.chamberClosed = false;
      s.measurementActive = false;
      s.handGrip = 0;
    }
  }, [simulatedAction]);

  // Main Canvas Rendering Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const state = stateRef.current;
    state.tick++;

    // Smooth hand lerp
    state.handX += (state.targetX - state.handX) * 0.12;
    state.handY += (state.targetY - state.handY) * 0.12;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (isLiveCamera && videoRef.current && videoRef.current.readyState >= 2) {
      // Draw webcam feed
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      if (visionFilter === 'thermal') {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Draw Simulated Glovebox Environment
      drawGloveboxEnvironment(ctx, width, height, state, visionFilter);
    }

    // Microgravity Floating Dust particles
    drawMicrogravityParticles(ctx, width, height, state);

    // Dynamic Objects Coordinates
    const objects = [
      {
        id: 'red_box',
        label: 'Red Container [Cryo-SOP]',
        cls: 'red_container',
        x: 150,
        y: 200,
        w: 90,
        h: 110,
        color: '#f43f5e',
        conf: 0.96,
      },
      {
        id: 'blue_box',
        label: 'Blue Solvent [Hazard-B]',
        cls: 'blue_solvent',
        x: 75,
        y: 245,
        w: 65,
        h: 80,
        color: '#3b82f6',
        conf: 0.91,
      },
      {
        id: 'chamber',
        label: 'Bio-Observation Chamber',
        cls: 'optical_chamber',
        x: 410,
        y: 160,
        w: 120,
        h: 140,
        color: '#06b6d4',
        conf: 0.98,
      },
      {
        id: 'panel',
        label: 'Sensor Controller S6',
        cls: 'telemetry_console',
        x: 520,
        y: 280,
        w: 95,
        h: 75,
        color: '#10b981',
        conf: 0.94,
      },
    ];

    // Astronaut Gloved Hand
    const handBox: BoundingBox = {
      id: 'hand_box',
      label: 'Astronaut IVA Glove [Grip: ' + (state.handGrip > 0.5 ? 'HOLD' : 'OPEN') + ']',
      category: 'hand',
      x: (state.handX - 55) / width * 100,
      y: (state.handY - 60) / height * 100,
      width: 110 / width * 100,
      height: 120 / height * 100,
      confidence: multiEvidence.poseConfidenceScore / 100,
      color: '#e2e8f0',
    };

    // Draw Hand Object Interaction ray
    if (showInteractionRay) {
      let closestObj = objects[0];
      let minDist = 9999;
      objects.forEach(obj => {
        const objCenterX = obj.x + obj.w / 2;
        const objCenterY = obj.y + obj.h / 2;
        const d = Math.hypot(state.handX - objCenterX, state.handY - objCenterY);
        if (d < minDist) {
          minDist = d;
          closestObj = obj;
        }
      });

      const isInteracting = minDist < 100;
      const targetCenterX = closestObj.x + closestObj.w / 2;
      const targetCenterY = closestObj.y + closestObj.h / 2;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(state.handX, state.handY);
      ctx.lineTo(targetCenterX, targetCenterY);
      ctx.strokeStyle = isInteracting ? '#22c55e' : '#64748b';
      ctx.lineWidth = isInteracting ? 2 : 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Proximity distance badge
      const midX = (state.handX + targetCenterX) / 2;
      const midY = (state.handY + targetCenterY) / 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(midX - 35, midY - 12, 70, 20);
      ctx.strokeStyle = isInteracting ? '#22c55e' : '#475569';
      ctx.strokeRect(midX - 35, midY - 12, 70, 20);
      ctx.fillStyle = isInteracting ? '#4ade80' : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(minDist)}mm ${isInteracting ? 'ACTIVE' : 'IDLE'}`, midX, midY - 1);
      ctx.restore();
    }

    // Draw YOLO Bounding Boxes
    if (showBBoxes) {
      // Objects
      objects.forEach(obj => {
        drawYoloBox(ctx, obj.x, obj.y, obj.w, obj.h, obj.label, obj.conf, obj.color);
      });
      // Astronaut Hand Box
      drawYoloBox(
        ctx, 
        state.handX - 55, 
        state.handY - 60, 
        110, 
        120, 
        handBox.label, 
        handBox.confidence, 
        status === 'DEVIATION' ? '#ef4444' : '#38bdf8'
      );
    }

    // Draw MediaPipe Hand Skeleton (21 keypoints)
    if (showSkeleton) {
      drawMediaPipeHandSkeleton(ctx, state.handX, state.handY, state.handGrip, status);
    }

    // Draw Spacecraft Camera HUD Telemetry Overlays
    if (showTelemetryHUD) {
      drawCameraTelemetryOverlay(ctx, width, height, status, confidence, deviationReason, multiEvidence);
    }

    animationFrameId.current = requestAnimationFrame(render);
  }, [
    isLiveCamera, 
    showBBoxes, 
    showSkeleton, 
    showInteractionRay, 
    showTelemetryHUD, 
    visionFilter, 
    status, 
    confidence, 
    deviationReason, 
    multiEvidence
  ]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [render]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Video / Canvas Viewport */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Hidden video element for live webcam */}
        <video 
          ref={videoRef} 
          className="hidden" 
          playsInline 
          muted 
        />
        
        {/* Canvas for render */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={400} 
          className="w-full h-full object-contain"
        />

        {/* Scanlines effect overlay */}
        <div className="absolute inset-0 pointer-events-none hud-scanlines opacity-40"></div>

        {/* Status Alert Banner directly in Camera HUD */}
        {status === 'DEVIATION' && (
          <div className="absolute top-4 inset-x-4 bg-red-950/90 border border-red-500/80 rounded-lg p-3 backdrop-blur-md flex items-center justify-between text-red-200 animate-pulse shadow-lg z-20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <div className="text-xs uppercase tracking-widest font-tech font-bold text-red-400">
                  ⚠️ Protocol Deviation Detected
                </div>
                <div className="text-sm font-medium text-white">
                  {deviationReason || 'Observed sequence violates safety state machine!'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1.5 rounded border border-red-700/50 text-xs font-mono">
              <Volume2 className="w-4 h-4 text-red-300" />
              <span>VOICE ALERT DISPATCHED</span>
            </div>
          </div>
        )}

        {status === 'UNCERTAIN' && (
          <div className="absolute top-4 inset-x-4 bg-amber-950/90 border border-amber-500/80 rounded-lg p-3 backdrop-blur-md flex items-center justify-between text-amber-200 z-20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-widest font-tech font-bold text-amber-400">
                  Confidence Threshold Warning ({confidence}%)
                </div>
                <div className="text-sm font-medium text-white">
                  Action ambiguous or hand occluded. Low-confidence verification required.
                </div>
              </div>
            </div>
            <span className="bg-amber-900/50 px-2.5 py-1 rounded text-xs font-mono border border-amber-600/40">
              Awaiting Confirmation
            </span>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="absolute top-4 inset-x-4 bg-emerald-950/90 border border-emerald-500/80 rounded-lg p-3 backdrop-blur-md flex items-center justify-between text-emerald-200 z-20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs uppercase tracking-widest font-tech font-bold text-emerald-400">
                  Experiment Protocol Complete
                </div>
                <div className="text-sm font-medium text-white">
                  All 6 states nominal. Measurement telemetry captured and verified.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top-Right Camera Source & Device Tag */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 px-2.5 py-1 rounded text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{isLiveCamera ? 'LIVE WEBCAM (ASTRONAUT IVA)' : 'OVERHEAD_FIXED_CAM_01'}</span>
          </div>
          <div className="bg-black/70 backdrop-blur-md border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
            30 FPS • 16.4ms
          </div>
        </div>

        {/* Bottom Bar: Action Perception HUD Overlay */}
        <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                Observed Action
              </div>
              <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                <span className="font-tech text-sm text-cyan-300">
                  {currentStep ? `${currentStep.code} — ${currentStep.name}` : 'Awaiting Action Trigger'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
                  Conf: {confidence}%
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                Expected State
              </div>
              <div className="font-tech font-semibold text-slate-200">
                {expectedStep ? `${expectedStep.code} — ${expectedStep.name}` : 'None'}
              </div>
            </div>

            <div className="pl-3 border-l border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                Protocol Gate
              </div>
              <div className={`font-mono text-xs font-bold ${
                status === 'NOMINAL' || status === 'COMPLETED' ? 'text-emerald-400' :
                status === 'DEVIATION' ? 'text-rose-400' :
                status === 'UNCERTAIN' ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip & Interactive Astronaut Triggers */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Toggle Overlays */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
              showBBoxes ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle YOLO bounding boxes"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>YOLO</span>
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
              showSkeleton ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle MediaPipe 21-point hand skeleton"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pose</span>
          </button>

          <button
            onClick={() => setShowInteractionRay(!showInteractionRay)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
              showInteractionRay ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Hand-Object Interaction ray & distance"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>HOI</span>
          </button>

          <button
            onClick={() => onToggleLiveCamera(!isLiveCamera)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition ${
              isLiveCamera ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Camera input"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isLiveCamera ? 'Webcam: ON' : 'Webcam'}</span>
          </button>
        </div>

        {/* Vision Filter (Normal / Edge / Thermal) */}
        <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
          <span className="hidden md:inline mr-1 text-[11px] text-slate-500">Filter:</span>
          {(['normal', 'thermal', 'edge'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setVisionFilter(mode)}
              className={`px-2 py-0.5 rounded capitalize ${
                visionFilter === mode ? 'bg-slate-800 text-cyan-300 font-semibold' : 'hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Astronaut Action Pad (Allows tactile execution of individual experiment steps) */}
      <div className="px-3 pb-3 pt-1 bg-slate-900 border-t border-slate-800/60">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-300 font-tech">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Interactive Astronaut Glovebox Actions (Manual Input)
          </span>
          <span className="text-[10px] text-slate-500">Click any action to test protocol validation</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => onSimulateAction('pick_red_container')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-red-400 group-hover:text-red-300 font-bold">S1: Step 1</div>
            <div className="text-[11px] text-slate-200 truncate">Pick Red Box</div>
          </button>

          <button
            onClick={() => onSimulateAction('open_container')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-cyan-400 group-hover:text-cyan-300 font-bold">S2: Step 2</div>
            <div className="text-[11px] text-slate-200 truncate">Open Lid</div>
          </button>

          <button
            onClick={() => onSimulateAction('remove_sample')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-emerald-400 group-hover:text-emerald-300 font-bold">S3: Step 3</div>
            <div className="text-[11px] text-slate-200 truncate">Remove Vial</div>
          </button>

          <button
            onClick={() => onSimulateAction('place_sample')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-blue-400 group-hover:text-blue-300 font-bold">S4: Step 4</div>
            <div className="text-[11px] text-slate-200 truncate">Place in Chamber</div>
          </button>

          <button
            onClick={() => onSimulateAction('close_chamber')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-indigo-400 group-hover:text-indigo-300 font-bold">S5: Step 5</div>
            <div className="text-[11px] text-slate-200 truncate">Close Chamber</div>
          </button>

          <button
            onClick={() => onSimulateAction('record_measurement')}
            className="px-2.5 py-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left text-xs transition active:scale-95 group"
          >
            <div className="font-mono text-[10px] text-purple-400 group-hover:text-purple-300 font-bold">S6: Step 6</div>
            <div className="text-[11px] text-slate-200 truncate">Measure Sensor</div>
          </button>
        </div>

        {/* Deviation triggers */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">Simulate Fault Injections:</span>
          <div className="flex gap-2">
            <button
              onClick={() => onSimulateAction('pick_blue_container')}
              className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-200 font-mono text-[11px] transition"
            >
              Trigger Wrong Object (Blue)
            </button>
            <button
              onClick={() => onSimulateAction('trigger_occlusion')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-mono text-[11px] transition"
            >
              Occlude Hand (Low Conf)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas drawing helpers
function drawGloveboxEnvironment(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  state: { 
    handX: number; 
    handY: number; 
    lidOpen: boolean; 
    sampleInContainer: boolean; 
    sampleInHand: boolean; 
    sampleInChamber: boolean; 
    chamberClosed: boolean; 
    measurementActive: boolean; 
    tick: number 
  },
  filter: 'normal' | 'thermal' | 'edge'
) {
  // Background metallic brushed steel
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (filter === 'thermal') {
    bgGrad.addColorStop(0, '#100c1e');
    bgGrad.addColorStop(0.5, '#1e1438');
    bgGrad.addColorStop(1, '#0c0717');
  } else {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#1e293b');
    bgGrad.addColorStop(1, '#0b1120');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Glovebox rear grid
  ctx.strokeStyle = filter === 'edge' ? '#38bdf8' : 'rgba(71, 85, 105, 0.18)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Workstation Table Surface
  ctx.fillStyle = filter === 'thermal' ? '#2e1c4a' : '#141d2f';
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.lineTo(w, h * 0.45);
  ctx.stroke();

  // Draw Blue Solvent Container (Obstacle / wrong object)
  drawBlueContainer(ctx, 75, 245, 65, 80, filter);

  // Draw Red Cryogenic Storage Container (Target S1/S2)
  drawRedContainer(ctx, 150, 200, 90, 110, state.lidOpen, state.sampleInContainer, filter);

  // Draw Observation Chamber (Target S4/S5)
  drawObservationChamber(ctx, 410, 160, 120, 140, state.chamberClosed, state.sampleInChamber, state.measurementActive, state.tick, filter);

  // Draw Measurement Console (Target S6)
  drawConsoleSensor(ctx, 520, 280, 95, 75, state.measurementActive, state.tick, filter);

  // Draw Sample Vial if in hand
  if (state.sampleInHand) {
    drawSampleVial(ctx, state.handX - 5, state.handY - 15, true, filter);
  }
}

function drawRedContainer(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  lidOpen: boolean, 
  hasSample: boolean,
  filter: 'normal' | 'thermal' | 'edge'
) {
  // Container Body
  ctx.save();
  ctx.fillStyle = filter === 'thermal' ? '#c026d3' : '#b91c1c';
  ctx.strokeStyle = filter === 'edge' ? '#ffffff' : '#f87171';
  ctx.lineWidth = 2;
  
  // Rounded vessel
  ctx.beginPath();
  ctx.roundRect(x, y + 25, w, h - 25, 8);
  ctx.fill();
  ctx.stroke();

  // Cryo Hazard Badge
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillText('CRYO-BIO', x + 14, y + 55);
  ctx.fillStyle = '#fee2e2';
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillText('SPECIMEN-S1', x + 12, y + 70);

  // Sample Vial inside container if not extracted
  if (hasSample && !lidOpen) {
    // Hidden inside
  } else if (hasSample && lidOpen) {
    // Visible inside opening
    drawSampleVial(ctx, x + w / 2 - 8, y + 10, false, filter);
  }

  // Lid
  ctx.fillStyle = filter === 'thermal' ? '#e879f9' : '#dc2626';
  ctx.strokeStyle = '#fca5a5';
  if (lidOpen) {
    // Lid placed to the side
    ctx.fillRect(x + w + 10, y + 50, 40, 16);
    ctx.strokeRect(x + w + 10, y + 50, 40, 16);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '8px monospace';
    ctx.fillText('LID_OPEN', x + w + 12, y + 62);
  } else {
    // Sealed lid
    ctx.fillRect(x - 4, y + 10, w + 8, 18);
    ctx.strokeRect(x - 4, y + 10, w + 8, 18);
  }
  ctx.restore();
}

function drawBlueContainer(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number,
  filter: 'normal' | 'thermal' | 'edge'
) {
  ctx.save();
  ctx.fillStyle = filter === 'thermal' ? '#3b82f6' : '#1d4ed8';
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText('SOLVENT-B', x + 8, y + 25);
  ctx.font = '7px monospace';
  ctx.fillText('HAZARD FLUID', x + 8, y + 40);
  ctx.restore();
}

function drawSampleVial(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  glow: boolean,
  filter: 'normal' | 'thermal' | 'edge'
) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 10;
  }
  // Glass tube
  ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, 16, 32, 4);
  ctx.fill();
  ctx.stroke();

  // Cell suspension fluid
  ctx.fillStyle = filter === 'thermal' ? '#10b981' : '#059669';
  ctx.fillRect(x + 2, y + 10, 12, 19);

  // Rubber stopper
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 2, y, 12, 5);
  ctx.restore();
}

function drawObservationChamber(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  closed: boolean, 
  hasSample: boolean, 
  measurementActive: boolean,
  tick: number,
  filter: 'normal' | 'thermal' | 'edge'
) {
  ctx.save();
  // Outer metallic chamber
  ctx.fillStyle = filter === 'thermal' ? '#1e1b4b' : '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  // Observation Window (circular viewport)
  const cx = x + w / 2;
  const cy = y + h / 2 + 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fillStyle = closed ? 'rgba(6, 182, 212, 0.25)' : 'rgba(15, 23, 42, 0.7)';
  ctx.fill();
  ctx.strokeStyle = closed ? '#22d3ee' : '#64748b';
  ctx.stroke();

  // Sample inside chamber
  if (hasSample) {
    drawSampleVial(ctx, cx - 8, cy - 16, true, filter);
  }

  // Laser sensor sweep if measurement is active
  if (measurementActive) {
    const sweepY = cy - 25 + ((tick * 2) % 50);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 28, sweepY);
    ctx.lineTo(cx + 28, sweepY);
    ctx.stroke();
  }

  // Hatch Door (Closed vs Open)
  ctx.fillStyle = closed ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.2)';
  ctx.strokeStyle = closed ? '#38bdf8' : '#f87171';
  ctx.beginPath();
  ctx.rect(x + 10, y + 8, w - 20, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText(closed ? 'SEALED [S5 COMPLIANT]' : 'HATCH OPEN [UNLATCHED]', x + 14, y + 20);

  ctx.restore();
}

function drawConsoleSensor(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  active: boolean,
  tick: number,
  filter: 'normal' | 'thermal' | 'edge'
) {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = active ? '#10b981' : '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = active ? '#34d399' : '#94a3b8';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText('SPECTRO S6', x + 8, y + 16);

  // Telemetry graph inside console
  ctx.strokeStyle = active ? '#10b981' : '#334155';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 45);
  for (let i = 0; i < 70; i += 10) {
    const py = active ? (y + 40 + Math.sin((tick + i) * 0.2) * 10) : (y + 45);
    ctx.lineTo(x + 8 + i, py);
  }
  ctx.stroke();

  ctx.restore();
}

function drawMicrogravityParticles(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  state: { particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> }
) {
  ctx.save();
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawYoloBox(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  label: string, 
  conf: number, 
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Corner brackets style
  const cornerLen = 8;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x, y + cornerLen);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLen, y);
  // Top-right
  ctx.moveTo(x + w - cornerLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + cornerLen);
  // Bottom-left
  ctx.moveTo(x, y + h - cornerLen);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + cornerLen, y + h);
  // Bottom-right
  ctx.moveTo(x + w - cornerLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - cornerLen);
  ctx.stroke();

  // Label tag
  ctx.fillStyle = color;
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  const tagText = `${label} ${(conf * 100).toFixed(0)}%`;
  const textWidth = ctx.measureText(tagText).width;
  ctx.fillRect(x, Math.max(0, y - 16), textWidth + 8, 16);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(tagText, x + 4, Math.max(12, y - 4));
  ctx.restore();
}

function drawMediaPipeHandSkeleton(
  ctx: CanvasRenderingContext2D, 
  hx: number, 
  hy: number, 
  grip: number,
  status: 'IDLE' | 'NOMINAL' | 'DEVIATION' | 'UNCERTAIN' | 'COMPLETED'
) {
  ctx.save();
  // Calculate 21 landmarks based on hand position and grip factor
  const wrist = { x: hx, y: hy + 40 };
  const palm = { x: hx, y: hy };

  const fingerCurl = grip * 22;

  // 5 Fingers: Thumb, Index, Middle, Ring, Pinky
  const fingers = [
    // Thumb
    [
      { x: hx - 22, y: hy + 20 },
      { x: hx - 30, y: hy + 5 },
      { x: hx - 28 + fingerCurl * 0.5, y: hy - 12 + fingerCurl * 0.8 },
      { x: hx - 20 + fingerCurl * 0.8, y: hy - 22 + fingerCurl * 1.0 },
    ],
    // Index
    [
      { x: hx - 14, y: hy - 5 },
      { x: hx - 16, y: hy - 25 },
      { x: hx - 16, y: hy - 45 + fingerCurl },
      { x: hx - 14, y: hy - 60 + fingerCurl * 1.2 },
    ],
    // Middle
    [
      { x: hx, y: hy - 8 },
      { x: hx, y: hy - 28 },
      { x: hx, y: hy - 50 + fingerCurl },
      { x: hx, y: hy - 65 + fingerCurl * 1.2 },
    ],
    // Ring
    [
      { x: hx + 14, y: hy - 5 },
      { x: hx + 14, y: hy - 24 },
      { x: hx + 14, y: hy - 44 + fingerCurl },
      { x: hx + 14, y: hy - 58 + fingerCurl * 1.2 },
    ],
    // Pinky
    [
      { x: hx + 25, y: hy },
      { x: hx + 27, y: hy - 16 },
      { x: hx + 27, y: hy - 32 + fingerCurl },
      { x: hx + 26, y: hy - 44 + fingerCurl * 1.1 },
    ],
  ];

  // Draw connections (Bones)
  ctx.strokeStyle = status === 'DEVIATION' ? '#f87171' : '#34d399';
  ctx.lineWidth = 2;

  // Connect wrist to fingers
  fingers.forEach(finger => {
    ctx.beginPath();
    ctx.moveTo(wrist.x, wrist.y);
    ctx.lineTo(finger[0].x, finger[0].y);
    for (let i = 0; i < finger.length - 1; i++) {
      ctx.moveTo(finger[i].x, finger[i].y);
      ctx.lineTo(finger[i + 1].x, finger[i + 1].y);
    }
    ctx.stroke();
  });

  // Connect MCP joints across palm
  ctx.beginPath();
  ctx.moveTo(fingers[0][0].x, fingers[0][0].y);
  for (let i = 1; i < fingers.length; i++) {
    ctx.lineTo(fingers[i][0].x, fingers[i][0].y);
  }
  ctx.stroke();

  // Draw Keypoints (Landmarks)
  const allPoints = [wrist, palm, ...fingers.flat()];
  allPoints.forEach((pt, idx) => {
    ctx.fillStyle = idx === 0 ? '#38bdf8' : '#22c55e';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === 0 ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  ctx.restore();
}

function drawCameraTelemetryOverlay(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  status: string, 
  conf: number,
  devReason: string,
  multiEvidence: MultiEvidence
) {
  ctx.save();
  // Corner framing reticles
  const pad = 12;
  const len = 16;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(pad, pad + len);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + len, pad);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(w - pad, h - pad - len);
  ctx.lineTo(w - pad, h - pad);
  ctx.lineTo(w - pad - len, h - pad);
  ctx.stroke();

  // Left Telemetry Strip (TCN, Pose, Object, HOI)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(pad, 36, 110, 80);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.strokeRect(pad, 36, 110, 80);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillText('PERCEPTION RADAR', pad + 6, 48);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`YOLO DET: ${multiEvidence.objectDetectionScore}%`, pad + 6, 62);
  ctx.fillText(`MP POSE:  ${multiEvidence.poseConfidenceScore}%`, pad + 6, 74);
  ctx.fillText(`HOI GRIP: ${multiEvidence.handInteractionScore}%`, pad + 6, 86);
  ctx.fillText(`TCN WIN:  ${multiEvidence.temporalTcnScore}%`, pad + 6, 98);
  ctx.fillText(`GATE:     ${multiEvidence.protocolGraphMatch ? 'PASS' : 'FAIL'}`, pad + 6, 110);

  ctx.restore();
}
