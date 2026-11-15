import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { ROLE_META } from '../../../shared/constants/physicsConstants';
import { PhysicsEngine } from '../../../shared/engine/PhysicsEngine';
import { PlayerRole } from '../../../shared/types/mission.types';
import { useMissionStore } from '../../store/useMissionStore';
import { getStatusStyles } from '../../utils/statusColors';
import { FeasibilityGauge } from '../ui/FeasibilityGauge';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase02Requirements: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const suggestRequirement = useMissionStore((s) => s.suggestRequirement);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const me = mission.players.find((p) => p.id === myPlayerId);
  const myRole: PlayerRole = me?.role || 'MANAGER';
  const req = mission.design.requirements;
  const feasibility = PhysicsEngine.calculateFeasibility(mission.design, mission.modifier);
  const fStyle = getStatusStyles(feasibility.status);

  const sliders = [
    {
      field: 'budgetLimit' as const,
      title: '1. ENVELOPPE BUDGÉTAIRE ALLOUÉE',
      ownerRole: 'MANAGER' as PlayerRole,
      min: 50,
      max: 400,
      step: 5,
      value: req.budgetLimit,
      display: `$${req.budgetLimit}M USD`,
      minLabel: '$50M',
      maxLabel: '$400M',
    },
    {
      field: 'minResolutionMeters' as const,
      title: '2. RÉSOLUTION SPATIALE REQUISE',
      ownerRole: 'SCIENCE' as PlayerRole,
      min: 1,
      max: 50,
      step: 1,
      value: req.minResolutionMeters,
      display: `${req.minResolutionMeters} m/px`,
      minLabel: '1m (Ultra-fin)',
      maxLabel: '50m (Large)',
    },
    {
      field: 'targetDurationYears' as const,
      title: '3. DURÉE DE VIE OPÉRATIONNELLE',
      ownerRole: 'SYSTEMS' as PlayerRole,
      min: 1,
      max: 10,
      step: 1,
      value: req.targetDurationYears,
      display: `${req.targetDurationYears} Ans`,
      minLabel: '1 an',
      maxLabel: '10 ans',
    },
    {
      field: 'maxRiskTolerance' as const,
      title: '4. TOLÉRANCE AU RISQUE TECHNIQUE',
      ownerRole: 'OPERATIONS' as PlayerRole,
      min: 5,
      max: 50,
      step: 1,
      value: req.maxRiskTolerance,
      display: `${req.maxRiskTolerance}%`,
      minLabel: '5% (Strict)',
      maxLabel: '50% (Audacieux)',
    },
  ];

  const handleSliderChange = (
    field: 'budgetLimit' | 'minResolutionMeters' | 'targetDurationYears' | 'maxRiskTolerance',
    ownerRole: PlayerRole,
    val: number
  ) => {
    const canControl = mission.mode === 'SOLO' || myRole === ownerRole || myRole === 'MANAGER';
    if (canControl) {
      updateDesign({
        requirements: {
          ...req,
          [field]: val,
        },
      });
    } else {
      suggestRequirement(field, val);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white tracking-wide">
          DÉFINITION DES EXIGENCES DU PROGRAMME (CML-1)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Chaque pôle ajuste sa contrainte. En multijoueur, déplacer un curseur tiers affiche une suggestion fantôme.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-3">
          {sliders.map((s) => {
            const roleMeta = ROLE_META[s.ownerRole];
            const lockedForMe =
              mission.mode === 'MULTI' && myRole !== s.ownerRole && myRole !== 'MANAGER';
            const suggestion = mission.design.requirementSuggestions?.[s.field];
            const pct = ((s.value - s.min) / (s.max - s.min)) * 100;
            const sugPct = suggestion
              ? ((suggestion.value - s.min) / (s.max - s.min)) * 100
              : null;

            return (
              <div key={s.field} className="mcc-panel p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{s.title}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        color: roleMeta.color,
                        borderColor: `${roleMeta.color}50`,
                        backgroundColor: `${roleMeta.color}12`,
                      }}
                    >
                      {roleMeta.labelFr}
                    </span>
                    {lockedForMe && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                  <span className="telemetry-value text-sm font-bold text-[#4FC3F7]">
                    {s.display}
                  </span>
                </div>

                <div className="relative py-1">
                  {sugPct !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-4 rounded-sm border border-dashed border-amber-300 bg-amber-400/30 pointer-events-none z-10"
                      style={{ left: `calc(${sugPct}% - 5px)` }}
                      title={`Suggestion ${suggestion?.byRole}: ${suggestion?.value}`}
                    />
                  )}
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={(e) =>
                      handleSliderChange(s.field, s.ownerRole, Number(e.target.value))
                    }
                    className="w-full mcc-slider cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 telemetry-value mt-1">
                    <span>{s.minLabel}</span>
                    <span className="text-slate-500">({Math.round(pct)}%)</span>
                    <span>{s.maxLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feasibility Dial */}
        <div className={`mcc-panel p-5 flex flex-col justify-between border ${fStyle.border}`}>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-slate-400 text-center">
              INDICE DE FAISABILITÉ INITIALE
            </div>
            <div className="my-4">
              <FeasibilityGauge scorePct={feasibility.scorePct} status={feasibility.status} />
            </div>
            <div className={`text-center text-xs font-bold uppercase tracking-wider ${fStyle.text}`}>
              {feasibility.status === 'NOMINAL'
                ? 'FAISABLE'
                : feasibility.status === 'WARNING'
                ? 'TENDU (COMPROMIS REQUIS)'
                : 'CRITIQUE (IRRÉALISTE)'}
            </div>
            <p className="text-xs text-slate-300 text-center mt-2 leading-relaxed">
              {feasibility.messageFr}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <GoSwitch
              label="PASSER AU MDL"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => advancePhase(3)}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
