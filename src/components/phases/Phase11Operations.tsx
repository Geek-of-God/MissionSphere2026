import React from 'react';
import { Activity, AlertOctagon, ArrowRight, CheckCircle2, HeartPulse, ShieldAlert, Zap } from 'lucide-react';
import { ROLE_META } from '../../../shared/constants/physicsConstants';
import { PlayerRole } from '../../../shared/types/mission.types';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase11Operations: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const resolveCrisis = useMissionStore((s) => s.resolveCrisis);
  const triggerNextCrisis = useMissionStore((s) => s.triggerNextCrisis);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const { opsState, activeCrisis, design } = mission;
  const totalYears = design.requirements.targetDurationYears;
  const currentYear = Math.min(totalYears, Math.max(1, opsState.currentStep));
  const resolvedCount = opsState.resolvedCrises.length;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const timerRatio = activeCrisis ? Math.max(0, activeCrisis.timeLeft / Math.max(1, activeCrisis.totalTime)) : 0;
  const strokeDashoffset = circumference * (1 - timerRatio);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            OPÉRATIONS EN ORBITE & GESTION DES CRISES (CML-6)
          </h2>
          <p className="text-xs text-slate-400">
            Supervisez le satellite sur 3 jalons temporels et arbitrez les anomalies critiques avant expiration.
          </p>
        </div>

        {!activeCrisis && resolvedCount >= 1 && (
          <GoSwitch
            variant="emerald"
            label="VERS MISSION VIZ CENTER (PHASE 12)"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => advancePhase(12)}
          />
        )}
      </div>

      {/* Mission Operations Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="mcc-panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Progression Temporelle</div>
            <div className="telemetry-value text-lg font-bold text-white mt-0.5">
              Année {currentYear} / {totalYears}
            </div>
            <div className="text-[11px] text-[#4FC3F7]">Jalon {opsState.currentStep}/3</div>
          </div>
          <Activity className="w-6 h-6 text-[#4FC3F7]" />
        </div>

        <div className="mcc-panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Données Collectées</div>
            <div className="telemetry-value text-lg font-bold text-emerald-300 mt-0.5">
              {opsState.dataCollectedPct}%
            </div>
            <div className="text-[11px] text-slate-400">Transmission DSN active</div>
          </div>
          <Zap className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="mcc-panel p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Santé Satellite</div>
            <div
              className={`telemetry-value text-lg font-bold mt-0.5 ${
                opsState.satelliteHealth >= 75
                  ? 'text-emerald-300'
                  : opsState.satelliteHealth >= 50
                  ? 'text-amber-300'
                  : 'text-red-400'
              }`}
            >
              {opsState.satelliteHealth}%
            </div>
            <div className="text-[11px] text-slate-400">Sous-systèmes orbitaux</div>
          </div>
          <HeartPulse className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Active Crisis Alert Panel */}
      {activeCrisis ? (
        <div className="rounded-lg border-2 border-red-500/80 bg-red-950/35 p-5 space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/60 shrink-0">
                <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-300">
                  ALERTE ANOMALIE EN ORBITE — ÉTAPE {activeCrisis.stepIndex}/3
                </div>
                <h3 className="font-display text-lg font-bold text-white mt-0.5">
                  {activeCrisis.title}
                </h3>
                <p className="text-xs text-red-100/90 mt-1 max-w-2xl leading-relaxed">
                  {activeCrisis.description}
                </p>
              </div>
            </div>

            {/* Circular SVG Countdown */}
            <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 68 68">
                <circle
                  cx="34"
                  cy="34"
                  r={radius}
                  fill="none"
                  stroke="rgba(239,68,68,0.2)"
                  strokeWidth="5"
                />
                <circle
                  cx="34"
                  cy="34"
                  r={radius}
                  fill="none"
                  stroke={activeCrisis.timeLeft <= 8 ? '#EF4444' : '#F59E0B'}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute telemetry-value text-sm font-bold text-white">
                {activeCrisis.timeLeft}s
              </span>
            </div>
          </div>

          {/* 3 Quantified Response Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeCrisis.options.map((opt) => {
              const voters = (Object.entries(activeCrisis.votes) as Array<[PlayerRole, string]>)
                .filter(([, choice]) => choice === opt.id)
                .map(([role]) => role);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => resolveCrisis(opt.id)}
                  className="text-left p-4 rounded border border-red-400/40 bg-[#060C1B]/95 hover:bg-[#112240] hover:border-[#4FC3F7] transition-all cursor-pointer flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="font-display text-sm font-bold text-white">{opt.label}</div>
                    <div className="mt-1.5 text-xs text-amber-300 font-medium telemetry-value">
                      {opt.impactSummary}
                    </div>
                  </div>

                  {voters.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
                      {voters.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#040812]"
                          style={{ color: ROLE_META[r].color }}
                        >
                          {ROLE_META[r].shortTag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mcc-panel p-5 flex flex-wrap items-center justify-between gap-4 border-emerald-500/35">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                {opsState.currentStep < 3
                  ? `Télémétrie stabilisée (${opsState.currentStep}/3 crises traitées)`
                  : 'Toutes les phases opérationnelles ont été complétées !'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {opsState.currentStep < 3
                  ? 'Avancez vers le prochain jalon temporel ou passez directement au Mission Viz Center.'
                  : 'Passez au Mission Viz Center pour observer les résultats en orbite et le bilan final.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {opsState.currentStep < 3 && (
              <button
                type="button"
                onClick={triggerNextCrisis}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-amber-400/60 bg-amber-950/50 hover:bg-amber-800/60 text-xs font-bold uppercase tracking-wider text-amber-100 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>SIMULER ANOMALIE SUIVANTE ({opsState.currentStep + 1}/3)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resolved Crises Log */}
      {opsState.resolvedCrises.length > 0 && (
        <div className="mcc-panel p-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#4FC3F7]">
            Historique des Arbitrages en Vol
          </div>
          <div className="space-y-2">
            {opsState.resolvedCrises.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="p-2.5 rounded bg-[#040812]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{item.title}</span>
                  <span className="text-slate-400 mx-2">→</span>
                  <span className="text-[#4FC3F7] font-semibold">{item.chosenLabel}</span>
                </div>
                <span className="telemetry-value text-amber-300 text-[11px]">{item.impactSummary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
