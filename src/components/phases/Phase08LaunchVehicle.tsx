import React from 'react';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { CATALOG } from '../../../shared/constants/catalogData';
import { ORBIT_PAYLOAD_PENALTY } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase08LaunchVehicle: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const d = mission.design;
  const t = mission.telemetry;
  const me = mission.players.find((p) => p.id === myPlayerId);
  const canEdit = mission.mode === 'SOLO' || ['SYSTEMS', 'MANAGER'].includes(me?.role || '');
  const launchers = Object.values(CATALOG).filter((it) => it.category === 'LAUNCHER');
  const penalty = ORBIT_PAYLOAD_PENALTY[d.orbit.type] || 1.0;

  // Cost excluding currently selected launcher so we can preview each launcher's budget impact
  const currentLauncherCost = d.launcherId ? CATALOG[d.launcherId]?.cost || 0 : 0;
  const satelliteOnlyCost = t.budgetUsed - currentLauncherCost;

  const selectedLauncher = d.launcherId ? CATALOG[d.launcherId] : launchers[1];
  const selectedCap = Math.round((selectedLauncher?.maxMassLeo || 0) * penalty);
  const massMarginPct =
    selectedCap > 0 ? Math.round(((selectedCap - t.massTotal) / selectedCap) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            SÉLECTION DU LANCEUR & COMPATIBILITÉ COIFFE (CML-4)
          </h2>
          <p className="text-xs text-slate-400">
            Orbite cible : {d.orbit.type} ({d.orbit.altitudeKm} km) · Masse satellite : {t.massTotal} kg
          </p>
        </div>
        <GoSwitch
          label="VERS REVUE MRR (AUDIT FINAL)"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(9)}
        />
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded bg-amber-950/35 border border-amber-500/35 text-xs text-amber-200">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode Lecture seule — Sélection du lanceur réservée au <strong>Systems Engineer</strong> (ou Mission Manager).
          </span>
        </div>
      )}

      {/* 3 Launcher Cards with Scale Silhouettes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {launchers.map((lnch, idx) => {
          const isSelected = d.launcherId === lnch.id;
          const capOrbit = Math.round((lnch.maxMassLeo || 0) * penalty);
          const overweight = t.massTotal > capOrbit;
          const overBudget = satelliteOnlyCost + lnch.cost > t.budgetMax;
          const rocketHeight = idx === 0 ? 78 : idx === 1 ? 108 : 132;
          const rocketWidth = idx === 0 ? 14 : idx === 1 ? 20 : 34;

          return (
            <button
              key={lnch.id}
              type="button"
              disabled={!canEdit}
              onClick={() => updateDesign({ launcherId: lnch.id })}
              className={`mcc-panel p-4 text-left flex flex-col justify-between transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-[#4FC3F7] bg-[#0B3D91]/55 shadow-[0_0_20px_rgba(79,195,247,0.2)]'
                  : 'hover:border-[#4FC3F7]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-display text-sm font-bold text-white">
                    {lnch.shortLabel}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                      <Check className="w-3.5 h-3.5" /> ACTIF
                    </span>
                  )}
                </div>

                {/* Scale SVG Silhouette */}
                <div className="h-36 flex items-end justify-center py-2 bg-[#040812]/80 rounded border border-slate-800/80 mb-3">
                  <svg width="80" height="140" viewBox="0 0 80 140">
                    {/* Fairing + Core */}
                    <polygon
                      points={`40,${136 - rocketHeight} ${40 - rocketWidth / 2},${
                        136 - rocketHeight + 22
                      } ${40 + rocketWidth / 2},${136 - rocketHeight + 22}`}
                      fill="#FFFFFF"
                    />
                    <rect
                      x={40 - rocketWidth / 2}
                      y={136 - rocketHeight + 22}
                      width={rocketWidth}
                      height={rocketHeight - 24}
                      fill="#CBD5E1"
                    />
                    {/* Side boosters for Heavy */}
                    {idx === 2 && (
                      <>
                        <rect x="16" y="48" width="9" height="86" rx="2" fill="#94A3B8" />
                        <rect x="55" y="48" width="9" height="86" rx="2" fill="#94A3B8" />
                      </>
                    )}
                    <line x1="10" y1="136" x2="70" y2="136" stroke="#4FC3F7" strokeOpacity="0.4" />
                  </svg>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">{lnch.description}</p>

                <div className="space-y-1 text-xs telemetry-value">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coût lancement :</span>
                    <span className="text-white font-bold">${lnch.cost}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacité {d.orbit.type} :</span>
                    <span className="text-[#4FC3F7] font-bold">{capOrbit.toLocaleString()} kg</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10">
                <div
                  className={`text-center py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                    overweight
                      ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                      : overBudget
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {overweight
                    ? 'SURPOIDS SUR CETTE ORBITE'
                    : overBudget
                    ? 'DÉPASSEMENT BUDGET'
                    : 'COMPATIBLE'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2D Fairing Cross-Section Diagram */}
      <div className="mcc-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
          <span className="font-bold tracking-wider text-[#4FC3F7] uppercase">
            DIAGRAMME D&apos;INTÉGRATION SOUS COIFFE ({selectedLauncher?.fairingDiameterM || 3.7}M)
          </span>
          <span
            className={`telemetry-value font-bold ${
              massMarginPct < 0 ? 'text-red-400' : massMarginPct < 15 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            Satellite {t.massTotal} kg / {selectedCap} kg (Marge : {massMarginPct}%)
          </span>
        </div>

        <div className="w-full h-24 bg-[#040812] rounded border border-slate-800 flex items-center justify-center px-4">
          <svg viewBox="0 0 560 80" className="w-full max-w-2xl h-20">
            {/* Fairing shell */}
            <path
              d="M 40 16 L 440 16 L 525 40 L 440 64 L 40 64 Z"
              fill="rgba(11, 61, 145, 0.2)"
              stroke="#4FC3F7"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Payload Adapter */}
            <rect x="60" y="26" width="24" height="28" fill="#475569" />
            {/* Folded Satellite inside fairing */}
            <rect
              x="88"
              y="22"
              width={Math.min(310, Math.max(70, (t.massTotal / Math.max(1, selectedCap)) * 280))}
              height="36"
              rx="3"
              fill={massMarginPct < 0 ? '#991B1B' : '#0B3D91'}
              stroke={massMarginPct < 0 ? '#EF4444' : '#34D399'}
              strokeWidth="2"
            />
            <text x="190" y="44" fill="#FFFFFF" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
              SATELLITE {t.massTotal} KG
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
