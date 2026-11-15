import { Server, Socket } from 'socket.io';
import { CATALOG, getTradeStudiesForTarget } from '../../../shared/constants/catalogData';
import { CrisisEngine } from '../../../shared/engine/CrisisEngine';
import { NasaMatcher } from '../../../shared/engine/NasaMatcher';
import { PhysicsEngine } from '../../../shared/engine/PhysicsEngine';
import { ScoreEngine } from '../../../shared/engine/ScoreEngine';
import { MissionDesign, MissionState, PlayerRole } from '../../../shared/types/mission.types';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types/socket.types';
import { SpaceMentor } from '../ai/SpaceMentor';
import { getRoomState, getSocketBinding, recordCompletedMission, saveRoomState } from '../config/roomStore';

const crisisIntervals = new Map<string, NodeJS.Timeout>();

function clearCrisisTimer(roomId: string) {
  const existing = crisisIntervals.get(roomId);
  if (existing) {
    clearInterval(existing);
    crisisIntervals.delete(roomId);
  }
}

function phaseToCml(phase: number): number {
  if (phase <= 2) return 1;
  if (phase <= 4) return 2;
  if (phase <= 6) return 3;
  if (phase <= 8) return 4;
  if (phase === 9) return 5;
  return 6;
}

function recalculateState(state: MissionState) {
  state.telemetry = PhysicsEngine.recalculate(state.design, state.modifier, {
    sciencePenaltyPct: state.opsState.sciencePenaltyPct,
    durationPenaltyYears: state.opsState.durationPenaltyYears,
  });
}

function applyCrisisResolution(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  state: MissionState,
  optionId: string
) {
  if (!state.activeCrisis) return;
  const option =
    state.activeCrisis.options.find((o) => o.id === optionId) ?? state.activeCrisis.options[0];

  clearCrisisTimer(state.roomId);

  if (option.scienceDelta < 0) {
    state.opsState.sciencePenaltyPct += Math.abs(option.scienceDelta);
  } else if (option.scienceDelta > 0) {
    state.opsState.sciencePenaltyPct = Math.max(0, state.opsState.sciencePenaltyPct - option.scienceDelta);
  }

  if (option.durationDeltaYears < 0) {
    state.opsState.durationPenaltyYears += Math.abs(option.durationDeltaYears);
  }

  state.opsState.satelliteHealth = Math.max(
    15,
    Math.min(100, state.opsState.satelliteHealth + option.healthDelta)
  );
  state.opsState.dataCollectedPct = Math.min(100, state.opsState.currentStep * 33 + 1);
  state.opsState.resolvedCrises.push({
    title: state.activeCrisis.title,
    chosenLabel: option.label,
    impactSummary: option.impactSummary,
  });

  state.eventsLog.push({
    id: `evt-${Date.now()}`,
    phaseNumber: 11,
    actorRole: 'OPERATIONS',
    eventType: 'CRISIS_CHOICE',
    description: `${state.activeCrisis.title} -> ${option.label}`,
    timestamp: Date.now(),
  });

  state.activeCrisis = null;
  recalculateState(state);
  state.telemetry.budgetUsed += option.budgetDelta;
  state.telemetry.riskPercentage = Math.max(
    1,
    Math.min(99, state.telemetry.riskPercentage + option.riskDelta)
  );

  saveRoomState(state.roomId, state);
  io.to(state.roomId).emit('crisis:triggered', null);
  io.to(state.roomId).emit('mission:stateSync', state);
}

function startCrisisForRoom(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  state: MissionState,
  stepIndex: number
) {
  clearCrisisTimer(state.roomId);
  state.opsState.currentStep = stepIndex;
  const crisis = CrisisEngine.generateCrisis(state, stepIndex);
  state.activeCrisis = crisis;
  saveRoomState(state.roomId, state);

  io.to(state.roomId).emit('crisis:triggered', crisis);
  io.to(state.roomId).emit('mission:stateSync', state);

  const timer = setInterval(() => {
    const current = getRoomState(state.roomId);
    if (!current || !current.activeCrisis || current.activeCrisis.id !== crisis.id) {
      clearCrisisTimer(state.roomId);
      return;
    }
    current.activeCrisis.timeLeft -= 1;
    if (current.activeCrisis.timeLeft <= 0) {
      // Auto-resolve with safest/default option on timeout
      applyCrisisResolution(io, current, current.activeCrisis.options[0].id);
      return;
    }
    saveRoomState(state.roomId, current);
    io.to(state.roomId).emit('mission:stateSync', current);
  }, 1000);

  crisisIntervals.set(state.roomId, timer);
}

export function registerMissionHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
  const getActingPlayerId = () => getSocketBinding(socket.id)?.playerId || socket.id;

  socket.on('design:update', ({ roomId, patch, actingRole }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    if (!player) return;

    // Role permission checks in MULTI mode
    if (state.mode === 'MULTI' && player.role) {
      const r = player.role;
      if (patch.payloadIds !== undefined && !['SCIENCE', 'MANAGER'].includes(r)) {
        socket.emit('mission:error', 'Charge utile réservée au Science Lead (ou Mission Manager).');
        return;
      }
      if (
        (patch.busId !== undefined ||
          patch.solarPanelId !== undefined ||
          patch.batteryId !== undefined ||
          patch.launcherId !== undefined) &&
        !['SYSTEMS', 'MANAGER'].includes(r)
      ) {
        socket.emit('mission:error', 'Architecture Bus/Énergie/Lanceur réservée au Systems Engineer.');
        return;
      }
      if (
        (patch.orbit !== undefined || patch.antennaId !== undefined) &&
        !['OPERATIONS', 'SYSTEMS', 'MANAGER'].includes(r)
      ) {
        socket.emit('mission:error', 'Orbite et antennes réservées à l\'Operations Lead.');
        return;
      }
    }

    // Modifier enforcement: CUBESAT_ONLY
    if (state.modifier === 'CUBESAT_ONLY' && patch.busId && patch.busId !== 'bus-cubesat-6u') {
      socket.emit('mission:error', 'Modificateur actif : Mode CubeSat uniquement !');
      return;
    }

    // Payload slot cap enforcement
    const nextBusId = patch.busId !== undefined ? patch.busId : state.design.busId;
    const maxSlots = nextBusId ? CATALOG[nextBusId]?.payloadSlots ?? 3 : 3;
    let nextPayloads = patch.payloadIds !== undefined ? patch.payloadIds : state.design.payloadIds;
    if (nextPayloads.length > maxSlots) {
      if (patch.payloadIds !== undefined) {
        socket.emit(
          'mission:error',
          `Baie Payload pleine (${maxSlots} emplacement${maxSlots > 1 ? 's' : ''} max sur ce châssis).`
        );
        return;
      }
      nextPayloads = nextPayloads.slice(0, maxSlots);
    }

    // Deep merge requirements & orbit cleanly
    const nextDesign: MissionDesign = {
      ...state.design,
      ...patch,
      payloadIds: nextPayloads,
      requirements: patch.requirements
        ? { ...state.design.requirements, ...patch.requirements }
        : state.design.requirements,
      orbit: patch.orbit ? { ...state.design.orbit, ...patch.orbit } : state.design.orbit,
    };

    // Auto-switch default orbit if target switches to MOON or MARS
    if (patch.target && patch.target !== state.design.target) {
      if (patch.target === 'MOON') {
        nextDesign.orbit = { type: 'LUNAR', altitudeKm: 100, inclinationDeg: 90 };
      } else if (patch.target === 'MARS') {
        nextDesign.orbit = { type: 'MARS', altitudeKm: 400, inclinationDeg: 74 };
      } else if (['LUNAR', 'MARS'].includes(nextDesign.orbit.type)) {
        nextDesign.orbit = { type: 'SSO', altitudeKm: 650, inclinationDeg: 98 };
      }
    }

    state.design = nextDesign;
    player.actionsCount += 1;
    recalculateState(state);

    const advice = SpaceMentor.evaluateState(state);
    if (advice) {
      state.mentorFeed.unshift(advice);
      state.mentorFeed = state.mentorFeed.slice(0, 12);
    }

    state.eventsLog.push({
      id: `evt-${Date.now()}`,
      phaseNumber: state.currentPhase,
      actorRole: actingRole || player.role,
      eventType: 'DESIGN_CHANGE',
      description: `Mise à jour conception (Phase ${state.currentPhase})`,
      timestamp: Date.now(),
    });

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('design:suggestRequirement', ({ roomId, field, value }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;
    const player = state.players.find((p) => p.id === getActingPlayerId());
    if (!player?.role) return;

    state.design.requirementSuggestions = {
      ...state.design.requirementSuggestions,
      [field]: { value, byRole: player.role },
    };
    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('mdl:propose', ({ roomId, text }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state || !text.trim()) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    const authorRole: PlayerRole = player?.role || 'MANAGER';
    if (player) player.proposalsMade += 1;

    state.mdlProposals.push({
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      authorRole,
      text: text.trim().slice(0, 200),
      votes: [authorRole],
    });

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('mdl:vote', ({ roomId, proposalId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    const role: PlayerRole = player?.role || 'MANAGER';
    const prop = state.mdlProposals.find((p) => p.id === proposalId);
    if (!prop) return;

    if (prop.votes.includes(role)) {
      prop.votes = prop.votes.filter((v) => v !== role);
    } else {
      prop.votes.push(role);
      if (player) player.votesCast += 1;
    }

    state.eventsLog.push({
      id: `evt-${Date.now()}`,
      phaseNumber: 3,
      actorRole: role,
      eventType: 'MDL_VOTE',
      description: `Vote MDL sur "${prop.text.slice(0, 40)}"`,
      timestamp: Date.now(),
    });

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('trade:vote', ({ roomId, archId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    const role: PlayerRole = player?.role || 'MANAGER';
    if (player) player.votesCast += 1;

    state.design.architectureVotes = {
      ...state.design.architectureVotes,
      [role]: archId,
    };

    // Determine majority or single player selection
    const counts: Record<'ARCH_A' | 'ARCH_B' | 'ARCH_C', number> = {
      ARCH_A: 0,
      ARCH_B: 0,
      ARCH_C: 0,
    };
    Object.values(state.design.architectureVotes).forEach((v) => {
      if (v) counts[v] += 1;
    });

    const winner = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || archId) as
      | 'ARCH_A'
      | 'ARCH_B'
      | 'ARCH_C';
    state.design.selectedArchitecture = winner;

    // Apply preset baseline if architecture selected (respecting CUBESAT_ONLY)
    const options = getTradeStudiesForTarget(state.design.target);
    const chosen = options.find((o) => o.id === winner);
    if (chosen) {
      const p = chosen.presetDesign;
      state.design = {
        ...state.design,
        busId: state.modifier === 'CUBESAT_ONLY' ? 'bus-cubesat-6u' : p.busId,
        solarPanelId: p.solarPanelId,
        batteryId: p.batteryId,
        antennaId: p.antennaId,
        obcId: p.obcId,
        payloadIds: state.modifier === 'CUBESAT_ONLY' ? p.payloadIds.slice(0, 1) : [...p.payloadIds],
        orbit: {
          type: p.orbitType,
          altitudeKm: p.altitudeKm,
          inclinationDeg: p.orbitType === 'SSO' ? 98 : p.orbitType === 'LUNAR' ? 90 : 51.6,
        },
        launcherId: p.launcherId,
      };
      recalculateState(state);
    }

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('phase:advance', ({ roomId, nextPhase }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state) return;

    const clamped = Math.max(1, Math.min(15, nextPhase));

    // MRR Gatekeeper: Cannot enter Phase 10+ if MRR has blocking CRITICAL items
    if (state.currentPhase === 9 && clamped >= 10) {
      const player = state.players.find((p) => p.id === getActingPlayerId());
      if (state.mode === 'MULTI' && player?.role !== 'MANAGER') {
        socket.emit('mission:error', 'Seul le Mission Manager peut signer le GO for Launch en Phase 9.');
        return;
      }
      const mrr = PhysicsEngine.evaluateMRR(state);
      if (!mrr.canLaunch) {
        socket.emit(
          'mission:error',
          'NO-GO : Un ou plusieurs indicateurs MRR sont en Rouge critique. Revenez corriger le design.'
        );
        return;
      }
      state.eventsLog.push({
        id: `evt-${Date.now()}`,
        phaseNumber: 9,
        actorRole: 'MANAGER',
        eventType: 'MRR_CHECK',
        description: 'Autorisation de lancement signée (GO FOR LAUNCH)',
        timestamp: Date.now(),
      });
    }

    state.currentPhase = clamped;
    state.cmlLevel = phaseToCml(clamped);

    // Entering Phase 11 automatically triggers Crisis #1 if none active and step 0
    if (clamped === 11 && state.opsState.currentStep === 0 && !state.activeCrisis) {
      startCrisisForRoom(io, state, 1);
      return;
    }

    // Entering Phases 13–15 computes final score & NASA match
    if (clamped >= 13 && !state.finalResults) {
      state.status = 'COMPLETED';
      const score = ScoreEngine.computeFinalScore(state);
      const nasaMatch = NasaMatcher.findClosestMission(state);
      state.finalResults = { score, nasaMatch };
      recordCompletedMission(state);
    }

    const advice = SpaceMentor.evaluateState(state);
    if (advice) {
      state.mentorFeed.unshift(advice);
      state.mentorFeed = state.mentorFeed.slice(0, 12);
    }

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('crisis:triggerNext', ({ roomId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state || state.activeCrisis) return;

    const nextStep = state.opsState.currentStep + 1;
    if (nextStep <= 3) {
      startCrisisForRoom(io, state, nextStep);
    }
  });

  socket.on('crisis:resolve', ({ roomId, optionId }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state || !state.activeCrisis) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    const role: PlayerRole = player?.role || 'OPERATIONS';

    if (state.mode === 'SOLO' || state.players.length <= 1) {
      applyCrisisResolution(io, state, optionId);
      return;
    }

    state.activeCrisis.votes[role] = optionId;
    if (player) player.votesCast += 1;

    const totalVotes = Object.keys(state.activeCrisis.votes).length;
    if (totalVotes >= Math.min(state.players.length, 2) || role === 'OPERATIONS' || role === 'MANAGER') {
      // Tally votes; Operations/Manager tie-break on second vote
      const counts: Record<string, number> = {};
      Object.values(state.activeCrisis.votes).forEach((id) => {
        if (id) counts[id] = (counts[id] || 0) + 1;
      });
      const winningId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || optionId;
      applyCrisisResolution(io, state, winningId);
      return;
    }

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });

  socket.on('chat:send', ({ roomId, text, isPing, roleOverride }) => {
    const cleanCode = roomId.trim().toUpperCase();
    const state = getRoomState(cleanCode);
    if (!state || !text.trim()) return;

    const player = state.players.find((p) => p.id === getActingPlayerId());
    const role: PlayerRole = roleOverride || player?.role || 'MANAGER';
    if (player && isPing) player.pingsSent += 1;

    state.chatMessages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      sender: player?.username || role,
      role,
      text: text.trim().slice(0, 280),
      isPing,
      timestamp: Date.now(),
    });
    state.chatMessages = state.chatMessages.slice(-40);

    saveRoomState(cleanCode, state);
    io.to(cleanCode).emit('mission:stateSync', state);
  });
}
