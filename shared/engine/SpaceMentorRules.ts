import { CATALOG, TARGET_SCENARIOS } from '../constants/catalogData';
import { MentorMessage, MissionState } from '../types/mission.types';

/**
 * Deterministic Socratic expert engine (18 rules covering Phases 1–12 trade-offs).
 */
export class SpaceMentorRules {
  public static evaluate(state: MissionState): MentorMessage | null {
    const d = state.design;
    const t = state.telemetry;
    const now = Date.now();
    const recentTitles = new Set(state.mentorFeed.slice(0, 4).map((m) => m.title));

    const emit = (
      severity: MentorMessage['severity'],
      title: string,
      explanation: string,
      tradeOffTip: string
    ): MentorMessage | null => {
      if (recentTitles.has(title)) return null;
      return {
        id: `mentor-${now}-${Math.random().toString(36).slice(2, 6)}`,
        severity,
        title,
        explanation,
        tradeOffTip,
        timestamp: now,
      };
    };

    // Rule 1: Critical budget overrun
    if (t.budgetUsed > t.budgetMax) {
      return emit(
        'CRITICAL',
        'Dépassement de l\'enveloppe budgétaire',
        `Votre configuration atteint $${t.budgetUsed}M pour un plafond de $${t.budgetMax}M.`,
        'Allégez le bus, passez sur un lanceur inférieur ou renégociez l\'enveloppe en Phase 2.'
      );
    }

    // Rule 2: Critical mass overload vs launcher
    if (t.massMax > 0 && t.massTotal > t.massMax) {
      return emit(
        'CRITICAL',
        'Capacité d\'emport du lanceur dépassée',
        `Le satellite pèse ${t.massTotal} kg alors que ce lanceur n'emporte que ${t.massMax} kg vers l'orbite ${d.orbit.type}.`,
        'Sélectionnez un lanceur de classe supérieure ou réduisez la masse du bus et des capteurs.'
      );
    }

    // Rule 3: Negative power balance
    if (t.powerBalance < 0) {
      return emit(
        'CRITICAL',
        'Déficit énergétique critique',
        `Vos systèmes consomment ${t.powerConsumed}W mais vos panneaux ne produisent que ${t.powerGenerated}W.`,
        'Les instruments s\'éteindront en orbite. Passez aux panneaux GaAs Bi-Axe ou retirez un capteur.'
      );
    }

    // Rule 4: Data bandwidth overflow (SAR + S-Band)
    if (t.dataCapacityMbps > 0 && t.dataGeneratedMbps > t.dataCapacityMbps) {
      return emit(
        'CRITICAL',
        'Saturation de la bande passante descendante',
        `Vos capteurs génèrent ${t.dataGeneratedMbps} Mbps contre ${t.dataCapacityMbps} Mbps disponibles sur l'antenne.`,
        'Vous risquez de perdre des données scientifiques. Passez sur une antenne Bande-X ou Bande-Ka.'
      );
    }

    // Rule 5: Mars 43% solar flux alert
    if ((d.target === 'MARS' || d.orbit.type === 'MARS') && d.solarPanelId === 'solar-fixed') {
      return emit(
        'CRITICAL',
        'Ensoleillement martien insuffisant (43%)',
        'À 1,5 UA sur Mars, le flux solaire est divisé par plus de deux. Des panneaux fixes ne suffiront pas.',
        'Équipez impérativement des panneaux GaAs Bi-Axe pour maintenir le bilan électrique positif.'
      );
    }

    // Rule 6: Floods without SAR Radar
    if (
      d.target === 'FLOODS' &&
      d.payloadIds.length > 0 &&
      !d.payloadIds.includes('pay-sar-c') &&
      state.currentPhase >= 6
    ) {
      return emit(
        'WARNING',
        'Couverture nuageuse sur zones inondées',
        'Vous n\'avez pas sélectionné de Radar SAR. Les tempêtes tropicales bloquent à 70% les capteurs optiques.',
        'Ajoutez le Radar SAR Bande-C pour observer de jour comme de nuit à travers les nuages.'
      );
    }

    // Rule 7: SAR selected + tight power margin
    if (d.payloadIds.includes('pay-sar-c') && t.powerBalance >= 0 && t.powerBalance < 45) {
      return emit(
        'WARNING',
        'Marge électrique tendue avec Radar SAR',
        `Le Radar SAR consomme 360W ! Votre marge tombe à +${t.powerBalance}W, ce qui est vulnérable aux éclipses.`,
        'Envisagez des panneaux GaAs Bi-Axe ou un pack batterie Li-Ion 600Wh.'
      );
    }

    // Rule 8: Non-Rad-Hard OBC on Deep Space or Polar SSO
    if (
      d.obcId === 'obc-std' &&
      (d.orbit.type === 'LUNAR' || d.orbit.type === 'MARS' || d.orbit.type === 'SSO')
    ) {
      return emit(
        'WARNING',
        'Exposition aux radiations sans blindage OBC',
        `L'orbite ${d.orbit.type} traverse des zones de flux de protons élevés que l'OBC COTS supporte mal.`,
        'Un OBC Rad-Hard réduit fortement le risque de panne lors des tempêtes solaires.'
      );
    }

    // Rule 9: CubeSat 6U slot saturation / small bus
    if (d.busId === 'bus-cubesat-6u' && state.currentPhase === 5) {
      return emit(
        'INFO',
        'Compromis du format CubeSat 6U',
        'Ce châssis est très économique ($4M) mais ne dispose que d\'un seul slot Payload et d\'une faible capacité thermique.',
        'Idéal pour un lanceur léger et un capteur optique/IR compact, mais incompatible avec un Radar SAR lourd.'
      );
    }

    // Rule 10: Spectrometer without fine ADCS pointing
    if (d.payloadIds.includes('pay-spectrometer') && d.obcId === 'obc-std') {
      return emit(
        'WARNING',
        'Précision de pointage insuffisante',
        'Le Spectromètre Imageur nécessite un pointage fin (< 20 arcsec) pour éviter le flou spectral.',
        'Associez-le à l\'OBC Rad-Hard avec roues à réaction pour préserver 100% du score science.'
      );
    }

    // Rule 11: Very low LEO atmospheric drag
    if (d.orbit.type === 'LEO' && d.orbit.altitudeKm < 420 && state.currentPhase === 7) {
      return emit(
        'WARNING',
        'Traînée atmosphérique forte en LEO basse',
        `À ${d.orbit.altitudeKm} km, la haute atmosphère freine le satellite et réduit sa durée de vie nominale.`,
        'Remontez entre 500 et 650 km pour concilier bonne résolution au sol et longévité.'
      );
    }

    // Rule 12: GEO resolution trade-off
    if (d.orbit.type === 'GEO' && state.currentPhase === 7) {
      return emit(
        'WARNING',
        'Orbite Géostationnaire (35 786 km)',
        'L\'orbite GEO offre une observation continue d\'un hémisphère, mais la distance dégrade fortement la résolution spatiale.',
        'Privilégiez LEO ou SSO (500–750 km) pour la cartographie haute résolution.'
      );
    }

    // Rule 13: Target/Orbit mismatch
    if (
      (d.target === 'MOON' && d.orbit.type !== 'LUNAR' && state.currentPhase >= 7) ||
      (d.target === 'MARS' && d.orbit.type !== 'MARS' && state.currentPhase >= 7)
    ) {
      return emit(
        'CRITICAL',
        'Orbite incompatible avec la cible',
        `Votre cible est ${d.target} mais l'orbite sélectionnée est ${d.orbit.type}.`,
        'Basculez sur le régime orbital correspondant à votre corps céleste dans le panneau de contrôle.'
      );
    }

    // Rule 14: Wildfires without Thermal IR
    if (
      d.target === 'WILDFIRES' &&
      d.payloadIds.length > 0 &&
      !d.payloadIds.includes('pay-thermal-ir') &&
      state.currentPhase >= 6
    ) {
      return emit(
        'WARNING',
        'Détection des foyers thermiques',
        'Les panaches de fumée masquent la lumière visible des méga-feux.',
        'Le Radiomètre Thermique Infrarouge perce la fumée et localise les points chauds.'
      );
    }

    // Rule 15: Oceans without Spectrometer
    if (
      d.target === 'OCEANS' &&
      d.payloadIds.length > 0 &&
      !d.payloadIds.includes('pay-spectrometer') &&
      state.currentPhase >= 6
    ) {
      return emit(
        'WARNING',
        'Mesure spectrale du phytoplancton',
        'L\'analyse de la couleur des océans demande des bandes spectrales très fines.',
        'Équipez le Spectromètre Hyperspectral pour maximiser votre retour scientifique.'
      );
    }

    // Rule 16: Phase 1 briefing guidance
    if (state.currentPhase === 1 && d.target) {
      const sc = TARGET_SCENARIOS[d.target];
      return emit(
        'INFO',
        `Briefing : ${sc.nameFr}`,
        sc.challengeFr,
        `Visez un score science >= ${sc.scienceTarget} pts et une revisite <= ${sc.maxRevisitDays} jours.`
      );
    }

    // Rule 17: Phase 3 MDL alignment prompt
    if (state.currentPhase === 3 && state.mdlProposals.length === 0) {
      return emit(
        'INFO',
        'Alignement Mission Design Lab',
        'Le MDL sert à fixer la doctrine avant de figer l\'ingénierie : résolution maximale ou économie de masse ?',
        'Proposez une priorité stratégique et recueillez les votes des 4 pôles.'
      );
    }

    // Rule 18: Phase 5 healthy balance encouragement
    if (
      state.currentPhase === 5 &&
      d.busId &&
      d.solarPanelId &&
      d.batteryId &&
      d.antennaId &&
      d.obcId &&
      t.powerBalance >= 350
    ) {
      const busName = CATALOG[d.busId]?.shortLabel || 'Bus';
      return emit(
        'INFO',
        `${busName} équilibré`,
        `Votre plateforme dispose de +${t.powerBalance}W de marge électrique avant l'ajout des instruments.`,
        'Vous êtes bien dimensionné pour accueillir la charge utile scientifique en Phase 6.'
      );
    }

    return null;
  }
}
