import React, { useState } from 'react';
import { ArrowRight, Eye, Globe, Radio, Satellite } from 'lucide-react';
import { DSN_STATIONS, TARGET_PLANET_MAP } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';
import { MissionViz3D } from '../three/MissionViz3D';
import { GoSwitch } from '../ui/GoSwitch';

export const Phase12MissionViz: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  const [showGroundTrack, setShowGroundTrack] = useState(true);
  const [showSwath, setShowSwath] = useState(true);
  const [showDsnLinks, setShowDsnLinks] = useState(true);

  if (!mission) return null;

  const planet = TARGET_PLANET_MAP[mission.design.target || 'FLOODS'] || 'EARTH';
  const { orbit } = mission.design;
  const t = mission.telemetry;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Satellite className="w-5 h-5 text-[#4FC3F7]" />
            NASA MISSION VIZ CENTER — SIMULATION EN ORBITE 3D
          </h2>
          <p className="text-xs text-slate-400">
            Visualisez la trace au sol sinusoïdale, le cône de fauchée capteur et les liaisons Deep Space Network.
          </p>
        </div>

        <GoSwitch
          variant="emerald"
          label="VOIR RÉSULTATS SCIENTIFIQUES (PHASE 13)"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(13)}
        />
      </div>

      {/* Layer Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGroundTrack((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
            showGroundTrack
              ? 'border-[#FACC15] bg-amber-950/40 text-[#FACC15]'
              : 'border-slate-700 bg-[#0B162C] text-slate-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Trace au sol</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSwath((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
            showSwath
              ? 'border-[#4FC3F7] bg-[#0B3D91]/50 text-[#4FC3F7]'
              : 'border-slate-700 bg-[#0B162C] text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Fauchée capteur</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDsnLinks((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
            showDsnLinks
              ? 'border-emerald-400 bg-emerald-950/50 text-emerald-300'
              : 'border-slate-700 bg-[#0B162C] text-slate-400'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Liaisons DSN</span>
        </button>
      </div>

      {/* 3D Viz + DSN Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[360px] sm:h-[400px]">
          <MissionViz3D
            planet={planet}
            altitudeKm={orbit.altitudeKm}
            inclinationDeg={orbit.inclinationDeg}
            showGroundTrack={showGroundTrack}
            showSwath={showSwath}
            showDsnLinks={showDsnLinks}
          />
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="mcc-panel p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#4FC3F7]">
              Réseau Deep Space Network (DSN)
            </div>
            <div className="space-y-1.5">
              {DSN_STATIONS.map((st) => (
                <div
                  key={st.id}
                  className="px-3 py-2 rounded bg-[#040812] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-white">{st.name}</span>
                  <span className="telemetry-value text-emerald-400 text-[11px]">EN LIGNE</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mcc-panel p-4 space-y-2 text-xs telemetry-value">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#4FC3F7] mb-1 font-sans">
              Métriques Orbitales
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Régime / Altitude :</span>
              <span className="text-white font-bold">
                {orbit.type} · {orbit.altitudeKm} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inclinaison :</span>
              <span className="text-white font-bold">{orbit.inclinationDeg}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Résolution au sol :</span>
              <span className="text-emerald-300 font-bold">{t.groundResolutionMeters} m/px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Revisite :</span>
              <span className="text-white font-bold">{t.revisitDays} jours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Qualité Liaison :</span>
              <span className={t.commQualityDb >= 0 ? 'text-emerald-300 font-bold' : 'text-red-400 font-bold'}>
                {t.commQualityDb >= 0 ? '+' : ''}
                {t.commQualityDb} dB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Volume collecté :</span>
              <span className="text-[#4FC3F7] font-bold">{mission.opsState.dataCollectedPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
