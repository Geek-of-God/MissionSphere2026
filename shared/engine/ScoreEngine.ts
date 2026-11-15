import { TARGET_SCENARIOS } from '../constants/catalogData';
import { MissionState, ScoreBreakdown } from '../types/mission.types';

export class ScoreEngine {
  public static computeFinalScore(state: MissionState): ScoreBreakdown {
    const t = state.telemetry;
    const scenario = state.design.target ? TARGET_SCENARIOS[state.design.target] : null;
    const targetSci = scenario?.scienceTarget ?? 85;

    // 1. Science (35%) -> /100
    const scienceRatio = Math.min(1.08, t.scienceScore / Math.max(40, targetSci));
    const science = Math.max(15, Math.min(100, Math.round(scienceRatio * 94)));

    // 2. Budget (20%) -> /100
    let budget = 85;
    if (t.budgetUsed > t.budgetMax) {
      const overPct = ((t.budgetUsed - t.budgetMax) / Math.max(1, t.budgetMax)) * 100;
      budget = Math.max(15, Math.round(70 - overPct * 1.8));
    } else {
      const util = t.budgetUsed / Math.max(1, t.budgetMax);
      budget = util >= 0.75 && util <= 1.0 ? 96 : Math.round(75 + util * 25);
    }

    // 3. Engineering (20%) -> /100
    let engineering = 92;
    if (t.powerBalance < 0) engineering -= 35;
    else if (t.powerBalance < 40) engineering -= 14;
    if (t.massMax > 0 && t.massTotal > t.massMax) engineering -= 30;
    if (t.dataGeneratedMbps > t.dataCapacityMbps) engineering -= 12;
    if (t.riskPercentage > 30) engineering -= 12;
    engineering = Math.max(20, Math.min(100, engineering));

    // 4. Collaboration (15%) -> /100
    const totalActions = state.players.reduce((acc, p) => acc + p.actionsCount + p.votesCast, 0);
    const mdlAligned = state.mdlProposals.some((p) => p.votes.length >= Math.min(3, state.players.length));
    const collaboration =
      state.mode === 'SOLO'
        ? Math.min(95, 78 + Math.min(17, state.mdlProposals.length * 6 + Math.floor(totalActions / 3)))
        : Math.min(
            100,
            62 + (mdlAligned ? 18 : 6) + Math.min(20, state.chatMessages.length * 3 + totalActions)
          );

    // 5. Survival (10%) -> /100
    const survival = Math.max(10, Math.min(100, Math.round(state.opsState.satelliteHealth)));

    const total = Math.round(
      science * 3.5 + budget * 2.0 + engineering * 2.0 + collaboration * 1.5 + survival * 1.0
    );

    const rank =
      total >= 900
        ? 'DIRECTEUR DE MISSION NASA'
        : total >= 800
        ? 'ARCHITECTE SPATIAL SENIOR'
        : total >= 680
        ? 'INGÉNIEUR SYSTÈME CONFIRMÉ'
        : total >= 520
        ? 'SPÉCIALISTE DE VOL JUNIOR'
        : 'APPRENTI MISSION DESIGN LAB';

    // Socratic Diagnostic
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (science >= 85) {
      strengths.push(
        `Votre sélection d'instruments sur orbite ${state.design.orbit.type} (${state.design.orbit.altitudeKm} km) a produit un retour scientifique remarquable (${science}/100).`
      );
    } else {
      improvements.push(
        `Le potentiel scientifique a été freiné (${science}/100) : vérifiez l'adéquation capteur/cible ou l'altitude orbitale.`
      );
    }

    if (t.powerBalance < 40) {
      improvements.push(
        'Ajoutez des panneaux solaires GaAs ou une batterie supérieure pour éviter les tensions énergétiques en éclipse et en crise.'
      );
    } else if (t.dataGeneratedMbps > t.dataCapacityMbps) {
      improvements.push(
        'Passez sur une antenne Bande-X ou Bande-Ka pour absorber le débit généré par vos capteurs sans saturation.'
      );
    } else if (budget >= 90) {
      strengths.push('Excellente maîtrise de l\'enveloppe budgétaire sans sur-ingénierie.');
    }

    const diagnostic =
      strengths.length > 0
        ? strengths.join(' ')
        : 'Votre architecture a permis d\'atteindre l\'orbite, mais plusieurs compromis sous-systèmes ont limité l\'efficacité globale.';
    const improvementTip =
      improvements.length > 0
        ? improvements[0]
        : 'Pour viser 950+, optimisez la synergie entre durée de revisite, marge de masse et anticipation des tempêtes solaires.';

    return {
      total,
      rank,
      science,
      budget,
      engineering,
      collaboration,
      survival,
      diagnostic,
      improvementTip,
    };
  }
}
