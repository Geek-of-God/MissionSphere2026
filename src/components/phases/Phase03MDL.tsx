import React, { useState } from 'react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { ROLE_META } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

const SUGGESTED_TEMPLATES = [
  'Priorité à l\'imagerie tout-temps (Radar SAR) quitte à augmenter le budget énergie.',
  'Limiter la masse totale sous 300 kg pour économiser sur un lanceur léger.',
  'Maximiser la durée de vie en orbite SSO 650 km avec avionique Rad-Hard.',
];

export const Phase03MDL: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const soloActiveRole = useMissionStore((s) => s.soloActiveRole);
  const proposeMdl = useMissionStore((s) => s.proposeMdl);
  const voteMdl = useMissionStore((s) => s.voteMdl);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  const [draft, setDraft] = useState('');

  if (!mission) return null;
  const me = mission.players.find((p) => p.id === myPlayerId);
  const myRole = mission.mode === 'SOLO' ? soloActiveRole : me?.role || 'MANAGER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    proposeMdl(draft);
    setDraft('');
  };

  const alignedCount = mission.mdlProposals.reduce(
    (max, p) => Math.max(max, p.votes.length),
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white tracking-wide">
          SALLE DE CONCEPTION COLLABORATIVE (MISSION DESIGN LAB)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          CML-2 · Proposez les priorités stratégiques de l&apos;équipe et votez pour aligner la doctrine avant les Trade Studies.
        </p>
      </div>

      {/* Proposal input & templates */}
      <div className="mcc-panel p-4 space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Soumettre une priorité stratégique (ex: Privilégier la revisite rapide...)"
            className="flex-1 px-3 py-2 rounded bg-[#040812] border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#4FC3F7]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#0B3D91] hover:bg-[#1455C0] border border-[#4FC3F7]/50 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#4FC3F7]" />
            <span>SOUMETTRE PROPOSITION</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              type="button"
              onClick={() => proposeMdl(tpl)}
              className="px-2.5 py-1 rounded border border-slate-700 bg-[#081022] hover:border-[#4FC3F7]/50 text-[11px] text-slate-300 cursor-pointer text-left"
            >
              + {tpl}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals Board */}
      <div className="space-y-2.5">
        {mission.mdlProposals.length === 0 ? (
          <div className="mcc-panel p-6 text-center text-xs text-slate-400">
            Aucune proposition stratégique encore enregistrée. Soumettez une priorité ou choisissez un modèle ci-dessus.
          </div>
        ) : (
          mission.mdlProposals.map((prop) => {
            const authorMeta = ROLE_META[prop.authorRole];
            const votedByMe = prop.votes.includes(myRole);

            return (
              <div
                key={prop.id}
                className="mcc-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: authorMeta.color }}
                    >
                      [{authorMeta.labelFr}]
                    </span>
                    <span className="text-xs text-white font-medium">{prop.text}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'] as const).map((r) => {
                      const hasVoted = prop.votes.includes(r);
                      return (
                        <span
                          key={r}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            hasVoted
                              ? 'bg-[#0B3D91]/70 border-[#4FC3F7]/60 text-white'
                              : 'bg-[#040812]/60 border-slate-800 text-slate-500'
                          }`}
                        >
                          {hasVoted && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                          {ROLE_META[r].shortTag}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => voteMdl(prop.id)}
                  className={`px-3.5 py-1.5 rounded border text-xs font-bold cursor-pointer whitespace-nowrap ${
                    votedByMe
                      ? 'bg-emerald-600/80 border-emerald-400 text-white'
                      : 'bg-[#112240] border-[#4FC3F7]/40 text-[#4FC3F7] hover:bg-[#0B3D91]'
                  }`}
                >
                  {votedByMe ? 'VOTÉ ✓' : 'VOTER POUR'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Consensus */}
      <div className="mcc-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          Statut du consensus MDL :{' '}
          <strong className="telemetry-value text-[#4FC3F7]">
            {alignedCount} / {Math.max(1, mission.players.length)} Rôles alignés
          </strong>
        </div>

        <GoSwitch
          label="CLÔTURER & ÉTUDIER LES COMPROMIS"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(4)}
        />
      </div>
    </div>
  );
};
