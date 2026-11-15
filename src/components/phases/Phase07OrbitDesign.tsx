import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import {
  ORBIT_DEFAULT_ALTITUDE_KM,
  TARGET_PLANET_MAP,
} from '../../../shared/constants/physicsConstants';
import { OrbitRegime } from '../../../shared/types/catalog.types';
import { useMissionStore } from '../../store/useMissionStore';
import { OrbitViewport3D } from '../three/OrbitViewport3D';
import { GoSwitch } from '../ui/GoSwitch';

const ORBIT_TYPES: Array<{ id: OrbitRegime; label: string }> = [
  { id: 'LEO', label: 'LEO' },
  { id: 'SSO', label: 'POLAIRE / SSO' },
  { id: 'GEO', label: 'GEO' },
  { id: 'LUNAR', label: 'LUNE' },
  { id: 'MARS', label: 'MARS' },
];

export const Phase07OrbitDesign: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const orbit = mission.design.orbit;
  const t = mission.telemetry;
  const me = mission.players.find((p) => p.id === myPlayerId);
  const canEdit =
    mission.mode === 'SOLO' || ['OPERATIONS', 'SYSTEMS', 'MANAGER'].includes(me?.role || '');
  const planet: 'EARTH' | 'MOON' | 'MARS' =
    orbit.type === 'LUNAR'
      ? 'MOON'
      : orbit.type === 'MARS'
      ? 'MARS'
      : mission.design.target
      ? TARGET_PLANET_MAP[mission.design.target]
      : 'EARTH';

  const bounds = ORBIT_DEFAULT_ALTITUDE_KM[orbit.type];

  const handleOrbitType = (type: OrbitRegime) => {
    const def = ORBIT_DEFAULT_ALTITUDE_KM[type];
    updateDesign({
      orbit: {
        type,
        altitudeKm: def.default,
        inclinationDeg: def.inclination,
      },
    });
  };

  return (
    <div className="h-full flex flex-col gap-3 min-h-[540px]">
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            CONCEPTION ORBITALE 3D — MOTEUR GMAT (CML-4)
          </h2>
          <p className="text-xs text-slate-400">
            Visualisez l&apos;orbite, la zone d&apos;éclipse et le cône de visée (Swath) autour du corps céleste.
          </p>
        </div>

        {/* Instant GMAT Orbit Metrics */}
        <div className="flex flex-wrap items-center gap-4 px-3 py-1.5 rounded bg-[#0B162C] border border-[#4FC3F7]/25 text-xs telemetry-value">
          <span>
            Résolution : <strong className="text-[#4FC3F7]">{t.groundResolutionMeters || '--'} m</strong>
          </span>
          <span>
            Revisite : <strong className="text-white">{t.revisitDays} j</strong>
          </span>
          <span>
            Éclipse : <strong className="text-amber-300">{t.eclipseMinutes} min/orb</strong>
          </span>
        </div>
      </div>

      {/* 3D Three.js Viewport */}
      <div className="flex-1 min-h-[290px]">
        <OrbitViewport3D
          planet={planet}
          orbitType={orbit.type}
          altitudeKm={orbit.altitudeKm}
          inclinationDeg={orbit.inclinationDeg}
        />
      </div>

      {/* Bottom Orbit Controls Dock */}
      <div className="mcc-panel p-4 shrink-0 space-y-3">
        {!canEdit && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-950/35 border border-amber-500/35 text-xs text-amber-200">
            <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>
              Mode Lecture seule — Orbite contrôlée par l&apos;<strong>Operations Lead</strong> (ou Systems / Manager).
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {ORBIT_TYPES.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={!canEdit}
                onClick={() => handleOrbitType(o.id)}
                className={`px-3 py-1.5 rounded border text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  orbit.type === o.id
                    ? 'bg-[#0B3D91] border-[#4FC3F7] text-[#4FC3F7]'
                    : 'bg-[#040812] border-slate-700 text-slate-300 hover:border-[#4FC3F7]/50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <GoSwitch
            label="VERS SÉLECTION LANCEUR"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => advancePhase(8)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-semibold">Altitude Orbitale</span>
              <span className="telemetry-value font-bold text-[#4FC3F7]">
                {orbit.altitudeKm.toLocaleString()} km
              </span>
            </div>
            <input
              type="range"
              disabled={!canEdit || orbit.type === 'GEO'}
              min={bounds.min}
              max={bounds.max}
              step={orbit.type === 'LUNAR' ? 10 : 25}
              value={orbit.altitudeKm}
              onChange={(e) =>
                updateDesign({
                  orbit: { ...orbit, altitudeKm: Number(e.target.value) },
                })
              }
              className="w-full mcc-slider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-semibold">Inclinaison Orbitale</span>
              <span className="telemetry-value font-bold text-[#4FC3F7]">
                {orbit.inclinationDeg}° {orbit.type === 'SSO' ? '(Héliosynchrone)' : ''}
              </span>
            </div>
            <input
              type="range"
              disabled={!canEdit || orbit.type === 'SSO' || orbit.type === 'GEO'}
              min={0}
              max={110}
              step={1}
              value={orbit.inclinationDeg}
              onChange={(e) =>
                updateDesign({
                  orbit: { ...orbit, inclinationDeg: Number(e.target.value) },
                })
              }
              className="w-full mcc-slider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
