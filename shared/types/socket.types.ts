import {
  ActiveCrisis,
  DifficultyLevel,
  MissionDesign,
  MissionModifier,
  MissionState,
  PlayerRole,
} from './mission.types';

export interface ClientToServerEvents {
  'room:create': (
    payload: { username: string; mode: 'SOLO' | 'MULTI'; demoMode?: boolean },
    cb: (res: { roomId: string; playerId: string }) => void
  ) => void;
  'room:join': (
    payload: { roomId: string; username: string },
    cb: (res: { success: boolean; error?: string; playerId?: string }) => void
  ) => void;
  'room:rejoin': (
    payload: { roomId: string; playerId: string },
    cb: (res: { success: boolean; error?: string; playerId?: string }) => void
  ) => void;
  'room:selectRole': (payload: { roomId: string; role: PlayerRole }) => void;
  'room:toggleReady': (payload: { roomId: string }) => void;
  'room:updateOptions': (payload: {
    roomId: string;
    difficulty?: DifficultyLevel;
    modifier?: MissionModifier;
    demoMode?: boolean;
  }) => void;
  'room:applyDemoPreset': (payload: { roomId: string }) => void;
  'room:startMission': (payload: { roomId: string }) => void;

  // Design & Engineering mutations (validated server-side by role in MULTI mode)
  'design:update': (payload: {
    roomId: string;
    patch: Partial<MissionDesign>;
    actingRole?: PlayerRole;
  }) => void;
  'design:suggestRequirement': (payload: {
    roomId: string;
    field: 'budgetLimit' | 'minResolutionMeters' | 'targetDurationYears' | 'maxRiskTolerance';
    value: number;
  }) => void;
  'mdl:propose': (payload: { roomId: string; text: string }) => void;
  'mdl:vote': (payload: { roomId: string; proposalId: string }) => void;
  'trade:vote': (payload: { roomId: string; archId: 'ARCH_A' | 'ARCH_B' | 'ARCH_C' }) => void;
  'phase:advance': (payload: { roomId: string; nextPhase: number }) => void;

  // Operations & Collaboration
  'crisis:triggerNext': (payload: { roomId: string }) => void;
  'crisis:resolve': (payload: { roomId: string; optionId: string }) => void;
  'chat:send': (payload: {
    roomId: string;
    text: string;
    isPing?: boolean;
    roleOverride?: PlayerRole;
  }) => void;
}

export interface ServerToClientEvents {
  'mission:stateSync': (state: MissionState) => void;
  'mission:error': (message: string) => void;
  'crisis:triggered': (crisis: ActiveCrisis | null) => void;
}
