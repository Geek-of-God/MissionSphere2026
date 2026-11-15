import { Server, Socket } from 'socket.io';
import { PhysicsEngine } from '../../../shared/engine/PhysicsEngine';
import { MissionDesign, MissionState, PlayerRole } from '../../../shared/types/mission.types';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types/socket.types';
import {
  getRoomState,
  getSocketBinding,
  registerSocket,
  saveRoomState,
  unregisterSocket,
} from '../config/roomStore';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return `plr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createInitialDesign(): MissionDesign {
  return {
    target: 'FLOODS',
    requirements: {
      budgetLimit: 180,
      minResolutionMeters: 10,
      targetDurationYears: 3,
      maxRiskTolerance: 25,
    },
    requirementSuggestions: {},
    selectedArchitecture: null,
    architectureVotes: {},
    busId: 'bus-smallsat',
    solarPanelId: 'solar-deploy-1axis',
    batteryId: 'batt-li-200',
    antennaId: 'ant-x-band',
    obcId: 'obc-radhard',
    payloadIds: [],
    orbit: {
      type: 'SSO',
      altitudeKm: 650,
      inclinationDeg: 98.0,
    },
    launcherId: 'launch-medium',
  };
}

export function createInitialMissionState(
  roomId: string,
  mode: 'SOLO' | 'MULTI',
  hostId: string,
  username: string,
  demoMode = false
): MissionState {
  const design = createInitialDesign();
  const telemetry = PhysicsEngine.recalculate(design, 'NONE');

  return {
    roomId,
    hostId,
    mode,
    status: mode === 'SOLO' ? 'ACTIVE' : 'LOBBY',
    difficulty: 'STANDARD',
    modifier: 'NONE',
    demoMode,
    currentPhase: 1,
    cmlLevel: 1,
    players: [
      {
        id: hostId,
        username: username.trim() || 'Commander',
        role: 'MANAGER',
        isReady: mode === 'SOLO',
        isConnected: true,
        actionsCount: 0,
        proposalsMade: 0,
        votesCast: 0,
        pingsSent: 0,
      },
    ],
    design,
    telemetry,
    mdlProposals: [],
    opsState: {
      currentStep: 0,
      satelliteHealth: 100,
      dataCollectedPct: 0,
      sciencePenaltyPct: 0,
      durationPenaltyYears: 0,
      resolvedCrises: [],
    },
    activeCrisis: null,
    mentorFeed: [
      {
        id: 'mentor-welcome',
        severity: 'INFO',
        title: 'Bienvenue au Mission Design Lab',
        explanation:
          'Chaque choix technique entraîne un compromis masse, énergie, débit ou budget. Commencez par choisir votre objectif scientifique.',
        tradeOffTip: 'Observez les 7 jauges en haut de votre console en temps réel.',
        timestamp: Date.now(),
      },
    ],
    chatMessages: [],
    eventsLog: [],
  };
}

export function registerRoomHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
  const getActingPlayerId = () => getSocketBinding(socket.id)?.playerId || socket.id;

  socket.on('room:create', ({ username, mode, demoMode }, cb) => {
    let roomId = generateRoomCode();
    while (getRoomState(roomId)) {
      roomId = generateRoomCode();
    }

    const playerId = generatePlayerId();
    const state = createInitialMissionState(roomId, mode, playerId, username, Boolean(demoMode));
    saveRoomState(roomId, state);
    registerSocket(socket.id, roomId, playerId);
    socket.join(roomId);

    cb({ roomId, playerId });
    io.to(roomId).emit('mission:stateSync', state);
  });

  socket.on('room:join', ({ roomId, username }, cb) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) {
      cb({ success: false, error: `Salle "${cleanCode}" introuvable.` });
      return;
    }

    const existingBySocket = state.players.find((p) => p.id === getActingPlayerId());
    const activePlayers = state.players.filter((p) => p.isConnected);
    if (activePlayers.length >= 4 && !existingBySocket) {
      cb({ success: false, error: 'Cette salle du Mission Control est déjà complète (4/4 joueurs).' });
      return;
    }

    let playerId = existingBySocket?.id;
    if (!existingBySocket) {
      if (state.status === 'LOBBY') {
        // Prune stale disconnected players in LOBBY so free seats stay cleanly available
        state.players = state.players.filter((p) => p.isConnected);
      }
      playerId = generatePlayerId();
      const takenRoles = new Set(
        state.players.filter((p) => p.isConnected).map((p) => p.role).filter(Boolean)
      );
      const allRoles: PlayerRole[] = ['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'];
      const freeRole = allRoles.find((r) => !takenRoles.has(r)) ?? null;

      state.players.push({
        id: playerId,
        username: username.trim() || `Specialist-${state.players.length + 1}`,
        role: freeRole,
        isReady: false,
        isConnected: true,
        actionsCount: 0,
        proposalsMade: 0,
        votesCast: 0,
        pingsSent: 0,
      });
    } else {
      existingBySocket.isConnected = true;
    }

    saveRoomState(cleanCode, state);
    registerSocket(socket.id, cleanCode, playerId!);
    socket.join(cleanCode);

    cb({ success: true, playerId });
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:rejoin', ({ roomId, playerId }, cb) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) {
      cb({ success: false, error: `Session "${cleanCode}" expirée ou introuvable.` });
      return;
    }

    const player = state.players.find((p) => p.id === playerId);
    if (!player) {
      cb({ success: false, error: 'Joueur introuvable dans cette salle.' });
      return;
    }

    player.isConnected = true;
    saveRoomState(cleanCode, state);
    registerSocket(socket.id, cleanCode, player.id);
    socket.join(cleanCode);

    cb({ success: true, playerId: player.id });
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:selectRole', ({ roomId, role }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const pid = getActingPlayerId();
    const player = state.players.find((p) => p.id === pid);
    if (!player) return;

    if (state.mode === 'MULTI') {
      const takenByOther = state.players.find(
        (p) => p.id !== pid && p.isConnected && p.role === role
      );
      if (takenByOther) {
        socket.emit('mission:error', `Le poste ${role} est déjà occupé par un autre joueur.`);
        return;
      }
      // Clear stale role from any disconnected player if reclaimed
      state.players.forEach((p) => {
        if (p.id !== pid && !p.isConnected && p.role === role) {
          p.role = null;
        }
      });
    }

    player.role = role;
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:toggleReady', ({ roomId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const pid = getActingPlayerId();
    const player = state.players.find((p) => p.id === pid);
    if (!player) return;

    player.isReady = !player.isReady;
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:updateOptions', ({ roomId, difficulty, modifier, demoMode }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    if (difficulty) state.difficulty = difficulty;
    if (modifier) {
      state.modifier = modifier;
      if (modifier === 'CUBESAT_ONLY') {
        state.design.busId = 'bus-cubesat-6u';
        state.design.payloadIds = state.design.payloadIds.slice(0, 1);
      }
    }
    if (typeof demoMode === 'boolean') state.demoMode = demoMode;

    state.telemetry = PhysicsEngine.recalculate(state.design, state.modifier);
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:applyDemoPreset', ({ roomId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    state.demoMode = true;
    state.design = {
      ...state.design,
      target: 'FLOODS',
      requirements: {
        budgetLimit: 195,
        minResolutionMeters: 5,
        targetDurationYears: 3,
        maxRiskTolerance: 25,
      },
      selectedArchitecture: 'ARCH_A',
      busId: 'bus-smallsat',
      solarPanelId: 'solar-gaas-2axis',
      batteryId: 'batt-li-200',
      antennaId: 'ant-x-band',
      obcId: 'obc-radhard',
      payloadIds: ['pay-sar-c'],
      orbit: { type: 'SSO', altitudeKm: 650, inclinationDeg: 98.0 },
      launcherId: 'launch-medium',
    };
    state.telemetry = PhysicsEngine.recalculate(state.design, state.modifier);
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('room:startMission', ({ roomId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    if (state.mode === 'MULTI') {
      const pid = getActingPlayerId();
      if (state.hostId && pid !== state.hostId) {
        socket.emit('mission:error', 'Seul l\'hôte de la salle peut lancer la mission.');
        return;
      }
      const connectedPlayers = state.players.filter((p) => p.isConnected);
      if (connectedPlayers.some((p) => !p.role)) {
        socket.emit('mission:error', 'Tous les joueurs connectés doivent sélectionner un rôle.');
        return;
      }
      if (connectedPlayers.some((p) => !p.isReady)) {
        socket.emit('mission:error', 'Tous les joueurs connectés doivent cliquer PRÊT avant le lancement.');
        return;
      }
    }

    state.status = 'ACTIVE';
    state.currentPhase = 1;
    state.cmlLevel = 1;
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('disconnect', () => {
    const binding = unregisterSocket(socket.id);
    if (!binding) return;
    const state = getRoomState(binding.roomId);
    if (!state) return;

    const player = state.players.find((p) => p.id === binding.playerId);
    if (player) {
      player.isConnected = false;
      saveRoomState(binding.roomId, state);
      io.to(binding.roomId).emit('mission:stateSync', state);
    }
  });
}
