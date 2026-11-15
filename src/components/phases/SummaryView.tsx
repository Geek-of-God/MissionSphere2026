import React, { useState } from 'react';
import { Award, CheckCircle2, ExternalLink, FileDown, Orbit, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { CATALOG, TARGET_SCENARIOS } from '../../../shared/constants/catalogData';
import { TargetId } from '../../../shared/types/mission.types';
import { useMissionStore } from '../../store/useMissionStore';
import { DataSourceStrip } from '../ui/DataSourceStrip';
import { GoSwitch } from '../ui/GoSwitch';

interface ScoreRingProps {
  label: string;
  weight: string;
  value: number;
  color: string;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ label, weight, value, color }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);

  return (
    <div className="mcc-panel p-4 flex flex-col items-center text-center">
      <div className="relative w-22 h-22 flex items-center justify-center">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute telemetry-value text-base font-bold text-white">{clamped}%</span>
      </div>
      <div className="text-xs font-bold text-white mt-2">{label}</div>
      <div className="text-[10px] telemetry-value text-slate-400">Pondération {weight}</div>
    </div>
  );
};

function renderTargetScienceVisual(target: TargetId, sliderPct: number) {
  if (target === 'FLOODS') {
    return (
      <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
        {/* Terrain base */}
        <rect width="560" height="220" fill="#0B192C" />
        {/* Mekong River winding */}
        <path
          d="M 20 170 Q 140 90, 260 130 T 540 60"
          fill="none"
          stroke="#0EA5E9"
          strokeWidth={14 + (sliderPct / 100) * 28}
          strokeOpacity="0.65"
        />
        <path
          d="M 80 200 Q 220 135, 360 165 T 520 120"
          fill="none"
          stroke="#38BDF8"
          strokeWidth={8 + (sliderPct / 100) * 18}
          strokeOpacity="0.45"
        />
        {/* Flood hotspots */}
        <ellipse cx="265" cy="132" rx={30 + sliderPct * 0.45} ry={18 + sliderPct * 0.25} fill="#0284C7" fillOpacity="0.45" />
        <ellipse cx="410" cy="95" rx={24 + sliderPct * 0.35} ry={15 + sliderPct * 0.2} fill="#EF4444" fillOpacity="0.4" />
        {/* Cloud overlay attenuated by SAR slider */}
        <rect
          width="560"
          height="220"
          fill="#E2E8F0"
          fillOpacity={Math.max(0.03, 0.45 * (1 - sliderPct / 100))}
        />
        <text x="16" y="24" fill="#4FC3F7" fontSize="11" fontFamily="JetBrains Mono">
          DELTA DU MÉKONG — INTERFÉROMÉTRIE SAR BANDE-C (PERCÉE NUAGEUSE : {sliderPct}%)
        </text>
      </svg>
    );
  }
  if (target === 'DEFORESTATION') {
    return (
      <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
        <rect width="560" height="220" fill="#064E3B" />
        {/* Forest grid */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect
            key={i}
            x={(i % 7) * 76 + 18}
            y={i < 7 ? 42 : 122}
            width="62"
            height="64"
            rx="4"
            fill={i % 3 === 0 && sliderPct > 35 ? '#92400E' : '#10B981'}
            fillOpacity={i % 3 === 0 ? 0.75 : 0.45}
          />
        ))}
        <text x="16" y="24" fill="#34D399" fontSize="11" fontFamily="JetBrains Mono">
          BASSIN AMAZONIEN — INDICE NDVI CANOPÉE (FILTRE MULTISPECTRAL : {sliderPct}%)
        </text>
      </svg>
    );
  }
  if (target === 'WILDFIRES') {
    return (
      <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
        <rect width="560" height="220" fill="#1E1B18" />
        <circle cx="170" cy="115" r={26 + sliderPct * 0.25} fill="#F97316" fillOpacity="0.5" />
        <circle cx="170" cy="115" r="14" fill="#EF4444" />
        <circle cx="350" cy="95" r={20 + sliderPct * 0.3} fill="#FB923C" fillOpacity="0.55" />
        <circle cx="350" cy="95" r="11" fill="#FACC15" />
        <circle cx="430" cy="150" r="18" fill="#EF4444" fillOpacity="0.65" />
        <text x="16" y="24" fill="#FB923C" fontSize="11" fontFamily="JetBrains Mono">
          FRONTS THERMIQUES IR — DÉTECTION SOUS PANACHE FUMÉE (GAIN : {sliderPct}%)
        </text>
      </svg>
    );
  }
  if (target === 'OCEANS') {
    return (
      <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
        <rect width="560" height="220" fill="#082F49" />
        <path
          d="M 40 140 C 140 60, 260 190, 380 95 C 440 50, 500 110, 540 85"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth={18 + sliderPct * 0.2}
          strokeOpacity="0.55"
        />
        <ellipse cx="220" cy="120" rx="70" ry="34" fill="#10B981" fillOpacity="0.35" />
        <text x="16" y="24" fill="#2DD4BF" fontSize="11" fontFamily="JetBrains Mono">
          ATLANTIQUE NORD — EFFLORESCENCE PHYTOPLANCTON (SPECTRE OCI : {sliderPct}%)
        </text>
      </svg>
    );
  }
  if (target === 'MOON') {
    return (
      <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
        <rect width="560" height="220" fill="#1E293B" />
        <circle cx="280" cy="120" r="76" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
        <circle cx="280" cy="120" r={28 + sliderPct * 0.25} fill="#38BDF8" fillOpacity="0.45" />
        <circle cx="140" cy="80" r="24" fill="#334155" />
        <circle cx="425" cy="145" r="32" fill="#334155" />
        <text x="16" y="24" fill="#4FC3F7" fontSize="11" fontFamily="JetBrains Mono">
          PÔLE SUD LUNAIRE (CRATÈRE SHACKLETON) — CONCENTRATION GLACE H2O ({sliderPct}%)
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 560 220" className="w-full h-56 rounded border border-[#4FC3F7]/30 bg-[#040812]">
      <rect width="560" height="220" fill="#451A03" />
      <path
        d="M 20 185 Q 160 140, 290 105 T 540 50"
        fill="none"
        stroke="#FACC15"
        strokeWidth="3"
      />
      <path
        d="M 20 195 Q 190 160, 330 135 T 540 95"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />
      <text x="16" y="24" fill="#FB923C" fontSize="11" fontFamily="JetBrains Mono">
        HAUTE ATMOSPHÈRE MARTIENNE — TAUX D&apos;ÉCHAPPEMENT IONIQUE (FENÊTRE : {sliderPct}%)
      </text>
    </svg>
  );
}

export const SummaryView: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const advancePhase = useMissionStore((s) => s.advancePhase);
  const leaveMission = useMissionStore((s) => s.leaveMission);

  const [filterPct, setFilterPct] = useState(75);

  if (!mission || !mission.finalResults) return null;

  const phase = Math.max(13, Math.min(15, mission.currentPhase));
  const { score, nasaMatch } = mission.finalResults;
  const target: TargetId = mission.design.target || 'FLOODS';
  const scenario = TARGET_SCENARIOS[target];

  return (
    <div className="min-h-screen w-full bg-[#040812] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="px-6 py-3.5 bg-[#060C1B] border-b border-[#4FC3F7]/25 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0B3D91] border border-[#4FC3F7]/60 flex items-center justify-center">
            <Orbit className="w-4 h-4 text-[#4FC3F7]" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-wider text-white">
              MISSIONSPHERE — DÉBRIEFING FINAL
            </div>
            <div className="text-[11px] text-[#4FC3F7]">
              {language === 'FR' ? scenario.nameFr : scenario.nameEn} · Salle {mission.roomId}
            </div>
          </div>
        </div>

        {/* Phase 13-15 Stepper Tabs */}
        <div className="flex items-center gap-1.5 bg-[#040812] p-1 rounded border border-slate-800">
          {[
            { p: 13, label: '13. Résultats' },
            { p: 14, label: '14. Score /1000' },
            { p: 15, label: '15. Match NASA' },
          ].map((tab) => (
            <button
              key={tab.p}
              type="button"
              onClick={() => advancePhase(tab.p)}
              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                phase === tab.p
                  ? 'bg-[#0B3D91] text-[#4FC3F7] border border-[#4FC3F7]/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 space-y-6">
        {/* PHASE 13: SCIENTIFIC RESULTS */}
        {phase === 13 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  PHASE 13 : RÉSULTATS SCIENTIFIQUES PRODUITS
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Analyse des données acquises par votre constellation durant {mission.telemetry.missionDurationYears} ans d&apos;exploitation.
                </p>
              </div>
              <GoSwitch
                label="SUIVANT : BILAN (/1000) >"
                onClick={() => advancePhase(14)}
              />
            </div>

            <div className="mcc-panel p-5 space-y-4">
              {renderTargetScienceVisual(target, filterPct)}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-3 text-xs text-slate-300 flex-1 max-w-md">
                  <span className="font-semibold text-[#4FC3F7] whitespace-nowrap">
                    Filtre de traitement :
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={filterPct}
                    onChange={(e) => setFilterPct(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="telemetry-value font-bold text-white w-10 text-right">
                    {filterPct}%
                  </span>
                </label>

                <div className="text-xs telemetry-value text-emerald-300 font-bold">
                  Qualité Science : {score.science}/100 · Résolution {mission.telemetry.groundResolutionMeters} m/px
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mcc-panel p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Instruments Actifs</div>
                <div className="text-sm font-bold text-white mt-1">
                  {mission.design.payloadIds.map((id) => CATALOG[id]?.shortLabel || id).join(', ') || 'Aucun'}
                </div>
              </div>
              <div className="mcc-panel p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Volume Transmis</div>
                <div className="telemetry-value text-sm font-bold text-[#4FC3F7] mt-1">
                  {mission.opsState.dataCollectedPct}% des objectifs couverts (Revisite {mission.telemetry.revisitDays}j)
                </div>
              </div>
              <div className="mcc-panel p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Découvertes Clés</div>
                <div className="text-xs text-emerald-300 font-semibold mt-1">
                  Cartographie {scenario.nameFr.toLowerCase()} validée avec succès pour les chercheurs.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 14: POST-MISSION ANALYSIS /1000 */}
        {phase === 14 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  PHASE 14 : ANALYSE POST-MISSION & SCORING
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Évaluation multi-critères de l&apos;architecture spatiale et de la gestion d&apos;équipe.
                </p>
              </div>
              <GoSwitch
                variant="emerald"
                label="SUIVANT : MATCH NASA >"
                onClick={() => advancePhase(15)}
              />
            </div>

            {/* Hero Total Score */}
            <div className="mcc-panel p-6 flex flex-wrap items-center justify-between gap-4 border-[#4FC3F7]/40 bg-gradient-to-r from-[#0B162C] to-[#0B3D91]/40">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#0B3D91] border border-[#4FC3F7]/60 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-[#FACC15]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#4FC3F7] font-bold">
                    RANG MISSION CONTROL
                  </div>
                  <div className="font-display text-2xl font-bold text-white mt-0.5">
                    {score.rank}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-slate-400">SCORE GLOBAL</div>
                <div className="telemetry-value text-4xl font-bold text-white">
                  {score.total} <span className="text-lg text-[#4FC3F7]">/ 1000</span>
                </div>
              </div>
            </div>

            {/* 5 Score Rings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <ScoreRing label="Science" weight="35%" value={score.science} color="#4FC3F7" />
              <ScoreRing label="Budget" weight="20%" value={score.budget} color="#10B981" />
              <ScoreRing label="Ingénierie" weight="20%" value={score.engineering} color="#34D399" />
              <ScoreRing label="Collaboration" weight="15%" value={score.collaboration} color="#FACC15" />
              <ScoreRing label="Survie" weight="10%" value={score.survival} color="#FB923C" />
            </div>

            {/* Space Mentor Debriefing */}
            <div className="mcc-panel p-5 space-y-2.5 border-[#4FC3F7]/35">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4FC3F7]">
                <Sparkles className="w-4 h-4" />
                <span>Diagnostic Space Mentor</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed">{score.diagnostic}</p>
              <p className="text-xs text-amber-300 font-medium pt-1">
                Piste d&apos;optimisation : {score.improvementTip}
              </p>
            </div>
          </div>
        )}

        {/* PHASE 15: NASA HISTORICAL COMPARISON */}
        {phase === 15 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  PHASE 15 : COMPARAISON HISTORIQUE NASA
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Rapprochement vectoriel avec le catalogue officiel des missions scientifiques NASA.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-[#4FC3F7]/50 bg-[#0B162C] hover:bg-[#112240] text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-[#4FC3F7]" />
                  <span>EXPORTER PDF</span>
                </button>
                <button
                  type="button"
                  onClick={leaveMission}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>REJOUER</span>
                </button>
              </div>
            </div>

            {/* Similarity Hero Banner */}
            <div className="mcc-panel p-6 flex flex-wrap items-center justify-between gap-4 border-[#FACC15]/50 bg-gradient-to-r from-[#0B162C] via-[#0B3D91]/40 to-[#0B162C]">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#FACC15]">
                  SIMILARITÉ VECTORIELLE NASA
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                  {nasaMatch.name} — {nasaMatch.fullTitle} ({nasaMatch.launchYear})
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 max-w-2xl">{nasaMatch.summary}</p>
              </div>

              <div className="text-center px-5 py-3 rounded-lg bg-[#040812]/80 border border-[#4FC3F7]/50">
                <div className="telemetry-value text-3xl font-bold text-[#4FC3F7]">
                  {nasaMatch.similarityPct}%
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white">MATCH</div>
              </div>
            </div>

            {/* Badge Unlocked */}
            <div className="p-4 rounded border border-[#FACC15]/60 bg-amber-950/25 flex items-center gap-3">
              <Award className="w-6 h-6 text-[#FACC15] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#FACC15] uppercase tracking-wider">
                  Badge NASA Heritage Débloqué : {nasaMatch.badgeTitle}
                </div>
                <div className="text-xs text-slate-200 mt-0.5">{nasaMatch.anecdote}</div>
              </div>
            </div>

            {/* Side-by-Side Comparison Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mcc-panel p-5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-display text-sm font-bold text-[#4FC3F7]">
                    VOTRE SATELLITE ({mission.roomId})
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-1.5 text-xs telemetry-value">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orbite & Altitude :</span>
                    <span className="text-white font-bold">
                      {mission.design.orbit.type} · {mission.design.orbit.altitudeKm} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masse totale :</span>
                    <span className="text-white font-bold">{mission.telemetry.massTotal} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget utilisé :</span>
                    <span className="text-white font-bold">${mission.telemetry.budgetUsed}M USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Charge utile :</span>
                    <span className="text-emerald-300 font-bold">
                      {mission.design.payloadIds.map((id) => CATALOG[id]?.shortLabel || id).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mcc-panel p-5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-display text-sm font-bold text-[#FACC15]">
                    MISSION RÉELLE NASA ({nasaMatch.name})
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{nasaMatch.launchYear}</span>
                </div>
                <div className="space-y-1.5 text-xs telemetry-value">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orbite & Altitude :</span>
                    <span className="text-white font-bold">
                      {nasaMatch.orbitType} · {nasaMatch.altitudeKm} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Masse au lancement :</span>
                    <span className="text-white font-bold">{nasaMatch.massKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coût programme :</span>
                    <span className="text-white font-bold">${nasaMatch.costMusd}M USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instruments clés :</span>
                    <span className="text-[#4FC3F7] font-bold truncate max-w-[230px]">
                      {nasaMatch.primaryInstruments.join(', ')}
                    </span>
                  </div>
                </div>
                {nasaMatch.nasaUrl && (
                  <div className="pt-2 border-t border-white/10">
                    <a
                      href={nasaMatch.nasaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FACC15] hover:text-white transition-colors"
                    >
                      <span>Consulter la fiche officielle NASA ({nasaMatch.name})</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DataSourceStrip phase={phase} />
      </main>
    </div>
  );
};
