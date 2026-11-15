import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CATALOG } from '../constants/catalogData';
import { MissionDesign, MissionState } from '../types/mission.types';
import { CrisisEngine } from './CrisisEngine';
import { NasaMatcher } from './NasaMatcher';
import { PhysicsEngine } from './PhysicsEngine';
import { ScoreEngine } from './ScoreEngine';
import { SpaceMentorRules } from './SpaceMentorRules';

function makeState(design: MissionDesign, overrides?: Partial<MissionState>): MissionState {
  const telemetry = PhysicsEngine.recalculate(design, overrides?.modifier ?? 'NONE');
  return {
    roomId: 'TEST01',
    mode: 'SOLO',
    status: 'ACTIVE',
    difficulty: 'STANDARD',
    modifier: 'NONE',
    demoMode: false,
    currentPhase: 9,
    cmlLevel: 5,
    players: [
      {
        id: 'p1',
        username: 'Tester',
        role: 'MANAGER',
        isReady: true,
        isConnected: true,
        actionsCount: 8,
        proposalsMade: 1,
        votesCast: 2,
        pingsSent: 1,
      },
    ],
    design,
    mdlProposals: [
      {
        id: 'prop-1',
        authorRole: 'MANAGER',
        text: 'Alignement prioritaire science/budget',
        votes: ['MANAGER', 'SCIENCE', 'SYSTEMS'],
      },
    ],
    opsState: {
      currentStep: 3,
      satelliteHealth: 92,
      dataCollectedPct: 98,
      sciencePenaltyPct: 0,
      durationPenaltyYears: 0,
      resolvedCrises: [],
    },
    activeCrisis: null,
    mentorFeed: [],
    chatMessages: [],
    eventsLog: [],
    ...overrides,
    telemetry,
  };
}

describe('MS-04 / MS-05 : Catalog & PhysicsEngine sur 3 configurations types', () => {
  it('MS-05: Chaque catégorie du catalogue possède au moins 3 options réalistes', () => {
    const categories = ['BUS', 'SOLAR', 'BATTERY', 'ANTENNA', 'OBC', 'PAYLOAD', 'LAUNCHER'] as const;
    for (const cat of categories) {
      const count = Object.values(CATALOG).filter((item) => item.category === cat).length;
      assert.ok(count >= 3, `La catégorie ${cat} doit contenir au moins 3 éléments (trouvé ${count})`);
    }
  });

  it('Config 1 (Terre - Inondations SAR / Classe SWOT): bilans nominaux et MRR GO', () => {
    const design: MissionDesign = {
      target: 'FLOODS',
      requirements: {
        budgetLimit: 220,
        minResolutionMeters: 10,
        targetDurationYears: 4,
        maxRiskTolerance: 25,
      },
      requirementSuggestions: {},
      selectedArchitecture: 'ARCH_A',
      architectureVotes: {},
      busId: 'bus-smallsat',
      solarPanelId: 'solar-gaas-2axis',
      batteryId: 'batt-li-200',
      antennaId: 'ant-x-band',
      obcId: 'obc-radhard',
      payloadIds: ['pay-sar-c'],
      orbit: { type: 'SSO', altitudeKm: 650, inclinationDeg: 98 },
      launcherId: 'launch-medium',
    };

    const telemetry = PhysicsEngine.recalculate(design);
    assert.equal(telemetry.budgetUsed, 194);
    assert.equal(telemetry.massTotal, 410);
    assert.equal(telemetry.massMax, 2880);
    assert.equal(telemetry.powerGenerated, 893);
    assert.equal(telemetry.powerConsumed, 465);
    assert.equal(telemetry.powerBalance, 428);
    assert.equal(telemetry.dataGeneratedMbps, 140);
    assert.equal(telemetry.dataCapacityMbps, 150);
    assert.ok(telemetry.scienceScore >= 90);

    const state = makeState(design);
    const mrr = PhysicsEngine.evaluateMRR(state);
    assert.equal(mrr.canLaunch, true);

    const nasaMatch = NasaMatcher.findClosestMission(state);
    assert.equal(nasaMatch.missionId, 'SWOT');
    assert.ok(nasaMatch.similarityPct >= 64 && nasaMatch.similarityPct <= 97);
  });

  it('Config 1b (Terre - Inondations sans SAR): pénalité couverture nuageuse de 45%', () => {
    const designOpticalOnly: MissionDesign = {
      target: 'FLOODS',
      requirements: {
        budgetLimit: 200,
        minResolutionMeters: 10,
        targetDurationYears: 3,
        maxRiskTolerance: 25,
      },
      requirementSuggestions: {},
      selectedArchitecture: 'ARCH_B',
      architectureVotes: {},
      busId: 'bus-smallsat',
      solarPanelId: 'solar-deploy-1axis',
      batteryId: 'batt-li-200',
      antennaId: 'ant-x-band',
      obcId: 'obc-radhard',
      payloadIds: ['pay-optical-hr'],
      orbit: { type: 'SSO', altitudeKm: 650, inclinationDeg: 98 },
      launcherId: 'launch-medium',
    };

    const telemetry = PhysicsEngine.recalculate(designOpticalOnly);
    // 52 * 0.55 = 29 * 1.05 = 30
    assert.ok(telemetry.scienceScore <= 35, `Expected cloud-penalized science <= 35, got ${telemetry.scienceScore}`);
  });

  it('Config 2 (Low-Cost CubeSat 6U - Méga-Feux): détection déficit et correction vers MRR GO', () => {
    const tightCubeSat: MissionDesign = {
      target: 'WILDFIRES',
      requirements: {
        budgetLimit: 80,
        minResolutionMeters: 20,
        targetDurationYears: 2,
        maxRiskTolerance: 35,
      },
      requirementSuggestions: {},
      selectedArchitecture: 'ARCH_B',
      architectureVotes: {},
      busId: 'bus-cubesat-6u',
      solarPanelId: 'solar-fixed',
      batteryId: 'batt-li-100',
      antennaId: 'ant-s-band',
      obcId: 'obc-std',
      payloadIds: ['pay-thermal-ir'],
      orbit: { type: 'LEO', altitudeKm: 500, inclinationDeg: 51.6 },
      launcherId: 'launch-light',
    };

    const badTelemetry = PhysicsEngine.recalculate(tightCubeSat);
    assert.equal(badTelemetry.budgetUsed, 59);
    assert.equal(badTelemetry.massTotal, 92);
    assert.equal(badTelemetry.massMax, 320);
    assert.equal(badTelemetry.powerBalance, -15);
    assert.equal(PhysicsEngine.evaluateMRR(makeState(tightCubeSat)).canLaunch, false);

    // Upgrade solar & antenna to resolve deficit and downlink saturation
    const fixedCubeSat: MissionDesign = {
      ...tightCubeSat,
      solarPanelId: 'solar-deploy-1axis',
      antennaId: 'ant-x-band',
    };
    const goodTelemetry = PhysicsEngine.recalculate(fixedCubeSat);
    assert.ok(goodTelemetry.powerBalance > 200);
    assert.ok(goodTelemetry.dataCapacityMbps >= goodTelemetry.dataGeneratedMbps);
    assert.equal(PhysicsEngine.evaluateMRR(makeState(fixedCubeSat)).canLaunch, true);
  });

  it('Config 3 (Deep Space - Mars / Classe MAVEN): flux solaire 43%, masse lanceur lourd et match MAVEN', () => {
    const marsDesign: MissionDesign = {
      target: 'MARS',
      requirements: {
        budgetLimit: 360,
        minResolutionMeters: 20,
        targetDurationYears: 4,
        maxRiskTolerance: 25,
      },
      requirementSuggestions: {},
      selectedArchitecture: 'ARCH_A',
      architectureVotes: {},
      busId: 'bus-deepspace',
      solarPanelId: 'solar-gaas-2axis',
      batteryId: 'batt-li-450',
      antennaId: 'ant-ka-band',
      obcId: 'obc-deepspace',
      payloadIds: ['pay-spectrometer'],
      orbit: { type: 'MARS', altitudeKm: 400, inclinationDeg: 74 },
      launcherId: 'launch-heavy',
    };

    const telemetry = PhysicsEngine.recalculate(marsDesign);
    assert.equal(telemetry.powerGenerated, 366);
    assert.equal(telemetry.powerConsumed, 285);
    assert.equal(telemetry.powerBalance, 81);
    assert.equal(telemetry.massTotal, 797);
    assert.equal(telemetry.massMax, 1920);
    assert.equal(telemetry.budgetUsed, 346);

    const state = makeState(marsDesign);
    assert.equal(PhysicsEngine.evaluateMRR(state).canLaunch, true);
    assert.equal(NasaMatcher.findClosestMission(state).missionId, 'MAVEN');
  });

  it('Modificateur BUDGET_CRISIS et blocage surcharge lanceur en MRR', () => {
    const design: MissionDesign = {
      target: 'DEFORESTATION',
      requirements: {
        budgetLimit: 200,
        minResolutionMeters: 5,
        targetDurationYears: 3,
        maxRiskTolerance: 25,
      },
      requirementSuggestions: {},
      selectedArchitecture: null,
      architectureVotes: {},
      busId: 'bus-standard',
      solarPanelId: 'solar-deploy-1axis',
      batteryId: 'batt-li-200',
      antennaId: 'ant-x-band',
      obcId: 'obc-radhard',
      payloadIds: ['pay-sar-c'],
      orbit: { type: 'SSO', altitudeKm: 650, inclinationDeg: 98 },
      launcherId: 'launch-light',
    };

    const crisisTelemetry = PhysicsEngine.recalculate(design, 'BUDGET_CRISIS');
    assert.equal(crisisTelemetry.budgetMax, 140);
    assert.ok(crisisTelemetry.massTotal > crisisTelemetry.massMax);

    const mrr = PhysicsEngine.evaluateMRR(makeState(design, { modifier: 'BUDGET_CRISIS' }));
    assert.equal(mrr.canLaunch, false);
    assert.equal(mrr.items.find((i) => i.id === 'budget')?.blocking, true);
    assert.equal(mrr.items.find((i) => i.id === 'mass')?.blocking, true);
  });

  it('SpaceMentorRules, CrisisEngine et ScoreEngine produisent des sorties déterministes cohérentes', () => {
    const marsUnderpowered: MissionDesign = {
      target: 'MARS',
      requirements: {
        budgetLimit: 350,
        minResolutionMeters: 20,
        targetDurationYears: 3,
        maxRiskTolerance: 25,
      },
      requirementSuggestions: {},
      selectedArchitecture: null,
      architectureVotes: {},
      busId: 'bus-deepspace',
      solarPanelId: 'solar-fixed',
      batteryId: 'batt-li-450',
      antennaId: 'ant-ka-band',
      obcId: 'obc-deepspace',
      payloadIds: ['pay-spectrometer'],
      orbit: { type: 'MARS', altitudeKm: 400, inclinationDeg: 74 },
      launcherId: 'launch-heavy',
    };

    const mentorMsg = SpaceMentorRules.evaluate(makeState(marsUnderpowered, { currentPhase: 5 }));
    assert.ok(mentorMsg !== null);
    assert.equal(mentorMsg.severity, 'CRITICAL');

    const healthyState = makeState({
      ...marsUnderpowered,
      solarPanelId: 'solar-gaas-2axis',
    });
    const crisis1 = CrisisEngine.generateCrisis(healthyState, 1);
    const crisis2 = CrisisEngine.generateCrisis(healthyState, 2);
    const crisis3 = CrisisEngine.generateCrisis(healthyState, 3);
    assert.equal(crisis1.options.length, 3);
    assert.equal(crisis2.options.length, 3);
    assert.equal(crisis3.options.length, 3);

    const score = ScoreEngine.computeFinalScore(healthyState);
    assert.ok(score.total >= 500 && score.total <= 1000);
    assert.ok(score.rank.length > 0);
  });
});
