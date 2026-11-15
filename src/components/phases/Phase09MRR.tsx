import React from 'react';
import { AlertTriangle, CheckCircle2, Rocket, ShieldAlert, Wrench } from 'lucide-react';
import { CATALOG, TARGET_SCENARIOS } from '../../../shared/constants/catalogData';
import { PhysicsEngine } from '../../../shared/engine/PhysicsEngine';
import { useMissionStore } from '../../store/useMissionStore';
import { getStatusStyles } from '../../utils/statusColors';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase09MRR: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const d = mission.design;
  const mrr = PhysicsEngine.evaluateMRR(mission);
  const me = mission.players.find((p) => p.id === myPlayerId);
  const isManagerAllowed = mission.mode === 'SOLO' || !me?.role || me.role === 'MANAGER';
  const target = d.target ? TARGET_SCENARIOS[d.target] : TARGET_SCENARIOS.FLOODS;

  const quickFixTargets = [
    { phase: 5, label: 'Phase 5 · Bus & Énergie' },
    { phase: 6, label: 'Phase 6 · Payload' },
    { phase: 7, label: 'Phase 7 · Orbite' },
    { phase: 8, label: 'Phase 8 · Lanceur' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            MISSION READINESS REVIEW (MRR — REVUE DE LANCEMENT CML-5)
          </h2>
          <p className="text-xs text-slate-400">
            Audit critique NASA : aucun voyant ROUGE (NO-GO) n&apos;est toléré pour armer le lanceur.
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider telemetry-value ${
            !mrr.canLaunch
              ? 'bg-red-950/70 border-red-500/70 text-red-200'
              : mrr.hasWarnings
              ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
              : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
          }`}
        >
          {!mrr.canLaunch ? 'VERDICT : NO-GO' : mrr.hasWarnings ? 'VERDICT : GO AVEC DÉROGATION' : 'VERDICT : GO FOR LAUNCH'}
        </div>
      </div>

      {/* 6-row MRR Audit Table */}
      <div className="mcc-panel overflow-hidden">
        <div className="px-4 py-2.5 bg-[#060C1B] border-b border-[#4FC3F7]/20 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className="col-span-4">Sous-Système / Critère</span>
          <span className="col-span-4">Mesure Actuelle</span>
          <span className="col-span-2">Marge / État</span>
          <span className="col-span-2 text-right">Statut LED</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {mrr.items.map((item) => {
            const c = getStatusStyles(item.status);
            const dotColor =
              item.status === 'CRITICAL'
                ? 'bg-red-500'
                : item.status === 'WARNING'
                ? 'bg-amber-400'
                : 'bg-emerald-400';
            const ledLabel =
              item.status === 'NOMINAL' ? 'NOMINAL' : item.status === 'WARNING' ? 'WAIVER' : 'NO-GO';
            return (
              <div
                key={item.id}
                className="px-4 py-3 grid grid-cols-12 items-center gap-2 text-xs hover:bg-[#112240]/40 transition-colors"
              >
                <div className="col-span-12 sm:col-span-4 font-semibold text-white">
                  {language === 'FR' ? item.labelFr : item.labelEn}
                </div>
                <div className="col-span-6 sm:col-span-4 telemetry-value text-slate-200">
                  {item.valueLabel}
                </div>
                <div className="col-span-4 sm:col-span-2 telemetry-value text-[11px] text-slate-400">
                  {item.marginLabel}
                </div>
                <div className="col-span-2 flex justify-end">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold telemetry-value ${c.bg} ${c.border} ${c.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    {ledLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Configuration Recap */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="mcc-panel p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Cible Scientifique</div>
          <div className="text-xs font-bold text-white mt-1">
            {language === 'FR' ? target.nameFr : target.nameEn}
          </div>
        </div>
        <div className="mcc-panel p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Plateforme & Bus</div>
          <div className="text-xs font-bold text-[#4FC3F7] mt-1">
            {d.busId ? CATALOG[d.busId]?.shortLabel : 'Non défini'}
          </div>
        </div>
        <div className="mcc-panel p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Charge Utile</div>
          <div className="text-xs font-bold text-emerald-300 mt-1 truncate">
            {d.payloadIds.length > 0
              ? d.payloadIds.map((id) => CATALOG[id]?.shortLabel || id).join(' + ')
              : 'Aucun instrument'}
          </div>
        </div>
        <div className="mcc-panel p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Lanceur & Orbite</div>
          <div className="text-xs font-bold text-amber-300 mt-1">
            {d.launcherId ? CATALOG[d.launcherId]?.shortLabel : 'Aucun'} · {d.orbit.type} {d.orbit.altitudeKm}km
          </div>
        </div>
      </div>

      {/* Blocking Banner OR Launch Gatekeeper */}
      {!mrr.canLaunch ? (
        <div className="p-4 rounded border border-red-500/70 bg-red-950/45 space-y-3">
          <div className="flex items-start gap-2.5 text-red-100">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-sm font-bold text-red-200">
                LANCEMENT BLOQUÉ — CORRECTIONS REQUISES
              </h3>
              <p className="text-xs text-red-200/90 mt-1">
                Un ou plusieurs sous-systèmes sont en état critique NO-GO. Revenez ajuster votre architecture avant la mise à feu.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickFixTargets.map((q) => (
              <button
                key={q.phase}
                type="button"
                onClick={() => advancePhase(q.phase)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-400/50 bg-[#0B162C] hover:bg-red-900/40 text-xs font-semibold text-white cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-[#4FC3F7]" />
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mcc-panel p-4 flex flex-wrap items-center justify-between gap-4 border-emerald-500/40 bg-emerald-950/20">
          <div className="flex items-start gap-2.5">
            {mrr.hasWarnings ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                {mrr.hasWarnings
                  ? 'Feu Vert Conditionnel (Waiver actif)'
                  : 'Tous les systèmes sont nominaux pour le tir'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isManagerAllowed
                  ? 'Signez l\'autorisation finale pour déclencher la séquence de lancement (Phase 10).'
                  : 'En attente de la signature finale du Mission Manager pour armer le lanceur.'}
              </p>
            </div>
          </div>

          <GoSwitch
            variant="emerald"
            disabled={!isManagerAllowed}
            label="ARMER & LANCER (GO FOR LAUNCH)"
            icon={<Rocket className="w-4 h-4" />}
            onClick={() => advancePhase(10)}
          />
        </div>
      )}
    </div>
  );
};
