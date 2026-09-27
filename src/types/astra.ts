export type ProtocolStatus = 'IDLE' | 'NOMINAL' | 'DEVIATION' | 'UNCERTAIN' | 'COMPLETED';

export type DeviationType = 
  | 'NONE'
  | 'SKIPPED_STEP'
  | 'WRONG_ORDER'
  | 'WRONG_OBJECT'
  | 'TIME_ANOMALY'
  | 'OCCLUSION_UNCERTAINTY';

export interface BoundingBox {
  id: string;
  label: string;
  confidence: number;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  width: number;
  height: number;
  color: string;
  category: 'container' | 'sample' | 'chamber' | 'tool' | 'hand';
}

export interface HandLandmark {
  x: number; // percentage
  y: number; // percentage
  z?: number;
  visibility?: number;
}

export interface HandObjectInteraction {
  isInteracting: boolean;
  targetObject: string | null;
  contactScore: number; // 0 to 1
  distancePx: number;
  graspType: 'pinch' | 'power_grip' | 'precision_fingertip' | 'open_palm' | 'none';
}

export interface ProtocolStep {
  id: string;
  code: string; // e.g. "S1"
  name: string; // e.g. "Pick Red Container"
  description: string;
  targetObject: string;
  expectedDurationSec: number;
  allowedNextSteps: string[]; // e.g. ["S2"]
  forbiddenPrecedingSteps?: string[];
  safetyCritical: boolean;
  voicePrompt: string;
  nominalFeedback: string;
  deviationCorrection: string;
}

export interface Protocol {
  id: string;
  code: string;
  title: string;
  category: string;
  facility: string; // e.g. "Microgravity Science Glovebox (MSG)"
  description: string;
  steps: ProtocolStep[];
}

export interface MultiEvidence {
  objectDetectionScore: number; // 0 - 100%
  poseConfidenceScore: number; // 0 - 100%
  handInteractionScore: number; // 0 - 100%
  temporalTcnScore: number; // 0 - 100%
  protocolGraphMatch: boolean;
  overallConfidence: number; // 0 - 100%
  decisionTier: 'HIGH_CONFIDENCE_AUTO' | 'UNCERTAIN_CONFIRM' | 'DEVIATION_ALERT';
}

export interface MissionEventLog {
  id: string;
  timestamp: string;
  missionTimeSec: number;
  protocolId: string;
  expectedStepCode: string;
  expectedStepName: string;
  observedStepCode: string;
  observedStepName: string;
  status: ProtocolStatus;
  deviationType: DeviationType;
  confidence: number;
  audioDispatched: string;
  explanation: string;
  evidence: MultiEvidence;
  activeObjects: string[];
}

export interface SystemTelemetry {
  fps: number;
  inferenceLatencyMs: number;
  edgeDevice: string;
  npuUtilization: number;
  gpuMemoryMb: number;
  networkLink: 'OFFLINE_AUTONOMOUS' | 'GROUND_TELEMETRY_SYNC';
  protocolGraphNodes: number;
  activeWorkers: number;
}

export type ScenarioPreset = 
  | 'nominal_run'
  | 's3_skip_deviation'
  | 'wrong_object_deviation'
  | 'wrong_order_deviation'
  | 'low_confidence_uncertain';
