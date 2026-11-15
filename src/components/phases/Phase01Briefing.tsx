import React from 'react';
import { ArrowRight, CloudRain, ExternalLink, Flame, Globe, Moon, Trees, Waves } from 'lucide-react';
import { TARGET_SCENARIOS } from '../../../shared/constants/catalogData';
import { TargetBody } from '../../../shared/types/catalog.types';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

const TARGET_ICONS: Record<TargetBody, React.ReactNode> = {
  FLOODS: <CloudRain className="w-6 h-6 text-[#4FC3F7]" />,
  DEFORESTATION: <Trees className="w-6 h-6 text-emerald-400" />,
  WILDFIRES: <Flame className="w-6 h-6 text-amber-400" />,
  OCEANS: <Waves className="w-6 h-6 text-cyan-300" />,
  MOON: <Moon className="w-6 h-6 text-slate-200" />,
  MARS: <Globe className="w-6 h-6 text-orange-400" />,
};

export const Phase01Briefing: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const selectedId: TargetBody = mission.design.target || 'FLOODS';
  const selected = TARGET_SCENARIOS[selectedId];
  const scenarios = Object.values(TARGET_SCENARIOS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            SÉLECTIONNEZ L&apos;OBJECTIF SCIENTIFIQUE DE LA MISSION
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            CML-1 · Chaque destination impose des lois physiques (ensoleillement, distance, météo).
          </p>
        </div>
      </div>

      {/* 3x2 Target Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const active = sc.id === selectedId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => updateDesign({ target: sc.id })}
              className={`text-left p-4 rounded-md border transition-all cursor-pointer ${
                active
                  ? 'bg-[#0B3D91]/70 border-[#4FC3F7] shadow-[0_0_18px_rgba(79,195,247,0.2)]'
                  : 'bg-[#0B162C]/80 border-[#4FC3F7]/20 hover:border-[#4FC3F7]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-[#040812]/80 border border-slate-800">
                    {TARGET_ICONS[sc.id]}
                  </div>
                  <div>
                    <div className="text-[10px] telemetry-value font-semibold text-[#4FC3F7]">
                      {sc.environmentLabel}
                    </div>
                    <h3 className="font-display text-sm font-bold text-white leading-tight mt-0.5">
                      {language === 'FR' ? sc.nameFr : sc.nameEn}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2.5">
                {language === 'FR' ? sc.subtitleFr : sc.subtitleEn}
              </p>

              <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-400">
                {(language === 'FR' ? sc.requirementsSummaryFr : sc.requirementsSummaryEn).map(
                  (req, i) => (
                    <span key={req}>
                      {i > 0 && <span className="mr-2 text-slate-600">·</span>}
                      {req}
                    </span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Target Detailed Briefing Panel */}
      <div className="mcc-panel p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4FC3F7]">
              CAHIER DES CHARGES : {language === 'FR' ? selected.nameFr : selected.nameEn}
            </span>
            {selected.nasaUrl ? (
              <a
                href={selected.nasaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0B3D91]/60 border border-[#4FC3F7]/40 text-[11px] font-semibold text-[#4FC3F7] hover:text-white hover:border-[#4FC3F7] transition-colors"
              >
                <span>{selected.nasaInspiration}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-slate-400">· {selected.nasaInspiration}</span>
            )}
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {language === 'FR' ? selected.challengeFr : selected.challengeEn}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs telemetry-value text-slate-300">
            <span>
              Objectif Science : <strong className="text-white">{selected.scienceTarget} pts</strong>
            </span>
            <span>
              Revisite max : <strong className="text-white">{selected.maxRevisitDays} jours</strong>
            </span>
            <span>
              Résolution cible : <strong className="text-white">&lt; {selected.requiredResolutionMeters} m</strong>
            </span>
          </div>
        </div>

        <GoSwitch
          label="VALIDER LA CIBLE"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(2)}
        />
      </div>
    </div>
  );
};
