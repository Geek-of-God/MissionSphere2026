import {
  CATALOG,
  TARGET_SCENARIOS,
} from '../constants/catalogData';
import {
  ORBIT_LINK_BASE_DB,
  ORBIT_PAYLOAD_PENALTY,
  SOLAR_FLUX_MULTIPLIER,
} from '../constants/physicsConstants';
import {
  MissionDesign,
  MissionModifier,
  MissionState,
  ResourceTelemetry,
  StatusLevel,
} from '../types/mission.types';

export interface MrrAuditItem {
  id: string;
  labelFr: string;
  labelEn: string;
  valueLabel: string;
  marginLabel: string;
  status: StatusLevel;
  blocking: boolean;
}

export class PhysicsEngine {
  public static recalculate(
    design: MissionDesign,
    modifier: MissionModifier = 'NONE',
    opsPenalties?: { sciencePenaltyPct?: number; durationPenaltyYears?: number; extraBudgetUsed?: number }
  ): ResourceTelemetry {
    let budgetUsed = opsPenalties?.extraBudgetUsed ?? 0;
    let massTotal = 0;
    let powerGenerated = 0;
    let powerConsumed = 0;
    let dataGeneratedMbps = 0;
    let dataCapacityMbps = 0;
    let riskPercentage = 6;
    let scienceScore = 0;

    // 1. Bus & Subsystems (Phase 5)
    const components = [
      design.busId,
      design.solarPanelId,
      design.batteryId,
      design.antennaId,
      design.obcId,
    ].filter(Boolean) as string[];

    for (const compId of components) {
      const item = CATALOG[compId];
      if (!item) continue;
      budgetUsed += item.cost;
      massTotal += item.mass;
      if (item.power > 0) powerGenerated += item.power;
      else powerConsumed += Math.abs(item.power);
      if (item.dataRate) dataCapacityMbps += item.dataRate;
      riskPercentage += item.riskDelta || 0;
    }

    // 2. Solar Flux adjustment by orbit/planet
    const fluxFactor = SOLAR_FLUX_MULTIPLIER[design.orbit.type] || 1.0;
    powerGenerated = Math.round(powerGenerated * fluxFactor);

    // 3. Payloads (Phase 6)
    const targetScenario = design.target ? TARGET_SCENARIOS[design.target] : null;
    let hasAllWeather = false;
    let bestResFactor = 4.0;
    let bestSwathKm = 60;

    for (const payloadId of design.payloadIds) {
      const inst = CATALOG[payloadId];
      if (!inst) continue;
      budgetUsed += inst.cost;
      massTotal += inst.mass;
      powerConsumed += Math.abs(inst.power);
      dataGeneratedMbps += inst.dataGenerated || 0;
      riskPercentage += inst.riskDelta || 0;

      let instScience = inst.scienceBase || 0;
      if (design.target && inst.idealTargets?.includes(design.target)) {
        instScience = Math.round(instScience * 1.25);
      }
      scienceScore += instScience;

      if (inst.allWeather) hasAllWeather = true;
      const rf = Number(inst.specs?.resolutionFactor ?? 3.0);
      if (rf < bestResFactor) bestResFactor = rf;
      const sw = Number(inst.specs?.swathKm ?? 80);
      if (sw > bestSwathKm) bestSwathKm = sw;
    }

    // Cloud cover penalty for FLOODS if no all-weather (SAR) sensor
    if (targetScenario?.cloudCoverWarning && design.payloadIds.length > 0 && !hasAllWeather) {
      scienceScore = Math.round(scienceScore * 0.55);
    }

    // Target body / Orbit compatibility
    const orbitType = design.orbit.type;
    if (design.target === 'MOON' && orbitType !== 'LUNAR') {
      scienceScore = Math.round(scienceScore * 0.2);
      riskPercentage += 15;
    } else if (design.target === 'MARS' && orbitType !== 'MARS') {
      scienceScore = Math.round(scienceScore * 0.2);
      riskPercentage += 15;
    } else if (
      design.target &&
      !['MOON', 'MARS'].includes(design.target) &&
      ['LUNAR', 'MARS'].includes(orbitType)
    ) {
      scienceScore = Math.round(scienceScore * 0.25);
    }

    // 4. Orbit impact on resolution, revisit, eclipse, and science
    const alt = Math.max(50, design.orbit.altitudeKm || 500);
    const groundResolutionMeters =
      design.payloadIds.length === 0
        ? 0
        : Number(Math.max(0.5, (alt / 200) * bestResFactor).toFixed(1));

    const revisitDays = Number(
      Math.max(
        0.5,
        orbitType === 'GEO'
          ? 0.25
          : orbitType === 'SSO'
          ? 2.2 * (80 / Math.max(40, bestSwathKm))
          : orbitType === 'LEO'
          ? 1.8 * (80 / Math.max(40, bestSwathKm))
          : 3.0
      ).toFixed(1)
    );

    const eclipseMinutes =
      orbitType === 'GEO'
        ? 12
        : orbitType === 'SSO'
        ? Math.round(18 + (alt / 1000) * 8)
        : Math.round(28 + (alt / 1200) * 10);

    // Resolution & Altitude science factor
    if (design.payloadIds.length > 0) {
      const altitudeFactor =
        orbitType === 'GEO' ? 0.68 : alt > 1100 ? 0.78 : alt < 400 ? 1.15 : 1.05;
      scienceScore = Math.round(scienceScore * altitudeFactor);

      // Pointing accuracy bonus for spectrometer
      const obc = design.obcId ? CATALOG[design.obcId] : null;
      if (design.payloadIds.includes('pay-spectrometer') && obc && (obc.pointingAccuracyArcsec ?? 999) > 30) {
        scienceScore = Math.round(scienceScore * 0.8);
      }
    }

    // Data bandwidth bottleneck penalty
    if (dataGeneratedMbps > 0 && dataCapacityMbps > 0 && dataGeneratedMbps > dataCapacityMbps) {
      const ratio = dataCapacityMbps / dataGeneratedMbps;
      scienceScore = Math.round(scienceScore * Math.max(0.35, ratio));
      riskPercentage += 8;
    } else if (dataGeneratedMbps > 0 && dataCapacityMbps === 0) {
      scienceScore = Math.round(scienceScore * 0.3);
      riskPercentage += 12;
    }

    // 5. Link budget (dB)
    const antGain = design.antennaId ? Number(CATALOG[design.antennaId]?.specs?.gainDb ?? 6) : 0;
    const baseDb = ORBIT_LINK_BASE_DB[orbitType] ?? 15;
    const commQualityDb = Math.round(baseDb + (antGain - 12) * 0.5 - (alt > 2000 ? 4 : 0));
    if (commQualityDb < 0) {
      riskPercentage += 10;
    }

    // 6. Launcher capacity & cost (Phase 8)
    let massMax = 0;
    if (design.launcherId) {
      const launcher = CATALOG[design.launcherId];
      if (launcher) {
        budgetUsed += launcher.cost;
        const orbitPenalty = ORBIT_PAYLOAD_PENALTY[orbitType] || 1.0;
        massMax = Math.round((launcher.maxMassLeo || 0) * orbitPenalty);
        riskPercentage += launcher.riskDelta || 0;
      }
    }

    // 7. Power & Eclipse & Radiation checks
    const powerBalance = powerGenerated - powerConsumed;
    if (powerBalance < 0) {
      riskPercentage += 22;
      scienceScore = Math.round(scienceScore * 0.7);
    } else if (powerBalance < 40 && design.payloadIds.length > 0) {
      riskPercentage += 5;
    }

    const obcItem = design.obcId ? CATALOG[design.obcId] : null;
    if ((orbitType === 'LUNAR' || orbitType === 'MARS' || orbitType === 'SSO') && obcItem && !obcItem.radHard) {
      riskPercentage += orbitType === 'SSO' ? 6 : 18;
    }

    if (modifier === 'SOLAR_STORM_GUARANTEED') {
      riskPercentage += 8;
    }

    // Budget limit adjusted by modifier
    const rawLimit = design.requirements.budgetLimit;
    const budgetMax = modifier === 'BUDGET_CRISIS' ? Math.round(rawLimit * 0.7) : rawLimit;

    if (budgetUsed > budgetMax) {
      riskPercentage += 6;
    }
    if (massMax > 0 && massTotal > massMax) {
      riskPercentage += 14;
    }

    // Mission Duration estimate
    let missionDurationYears = design.requirements.targetDurationYears;
    if (orbitType === 'LEO' && alt < 420) {
      missionDurationYears = Math.max(0.5, Number((missionDurationYears * 0.65).toFixed(1)));
    }
    if (opsPenalties?.durationPenaltyYears) {
      missionDurationYears = Math.max(
        0.5,
        Number((missionDurationYears - opsPenalties.durationPenaltyYears).toFixed(1))
      );
    }

    // Apply operations science penalty
    if (opsPenalties?.sciencePenaltyPct) {
      scienceScore = Math.max(
        0,
        Math.round(scienceScore * (1 - opsPenalties.sciencePenaltyPct / 100))
      );
    }

    return {
      budgetUsed,
      budgetMax,
      massTotal,
      massMax,
      powerGenerated,
      powerConsumed,
      powerBalance,
      dataGeneratedMbps,
      dataCapacityMbps,
      commQualityDb,
      missionDurationYears,
      riskPercentage: Math.min(99, Math.max(1, Math.round(riskPercentage))),
      scienceScore: Math.min(120, Math.max(0, scienceScore)),
      groundResolutionMeters,
      revisitDays,
      eclipseMinutes,
    };
  }

  public static calculateFeasibility(design: MissionDesign, modifier: MissionModifier = 'NONE'): {
    scorePct: number;
    status: StatusLevel;
    messageFr: string;
    messageEn: string;
  } {
    const budget = modifier === 'BUDGET_CRISIS'
      ? Math.round(design.requirements.budgetLimit * 0.7)
      : design.requirements.budgetLimit;
    const res = design.requirements.minResolutionMeters;
    const dur = design.requirements.targetDurationYears;
    const risk = design.requirements.maxRiskTolerance;
    const isDeepSpace = design.target === 'MOON' || design.target === 'MARS';

    const minRealisticBudget = isDeepSpace ? 155 : res <= 5 ? 130 : 75;
    const budgetFactor = Math.min(1.2, budget / minRealisticBudget);
    const durationPenalty = dur > 5 ? (dur - 5) * 4 : 0;
    const riskBonus = risk >= 20 ? 8 : -6;
    const resPenalty = res < 3 ? 12 : 0;

    const raw = Math.round(budgetFactor * 72 + riskBonus - durationPenalty - resPenalty);
    const scorePct = Math.max(12, Math.min(98, raw));

    if (scorePct >= 70) {
      return {
        scorePct,
        status: 'NOMINAL',
        messageFr: 'Le ratio Budget / Exigences scientifiques est cohérent.',
        messageEn: 'Budget to scientific requirements ratio is realistic.',
      };
    }
    if (scorePct >= 45) {
      return {
        scorePct,
        status: 'WARNING',
        messageFr: 'Contraintes tendues : une architecture CubeSat ou des compromis seront nécessaires.',
        messageEn: 'Tight constraints: a CubeSat architecture or strict trade-offs will be needed.',
      };
    }
    return {
      scorePct,
      status: 'CRITICAL',
      messageFr: isDeepSpace
        ? 'Budget critique pour l\'espace lointain ! Augmentez l\'enveloppe ou assouplissez la résolution.'
        : 'Objectif irréaliste avec ce budget : risque élevé d\'impasse en Phase 9.',
      messageEn: isDeepSpace
        ? 'Critical underfunding for deep space! Increase budget or relax requirements.'
        : 'Unrealistic requirements for this budget: high risk of MRR rejection.',
    };
  }

  public static evaluateMRR(state: MissionState): {
    items: MrrAuditItem[];
    canLaunch: boolean;
    hasWarnings: boolean;
  } {
    const t = state.telemetry;
    const d = state.design;

    const budgetMarginPct = t.budgetMax > 0 ? ((t.budgetMax - t.budgetUsed) / t.budgetMax) * 100 : 0;
    const budgetStatus: StatusLevel =
      t.budgetUsed > t.budgetMax ? 'CRITICAL' : budgetMarginPct < 10 ? 'WARNING' : 'NOMINAL';

    const massMarginPct = t.massMax > 0 ? ((t.massMax - t.massTotal) / t.massMax) * 100 : -1;
    const massStatus: StatusLevel =
      !d.launcherId || t.massMax === 0 || t.massTotal > t.massMax
        ? 'CRITICAL'
        : massMarginPct < 15
        ? 'WARNING'
        : 'NOMINAL';

    const powerStatus: StatusLevel =
      t.powerBalance < 0 ? 'CRITICAL' : t.powerBalance < 40 ? 'WARNING' : 'NOMINAL';

    const dataStatus: StatusLevel =
      t.dataCapacityMbps === 0 || t.dataGeneratedMbps > t.dataCapacityMbps
        ? t.dataGeneratedMbps > t.dataCapacityMbps * 1.35 || t.dataCapacityMbps === 0
          ? 'CRITICAL'
          : 'WARNING'
        : 'NOMINAL';

    const riskStatus: StatusLevel =
      t.riskPercentage > d.requirements.maxRiskTolerance + 10
        ? 'CRITICAL'
        : t.riskPercentage > d.requirements.maxRiskTolerance
        ? 'WARNING'
        : 'NOMINAL';

    const orbitCompatible =
      !(d.target === 'MOON' && d.orbit.type !== 'LUNAR') &&
      !(d.target === 'MARS' && d.orbit.type !== 'MARS') &&
      !(['FLOODS', 'DEFORESTATION', 'WILDFIRES', 'OCEANS'].includes(d.target || '') &&
        ['LUNAR', 'MARS'].includes(d.orbit.type));

    const systemsComplete = Boolean(
      d.busId && d.solarPanelId && d.batteryId && d.antennaId && d.obcId && d.launcherId && d.payloadIds.length > 0
    );

    const compatStatus: StatusLevel =
      !systemsComplete || !orbitCompatible ? 'CRITICAL' : t.commQualityDb < 0 ? 'WARNING' : 'NOMINAL';

    const items: MrrAuditItem[] = [
      {
        id: 'budget',
        labelFr: '1. BUDGET PROGRAMME',
        labelEn: '1. PROGRAM BUDGET',
        valueLabel: `$${t.budgetUsed}M / $${t.budgetMax}M`,
        marginLabel: `${budgetMarginPct >= 0 ? '+' : ''}${Math.round(budgetMarginPct)}%`,
        status: budgetStatus,
        blocking: budgetStatus === 'CRITICAL',
      },
      {
        id: 'mass',
        labelFr: '2. MASSE & LANCEUR',
        labelEn: '2. MASS & LAUNCHER',
        valueLabel: `${t.massTotal} kg / ${t.massMax || '---'} kg`,
        marginLabel: t.massMax > 0 ? `${massMarginPct >= 0 ? '+' : ''}${Math.round(massMarginPct)}%` : 'Aucun lanceur',
        status: massStatus,
        blocking: massStatus === 'CRITICAL',
      },
      {
        id: 'power',
        labelFr: '3. BILAN ÉNERGÉTIQUE',
        labelEn: '3. POWER BALANCE',
        valueLabel: `${t.powerBalance >= 0 ? '+' : ''}${t.powerBalance} W`,
        marginLabel: `${t.powerGenerated}W prod / ${t.powerConsumed}W conso`,
        status: powerStatus,
        blocking: powerStatus === 'CRITICAL',
      },
      {
        id: 'data',
        labelFr: '4. LIAISON & DATA RATE',
        labelEn: '4. DATA & LINK BUDGET',
        valueLabel: `${t.dataGeneratedMbps} / ${t.dataCapacityMbps} Mbps (${t.commQualityDb} dB)`,
        marginLabel:
          t.dataGeneratedMbps <= t.dataCapacityMbps ? 'Bande passante OK' : 'Saturation downlink',
        status: dataStatus,
        blocking: dataStatus === 'CRITICAL',
      },
      {
        id: 'risk',
        labelFr: '5. INDICE DE RISQUE',
        labelEn: '5. RISK INDEX',
        valueLabel: `${t.riskPercentage}% (Seuil: ${d.requirements.maxRiskTolerance}%)`,
        marginLabel:
          t.riskPercentage <= d.requirements.maxRiskTolerance ? 'Sous tolérance' : 'Dérogation requise',
        status: riskStatus,
        blocking: riskStatus === 'CRITICAL',
      },
      {
        id: 'compat',
        labelFr: '6. INTÉGRATION ORBITE & PAYLOAD',
        labelEn: '6. ORBIT & PAYLOAD FIT',
        valueLabel: `${d.orbit.type} ${d.orbit.altitudeKm} km · ${d.payloadIds.length} inst.`,
        marginLabel: !systemsComplete
          ? 'Sous-système manquant'
          : !orbitCompatible
          ? 'Orbite incompatible cible'
          : `Durée ~${t.missionDurationYears} ans`,
        status: compatStatus,
        blocking: compatStatus === 'CRITICAL',
      },
    ];

    const canLaunch = items.every((it) => !it.blocking);
    const hasWarnings = items.some((it) => it.status === 'WARNING');
    return { items, canLaunch, hasWarnings };
  }
}
