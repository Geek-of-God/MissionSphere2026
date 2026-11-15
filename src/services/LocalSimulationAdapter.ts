import { CATALOG, getTradeStudiesForTarget } from '../../shared/constants/catalogData';
import { CrisisEngine } from '../../shared/engine/CrisisEngine';
import { NasaMatcher } from '../../shared/engine/NasaMatcher';
import { PhysicsEngine } from '../../shared/engine/PhysicsEngine';
import { ScoreEngine } from '../../shared/engine/ScoreEngine';
import { SpaceMentorRules } from '../../shared/engine/SpaceMentorRules';
import {
  DifficultyLevel,
  MissionDesign,
  MissionModifier,
  MissionState,
  PlayerRole,
} from '../../shared/types/mission.types';

/**
 * LocalSimulationAdapter (MS-18):
 * Runs full PhysicsEngine, CrisisEngine, ScoreEngine, NasaMatcher, and SpaceMentorRules
 * in-browser whenever the WebSocket server is unreachable or offline demo mode is active.
 */
export class LocalSimulationAdapter {
  private state: MissionState;
  private crisisTimer: number | null = null;
  private onChange: (state: MissionState) => void;

  constructor(username: string, mode: 'SOLO' | 'MULTI', demoMode: boolean, onChange: (s: MissionState) => void) {
    this.onChange = onChange;
    const code = 'LOCAL1';
    const design: MissionDesign = {
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
      orbit: { type: 'SSO', altitudeKm: 650, inclinationDeg: 98.0 },
      launcherId: 'launch-medium',
    };

    this.state = {
      roomId: code,
      mode,
      status: mode === 'SOLO' ? 'ACTIVE' : 'LOBBY',
      difficulty: 'STANDARD',
      modifier: 'NONE',
      demoMode,
      currentPhase: 1,
      cmlLevel: 1,
      players: [
        {
          id: 'local-player',
          username: username || 'Commander',
          role: 'MANAGER',
          isReady: true,
          isConnected: true,
          actionsCount: 0,
          proposalsMade: 0,
          votesCast: 0,
          pingsSent: 0,
        },
      ],
      design,
      telemetry: PhysicsEngine.recalculate(design, 'NONE'),
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
          id: 'local-welcome',
          severity: 'INFO',
          title: 'Mode Simulation Locale Actif',
          explanation:
            'Tous les calculs physiques, règles Space Mentor et comparaisons NASA fonctionnent directement dans votre navigateur.',
          tradeOffTip: 'Sélectionnez une cible pour démarrer la conception.',
          timestamp: Date.now(),
        },
      ],
      chatMessages: [],
      eventsLog: [],
    };
  }

  public getState(): MissionState {
    return this.state;
  }

  private emit() {
    this.onChange({ ...this.state });
  }

  private recalculate() {
    this.state.telemetry = PhysicsEngine.recalculate(this.state.design, this.state.modifier, {
      sciencePenaltyPct: this.state.opsState.sciencePenaltyPct,
      durationPenaltyYears: this.state.opsState.durationPenaltyYears,
    });
  }

  public selectRole(role: PlayerRole) {
    this.state.players[0].role = role;
    this.emit();
  }

  public updateOptions(opts: { difficulty?: DifficultyLevel; modifier?: MissionModifier; demoMode?: boolean }) {
    if (opts.difficulty) this.state.difficulty = opts.difficulty;
    if (opts.modifier) {
      this.state.modifier = opts.modifier;
      if (opts.modifier === 'CUBESAT_ONLY') {
        this.state.design.busId = 'bus-cubesat-6u';
        this.state.design.payloadIds = this.state.design.payloadIds.slice(0, 1);
      }
    }
    if (typeof opts.demoMode === 'boolean') this.state.demoMode = opts.demoMode;
    this.recalculate();
    this.emit();
  }

  public applyDemoPreset() {
    this.state.demoMode = true;
    this.state.design = {
      ...this.state.design,
      target: 'FLOODS',
      requirements: { budgetLimit: 195, minResolutionMeters: 5, targetDurationYears: 3, maxRiskTolerance: 25 },
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
    this.recalculate();
    this.emit();
  }

  public updateDesign(patch: Partial<MissionDesign>): string | null {
    const nextBusId = patch.busId !== undefined ? patch.busId : this.state.design.busId;
    const maxSlots = nextBusId ? CATALOG[nextBusId]?.payloadSlots ?? 3 : 3;
    let nextPayloads = patch.payloadIds !== undefined ? patch.payloadIds : this.state.design.payloadIds;
    if (nextPayloads.length > maxSlots) {
      if (patch.payloadIds !== undefined) {
        return `Baie Payload pleine (${maxSlots} max sur ce bus).`;
      }
      nextPayloads = nextPayloads.slice(0, maxSlots);
    }

    const nextDesign: MissionDesign = {
      ...this.state.design,
      ...patch,
      payloadIds: nextPayloads,
      requirements: patch.requirements
        ? { ...this.state.design.requirements, ...patch.requirements }
        : this.state.design.requirements,
      orbit: patch.orbit ? { ...this.state.design.orbit, ...patch.orbit } : this.state.design.orbit,
    };

    if (patch.target && patch.target !== this.state.design.target) {
      if (patch.target === 'MOON') nextDesign.orbit = { type: 'LUNAR', altitudeKm: 100, inclinationDeg: 90 };
      else if (patch.target === 'MARS') nextDesign.orbit = { type: 'MARS', altitudeKm: 400, inclinationDeg: 74 };
      else if (['LUNAR', 'MARS'].includes(nextDesign.orbit.type)) {
        nextDesign.orbit = { type: 'SSO', altitudeKm: 650, inclinationDeg: 98 };
      }
    }

    this.state.design = nextDesign;
    this.state.players[0].actionsCount += 1;
    this.recalculate();

    const advice = SpaceMentorRules.evaluate(this.state);
    if (advice) {
      this.state.mentorFeed = [advice, ...this.state.mentorFeed].slice(0, 12);
    }
    this.emit();
    return null;
  }

  public proposeMdl(text: string) {
    if (!text.trim()) return;
    const role = this.state.players[0].role || 'MANAGER';
    this.state.mdlProposals = [
      ...this.state.mdlProposals,
      { id: `prop-${Date.now()}`, authorRole: role, text: text.trim(), votes: [role] },
    ];
    this.emit();
  }

  public voteMdl(proposalId: string) {
    const role = this.state.players[0].role || 'MANAGER';
    this.state.mdlProposals = this.state.mdlProposals.map((p) => {
      if (p.id !== proposalId) return p;
      const has = p.votes.includes(role);
      return { ...p, votes: has ? p.votes.filter((v) => v !== role) : [...p.votes, role] };
    });
    this.emit();
  }

  public voteTrade(archId: 'ARCH_A' | 'ARCH_B' | 'ARCH_C') {
    const role = this.state.players[0].role || 'MANAGER';
    this.state.design.architectureVotes = { ...this.state.design.architectureVotes, [role]: archId };
    this.state.design.selectedArchitecture = archId;
    const chosen = getTradeStudiesForTarget(this.state.design.target).find((o) => o.id === archId);
    if (chosen) {
      const p = chosen.presetDesign;
      this.state.design = {
        ...this.state.design,
        busId: this.state.modifier === 'CUBESAT_ONLY' ? 'bus-cubesat-6u' : p.busId,
        solarPanelId: p.solarPanelId,
        batteryId: p.batteryId,
        antennaId: p.antennaId,
        obcId: p.obcId,
        payloadIds: this.state.modifier === 'CUBESAT_ONLY' ? p.payloadIds.slice(0, 1) : [...p.payloadIds],
        orbit: {
          type: p.orbitType,
          altitudeKm: p.altitudeKm,
          inclinationDeg: p.orbitType === 'SSO' ? 98 : p.orbitType === 'LUNAR' ? 90 : 51.6,
        },
        launcherId: p.launcherId,
      };
      this.recalculate();
    }
    this.emit();
  }

  public advancePhase(nextPhase: number): string | null {
    if (this.state.currentPhase === 9 && nextPhase >= 10) {
      const mrr = PhysicsEngine.evaluateMRR(this.state);
      if (!mrr.canLaunch) {
        return 'NO-GO : Corrigez les indicateurs rouges avant le lancement.';
      }
    }

    this.state.currentPhase = nextPhase;
    this.state.cmlLevel =
      nextPhase <= 2 ? 1 : nextPhase <= 4 ? 2 : nextPhase <= 6 ? 3 : nextPhase <= 8 ? 4 : nextPhase === 9 ? 5 : 6;

    if (nextPhase === 11 && this.state.opsState.currentStep === 0 && !this.state.activeCrisis) {
      this.triggerNextCrisis();
      return null;
    }

    if (nextPhase >= 13 && !this.state.finalResults) {
      this.state.status = 'COMPLETED';
      this.state.finalResults = {
        score: ScoreEngine.computeFinalScore(this.state),
        nasaMatch: NasaMatcher.findClosestMission(this.state),
      };
    }

    const advice = SpaceMentorRules.evaluate(this.state);
    if (advice) {
      this.state.mentorFeed = [advice, ...this.state.mentorFeed].slice(0, 12);
    }
    this.emit();
    return null;
  }

  public triggerNextCrisis() {
    if (this.state.activeCrisis) return;
    const nextStep = this.state.opsState.currentStep + 1;
    if (nextStep > 3) return;
    this.state.opsState.currentStep = nextStep;
    this.state.activeCrisis = CrisisEngine.generateCrisis(this.state, nextStep);
    this.emit();

    if (this.crisisTimer) window.clearInterval(this.crisisTimer);
    this.crisisTimer = window.setInterval(() => {
      if (!this.state.activeCrisis) {
        if (this.crisisTimer) window.clearInterval(this.crisisTimer);
        return;
      }
      this.state.activeCrisis = {
        ...this.state.activeCrisis,
        timeLeft: this.state.activeCrisis.timeLeft - 1,
      };
      if (this.state.activeCrisis.timeLeft <= 0) {
        this.resolveCrisis(this.state.activeCrisis.options[0].id);
        return;
      }
      this.emit();
    }, 1000);
  }

  public resolveCrisis(optionId: string) {
    if (!this.state.activeCrisis) return;
    if (this.crisisTimer) {
      window.clearInterval(this.crisisTimer);
      this.crisisTimer = null;
    }
    const opt =
      this.state.activeCrisis.options.find((o) => o.id === optionId) ??
      this.state.activeCrisis.options[0];

    if (opt.scienceDelta < 0) this.state.opsState.sciencePenaltyPct += Math.abs(opt.scienceDelta);
    else this.state.opsState.sciencePenaltyPct = Math.max(0, this.state.opsState.sciencePenaltyPct - opt.scienceDelta);

    if (opt.durationDeltaYears < 0) {
      this.state.opsState.durationPenaltyYears += Math.abs(opt.durationDeltaYears);
    }
    this.state.opsState.satelliteHealth = Math.max(
      15,
      Math.min(100, this.state.opsState.satelliteHealth + opt.healthDelta)
    );
    this.state.opsState.dataCollectedPct = Math.min(100, this.state.opsState.currentStep * 33 + 1);
    this.state.opsState.resolvedCrises.push({
      title: this.state.activeCrisis.title,
      chosenLabel: opt.label,
      impactSummary: opt.impactSummary,
    });
    this.state.activeCrisis = null;
    this.recalculate();
    this.state.telemetry.budgetUsed += opt.budgetDelta;
    this.state.telemetry.riskPercentage = Math.max(
      1,
      Math.min(99, this.state.telemetry.riskPercentage + opt.riskDelta)
    );
    this.emit();
  }

  public sendChat(text: string, isPing?: boolean, roleOverride?: PlayerRole) {
    if (!text.trim()) return;
    const role = roleOverride || this.state.players[0].role || 'MANAGER';
    this.state.chatMessages = [
      ...this.state.chatMessages,
      {
        id: `msg-${Date.now()}`,
        sender: this.state.players[0].username,
        role,
        text: text.trim(),
        isPing,
        timestamp: Date.now(),
      },
    ].slice(-40);
    this.emit();
  }

  public dispose() {
    if (this.crisisTimer) window.clearInterval(this.crisisTimer);
  }
}
