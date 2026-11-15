import React from 'react';
import {
  Bot,
  HelpCircle,
  ListChecks,
  LogOut,
  Orbit,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PHASE_META, ROLE_META } from '../../../shared/constants/physicsConstants';
import { PlayerRole } from '../../../shared/types/mission.types';
import { useMissionStore } from '../../store/useMissionStore';

interface HeaderProps {
  onOpenHelp: () => void;
  onToggleTimeline?: () => void;
  onToggleCopilot?: () => void;
  timelineOpen?: boolean;
  copilotOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHelp,
  onToggleTimeline,
  onToggleCopilot,
  timelineOpen = false,
  copilotOpen = false,
}) => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const muted = useMissionStore((s) => s.muted);
  const isOfflineMode = useMissionStore((s) => s.isOfflineMode);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const soloActiveRole = useMissionStore((s) => s.soloActiveRole);
  const toggleMute = useMissionStore((s) => s.toggleMute);
  const setSoloActiveRole = useMissionStore((s) => s.setSoloActiveRole);
  const leaveMission = useMissionStore((s) => s.leaveMission);

  if (!mission) return null;

  const phaseInfo = PHASE_META.find((p) => p.phase === mission.currentPhase) || PHASE_META[0];
  const me = mission.players.find((p) => p.id === myPlayerId) || mission.players[0];
  const displayedRole: PlayerRole =
    mission.mode === 'SOLO' ? soloActiveRole : me?.role || 'MANAGER';
  const roleMeta = ROLE_META[displayedRole];

  return (
    <header className="h-[52px] shrink-0 px-3 lg:px-4 bg-[#060C1B] border-b border-[#4FC3F7]/25 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Tablet/mobile timeline toggle */}
        {onToggleTimeline && (
          <button
            type="button"
            onClick={onToggleTimeline}
            aria-label="Afficher la timeline CML"
            className={`lg:hidden p-1.5 rounded border text-xs cursor-pointer shrink-0 ${
              timelineOpen
                ? 'border-[#4FC3F7] bg-[#0B3D91] text-[#4FC3F7]'
                : 'border-slate-700 bg-[#0B162C] text-slate-300'
            }`}
          >
            <ListChecks className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded bg-[#0B3D91] border border-[#4FC3F7]/60 flex items-center justify-center">
            <Orbit className="w-4 h-4 text-[#4FC3F7]" />
          </div>
          <span className="font-display font-bold tracking-wider text-xs sm:text-sm text-white whitespace-nowrap hidden sm:inline">
            MISSIONSPHERE
          </span>
        </div>

        <span className="text-slate-600 hidden sm:inline">|</span>

        <div className="flex items-center gap-2 min-w-0">
          <span className="telemetry-value text-xs font-bold text-[#4FC3F7] whitespace-nowrap">
            PHASE {mission.currentPhase}/15
          </span>
          <span className="text-xs font-semibold text-white truncate">
            {language === 'FR' ? phaseInfo.titleFr : phaseInfo.titleEn}
          </span>
          <span className="telemetry-value text-[10px] px-1.5 py-0.5 rounded bg-[#0B3D91]/70 border border-[#4FC3F7]/40 text-cyan-200 whitespace-nowrap shrink-0">
            CML-{mission.cmlLevel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {mission.mode === 'SOLO' ? (
          <div className="hidden md:flex items-center gap-1 bg-[#040812] p-0.5 rounded border border-slate-800">
            {(['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'] as PlayerRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSoloActiveRole(r)}
                className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  soloActiveRole === r ? 'bg-[#112240]' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ color: ROLE_META[r].color }}
              >
                {ROLE_META[r].shortTag}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="hidden sm:block px-2.5 py-1 rounded border text-[11px] font-bold whitespace-nowrap"
            style={{
              borderColor: `${roleMeta.color}66`,
              color: roleMeta.color,
              backgroundColor: `${roleMeta.color}15`,
            }}
          >
            {language === 'FR' ? roleMeta.labelFr : roleMeta.labelEn}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-[11px] telemetry-value text-slate-400 px-2 py-1 rounded bg-[#040812] border border-slate-800">
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300">LOCAL</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>{mission.roomId}</span>
            </>
          )}
        </div>

        {/* Tablet/mobile Space Mentor & Comms toggle */}
        {onToggleCopilot && (
          <button
            type="button"
            onClick={onToggleCopilot}
            aria-label="Afficher Space Mentor & Comms"
            className={`lg:hidden p-1.5 rounded border text-xs cursor-pointer ${
              copilotOpen
                ? 'border-[#4FC3F7] bg-[#0B3D91] text-[#4FC3F7]'
                : 'border-slate-700 bg-[#0B162C] text-[#4FC3F7]'
            }`}
          >
            <Bot className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded border border-slate-700 bg-[#0B162C] hover:border-[#4FC3F7]/60 text-slate-300 cursor-pointer"
          title={muted ? 'Activer le son' : 'Couper le son'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-slate-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#4FC3F7]" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          className="p-1.5 rounded border border-slate-700 bg-[#0B162C] hover:border-[#4FC3F7]/60 text-slate-300 cursor-pointer"
          title="Aide Mission Control"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={leaveMission}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-red-500/40 bg-red-950/30 hover:bg-red-900/50 text-xs font-semibold text-red-200 cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quitter</span>
        </button>
      </div>
    </header>
  );
};
