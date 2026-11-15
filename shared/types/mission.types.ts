import { OrbitRegime, TargetBody } from './catalog.types';

export type PlayerRole = 'MANAGER' | 'SCIENCE' | 'SYSTEMS' | 'OPERATIONS';

export type TargetId = TargetBody;

export type StatusLevel = 'NOMINAL' | 'WARNING' | 'CRITICAL';

export type DifficultyLevel = 'STANDARD' | 'EXPERT';

export type MissionModifier =
  | 'NONE'
  | 'BUDGET_CRISIS'
  | 'SOLAR_STORM_GUARANTEED'
  | 'CUBESAT_ONLY';

export interface Player {
  id: string;
  username: string;
  role: PlayerRole | null;
  isReady: boolean;
  isConnected: boolean;
  actionsCount: number;
  proposalsMade: number;
  votesCast: number;
  pingsSent: number;
}

export interface ResourceTelemetry {
  budgetUsed: number; // $M USD
  budgetMax: number; // $M USD
  massTotal: number; // kg
  massMax: number; // launcher capacity to target orbit
  powerGenerated: number; // Watts (adjusted by solar flux)
  powerConsumed: number; // Watts
  powerBalance: number; // Generated - Consumed
  dataGeneratedMbps: number;
  dataCapacityMbps: number;
  commQualityDb: number; // Link budget in dB
  missionDurationYears: number;
  riskPercentage: number; // 1 to 99%
  scienceScore: number; // 0 to 100+
  groundResolutionMeters: number;
  revisitDays: number;
  eclipseMinutes: number;
}

export interface MissionDesign {
  target: TargetId | null;
  requirements: {
    budgetLimit: number;
    minResolutionMeters: number;
    targetDurationYears: number;
    maxRiskTolerance: number;
  };
  requirementSuggestions: Partial<
    Record<
      'budgetLimit' | 'minResolutionMeters' | 'targetDurationYears' | 'maxRiskTolerance',
      { value: number; byRole: PlayerRole }
    >
  >;
  selectedArchitecture: 'ARCH_A' | 'ARCH_B' | 'ARCH_C' | null;
  architectureVotes: Partial<Record<PlayerRole, 'ARCH_A' | 'ARCH_B' | 'ARCH_C'>>;
  busId: string | null;
  solarPanelId: string | null;
  batteryId: string | null;
  antennaId: string | null;
  obcId: string | null;
  payloadIds: string[];
  orbit: {
    type: OrbitRegime;
    altitudeKm: number;
    inclinationDeg: number;
  };
  launcherId: string | null;
}

export interface MentorMessage {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  explanation: string;
  tradeOffTip: string;
  timestamp: number;
}

export interface CrisisOption {
  id: string;
  label: string;
  impactSummary: string;
  scienceDelta: number;
  durationDeltaYears: number;
  riskDelta: number;
  budgetDelta: number;
  healthDelta: number;
}

export interface ActiveCrisis {
  id: string;
  stepIndex: number; // 1, 2, or 3
  title: string;
  description: string;
  timeLeft: number;
  totalTime: number;
  options: CrisisOption[];
  votes: Partial<Record<PlayerRole, string>>;
  resolvedOptionId?: string;
}

export interface MissionEventEntry {
  id: string;
  phaseNumber: number;
  actorRole: PlayerRole | null;
  eventType: 'DESIGN_CHANGE' | 'MDL_VOTE' | 'MRR_CHECK' | 'CRISIS_CHOICE' | 'PHASE_CHANGE';
  description: string;
  timestamp: number;
}

export interface ScoreBreakdown {
  total: number; // /1000
  rank: string;
  science: number; // /100
  budget: number; // /100
  engineering: number; // /100
  collaboration: number; // /100
  survival: number; // /100
  diagnostic: string;
  improvementTip: string;
}

export interface NasaMatchResult {
  missionId: string;
  name: string;
  fullTitle: string;
  launchYear: number;
  similarityPct: number;
  targetId: TargetId;
  orbitType: OrbitRegime;
  altitudeKm: number;
  massKg: number;
  costMusd: number;
  primaryInstruments: string[];
  summary: string;
  badgeTitle: string;
  anecdote: string;
  nasaUrl?: string;
}

export interface MissionState {
  roomId: string;
  hostId?: string;
  mode: 'SOLO' | 'MULTI';
  status: 'LOBBY' | 'ACTIVE' | 'COMPLETED';
  difficulty: DifficultyLevel;
  modifier: MissionModifier;
  demoMode: boolean;
  currentPhase: number; // 1 to 15
  cmlLevel: number; // 1 to 6
  players: Player[];
  design: MissionDesign;
  telemetry: ResourceTelemetry;
  mdlProposals: Array<{
    id: string;
    authorRole: PlayerRole;
    text: string;
    votes: PlayerRole[];
  }>;
  opsState: {
    currentStep: number; // 0..3
    satelliteHealth: number; // 0..100
    dataCollectedPct: number; // 0..100
    sciencePenaltyPct: number;
    durationPenaltyYears: number;
    resolvedCrises: Array<{
      title: string;
      chosenLabel: string;
      impactSummary: string;
    }>;
  };
  activeCrisis: ActiveCrisis | null;
  mentorFeed: MentorMessage[];
  chatMessages: Array<{
    id: string;
    sender: string;
    role: PlayerRole;
    text: string;
    isPing?: boolean;
    timestamp: number;
  }>;
  eventsLog: MissionEventEntry[];
  finalResults?: {
    score: ScoreBreakdown;
    nasaMatch: NasaMatchResult;
  };
}
