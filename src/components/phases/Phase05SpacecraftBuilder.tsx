import React, { useState } from 'react';
import { ArrowRight, Battery, Cpu, Layers, Lock, Radio, Sun } from 'lucide-react';
import { CATALOG } from '../../../shared/constants/catalogData';
import { ItemCategory } from '../../../shared/types/catalog.types';
import { useMissionStore } from '../../store/useMissionStore';
import { GoSwitch } from '../ui/GoSwitch';

const TABS: Array<{ cat: ItemCategory; label: string; field: 'busId' | 'solarPanelId' | 'batteryId' | 'antennaId' | 'obcId'; icon: React.ReactNode }> = [
  { cat: 'BUS', label: 'Châssis (Bus)', field: 'busId', icon: <Layers className="w-3.5 h-3.5" /> },
  { cat: 'SOLAR', label: 'Panneaux Solaires', field: 'solarPanelId', icon: <Sun className="w-3.5 h-3.5" /> },
  { cat: 'BATTERY', label: 'Batteries', field: 'batteryId', icon: <Battery className="w-3.5 h-3.5" /> },
  { cat: 'ANTENNA', label: 'Télécoms', field: 'antennaId', icon: <Radio className="w-3.5 h-3.5" /> },
  { cat: 'OBC', label: 'Avionique / ADCS', field: 'obcId', icon: <Cpu className="w-3.5 h-3.5" /> },
];

export const Phase05SpacecraftBuilder: React.FC = () => {
  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const updateDesign = useMissionStore((s) => s.updateDesign);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  const [activeTab, setActiveTab] = useState<ItemCategory>('BUS');

  if (!mission) return null;
  const d = mission.design;
  const t = mission.telemetry;
  const me = mission.players.find((p) => p.id === myPlayerId);
  const myRole = me?.role || '';

  const isTabEditable = (cat: ItemCategory): boolean => {
    if (mission.mode === 'SOLO') return true;
    if (cat === 'BUS' || cat === 'SOLAR' || cat === 'BATTERY') {
      return ['SYSTEMS', 'MANAGER'].includes(myRole);
    }
    if (cat === 'ANTENNA') {
      return ['OPERATIONS', 'SYSTEMS', 'MANAGER'].includes(myRole);
    }
    return true;
  };

  const tabOwnerLabel: Record<string, string> = {
    BUS: 'Systems Engineer',
    SOLAR: 'Systems Engineer',
    BATTERY: 'Systems Engineer',
    ANTENNA: 'Operations Lead / Systems Engineer',
    OBC: 'Équipe ingénierie',
  };

  const canEditTab = isTabEditable(activeTab);

  const currentTab = TABS.find((tb) => tb.cat === activeTab) || TABS[0];
  const items = Object.values(CATALOG).filter((it) => it.category === activeTab);

  const isCubeSat = d.busId === 'bus-cubesat-6u';
  const isHeavyBus = d.busId === 'bus-standard' || d.busId === 'bus-deepspace';
  const isGaAs = d.solarPanelId === 'solar-gaas-2axis';
  const isFixedSolar = d.solarPanelId === 'solar-fixed';
  const isKaOrX = d.antennaId === 'ant-ka-band' || d.antennaId === 'ant-x-band';
  const isRadHard = d.obcId === 'obc-radhard' || d.obcId === 'obc-deepspace';

  // CoG & Thermal indicators
  const cogOffsetPx = d.payloadIds.length > 0 ? 4 : 0;
  const cogStable = t.massTotal < 1100;
  const thermalNominal = t.powerBalance >= 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-white tracking-wide">
            ASSEMBLAGE SATELLITE — VUE ISOMÉTRIQUE 2.5D (CML-3)
          </h2>
          <p className="text-xs text-slate-400">
            Configurez la structure, la génération d&apos;énergie, les batteries, l&apos;antenne et l&apos;avionique.
          </p>
        </div>
        <GoSwitch
          label="VERS CHARGE UTILE (PAYLOAD)"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => advancePhase(6)}
        />
      </div>

      {/* Split Screen 35% Catalogue / 65% Isometric 2.5D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: 35% (5 cols on 12-col grid) SUBSYSTEM CATALOGUE */}
        <div className="lg:col-span-5 mcc-panel p-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1 border-b border-[#4FC3F7]/15 pb-2.5">
            {TABS.map((tb) => {
              const locked = !isTabEditable(tb.cat);
              return (
                <button
                  key={tb.cat}
                  type="button"
                  onClick={() => setActiveTab(tb.cat)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                    activeTab === tb.cat
                      ? 'bg-[#0B3D91] text-[#4FC3F7] border border-[#4FC3F7]/60'
                      : 'bg-[#040812]/70 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {tb.icon}
                  <span>{tb.label}</span>
                  {locked && <Lock className="w-2.5 h-2.5 text-amber-400/80" />}
                </button>
              );
            })}
          </div>

          {!canEditTab && (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-950/35 border border-amber-500/35 text-[11px] text-amber-200">
              <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                Mode Lecture seule — Sous-système géré par : <strong>{tabOwnerLabel[activeTab]}</strong>
              </span>
            </div>
          )}

          <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
            {items.map((item) => {
              const selected = d[currentTab.field] === item.id;
              const disabledByMod =
                mission.modifier === 'CUBESAT_ONLY' &&
                item.category === 'BUS' &&
                item.id !== 'bus-cubesat-6u';

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabledByMod || !canEditTab}
                  onClick={() => updateDesign({ [currentTab.field]: item.id })}
                  className={`w-full text-left p-3 rounded border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-[#0B3D91]/65 border-[#4FC3F7] shadow-[0_0_14px_rgba(79,195,247,0.18)]'
                      : 'bg-[#060C1B] border-slate-800 hover:border-[#4FC3F7]/45'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold text-white">
                      {item.name}
                    </span>
                    <span className="telemetry-value text-xs font-bold text-[#4FC3F7] shrink-0">
                      ${item.cost}M
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] telemetry-value text-slate-300">
                    <span>Masse: {item.mass} kg</span>
                    <span className={item.power >= 0 ? 'text-emerald-400' : 'text-amber-300'}>
                      Énergie: {item.power >= 0 ? `+${item.power}W` : `${item.power}W`}
                    </span>
                    {item.dataRate && <span className="text-cyan-300">Débit: {item.dataRate} Mbps</span>}
                    {item.payloadSlots && <span className="text-slate-200">Slots: {item.payloadSlots}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: 65% (7 cols) 2.5D ISOMETRIC SPACECRAFT BLUEPRINT */}
        <div className="lg:col-span-7 mcc-panel p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#4FC3F7]/15">
            <span className="font-bold tracking-wider text-[#4FC3F7] uppercase">
              SCHÉMA D&apos;INTÉGRATION ISOMÉTRIQUE 2.5D
            </span>
            <span className="telemetry-value text-slate-300">
              {d.busId ? CATALOG[d.busId]?.shortLabel : 'Bus'} ·{' '}
              {d.solarPanelId ? CATALOG[d.solarPanelId]?.shortLabel : 'Solaire'}
            </span>
          </div>

          {/* Blueprint Grid + Isometric SVG */}
          <div className="relative my-2 rounded border border-[#4FC3F7]/15 bg-[#040812] flex items-center justify-center min-h-[330px]">
            <svg
              viewBox="0 0 600 340"
              className="w-full h-full max-h-[360px]"
              role="img"
              aria-label="Assemblage satellite isométrique 2.5D"
            >
              <defs>
                <pattern id="isoGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="rgba(79, 195, 247, 0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              <rect width="600" height="340" fill="url(#isoGrid)" />

              {/* Left Solar Wing */}
              {!isFixedSolar ? (
                <g
                  className="transition-transform duration-500"
                  style={{
                    transform: isGaAs ? 'scale(1.12)' : 'scale(0.95)',
                    transformOrigin: '240px 165px',
                  }}
                >
                  <line x1="255" y1="165" x2="215" y2="185" stroke="#94A3B8" strokeWidth="4" />
                  <polygon
                    points={
                      isGaAs
                        ? '55,195 215,120 230,175 70,250'
                        : '85,190 215,130 228,170 98,230'
                    }
                    fill="#0B3D91"
                    stroke="#4FC3F7"
                    strokeWidth="1.5"
                  />
                  {/* Solar cell grid lines */}
                  <line x1="135" y1="172" x2="150" y2="212" stroke="#4FC3F7" strokeOpacity="0.45" />
                  <line x1="175" y1="152" x2="190" y2="192" stroke="#4FC3F7" strokeOpacity="0.45" />
                  {/* Animated power flow line */}
                  <line
                    x1="160"
                    y1="190"
                    x2="265"
                    y2="165"
                    stroke="#34D399"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="20"
                      to="0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                </g>
              ) : (
                <text x="115" y="170" fill="#64748B" fontSize="11" fontFamily="JetBrains Mono">
                  [Panneaux intégrés au corps]
                </text>
              )}

              {/* Right Solar Wing */}
              {!isFixedSolar && (
                <g
                  className="transition-transform duration-500"
                  style={{
                    transform: isGaAs ? 'scale(1.12)' : 'scale(0.95)',
                    transformOrigin: '360px 165px',
                  }}
                >
                  <line x1="345" y1="165" x2="385" y2="145" stroke="#94A3B8" strokeWidth="4" />
                  <polygon
                    points={
                      isGaAs
                        ? '370,130 530,55 545,110 385,185'
                        : '375,135 505,75 518,115 388,175'
                    }
                    fill="#0B3D91"
                    stroke="#4FC3F7"
                    strokeWidth="1.5"
                  />
                  <line x1="435" y1="108" x2="448" y2="148" stroke="#4FC3F7" strokeOpacity="0.45" />
                  <line
                    x1="440"
                    y1="128"
                    x2="335"
                    y2="165"
                    stroke="#34D399"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="20"
                      to="0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </line>
                </g>
              )}

              {/* Isometric Spacecraft Bus Body */}
              <g
                transform={
                  isCubeSat
                    ? 'translate(300, 175) scale(0.65) translate(-300, -175)'
                    : isHeavyBus
                    ? 'translate(300, 175) scale(1.18) translate(-300, -175)'
                    : ''
                }
              >
                {/* Top face */}
                <polygon
                  points="300,105 360,135 300,165 240,135"
                  fill="#1E3A8A"
                  stroke="#4FC3F7"
                  strokeWidth="1.8"
                />
                {/* Left face */}
                <polygon
                  points="240,135 300,165 300,235 240,205"
                  fill="#0F2557"
                  stroke="#4FC3F7"
                  strokeWidth="1.5"
                />
                {/* Right face */}
                <polygon
                  points="300,165 360,135 360,205 300,235"
                  fill="#163370"
                  stroke="#4FC3F7"
                  strokeWidth="1.5"
                />

                {/* Internal Battery Module */}
                <rect
                  x="252"
                  y="175"
                  width="32"
                  height="18"
                  rx="2"
                  fill="#064E3B"
                  stroke="#34D399"
                  strokeWidth="1.2"
                />
                <text x="268" y="187" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontFamily="JetBrains Mono">
                  BATT
                </text>

                {/* Internal OBC Avionics */}
                <rect
                  x="312"
                  y="172"
                  width="34"
                  height="20"
                  rx="2"
                  fill={isRadHard ? '#312E81' : '#334155'}
                  stroke={isRadHard ? '#FACC15' : '#94A3B8'}
                  strokeWidth="1.2"
                />
                <text x="329" y="185" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono">
                  {isRadHard ? 'RAD-OBC' : 'OBC'}
                </text>

                {/* Top Antenna */}
                {isKaOrX ? (
                  <g>
                    <line x1="300" y1="130" x2="300" y2="95" stroke="#CBD5E1" strokeWidth="3" />
                    <ellipse
                      cx="300"
                      cy="90"
                      rx={d.antennaId === 'ant-ka-band' ? 28 : 20}
                      ry="11"
                      fill="#E2E8F0"
                      stroke="#4FC3F7"
                      strokeWidth="1.5"
                    />
                    <circle cx="300" cy="84" r="3" fill="#4FC3F7" />
                  </g>
                ) : (
                  <g>
                    <line x1="300" y1="130" x2="300" y2="90" stroke="#94A3B8" strokeWidth="2.5" />
                    <circle cx="300" cy="88" r="4" fill="#FB923C" />
                  </g>
                )}

                {/* Nadir Payload Indicator */}
                <rect
                  x="286"
                  y="222"
                  width="28"
                  height="16"
                  rx="3"
                  fill={d.payloadIds.length > 0 ? '#0284C7' : '#1E293B'}
                  stroke="#4FC3F7"
                  strokeWidth="1.2"
                />
                <text x="300" y="233" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="JetBrains Mono">
                  PAY({d.payloadIds.length})
                </text>
              </g>

              {/* Center of Gravity Crosshair */}
              <g transform={`translate(${300 + cogOffsetPx}, 170)`}>
                <circle cx="0" cy="0" r="9" fill="none" stroke="#FACC15" strokeWidth="1.5" />
                <line x1="-13" y1="0" x2="13" y2="0" stroke="#FACC15" strokeWidth="1.2" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="#FACC15" strokeWidth="1.2" />
              </g>

              {/* Callout labels */}
              <text x="20" y="30" fill="#94A3B8" fontSize="10" fontFamily="JetBrains Mono">
                MASSE TOTALE: {t.massTotal} KG | PRODUCTION: +{t.powerGenerated}W | CONSO: -{t.powerConsumed}W
              </text>
            </svg>
          </div>

          {/* Bottom Engineering Status Readout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
            <div className="px-3 py-2 rounded bg-[#060C1B] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Centre de gravité :</span>
              <span className={`font-bold ${cogStable ? 'text-emerald-400' : 'text-amber-400'}`}>
                {cogStable ? 'STABLE' : 'DÉCENTRÉ'}
              </span>
            </div>
            <div className="px-3 py-2 rounded bg-[#060C1B] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Marge thermique :</span>
              <span className={`font-bold ${thermalNominal ? 'text-emerald-400' : 'text-red-400'}`}>
                {thermalNominal ? 'NOMINAL' : 'SURCHAUFFE'}
              </span>
            </div>
            <div className="px-3 py-2 rounded bg-[#060C1B] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Slots Payload :</span>
              <span className="telemetry-value font-bold text-[#4FC3F7]">
                {d.busId ? CATALOG[d.busId]?.payloadSlots || 1 : 1} baies
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
