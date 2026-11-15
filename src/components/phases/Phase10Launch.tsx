import React, { useEffect, useState } from 'react';
import { ArrowRight, FastForward, Flame, Radio } from 'lucide-react';
import { CATALOG } from '../../../shared/constants/catalogData';
import { TARGET_PLANET_MAP } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';
import { LaunchViewport3D } from '../three/LaunchViewport3D';
import { GoSwitch } from '../ui/GoSwitch';

const FLIGHT_EVENTS = [
  { threshold: 0, time: 'T+00:00', text: 'Allumage moteur principal & décollage du pas de tir.' },
  { threshold: 25, time: 'T+01:12', text: 'Max-Q atteint — pression aérodynamique maximale nominale.' },
  { threshold: 48, time: 'T+02:10', text: 'MECO & Séparation du 1er étage. Allumage étage supérieur.' },
  { threshold: 74, time: 'T+02:40', text: 'Largage de la coiffe & déploiement des panneaux solaires.' },
  { threshold: 96, time: 'T+03:30', text: 'Injection orbitale réussie ! Acquisition signal DSN confirmée.' },
];

export const Phase10Launch: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mission) return;
    const durationMs = mission.demoMode ? 6000 : 14000;
    const start = performance.now();
    const id = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) window.clearInterval(id);
    }, 80);
    return () => window.clearInterval(id);
  }, [mission?.demoMode]);

  if (!mission) return null;

  const planet = TARGET_PLANET_MAP[mission.design.target || 'FLOODS'] || 'EARTH';
  const targetAlt = mission.design.orbit.altitudeKm;
  const currentAlt = Math.round((progress / 100) * targetAlt);
  const targetVel = planet === 'EARTH' && mission.design.orbit.type === 'GEO' ? 3.1 : 7.8;
  const currentVel = ((progress / 100) * targetVel).toFixed(2);
  const maxQ = progress < 25 ? Math.round((progress / 25) * 34) : Math.max(0, Math.round(34 - ((progress - 25) / 35) * 34));
  const launcherName = mission.design.launcherId
    ? CATALOG[mission.design.launcherId]?.shortLabel
    : 'Lanceur Orbital';
  const completed = progress >= 100;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            SÉQUENCE DE LANCEMENT — {launcherName.toUpperCase()}
          </h2>
          <p className="text-xs text-slate-400">
            Suivi télémétrique d&apos;ascension et mise à poste vers {mission.design.orbit.type} ({targetAlt} km).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!completed && (
            <button
              type="button"
              onClick={() => setProgress(100)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-slate-700 bg-[#0B162C] hover:border-[#4FC3F7] text-xs font-semibold text-slate-300 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Passer</span>
            </button>
          )}
          <GoSwitch
            variant={completed ? 'emerald' : 'primary'}
            label="VERS OPÉRATIONS (PHASE 11)"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => advancePhase(11)}
          />
        </div>
      </div>

      {/* Main 3D Viewport + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[340px] sm:h-[380px] relative">
          <LaunchViewport3D progress={progress} planet={planet} />

          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#040812]/85 border border-[#4FC3F7]/40 text-[11px] telemetry-value text-[#4FC3F7]">
            PROGRESSION VOL : {Math.round(progress)}%
          </div>
          {completed && (
            <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded bg-emerald-950/90 border border-emerald-400/70 text-xs font-bold text-emerald-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>SECO CONFIRMÉ — SATELLITE DÉPLOYÉ SUR ORBITE NOMINALE</span>
            </div>
          )}
        </div>

        {/* Telemetry & Flight Events Log */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5">
            <div className="mcc-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Altitude Actuelle</div>
              <div className="telemetry-value text-xl font-bold text-white mt-0.5">
                {currentAlt.toLocaleString()} <span className="text-xs text-[#4FC3F7]">km</span>
              </div>
            </div>
            <div className="mcc-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Vitesse Orbitale</div>
              <div className="telemetry-value text-xl font-bold text-white mt-0.5">
                {currentVel} <span className="text-xs text-[#4FC3F7]">km/s</span>
              </div>
            </div>
            <div className="mcc-panel p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Pression Max-Q</div>
              <div className="telemetry-value text-xl font-bold text-amber-300 mt-0.5">
                {maxQ} <span className="text-xs text-slate-400">kPa</span>
              </div>
            </div>
          </div>

          <div className="mcc-panel p-3.5 flex-1 flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#4FC3F7] mb-2">
              Journal de Vol En Direct
            </div>
            <div className="space-y-2 overflow-y-auto text-xs">
              {FLIGHT_EVENTS.map((ev) => {
                const reached = progress >= ev.threshold;
                return (
                  <div
                    key={ev.time}
                    className={`p-2 rounded border transition-all ${
                      reached
                        ? 'border-[#4FC3F7]/40 bg-[#0B3D91]/25 text-slate-100'
                        : 'border-slate-800/70 bg-[#040812]/60 text-slate-500 opacity-55'
                    }`}
                  >
                    <span className="telemetry-value font-bold text-[#4FC3F7] mr-2">{ev.time}</span>
                    <span>{ev.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
