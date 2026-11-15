import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Compass,
  Cpu,
  FileText,
  Flame,
  GitCompare,
  Globe,
  Orbit,
  Radar,
  Rocket,
  Sliders,
  Users,
} from 'lucide-react';
import { PHASE_META, ROLE_META } from '../../../shared/constants/physicsConstants';
import { PlayerRole } from '../../../shared/types/mission.types';
import { Lang } from '../../utils/i18n';

interface PhaseDetail {
  phase: number;
  leadRoles: PlayerRole[];
  summaryFr: string;
  summaryEn: string;
  outcomeFr: string;
  outcomeEn: string;
  icon: React.FC<{ className?: string }>;
}

const PHASE_DETAILS: PhaseDetail[] = [
  {
    phase: 1,
    leadRoles: ['SCIENCE', 'MANAGER'],
    summaryFr:
      'Sélectionnez la cible scientifique (Inondations, Déforestation, Méga-Feux, Océans, Lune ou Mars) et analysez ses contraintes physiques.',
    summaryEn:
      'Select your scientific target (Floods, Deforestation, Wildfires, Oceans, Moon, or Mars) and review its physical constraints.',
    outcomeFr: 'Cahier de mission initialisé',
    outcomeEn: 'Mission charter locked',
    icon: Compass,
  },
  {
    phase: 2,
    leadRoles: ['MANAGER', 'SCIENCE'],
    summaryFr:
      'Fixez et négociez les 4 seuils cibles : enveloppe budgétaire ($M), résolution au sol (m), durée de vie (ans) et tolérance au risque (%).',
    summaryEn:
      'Define and negotiate the 4 mission thresholds: budget cap ($M), ground resolution (m), lifetime (yrs), and risk tolerance (%).',
    outcomeFr: 'Exigences de référence validées',
    outcomeEn: 'Baseline requirements set',
    icon: FileText,
  },
  {
    phase: 3,
    leadRoles: ['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'],
    summaryFr:
      'Session concurrente façon JPL Team X / GSFC MDL : proposez des compromis coût/science/risque et votez en équipe.',
    summaryEn:
      'Concurrent JPL Team X / GSFC MDL session: submit cost/science/risk proposals and vote together as a team.',
    outcomeFr: 'Alignement inter-disciplines',
    outcomeEn: 'Cross-team alignment',
    icon: Users,
  },
  {
    phase: 4,
    leadRoles: ['MANAGER', 'SYSTEMS'],
    summaryFr:
      'Comparez 3 architectures pré-dimensionnées (Low-Cost CubeSat, Équilibrée, Haute Performance) pour orienter la conception.',
    summaryEn:
      'Compare 3 baseline architectures (Low-Cost CubeSat, Balanced, High Performance) to guide spacecraft sizing.',
    outcomeFr: 'Architecture de référence choisie',
    outcomeEn: 'Reference architecture chosen',
    icon: GitCompare,
  },
  {
    phase: 5,
    leadRoles: ['SYSTEMS', 'OPERATIONS'],
    summaryFr:
      'Assemblez le satellite en 2.5D : châssis/bus, panneaux solaires GaAs, batteries Li-Ion, ordinateur de bord (OBC) et antenne S/X/Ka.',
    summaryEn:
      'Assemble the 2.5D spacecraft: bus chassis, GaAs solar arrays, Li-Ion batteries, onboard computer (OBC), and S/X/Ka antenna.',
    outcomeFr: 'Bilans masse, énergie & liaison',
    outcomeEn: 'Mass, power & link budgets',
    icon: Cpu,
  },
  {
    phase: 6,
    leadRoles: ['SCIENCE'],
    summaryFr:
      'Équipez les instruments scientifiques (Radar SAR tout-temps, Optique HR, Spectromètre hyperspectral, Radiomètre IR thermique).',
    summaryEn:
      'Equip scientific payloads (all-weather C-Band SAR, HR Optical, Hyperspectral Spectrometer, Thermal IR radiometer).',
    outcomeFr: 'Charge utile adaptée à la cible',
    outcomeEn: 'Target-matched payload suite',
    icon: Radar,
  },
  {
    phase: 7,
    leadRoles: ['OPERATIONS'],
    summaryFr:
      'Réglez l’orbite 3D (LEO, SSO, GEO, Lunaire ou Mars), l’altitude et l’inclinaison : observez résolution, éclipses et flux solaire (43 % sur Mars).',
    summaryEn:
      'Tune the 3D orbit (LEO, SSO, GEO, Lunar, or Mars), altitude, and inclination while watching resolution, eclipses, and solar flux.',
    outcomeFr: 'Trajectoire orbitale optimisée',
    outcomeEn: 'Optimized orbital trajectory',
    icon: Orbit,
  },
  {
    phase: 8,
    leadRoles: ['SYSTEMS'],
    summaryFr:
      'Choisissez le lanceur capable d’injecter la masse totale du satellite jusqu’à l’orbite choisie tout en respectant le budget.',
    summaryEn:
      'Select a launch vehicle with enough payload capacity to the target orbit while staying within your remaining budget.',
    outcomeFr: 'Compatibilité masse/lanceur',
    outcomeEn: 'Mass-to-orbit clearance',
    icon: Rocket,
  },
  {
    phase: 9,
    leadRoles: ['MANAGER', 'SYSTEMS', 'SCIENCE', 'OPERATIONS'],
    summaryFr:
      'Revue d’Aptitude au Lancement (MRR) : vérifiez les 7 jauges système et résolvez tout voyant rouge pour obtenir le GO final.',
    summaryEn:
      'Mission Readiness Review (MRR): audit all 7 telemetry gauges and clear any critical blocker to earn the final Launch GO.',
    outcomeFr: 'Feu vert officiel GO / NO-GO',
    outcomeEn: 'Official GO / NO-GO gate',
    icon: CheckCircle2,
  },
  {
    phase: 10,
    leadRoles: ['OPERATIONS', 'MANAGER'],
    summaryFr:
      'Séquence d’ascension animée en direct : Allumage, Max-Q, MECO, largage coiffe, SECO et déploiement des panneaux solaires.',
    summaryEn:
      'Live launch sequence: Liftoff, Max-Q, MECO, fairing separation, SECO, and solar array deployment.',
    outcomeFr: 'Mise en orbite confirmée',
    outcomeEn: 'Orbital insertion confirmed',
    icon: Flame,
  },
  {
    phase: 11,
    leadRoles: ['OPERATIONS', 'MANAGER', 'SCIENCE', 'SYSTEMS'],
    summaryFr:
      'Affrontez 3 crises spatiales chronométrées (tempête solaire CME, débris orbitaux, dérive thermique) et arbitrez les contre-mesures.',
    summaryEn:
      'Survive 3 timed in-orbit anomalies (CME solar storm, orbital debris conjunction, thermal drift) by voting on countermeasures.',
    outcomeFr: 'Santé satellite préservée',
    outcomeEn: 'Spacecraft health preserved',
    icon: AlertTriangle,
  },
  {
    phase: 12,
    leadRoles: ['OPERATIONS'],
    summaryFr:
      'Visualisez votre satellite en 3D temps réel : fauchée d’observation au sol, trace orbitale et fenêtres de contact Deep Space Network.',
    summaryEn:
      'Inspect your spacecraft in live 3D: ground sensor swath footprint, ground track, and Deep Space Network pass windows.',
    outcomeFr: 'Télémétrie sol & liaison DSN',
    outcomeEn: 'Ground track & DSN link check',
    icon: Globe,
  },
  {
    phase: 13,
    leadRoles: ['SCIENCE'],
    summaryFr:
      'Analysez les données et produits scientifiques récoltés : couverture réelle, qualité de mesure et retour scientifique total.',
    summaryEn:
      'Review the scientific measurements captured by your payloads: ground coverage, data quality, and net science return.',
    outcomeFr: 'Bilan scientifique complet',
    outcomeEn: 'Science return validated',
    icon: BarChart3,
  },
  {
    phase: 14,
    leadRoles: ['MANAGER', 'SYSTEMS'],
    summaryFr:
      'Évaluation finale sur 1000 points (Science, Budget, Ingénierie, Collaboration, Survie) avec diagnostic personnalisé de Space Mentor.',
    summaryEn:
      'Final 1000-point scoring breakdown (Science, Budget, Engineering, Collaboration, Survival) plus Space Mentor diagnostic.',
    outcomeFr: 'Score /1000 & Grade obtenu',
    outcomeEn: 'Final /1000 score & rank',
    icon: Sliders,
  },
  {
    phase: 15,
    leadRoles: ['SCIENCE', 'MANAGER'],
    summaryFr:
      'Comparez votre architecture à la mission NASA la plus proche (SWOT, Landsat 9, Terra, PACE, LRO ou MAVEN) et débloquez son badge.',
    summaryEn:
      'Match your spacecraft design against the closest real NASA mission (SWOT, Landsat 9, Terra, PACE, LRO, or MAVEN) to unlock its badge.',
    outcomeFr: 'Badge NASA Heritage débloqué',
    outcomeEn: 'NASA Heritage badge unlocked',
    icon: Award,
  },
];

const ACTS = [
  {
    id: 0 as const,
    labelFr: 'Toutes les phases (15)',
    labelEn: 'All Phases (15)',
    cml: 'CML 1 → 6',
  },
  {
    id: 1 as const,
    labelFr: 'Acte I · Concept & MDL (01–04)',
    labelEn: 'Act I · Concept & MDL (01–04)',
    cml: 'CML 1–2',
  },
  {
    id: 2 as const,
    labelFr: 'Acte II · Ingénierie & Orbite (05–08)',
    labelEn: 'Act II · Engineering & Orbit (05–08)',
    cml: 'CML 3–4',
  },
  {
    id: 3 as const,
    labelFr: 'Acte III · MRR, Vol & Crises (09–12)',
    labelEn: 'Act III · MRR, Launch & Ops (09–12)',
    cml: 'CML 5–6',
  },
  {
    id: 4 as const,
    labelFr: 'Acte IV · Résultats & NASA (13–15)',
    labelEn: 'Act IV · Science & NASA (13–15)',
    cml: 'CML 6',
  },
];

interface MissionRoadmapProps {
  language: Lang;
}

export const MissionRoadmap: React.FC<MissionRoadmapProps> = ({ language }) => {
  const [selectedAct, setSelectedAct] = useState<0 | 1 | 2 | 3 | 4>(0);

  const visiblePhases = PHASE_META.filter((p) =>
    selectedAct === 0 ? true : p.act === selectedAct,
  );

  return (
    <section
      id="mission-roadmap"
      className="w-full max-w-6xl mx-auto mt-10 mcc-panel-glass p-5 sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#4FC3F7]/20">
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-[#4FC3F7] uppercase">
            {language === 'FR'
              ? 'FEUILLE DE ROUTE · AVANT DE LANCER UNE MISSION'
              : 'MISSION ROADMAP · BEFORE LAUNCHING A MODE'}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
            {language === 'FR'
              ? 'Déroulement complet des 15 phases (CML 1 → 6)'
              : 'Complete 15-Phase Mission Walkthrough (CML 1 → 6)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            {language === 'FR'
              ? 'Identique en Mode Solo et en Mode Collaboratif : concevez votre mission étape par étape, négociez les compromis techniques et survivez aux aléas en orbite.'
              : 'Shared across Solo and Collaborative modes: design your spacecraft step by step, negotiate engineering trade-offs, and survive in-orbit anomalies.'}
          </p>
        </div>

        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 shrink-0">
          {(['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'] as const).map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#040812]/90 border border-slate-800"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ROLE_META[r].color }}
              />
              <span className="font-semibold text-slate-200">{ROLE_META[r].shortTag}</span>
              <span className="hidden sm:inline text-slate-400">
                {language === 'FR' ? ROLE_META[r].labelFr : ROLE_META[r].labelEn}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Act filter tabs */}
      <div className="flex flex-wrap gap-2 mt-4 mb-5">
        {ACTS.map((act) => {
          const active = selectedAct === act.id;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => setSelectedAct(act.id)}
              className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                active
                  ? 'bg-[#0B3D91] border-[#4FC3F7] text-white shadow-[0_0_12px_rgba(79,195,247,0.2)]'
                  : 'bg-[#081022]/85 border-slate-800 text-slate-300 hover:border-[#4FC3F7]/40 hover:text-white'
              }`}
            >
              <span>{language === 'FR' ? act.labelFr : act.labelEn}</span>
              <span className="telemetry-value text-[10px] text-[#4FC3F7] opacity-85">
                {act.cml}
              </span>
            </button>
          );
        })}
      </div>

      {/* Phases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {visiblePhases.map((meta) => {
          const detail = PHASE_DETAILS.find((d) => d.phase === meta.phase);
          if (!detail) return null;
          const Icon = detail.icon;
          const phaseNum = String(meta.phase).padStart(2, '0');

          return (
            <div
              key={meta.phase}
              className="rounded border border-[#4FC3F7]/20 bg-[#060C1B]/90 hover:border-[#4FC3F7]/55 transition-colors p-3.5 flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-[#0B3D91]/70 border border-[#4FC3F7]/40 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#4FC3F7]" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="telemetry-value text-[10px] font-bold text-[#4FC3F7]">
                          PHASE {phaseNum}
                        </span>
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="telemetry-value text-[10px] text-slate-400">
                          CML-{meta.cml}
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-white leading-tight">
                        {language === 'FR' ? meta.titleFr : meta.titleEn}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {language === 'FR' ? detail.summaryFr : detail.summaryEn}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-emerald-300/90 truncate">
                  → {language === 'FR' ? detail.outcomeFr : detail.outcomeEn}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {detail.leadRoles.map((r) => (
                    <span
                      key={r}
                      className="px-1.5 py-0.5 rounded bg-[#040812] border border-slate-800 telemetry-value text-[9px] font-bold"
                      style={{ color: ROLE_META[r].color }}
                      title={language === 'FR' ? ROLE_META[r].labelFr : ROLE_META[r].labelEn}
                    >
                      {ROLE_META[r].shortTag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
