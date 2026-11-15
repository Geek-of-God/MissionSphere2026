import { create } from 'zustand';
import {
  DifficultyLevel,
  MissionDesign,
  MissionModifier,
  MissionState,
  PlayerRole,
} from '../../shared/types/mission.types';
import { audioService } from '../services/audioService';
import { LocalSimulationAdapter } from '../services/LocalSimulationAdapter';
import { socket, socketService } from '../services/socketService';
import { Lang } from '../utils/i18n';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || '').replace(
  /\/$/,
  '',
);

export type AppScreen = 'HOME' | 'LOBBY' | 'WORKSPACE' | 'SUMMARY';

interface MissionStore {
  screen: AppScreen;
  language: Lang;
  muted: boolean;
  isOfflineMode: boolean;
  myPlayerId: string | null;
  soloActiveRole: PlayerRole;
  mission: MissionState | null;
  errorBanner: string | null;
  isExplainingMentor: boolean;
  unlockedBadges: string[];
  adapter: LocalSimulationAdapter | null;

  setLanguage: (lang: Lang) => void;
  toggleMute: () => void;
  setSoloActiveRole: (role: PlayerRole) => void;
  clearError: () => void;
  setError: (msg: string) => void;

  initListeners: () => void;
  loadBadges: () => Promise<void>;
  startSoloMission: (username: string, demoMode?: boolean) => Promise<string | null>;
  createMultiRoom: (username: string) => Promise<string | null>;
  joinMultiRoom: (roomId: string, username: string) => Promise<boolean>;
  rejoinRoom: (roomId: string) => Promise<boolean>;
  selectRole: (role: PlayerRole) => void;
  toggleReady: () => void;
  updateOptions: (opts: { difficulty?: DifficultyLevel; modifier?: MissionModifier; demoMode?: boolean }) => void;
  applyDemoPreset: () => void;
  startMissionFromLobby: () => void;
  updateDesign: (patch: Partial<MissionDesign>) => void;
  suggestRequirement: (
    field: 'budgetLimit' | 'minResolutionMeters' | 'targetDurationYears' | 'maxRiskTolerance',
    value: number
  ) => void;
  proposeMdl: (text: string) => void;
  voteMdl: (proposalId: string) => void;
  voteTrade: (archId: 'ARCH_A' | 'ARCH_B' | 'ARCH_C') => void;
  advancePhase: (nextPhase: number) => void;
  triggerNextCrisis: () => void;
  resolveCrisis: (optionId: string) => void;
  sendChat: (text: string, isPing?: boolean) => void;
  askSpaceMentor: (question?: string) => Promise<void>;
  leaveMission: () => void;
}

const BADGE_STORAGE_KEY = 'missionsphere_badges';

function loadLocalBadges(): string[] {
  try {
    const raw = localStorage.getItem(BADGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBadge(id: string) {
  try {
    const current = loadLocalBadges();
    if (!current.includes(id)) {
      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify([...current, id]));
    }
  } catch {
    // ignore
  }
}

const SESSION_STORAGE_KEY = 'missionsphere_session';

export function getSavedSession(): { roomId: string; playerId: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.roomId === 'string' && typeof parsed.playerId === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveSession(roomId: string, playerId: string) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ roomId, playerId }));
  } catch {
    // ignore
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

let listenersInitialized = false;

export const useMissionStore = create<MissionStore>((set, get) => ({
  screen: 'HOME',
  language: 'FR',
  muted: false,
  isOfflineMode: false,
  myPlayerId: null,
  soloActiveRole: 'MANAGER',
  mission: null,
  errorBanner: null,
  isExplainingMentor: false,
  unlockedBadges: loadLocalBadges(),
  adapter: null,

  setLanguage: (language) => set({ language }),

  toggleMute: () => {
    const next = !get().muted;
    audioService.setMuted(next);
    set({ muted: next });
  },

  setSoloActiveRole: (soloActiveRole) => set({ soloActiveRole }),

  clearError: () => set({ errorBanner: null }),
  setError: (errorBanner) => {
    audioService.playWarningTone();
    set({ errorBanner });
  },

  initListeners: () => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    socket.on('mission:stateSync', (state) => {
      const prev = get().mission;
      if (state.activeCrisis && !prev?.activeCrisis) {
        audioService.playCriticalAlert();
      }
      if (state.finalResults?.nasaMatch?.missionId) {
        saveLocalBadge(state.finalResults.nasaMatch.missionId);
        set({ unlockedBadges: loadLocalBadges() });
      }

      let nextScreen: AppScreen = get().screen;
      if (state.status === 'LOBBY') nextScreen = 'LOBBY';
      else if (state.currentPhase >= 13) nextScreen = 'SUMMARY';
      else nextScreen = 'WORKSPACE';

      set({ mission: state, screen: nextScreen });
    });

    socket.on('mission:error', (msg) => {
      audioService.playWarningTone();
      set({ errorBanner: msg });
    });

    socket.on('crisis:triggered', (crisis) => {
      if (crisis) audioService.playCriticalAlert();
    });
  },

  loadBadges: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/badges`);
      if (res.ok) {
        const data = await res.json();
        const merged = Array.from(new Set([...loadLocalBadges(), ...(data.unlockedIds || [])]));
        set({ unlockedBadges: merged });
      }
    } catch {
      set({ unlockedBadges: loadLocalBadges() });
    }
  },

  startSoloMission: async (username, demoMode = false) => {
    get().initListeners();
    set({ errorBanner: null });

    const fallbackToLocal = () => {
      const adapter = new LocalSimulationAdapter(username, 'SOLO', demoMode, (s) => {
        if (s.finalResults?.nasaMatch?.missionId) {
          saveLocalBadge(s.finalResults.nasaMatch.missionId);
        }
        const nextScreen: AppScreen = s.currentPhase >= 13 ? 'SUMMARY' : 'WORKSPACE';
        set({ mission: s, screen: nextScreen, unlockedBadges: loadLocalBadges() });
      });
      const localState = adapter.getState();
      set({
        isOfflineMode: true,
        adapter,
        myPlayerId: 'local-player',
        mission: localState,
        screen: 'WORKSPACE',
      });
      audioService.playGoForLaunch();
      return localState.roomId;
    };

    try {
      await socketService.connect(2500);

      return await new Promise<string | null>((resolve) => {
        socket.emit('room:create', { username, mode: 'SOLO', demoMode }, ({ roomId, playerId }) => {
          saveSession(roomId, playerId);
          set({ isOfflineMode: false, adapter: null, myPlayerId: playerId, screen: 'WORKSPACE' });
          audioService.playGoForLaunch();
          resolve(roomId);
        });
      });
    } catch {
      return fallbackToLocal();
    }
  },

  createMultiRoom: async (username) => {
    get().initListeners();
    set({ errorBanner: null });
    try {
      await socketService.connect(7000);
      return await new Promise<string | null>((resolve) => {
        socket.emit('room:create', { username, mode: 'MULTI' }, ({ roomId, playerId }) => {
          saveSession(roomId, playerId);
          set({ isOfflineMode: false, adapter: null, myPlayerId: playerId, screen: 'LOBBY' });
          audioService.playTelemetryBlip(960, 0.08);
          resolve(roomId);
        });
      });
    } catch {
      set({
        errorBanner:
          'Serveur multijoueur WebSocket inaccessible (hébergement statique sans backend Socket.io ou serveur éteint). Utilisez le Mode Solo ou configurez VITE_SOCKET_URL.',
      });
      return null;
    }
  },

  joinMultiRoom: async (roomId, username) => {
    get().initListeners();
    set({ errorBanner: null });
    try {
      await socketService.connect(7000);

      return await new Promise<boolean>((resolve) => {
        const code = roomId.trim().toUpperCase();
        socket.emit('room:join', { roomId: code, username }, (res) => {
          if (res.success && res.playerId) {
            saveSession(code, res.playerId);
            set({ isOfflineMode: false, adapter: null, myPlayerId: res.playerId, screen: 'LOBBY' });
            audioService.playTelemetryBlip(960, 0.08);
            resolve(true);
          } else {
            set({ errorBanner: res.error || 'Impossible de rejoindre la salle.' });
            resolve(false);
          }
        });
      });
    } catch {
      set({
        errorBanner:
          'Connexion au serveur multijoueur impossible (vérifiez que server.ts tourne ou que VITE_SOCKET_URL est configuré).',
      });
      return false;
    }
  },

  rejoinRoom: async (roomId) => {
    const saved = getSavedSession();
    const code = roomId.trim().toUpperCase();
    if (!saved || saved.roomId.toUpperCase() !== code) return false;

    get().initListeners();
    try {
      await socketService.connect(7000);

      return await new Promise<boolean>((resolve) => {
        socket.emit('room:rejoin', { roomId: code, playerId: saved.playerId }, (res) => {
          if (res.success && res.playerId) {
            set({ isOfflineMode: false, adapter: null, myPlayerId: res.playerId });
            resolve(true);
          } else {
            clearSession();
            resolve(false);
          }
        });
      });
    } catch {
      return false;
    }
  },

  selectRole: (role) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(820, 0.05);
    if (isOfflineMode && adapter) {
      adapter.selectRole(role);
      return;
    }
    socket.emit('room:selectRole', { roomId: mission.roomId, role });
  },

  toggleReady: () => {
    const { mission, isOfflineMode } = get();
    if (!mission || isOfflineMode) return;
    audioService.playTelemetryBlip(920, 0.05);
    socket.emit('room:toggleReady', { roomId: mission.roomId });
  },

  updateOptions: (opts) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    if (isOfflineMode && adapter) {
      adapter.updateOptions(opts);
      return;
    }
    socket.emit('room:updateOptions', { roomId: mission.roomId, ...opts });
  },

  applyDemoPreset: () => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(1020, 0.08);
    if (isOfflineMode && adapter) {
      adapter.applyDemoPreset();
      return;
    }
    socket.emit('room:applyDemoPreset', { roomId: mission.roomId });
  },

  startMissionFromLobby: () => {
    const { mission, isOfflineMode } = get();
    if (!mission || isOfflineMode) return;
    audioService.playGoForLaunch();
    socket.emit('room:startMission', { roomId: mission.roomId });
  },

  updateDesign: (patch) => {
    const { mission, isOfflineMode, adapter, soloActiveRole } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(760, 0.04);
    if (isOfflineMode && adapter) {
      const err = adapter.updateDesign(patch);
      if (err) set({ errorBanner: err });
      return;
    }
    socket.emit('design:update', {
      roomId: mission.roomId,
      patch,
      actingRole: mission.mode === 'SOLO' ? soloActiveRole : undefined,
    });
  },

  suggestRequirement: (field, value) => {
    const { mission, isOfflineMode } = get();
    if (!mission || isOfflineMode) return;
    socket.emit('design:suggestRequirement', { roomId: mission.roomId, field, value });
  },

  proposeMdl: (text) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(860, 0.05);
    if (isOfflineMode && adapter) {
      adapter.proposeMdl(text);
      return;
    }
    socket.emit('mdl:propose', { roomId: mission.roomId, text });
  },

  voteMdl: (proposalId) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(900, 0.05);
    if (isOfflineMode && adapter) {
      adapter.voteMdl(proposalId);
      return;
    }
    socket.emit('mdl:vote', { roomId: mission.roomId, proposalId });
  },

  voteTrade: (archId) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(920, 0.06);
    if (isOfflineMode && adapter) {
      adapter.voteTrade(archId);
      return;
    }
    socket.emit('trade:vote', { roomId: mission.roomId, archId });
  },

  advancePhase: (nextPhase) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    if (nextPhase === 10) audioService.playGoForLaunch();
    else audioService.playTelemetryBlip(980, 0.07);

    if (isOfflineMode && adapter) {
      const err = adapter.advancePhase(nextPhase);
      if (err) {
        audioService.playCriticalAlert();
        set({ errorBanner: err });
      }
      return;
    }
    socket.emit('phase:advance', { roomId: mission.roomId, nextPhase });
  },

  triggerNextCrisis: () => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playCriticalAlert();
    if (isOfflineMode && adapter) {
      adapter.triggerNextCrisis();
      return;
    }
    socket.emit('crisis:triggerNext', { roomId: mission.roomId });
  },

  resolveCrisis: (optionId) => {
    const { mission, isOfflineMode, adapter } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(840, 0.07);
    if (isOfflineMode && adapter) {
      adapter.resolveCrisis(optionId);
      return;
    }
    socket.emit('crisis:resolve', { roomId: mission.roomId, optionId });
  },

  sendChat: (text, isPing = false) => {
    const { mission, isOfflineMode, adapter, soloActiveRole } = get();
    if (!mission) return;
    audioService.playTelemetryBlip(isPing ? 1100 : 720, 0.05);
    if (isOfflineMode && adapter) {
      adapter.sendChat(text, isPing, mission.mode === 'SOLO' ? soloActiveRole : undefined);
      return;
    }
    socket.emit('chat:send', {
      roomId: mission.roomId,
      text,
      isPing,
      roleOverride: mission.mode === 'SOLO' ? soloActiveRole : undefined,
    });
  },

  askSpaceMentor: async (question) => {
    const { mission } = get();
    if (!mission) return;
    set({ isExplainingMentor: true });
    try {
      const res = await fetch(`${API_BASE}/api/mentor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: mission.roomId,
          question,
          fallbackState: mission,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const { message } = await res.json();
      if (message) {
        set((state) => ({
          mission: state.mission
            ? {
                ...state.mission,
                mentorFeed: [message, ...state.mission.mentorFeed].slice(0, 12),
              }
            : null,
        }));
      }
    } catch {
      // Fallback inline message if network fails completely
      set((state) => ({
        mission: state.mission
          ? {
              ...state.mission,
              mentorFeed: [
                {
                  id: `mentor-local-${Date.now()}`,
                  severity: 'INFO' as const,
                  title: 'Rappel Space Mentor',
                  explanation: `Équilibrez masse (${state.mission.telemetry.massTotal}kg), énergie (${state.mission.telemetry.powerBalance}W) et débit (${state.mission.telemetry.dataGeneratedMbps}/${state.mission.telemetry.dataCapacityMbps} Mbps).`,
                  tradeOffTip: 'Ajustez vos panneaux ou votre antenne si une jauge passe en Orange ou Rouge.',
                  timestamp: Date.now(),
                },
                ...state.mission.mentorFeed,
              ].slice(0, 12),
            }
          : null,
      }));
    } finally {
      set({ isExplainingMentor: false });
    }
  },

  leaveMission: () => {
    const { adapter } = get();
    if (adapter) adapter.dispose();
    if (socket.connected) socket.disconnect();
    clearSession();
    set({
      screen: 'HOME',
      mission: null,
      adapter: null,
      isOfflineMode: false,
      errorBanner: null,
    });
  },
}));
