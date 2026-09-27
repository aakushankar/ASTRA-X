/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DEFAULT_EXPERIMENT_PROTOCOL, 
  SECONDARY_PROTOCOL_PCG, 
  PROTOCOL_LIBRARY 
} from './data/protocols';
import { 
  Protocol, 
  ProtocolStep, 
  ProtocolStatus, 
  DeviationType, 
  MultiEvidence, 
  MissionEventLog, 
  SystemTelemetry, 
  ScenarioPreset 
} from './types/astra';
import { astraAudio } from './services/audioSpeech';
import { MissionControlHeader } from './components/MissionControlHeader';
import { GloveboxVisionFeed } from './components/GloveboxVisionFeed';
import { ProtocolGraphVisualizer } from './components/ProtocolGraphVisualizer';
import { MultiEvidenceInspector } from './components/MultiEvidenceInspector';
import { MissionReplayScrubber } from './components/MissionReplayScrubber';
import { EdgeTelemetryBar } from './components/EdgeTelemetryBar';
import { ConfidenceDecisionModal } from './components/ConfidenceDecisionModal';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './services/AuthContext';
import { db } from './services/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  Layers, 
  FileText, 
  FlaskConical, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  CloudCheck,
  UserCheck
} from 'lucide-react';

export default function App() {
  const { user, userProfile } = useAuth();

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Protocol State
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(DEFAULT_EXPERIMENT_PROTOCOL);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedStepCodes, setCompletedStepCodes] = useState<string[]>([]);
  const [status, setStatus] = useState<ProtocolStatus>('IDLE');
  const [deviationType, setDeviationType] = useState<DeviationType>('NONE');
  const [deviationStepCode, setDeviationStepCode] = useState<string | null>(null);
  const [deviationReason, setDeviationReason] = useState<string>('');
  const [observedSequence, setObservedSequence] = useState<string[]>([]);
  const [selectedStep, setSelectedStep] = useState<ProtocolStep | null>(DEFAULT_EXPERIMENT_PROTOCOL.steps[0]);

  // Perception & Multi-evidence
  const [confidence, setConfidence] = useState<number>(94);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(70);
  const [multiEvidence, setMultiEvidence] = useState<MultiEvidence>({
    objectDetectionScore: 96,
    poseConfidenceScore: 92,
    handInteractionScore: 94,
    temporalTcnScore: 91,
    protocolGraphMatch: true,
    overallConfidence: 94,
    decisionTier: 'HIGH_CONFIDENCE_AUTO',
  });

  // Simulation & Visual feed
  const [simulatedActionKey, setSimulatedActionKey] = useState<string>('reset');
  const [isLiveCamera, setIsLiveCamera] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioPreset>('nominal_run');
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState<boolean>(false);

  // Mission Log & Replay
  const [missionLogs, setMissionLogs] = useState<MissionEventLog[]>([]);
  const [missionTimeSec, setMissionTimeSec] = useState<number>(0);
  const [totalExperimentTimeSec, setTotalExperimentTimeSec] = useState<number>(60);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Edge Telemetry
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    fps: 30,
    inferenceLatencyMs: 16.2,
    edgeDevice: 'NVIDIA Jetson Orin Nano (15W Local Edge)',
    npuUtilization: 38,
    gpuMemoryMb: 742,
    networkLink: 'OFFLINE_AUTONOMOUS',
    protocolGraphNodes: 6,
    activeWorkers: 4,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user-saved logs from Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    const fetchUserLogs = async () => {
      try {
        const logsRef = collection(db, 'users', user.uid, 'mission_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(25));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const loaded: MissionEventLog[] = [];
          snap.forEach(d => {
            const data = d.data();
            loaded.push({
              id: d.id,
              timestamp: data.timestamp || new Date().toLocaleTimeString(),
              missionTimeSec: data.missionTimeSec || 0,
              protocolId: data.protocolId || selectedProtocol.id,
              expectedStepCode: data.expectedStepCode || 'S1',
              expectedStepName: data.expectedStepName || '',
              observedStepCode: data.observedStepCode || 'S1',
              observedStepName: data.observedStepName || '',
              status: data.status || 'NOMINAL',
              deviationType: data.deviationType || 'NONE',
              confidence: data.confidence || 95,
              audioDispatched: data.audioDispatched || '',
              explanation: data.explanation || '',
              evidence: {
                objectDetectionScore: 95,
                poseConfidenceScore: 92,
                handInteractionScore: 94,
                temporalTcnScore: 90,
                protocolGraphMatch: true,
                overallConfidence: data.confidence || 95,
                decisionTier: 'HIGH_CONFIDENCE_AUTO',
              },
              activeObjects: ['Glovebox Chamber', 'Cryo-Container'],
            });
          });
          setMissionLogs(prev => {
            const ids = new Set(prev.map(p => p.id));
            const newOnes = loaded.filter(l => !ids.has(l.id));
            return [...newOnes, ...prev];
          });
        }
      } catch (err) {
        console.warn('Could not sync user logs from Firestore:', err);
      }
    };
    fetchUserLogs();
  }, [user, selectedProtocol.id]);

  // Seed initial mission log
  useEffect(() => {
    const initialLog: MissionEventLog = {
      id: 'init-log-01',
      timestamp: new Date().toLocaleTimeString(),
      missionTimeSec: 0,
      protocolId: selectedProtocol.id,
      expectedStepCode: 'S1',
      expectedStepName: selectedProtocol.steps[0].name,
      observedStepCode: 'INIT',
      observedStepName: 'System Boot & Optical Alignment',
      status: 'IDLE',
      deviationType: 'NONE',
      confidence: 99,
      audioDispatched: 'ASTRA-X on-board protocol intelligence online. Ready for S1.',
      explanation: 'Edge vision pipeline and deterministic protocol graph initialized successfully.',
      evidence: {
        objectDetectionScore: 98,
        poseConfidenceScore: 96,
        handInteractionScore: 92,
        temporalTcnScore: 95,
        protocolGraphMatch: true,
        overallConfidence: 96,
        decisionTier: 'HIGH_CONFIDENCE_AUTO',
      },
      activeObjects: ['Glovebox Chamber', 'Red Container', 'Specimen Vial'],
    };
    setMissionLogs([initialLog]);
  }, [selectedProtocol]);

  // Handle Audio Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    astraAudio.setMuted(nextMuted);
  }, [isMuted]);

  // Record a mission log event and persist to Firestore if logged in
  const addMissionLog = useCallback((
    expectedCode: string,
    expectedName: string,
    observedCode: string,
    observedName: string,
    logStatus: ProtocolStatus,
    devType: DeviationType,
    conf: number,
    voiceText: string,
    expl: string,
    ev: MultiEvidence
  ) => {
    const newLogId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newLog: MissionEventLog = {
      id: newLogId,
      timestamp: new Date().toLocaleTimeString(),
      missionTimeSec: Math.round(missionTimeSec),
      protocolId: selectedProtocol.id,
      expectedStepCode: expectedCode,
      expectedStepName: expectedName,
      observedStepCode: observedCode,
      observedStepName: observedName,
      status: logStatus,
      deviationType: devType,
      confidence: conf,
      audioDispatched: voiceText,
      explanation: expl,
      evidence: ev,
      activeObjects: [selectedProtocol.steps.find(s => s.code === observedCode)?.targetObject || 'IVA Glove'],
    };

    setMissionLogs(prev => [newLog, ...prev]);

    // Save to Firestore if authenticated
    if (user) {
      try {
        const logDocRef = doc(db, 'users', user.uid, 'mission_logs', newLogId);
        setDoc(logDocRef, {
          id: newLogId,
          userId: user.uid,
          timestamp: newLog.timestamp,
          missionTimeSec: newLog.missionTimeSec,
          protocolId: newLog.protocolId,
          expectedStepCode: newLog.expectedStepCode,
          expectedStepName: newLog.expectedStepName,
          observedStepCode: newLog.observedStepCode,
          observedStepName: newLog.observedStepName,
          status: newLog.status,
          deviationType: newLog.deviationType,
          confidence: newLog.confidence,
          audioDispatched: newLog.audioDispatched,
          explanation: newLog.explanation,
        }).catch(e => console.warn('Firestore log write error:', e));
      } catch (err) {
        console.warn('Firestore log write skipped:', err);
      }
    }
  }, [missionTimeSec, selectedProtocol, user]);

  // Execute an action and evaluate against protocol state machine
  const executeStep = useCallback((actionKey: string, forceConfidence?: number) => {
    const currentExpected = selectedProtocol.steps[currentStepIndex];
    let observedCode = 'UNKNOWN';
    let observedName = 'Unclassified Gesture';

    if (actionKey === 'pick_red_container') {
      observedCode = 'S1';
      observedName = 'Pick Red Container';
    } else if (actionKey === 'open_container') {
      observedCode = 'S2';
      observedName = 'Open Container';
    } else if (actionKey === 'remove_sample') {
      observedCode = 'S3';
      observedName = 'Remove Sample';
    } else if (actionKey === 'place_sample') {
      observedCode = 'S4';
      observedName = 'Place Sample';
    } else if (actionKey === 'close_chamber') {
      observedCode = 'S5';
      observedName = 'Close Chamber';
    } else if (actionKey === 'record_measurement') {
      observedCode = 'S6';
      observedName = 'Record Measurement';
    } else if (actionKey === 'pick_blue_container') {
      observedCode = 'ERR_OBJ';
      observedName = 'Pick Blue Solvent Container (Hazard)';
    } else if (actionKey === 'trigger_occlusion') {
      observedCode = currentExpected?.code || 'S1';
      observedName = `Occluded Action (${observedCode})`;
    }

    setSimulatedActionKey(actionKey);
    setObservedSequence(prev => [...prev, observedCode]);

    // Check for Low-confidence / Occlusion
    if (actionKey === 'trigger_occlusion' || (forceConfidence !== undefined && forceConfidence < confidenceThreshold)) {
      const lowConf = forceConfidence ?? 44;
      setConfidence(lowConf);
      setStatus('UNCERTAIN');
      setDeviationType('OCCLUSION_UNCERTAINTY');
      const uncertainEvidence: MultiEvidence = {
        objectDetectionScore: 78,
        poseConfidenceScore: 42,
        handInteractionScore: 48,
        temporalTcnScore: 50,
        protocolGraphMatch: true,
        overallConfidence: lowConf,
        decisionTier: 'UNCERTAIN_CONFIRM',
      };
      setMultiEvidence(uncertainEvidence);
      setIsConfidenceModalOpen(true);
      astraAudio.speak(
        `Low confidence perception detected for step ${observedCode}. Please confirm action.`, 
        'caution'
      );
      addMissionLog(
        currentExpected?.code || 'S1',
        currentExpected?.name || '',
        observedCode,
        observedName,
        'UNCERTAIN',
        'OCCLUSION_UNCERTAINTY',
        lowConf,
        `Action ambiguous (${lowConf}%). Astronaut confirmation requested.`,
        'MediaPipe hand joints partially occluded by glove reflection; confidence dropped below safety threshold.',
        uncertainEvidence
      );
      return;
    }

    // Check for Wrong Object Fault
    if (actionKey === 'pick_blue_container') {
      const confVal = 92;
      setConfidence(confVal);
      setStatus('DEVIATION');
      setDeviationType('WRONG_OBJECT');
      setDeviationStepCode('ERR_OBJ');
      setDeviationReason('Object Mismatch: Grabbed Blue Solvent Container instead of Red Cryo Container.');

      const devEvidence: MultiEvidence = {
        objectDetectionScore: 95,
        poseConfidenceScore: 91,
        handInteractionScore: 93,
        temporalTcnScore: 89,
        protocolGraphMatch: false,
        overallConfidence: confVal,
        decisionTier: 'DEVIATION_ALERT',
      };
      setMultiEvidence(devEvidence);

      const alertVoice = 'Incorrect container acquired! Grasp the primary red cryogenic container.';
      astraAudio.speak(alertVoice, 'deviation');

      addMissionLog(
        currentExpected?.code || 'S1',
        currentExpected?.name || '',
        'ERR_OBJ',
        'Pick Blue Solvent (Hazardous)',
        'DEVIATION',
        'WRONG_OBJECT',
        confVal,
        alertVoice,
        'YOLO classified blue solvent container with 95% confidence; protocol state machine explicitly prohibits chemical solvent access during S1.',
        devEvidence
      );
      return;
    }

    // Standard Protocol State Machine Verification
    const stepObj = selectedProtocol.steps.find(s => s.code === observedCode);

    // Is this the expected next step?
    if (currentExpected && observedCode === currentExpected.code) {
      // NOMINAL VALID TRANSITION
      const confVal = 95;
      setConfidence(confVal);
      setStatus('NOMINAL');
      setDeviationType('NONE');
      setDeviationStepCode(null);
      setDeviationReason('');
      setCompletedStepCodes(prev => [...new Set([...prev, observedCode])]);

      const nominalEvidence: MultiEvidence = {
        objectDetectionScore: 96,
        poseConfidenceScore: 94,
        handInteractionScore: 93,
        temporalTcnScore: 95,
        protocolGraphMatch: true,
        overallConfidence: confVal,
        decisionTier: 'HIGH_CONFIDENCE_AUTO',
      };
      setMultiEvidence(nominalEvidence);

      const voiceFeedback = stepObj?.nominalFeedback || `Step ${observedCode} verified.`;
      astraAudio.speak(voiceFeedback, 'nominal');

      addMissionLog(
        currentExpected.code,
        currentExpected.name,
        observedCode,
        observedName,
        'NOMINAL',
        'NONE',
        confVal,
        voiceFeedback,
        `All 5 multi-evidence modalities reached consensus. Step transition ${observedCode} validated against SOP graph.`,
        nominalEvidence
      );

      // Advance to next step or complete
      if (currentStepIndex < selectedProtocol.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        setSelectedStep(selectedProtocol.steps[currentStepIndex + 1]);
      } else {
        setStatus('COMPLETED');
        astraAudio.speak('Protocol complete! All microgravity experiment data verified and sealed.', 'nominal');
      }
    } else {
      // PROTOCOL DEVIATION DETECTED!
      // (e.g. S1 -> S2 -> S4 as in Slide 2)
      const confVal = 93;
      setConfidence(confVal);
      setStatus('DEVIATION');
      setDeviationStepCode(observedCode);

      let devType: DeviationType = 'WRONG_ORDER';
      let devExplanation = `Observed ${observedCode} before completing expected step ${currentExpected?.code}.`;

      // Specifically check for Slide 2 Concrete Example: Skipping S3
      if (currentExpected?.code === 'S3' && observedCode === 'S4') {
        devType = 'SKIPPED_STEP';
        devExplanation = 'Critical SOP Skip: Attempted to place sample into chamber without removing it from cryo-container!';
      }

      setDeviationType(devType);
      setDeviationReason(devExplanation);

      const devEvidence: MultiEvidence = {
        objectDetectionScore: 94,
        poseConfidenceScore: 92,
        handInteractionScore: 95,
        temporalTcnScore: 90,
        protocolGraphMatch: false,
        overallConfidence: confVal,
        decisionTier: 'DEVIATION_ALERT',
      };
      setMultiEvidence(devEvidence);

      // Voice correction guidance as defined in Slide 2
      const correctionVoice = stepObj?.deviationCorrection || 
        (currentExpected ? `Please complete step ${currentExpected.code} ${currentExpected.name} first.` : 'Protocol sequence deviation.');
      
      astraAudio.speak(correctionVoice, 'deviation');

      addMissionLog(
        currentExpected?.code || 'S1',
        currentExpected?.name || '',
        observedCode,
        observedName,
        'DEVIATION',
        devType,
        confVal,
        correctionVoice,
        devExplanation,
        devEvidence
      );
    }
  }, [selectedProtocol, currentStepIndex, confidenceThreshold, addMissionLog]);

  // Reset experiment
  const resetExperiment = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedStepCodes([]);
    setStatus('IDLE');
    setDeviationType('NONE');
    setDeviationStepCode(null);
    setDeviationReason('');
    setObservedSequence([]);
    setSimulatedActionKey('reset');
    setSelectedStep(selectedProtocol.steps[0]);
    setConfidence(94);
    setIsAutoSimulating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [selectedProtocol]);

  // Run Scenario Presets automatically
  const runScenario = useCallback((preset: ScenarioPreset) => {
    resetExperiment();
    setActiveScenario(preset);
    setIsAutoSimulating(true);

    if (preset === 'nominal_run') {
      // S1 -> S2 -> S3 -> S4 -> S5 -> S6
      const steps = ['pick_red_container', 'open_container', 'remove_sample', 'place_sample', 'close_chamber', 'record_measurement'];
      steps.forEach((act, idx) => {
        setTimeout(() => {
          executeStep(act);
          if (idx === steps.length - 1) setIsAutoSimulating(false);
        }, (idx + 1) * 2200);
      });
    } else if (preset === 's3_skip_deviation') {
      // Step deviation sequence: S1 -> S2 -> S4 (skips required S3)!
      setTimeout(() => executeStep('pick_red_container'), 1200);
      setTimeout(() => executeStep('open_container'), 3200);
      setTimeout(() => {
        executeStep('place_sample'); // S4 directly without S3!
        setIsAutoSimulating(false);
      }, 5400);
    } else if (preset === 'wrong_object_deviation') {
      // Pick blue container instead of red
      setTimeout(() => {
        executeStep('pick_blue_container');
        setIsAutoSimulating(false);
      }, 1500);
    } else if (preset === 'low_confidence_uncertain') {
      // Occluded hand triggering confidence confirmation dialog
      setTimeout(() => {
        executeStep('trigger_occlusion', 46);
        setIsAutoSimulating(false);
      }, 1500);
    }
  }, [resetExperiment, executeStep]);

  // Protocol Switcher
  const handleSelectProtocol = (protoId: string) => {
    const proto = PROTOCOL_LIBRARY.find(p => p.id === protoId);
    if (proto) {
      setSelectedProtocol(proto);
      resetExperiment();
    }
  };

  // Replay play/pause loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isReplaying) {
      interval = setInterval(() => {
        setMissionTimeSec(prev => {
          if (prev >= totalExperimentTimeSec) {
            setIsReplaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isReplaying, totalExperimentTimeSec]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Mission Control Header */}
      <MissionControlHeader
        onSelectScenario={runScenario}
        activeScenario={activeScenario}
        onResetExperiment={resetExperiment}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenAuthModal={handleOpenAuth}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-3 md:p-5 flex flex-col gap-5">
        {/* Protocol Selector & Summary Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
                <span>Active Experiment Protocol</span>
                <span className="text-emerald-400 font-bold">• {selectedProtocol.facility}</span>
                {user && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/50">
                    <UserCheck className="w-3 h-3 text-cyan-400" />
                    <span>Logged In: {userProfile?.callsign || user.email}</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm md:text-base font-tech font-bold text-slate-100">
                {selectedProtocol.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Switch Protocol:</span>
              <select
                value={selectedProtocol.id}
                onChange={(e) => handleSelectProtocol(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {PROTOCOL_LIBRARY.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runScenario('nominal_run')}
              disabled={isAutoSimulating}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-tech font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Automated Assay</span>
            </button>
          </div>
        </div>

        {/* Top Split View: Fixed Camera Vision Feed + Protocol State Machine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Overhead Fixed Camera HUD & Interactive Simulator */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <GloveboxVisionFeed
              currentStep={selectedProtocol.steps[currentStepIndex] || null}
              expectedStep={selectedProtocol.steps[currentStepIndex] || null}
              simulatedAction={simulatedActionKey}
              status={status}
              deviationReason={deviationReason}
              confidence={confidence}
              multiEvidence={multiEvidence}
              isLiveCamera={isLiveCamera}
              onToggleLiveCamera={setIsLiveCamera}
              onSimulateAction={executeStep}
              activePreset={activeScenario}
            />
          </div>

          {/* Right Column (5 cols): Protocol State Graph & Multi-Evidence */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* 01 Protocol Graph Engine */}
            <ProtocolGraphVisualizer
              protocol={selectedProtocol}
              currentStepIndex={currentStepIndex}
              completedStepCodes={completedStepCodes}
              status={status}
              deviationType={deviationType}
              deviationStepCode={deviationStepCode}
              deviationReason={deviationReason}
              expectedStepCode={selectedProtocol.steps[currentStepIndex]?.code || null}
              observedSequence={observedSequence}
              onSelectStep={setSelectedStep}
              selectedStep={selectedStep}
            />

            {/* 03 Multi-Evidence Verification Fusion & 02 Confidence Decision */}
            <MultiEvidenceInspector
              evidence={multiEvidence}
              confidenceThreshold={confidenceThreshold}
              onThresholdChange={setConfidenceThreshold}
              onTriggerConfirmationModal={() => setIsConfidenceModalOpen(true)}
            />
          </div>
        </div>

        {/* Bottom Section: 04 Mission Replay Scrubber & Structured Blackbox Flight Event Log */}
        <MissionReplayScrubber
          logs={missionLogs}
          currentTimeSec={missionTimeSec}
          totalTimeSec={totalExperimentTimeSec}
          isPlaying={isReplaying}
          onTogglePlay={() => setIsReplaying(!isReplaying)}
          onSeek={setMissionTimeSec}
          onReset={() => setMissionTimeSec(0)}
          onSelectLog={(log) => {
            // Highlight selected log step
            const matchedStep = selectedProtocol.steps.find(s => s.code === log.observedStepCode);
            if (matchedStep) setSelectedStep(matchedStep);
          }}
        />
      </main>

      {/* Edge Hardware & System Telemetry Bar */}
      <EdgeTelemetryBar telemetry={telemetry} />

      {/* Confidence Decision Modal (Slide 2: Pillar 02) */}
      <ConfidenceDecisionModal
        isOpen={isConfidenceModalOpen}
        step={selectedProtocol.steps[currentStepIndex] || null}
        confidence={confidence}
        reason={deviationReason || 'Low optical visibility of hand-object engagement.'}
        onConfirm={() => {
          setIsConfidenceModalOpen(false);
          // Confirm step as completed
          const target = selectedProtocol.steps[currentStepIndex];
          if (target) {
            executeStep(target.code === 'S1' ? 'pick_red_container' : 
                        target.code === 'S2' ? 'open_container' :
                        target.code === 'S3' ? 'remove_sample' :
                        target.code === 'S4' ? 'place_sample' :
                        target.code === 'S5' ? 'close_chamber' : 'record_measurement', 95);
          }
        }}
        onReject={() => {
          setIsConfidenceModalOpen(false);
          astraAudio.speak('Step confirmation aborted. Astronaut retrying action.', 'caution');
        }}
        onClose={() => setIsConfidenceModalOpen(false)}
      />

      {/* User Authentication Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
