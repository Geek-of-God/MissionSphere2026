import { ActiveCrisis, MissionState } from '../types/mission.types';

export class CrisisEngine {
  public static generateCrisis(state: MissionState, stepIndex: number): ActiveCrisis {
    const totalTime = state.demoMode ? 10 : 30;
    const isLowPower = state.telemetry.powerBalance < 45;
    const isNotRadHard = state.design.obcId === 'obc-std';
    const isDataSaturated = state.telemetry.dataGeneratedMbps > state.telemetry.dataCapacityMbps;
    const isLowLeo = state.design.orbit.type === 'LEO' && state.design.orbit.altitudeKm <= 650;

    // Step 1: Solar Storm (prioritized if guaranteed or low power / non rad-hard)
    if (
      stepIndex === 1 ||
      (state.modifier === 'SOLAR_STORM_GUARANTEED' && stepIndex === 1)
    ) {
      return {
        id: `crisis-cme-${Date.now()}`,
        stepIndex,
        title: 'ALERTE CRITIQUE : TEMPÊTE SOLAIRE CLASSE X (CME)',
        description: isNotRadHard
          ? 'Flux de protons élevé détecté ! Votre OBC non durci (COTS) risque un grillage des registres sans mise en sécurité immédiate.'
          : isLowPower
          ? `Flux de protons élevé détecté. Votre marge électrique faible (+${state.telemetry.powerBalance}W) expose l'ordinateur de bord à un reboot.`
          : 'Éjection de masse coronale majeure détectée sur la trajectoire orbitale. Protégez la charge utile ou maintenez les mesures.',
        timeLeft: totalTime,
        totalTime,
        votes: {},
        options: [
          {
            id: 'safe-mode',
            label: 'PASSER EN SAFE MODE',
            impactSummary: '-15% Science | 0% Risque panne | +2% Santé',
            scienceDelta: -15,
            durationDeltaYears: 0,
            riskDelta: 0,
            budgetDelta: 0,
            healthDelta: 2,
          },
          {
            id: 'keep-observing',
            label: 'MAINTENIR LES INSTRUMENTS ACTIFS',
            impactSummary: '+5% Science | Risque panne OBC (+20% dégâts santé)',
            scienceDelta: 5,
            durationDeltaYears: 0,
            riskDelta: isNotRadHard ? 18 : 8,
            budgetDelta: 0,
            healthDelta: isNotRadHard ? -24 : -10,
          },
          {
            id: 'reorient-arrays',
            label: 'RÉORIENTER LES PANNEAUX & BOUCLIER',
            impactSummary: '-0.5 an durée de vie (ergols) | -5% Science',
            scienceDelta: -5,
            durationDeltaYears: -0.5,
            riskDelta: 2,
            budgetDelta: 0,
            healthDelta: -2,
          },
        ],
      };
    }

    // Step 2: Data Saturation OR Space Debris
    if (stepIndex === 2 && (isDataSaturated || state.design.payloadIds.includes('pay-sar-c'))) {
      return {
        id: `crisis-data-${Date.now()}`,
        stepIndex,
        title: 'SATURATION DE LA MÉMOIRE DE BORD',
        description: `Le volume généré (${state.telemetry.dataGeneratedMbps} Mbps) dépasse votre fenêtre de téléchargement (${state.telemetry.dataCapacityMbps} Mbps). Les tampons atteignent 97%.`,
        timeLeft: totalTime,
        totalTime,
        votes: {},
        options: [
          {
            id: 'compress-lossy',
            label: 'ACTIVER COMPRESSION FORTE (LOSSY)',
            impactSummary: '-12% Science | 0$ Coût | Tampons libérés',
            scienceDelta: -12,
            durationDeltaYears: 0,
            riskDelta: 0,
            budgetDelta: 0,
            healthDelta: 0,
          },
          {
            id: 'buy-dsn-slot',
            label: 'ACHETER CRÉNEAU ANTENNE DSN EXTRA',
            impactSummary: '0% perte Science | +$12M Budget Opérations',
            scienceDelta: 0,
            durationDeltaYears: 0,
            riskDelta: -2,
            budgetDelta: 12,
            healthDelta: 0,
          },
          {
            id: 'drop-secondary',
            label: 'PURGER LES DONNÉES SECONDAIRES',
            impactSummary: '-18% Science | +5% Santé mémoire',
            scienceDelta: -18,
            durationDeltaYears: 0,
            riskDelta: -4,
            budgetDelta: 0,
            healthDelta: 4,
          },
        ],
      };
    }

    if (stepIndex === 2 || isLowLeo) {
      return {
        id: `crisis-debris-${Date.now()}`,
        stepIndex,
        title: 'CONJONCTION DE DÉBRIS SPATIAUX (ALERTE COLLISION)',
        description:
          'Le réseau de surveillance signale un fragment d\'étage supérieur croisant votre orbite dans 18 minutes avec une probabilité de collision de 1/450.',
        timeLeft: totalTime,
        totalTime,
        votes: {},
        options: [
          {
            id: 'burn-avoidance',
            label: 'MANŒUVRE D\'ÉVITEMENT (PROPULSION)',
            impactSummary: '-0.6 an durée de vie (ergols) | 0% Risque impact',
            scienceDelta: -3,
            durationDeltaYears: -0.6,
            riskDelta: -5,
            budgetDelta: 0,
            healthDelta: 0,
          },
          {
            id: 'hold-orbit',
            label: 'MAINTENIR LA TRAJECTOIRE NOMINALE',
            impactSummary: '0 ergol consommé | Risque impact (-18% Santé)',
            scienceDelta: 2,
            durationDeltaYears: 0,
            riskDelta: 14,
            budgetDelta: 0,
            healthDelta: -18,
          },
          {
            id: 'drag-attitude',
            label: 'BASCULE PROFIL AÉRODYNAMIQUE MINIMAL',
            impactSummary: '-8% Science | -0.2 an vie | Risque réduit',
            scienceDelta: -8,
            durationDeltaYears: -0.2,
            riskDelta: 3,
            budgetDelta: 0,
            healthDelta: -4,
          },
        ],
      };
    }

    // Step 3: Thermal / Solar Array Anomaly
    return {
      id: `crisis-thermal-${Date.now()}`,
      stepIndex,
      title: 'ANOMALIE THERMIQUE & DÉRIVE D\'UN PANNEAU SOLAIRE',
      description:
        'Un actionneur solaire présente une résistance thermique anormale après la sortie d\'éclipse. Le bus dépasse 62°C côté Soleil.',
      timeLeft: totalTime,
      totalTime,
      votes: {},
      options: [
        {
          id: 'shed-load',
          label: 'DÉLESTER UN INSTRUMENT SECONDAIRE',
          impactSummary: '-10% Science | Température stabilisée (+4% Santé)',
          scienceDelta: -10,
          durationDeltaYears: 0,
          riskDelta: -3,
          budgetDelta: 0,
          healthDelta: 4,
        },
        {
          id: 'duty-cycle',
          label: 'OPÉRER EN CYCLES INTERMITTENTS (50%)',
          impactSummary: '-7% Science | -0.3 an durée | -4% Santé',
          scienceDelta: -7,
          durationDeltaYears: -0.3,
          riskDelta: 2,
          budgetDelta: 0,
          healthDelta: -4,
        },
        {
          id: 'push-nominal',
          label: 'FORCER LE RÉGIME NOMINAL',
          impactSummary: '+4% Science | Surchauffe (-15% Santé)',
          scienceDelta: 4,
          durationDeltaYears: -0.4,
          riskDelta: 12,
          budgetDelta: 0,
          healthDelta: -15,
        },
      ],
    };
  }
}
