import React from 'react';
import { ArrowRight, Check, Lock, Plus, Trash2 } from 'lucide-react';
import { CATALOG, TARGET_SCENARIOS } from '../../../shared/constants/catalogData';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase06PayloadDesign: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const d = mission.design;
  const t = mission.telemetry;
  const me = mission.players.find((p) => p.id === myPlayerId);
  const canEdit = mission.mode === 'SOLO' || ['SCIENCE', 'MANAGER'].includes(me?.role || '');

  const maxSlots = d.busId ? CATALOG[d.busId]?.payloadSlots ?? 2 : 2;
  const payloads = Object.values(CATALOG).filter((it) => it.category === 'PAYLOAD');
  const scenario = d.target ? TARGET_SCENARIOS[d.target] : TARGET_SCENARIOS.FLOODS;

  const togglePayload = (id: string) => {
    if (!canEdit) return;
    const equipped = d.payloadIds.includes(id);
    if (equipped) {
      updateDesign({ payloadIds: d.payloadIds.filter((p) => p !== id) });
    } else if (d.payloadIds.length < maxSlots) {
      updateDesign({ payloadIds: [...d.payloadIds, id] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            CHARGE UTILE SCIENTIFIQUE — BAIE NADIR ({d.payloadIds.length}/{maxSlots} SLOTS)
          </h2>
          <p className="text-xs text-slate-400">
            CML-3 · Équipez jusqu&apos;à {maxSlots} instrument(s) selon la capacité de votre Bus.
          </p>
        </div>
        <GoSwitch
          label="VERS CONCEPTION ORBITALE (3D)"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(7)}
        />
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded bg-amber-950/35 border border-amber-500/35 text-xs text-amber-200">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode Lecture seule — Charge utile scientifique gérée par le <strong>Science Lead</strong> (ou Mission Manager).
          </span>
        </div>
      )}

      {/* Physical Nadir Payload Bay Slots */}
      <div className="mcc-panel p-4">
        <div className="text-[11px] font-bold tracking-wider text-[#4FC3F7] uppercase mb-2.5">
          FACE NADIR DU SATELLITE — EMPLACEMENTS PHYSIQUES
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, idx) => {
            const isAvailableOnBus = idx < maxSlots;
            const equippedId = d.payloadIds[idx];
            const equippedItem = equippedId ? CATALOG[equippedId] : null;

            return (
              <div
                key={idx}
                className={`p-3 rounded border flex items-center justify-between gap-2 ${
                  !isAvailableOnBus
                    ? 'border-slate-800/60 bg-[#040812]/60 opacity-40'
                    : equippedItem
                    ? 'border-[#4FC3F7] bg-[#0B3D91]/55'
                    : 'border-dashed border-slate-700 bg-[#060C1B]'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[10px] telemetry-value text-slate-400">
                    SLOT #{idx + 1} {!isAvailableOnBus ? '(Indisponible sur ce Bus)' : ''}
                  </div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">
                    {equippedItem ? equippedItem.shortLabel : isAvailableOnBus ? 'Baie libre' : 'Verrouillé'}
                  </div>
                </div>
                {equippedItem && (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => togglePayload(equippedItem.id)}
                    className="p-1.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={canEdit ? "Retirer l'instrument" : 'Réservé au Science Lead'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instrument Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {payloads.map((inst) => {
          const equipped = d.payloadIds.includes(inst.id);
          const bayFull = !equipped && d.payloadIds.length >= maxSlots;
          const isRecommended = d.target ? inst.idealTargets?.includes(d.target) : false;

          return (
            <div
              key={inst.id}
              className={`mcc-panel p-4 flex flex-col justify-between transition-all ${
                equipped ? 'border-[#4FC3F7] bg-[#0B3D91]/45' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-sm font-bold text-white">{inst.name}</h3>
                    </div>
                    <div className="text-[11px] text-[#4FC3F7] mt-0.5">
                      {inst.spectralFocus} {isRecommended ? '· Recommandé pour cette cible' : ''}
                    </div>
                  </div>

                  {equipped && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 shrink-0">
                      <Check className="w-3.5 h-3.5" /> ÉQUIPÉ
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{inst.description}</p>

                <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-white/10 text-[11px] telemetry-value">
                  <div>
                    <span className="text-slate-500 block text-[9px]">COÛT</span>
                    <span className="text-white font-bold">${inst.cost}M</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">MASSE</span>
                    <span className="text-white font-bold">{inst.mass} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">CONSO</span>
                    <span className="text-amber-300 font-bold">{inst.power}W</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">DATA</span>
                    <span className="text-cyan-300 font-bold">{inst.dataGenerated} Mbps</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={bayFull || !canEdit}
                onClick={() => togglePayload(inst.id)}
                className={`mt-4 w-full py-2 px-3 rounded border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  equipped
                    ? 'bg-red-950/60 border-red-500/50 text-red-200 hover:bg-red-800/80'
                    : 'bg-[#0B3D91] border-[#4FC3F7]/60 text-white hover:bg-[#1455C0]'
                }`}
              >
                {!canEdit ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>SCIENCE LEAD REQUIS</span>
                  </>
                ) : equipped ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>RETIRER L&apos;INSTRUMENT</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{bayFull ? 'BAIE PLEINE' : `AJOUTER (+$${inst.cost}M)`}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Estimated Science Score Footer */}
      <div className="mcc-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              SCORE SCIENCE ESTIMÉ
            </div>
            <div className="telemetry-value text-base font-bold text-white">
              <span className={t.scienceScore >= scenario.scienceTarget ? 'text-emerald-400' : 'text-amber-400'}>
                {t.scienceScore}
              </span>{' '}
              / {scenario.scienceTarget} pts requis
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {d.payloadIds.length === 0
            ? 'Équipez au moins 1 instrument scientifique avant de définir l\'orbite.'
            : 'Ajustez la puissance et l\'antenne en Phase 5 si vos jauges passent en Rouge.'}
        </div>
      </div>
    </div>
  );
};
