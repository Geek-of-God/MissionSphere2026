import { CATALOG } from '../constants/catalogData';
import { NASA_MISSIONS } from '../constants/nasaMissions';
import { OrbitRegime, TargetBody } from '../types/catalog.types';
import { MissionState, NasaMatchResult } from '../types/mission.types';

const TARGET_INDEX: Record<TargetBody, number> = {
  FLOODS: 1,
  DEFORESTATION: 2,
  WILDFIRES: 3,
  OCEANS: 4,
  MOON: 5,
  MARS: 6,
};

const ORBIT_INDEX: Record<OrbitRegime, number> = {
  LEO: 1,
  SSO: 2,
  GEO: 3,
  LUNAR: 4,
  MARS: 5,
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export class NasaMatcher {
  public static findClosestMission(state: MissionState): NasaMatchResult {
    const target = state.design.target || 'FLOODS';
    const orbit = state.design.orbit.type;
    const massNorm = Math.min(1, state.telemetry.massTotal / 3500);
    const costNorm = Math.min(1, state.telemetry.budgetUsed / 1000);
    const hasAllWeatherOrDeep =
      state.design.payloadIds.some((id) => CATALOG[id]?.allWeather) ||
      target === 'MOON' ||
      target === 'MARS'
        ? 0.92
        : 0.62;

    const userVector = [
      TARGET_INDEX[target] / 6,
      ORBIT_INDEX[orbit] / 5,
      Math.max(0.2, massNorm + 0.25),
      Math.max(0.2, costNorm + 0.35),
      hasAllWeatherOrDeep,
    ];

    let bestMission = NASA_MISSIONS[0];
    let bestScore = -1;

    for (const mission of NASA_MISSIONS) {
      let sim = cosineSimilarity(userVector, mission.featureVector);
      // Domain alignment bonus so matching target + orbit rewards authentic design
      if (mission.targetId === target) sim += 0.08;
      if (mission.orbitType === orbit) sim += 0.04;
      if (sim > bestScore) {
        bestScore = sim;
        bestMission = mission;
      }
    }

    const similarityPct = Math.max(64, Math.min(97, Math.round(bestScore * 89)));

    return {
      missionId: bestMission.id,
      name: bestMission.name,
      fullTitle: bestMission.fullTitle,
      launchYear: bestMission.launchYear,
      similarityPct,
      targetId: bestMission.targetId,
      orbitType: bestMission.orbitType,
      altitudeKm: bestMission.altitudeKm,
      massKg: bestMission.massKg,
      costMusd: bestMission.costMusd,
      primaryInstruments: bestMission.primaryInstruments,
      summary: bestMission.summary,
      badgeTitle: bestMission.badgeTitle,
      anecdote: bestMission.anecdote,
      nasaUrl: bestMission.nasaUrl,
    };
  }
}
