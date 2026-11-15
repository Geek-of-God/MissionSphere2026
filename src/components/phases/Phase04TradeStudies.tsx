import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { getTradeStudiesForTarget } from '../../../shared/constants/catalogData';
import { ROLE_META } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';
import { RadarChartSVG } from '../ui/RadarChartSVG';

export const Phase04TradeStudies: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const voteTrade = useMissionStore((s) => s.voteTrade);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const options = getTradeStudiesForTarget(mission.design.target);
  const budgetLimit = mission.telemetry.budgetMax;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white tracking-wide">
          MATRICE DE COMPROMIS D&apos;ARCHITECTURES (TRADE SPACE)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          CML-2 → CML-3 · Comparez les 3 profils radar avant de figer l&apos;architecture de référence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {options.map((opt) => {
          const isSelected = mission.design.selectedArchitecture === opt.id;
          const overBudget = opt.estimatedCost > budgetLimit;
          const voters = Object.entries(mission.design.architectureVotes || {})
            .filter(([, arch]) => arch === opt.id)
            .map(([role]) => role as keyof typeof ROLE_META);

          return (
            <div
              key={opt.id}
              className={`mcc-panel p-4 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-[#4FC3F7] bg-[#0B3D91]/45 shadow-[0_0_20px_rgba(79,195,247,0.2)]'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display text-sm font-bold text-white">
                    {language === 'FR' ? opt.nameFr : opt.nameEn}
                  </h3>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 shrink-0">
                      <Check className="w-3.5 h-3.5" /> RETENUE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4FC3F7]/90 mb-3">
                  {language === 'FR' ? opt.subtitleFr : opt.subtitleEn}
                </p>

                <div className="py-2">
                  <RadarChartSVG metrics={opt.radarMetrics} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-slate-400">SCIENCE</div>
                    <div className="telemetry-value text-xs font-bold text-[#4FC3F7]">
                      {opt.estimatedScience}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">COÛT EST.</div>
                    <div
                      className={`telemetry-value text-xs font-bold ${
                        overBudget ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      ${opt.estimatedCost}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">RISQUE</div>
                    <div className="telemetry-value text-xs font-bold text-amber-300">
                      {opt.estimatedRisk}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {voters.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {voters.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#040812] border border-slate-700"
                        style={{ color: ROLE_META[r].color }}
                      >
                        {ROLE_META[r].shortTag}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => voteTrade(opt.id)}
                  className={`w-full py-2 px-3 rounded border text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0B3D91] border-[#4FC3F7] text-white'
                      : 'bg-[#112240] border-[#4FC3F7]/40 text-slate-200 hover:bg-[#0B3D91]'
                  }`}
                >
                  {overBudget ? 'CHOISIR (HORS BUDGET)' : `VOTER ${opt.id.replace('_', ' ')}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mcc-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          Architecture de référence :{' '}
          <strong className="telemetry-value text-[#4FC3F7]">
            {mission.design.selectedArchitecture || 'Aucune sélectionnée (personnalisation libre)'}
          </strong>
        </div>

        <GoSwitch
          label="FIGER ARCHITECTURE & ASSEMBLER (2.5D)"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(5)}
        />
      </div>
    </div>
  );
};
