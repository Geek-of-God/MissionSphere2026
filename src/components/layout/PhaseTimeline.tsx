import React from 'react';
import { Check, ChevronRight, X } from 'lucide-react';
import { PHASE_META } from '../../../shared/constants/physicsConstants';
import { useMissionStore } from '../../store/useMissionStore';

interface PhaseTimelineProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const PhaseTimeline: React.FC<PhaseTimelineProps> = ({
  mobileOpen = false,
  onClose,
}) => {
  const mission = useMissionStore((s) => s.mission);
  const advancePhase = useMissionStore((s) => s.advancePhase);

  if (!mission) return null;

  const acts = [
    { id: 1, title: 'ACTE I · CML 1-2' },
    { id: 2, title: 'ACTE II · CML 3-4' },
    { id: 3, title: 'ACTE III · CML 5-6' },
    { id: 4, title: 'ACTE IV · BILAN' },
  ] as const;

  const content = (
    <aside className="w-[220px] shrink-0 h-full bg-[#060C1B] border-r border-[#4FC3F7]/20 flex flex-col overflow-y-auto py-3 px-2.5 select-none">
      <div className="px-2 pb-2 mb-2 border-b border-[#4FC3F7]/15 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-[#4FC3F7]">
          TIMELINE CML
        </span>
        <div className="flex items-center gap-2">
          <span className="telemetry-value text-[11px] text-slate-300 font-semibold">
            CML-{mission.cmlLevel}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
              aria-label="Fermer la timeline"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {acts.map((act) => {
          const phases = PHASE_META.filter((p) => p.act === act.id);
          return (
            <div key={act.id}>
              <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-slate-500">
                {act.title}
              </div>
              <div className="space-y-0.5">
                {phases.map((p) => {
                  const isActive = mission.currentPhase === p.phase;
                  const isCompleted = mission.currentPhase > p.phase;
                  const canJump =
                    p.phase <= mission.currentPhase &&
                    mission.currentPhase <= 9 &&
                    p.phase !== mission.currentPhase;

                  return (
                    <button
                      key={p.phase}
                      type="button"
                      disabled={!canJump}
                      onClick={() => {
                        if (canJump) {
                          advancePhase(p.phase);
                          onClose?.();
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${
                        isActive
                          ? 'bg-[#0B3D91]/70 text-[#4FC3F7] border border-[#4FC3F7]/60 font-semibold shadow-[0_0_12px_rgba(79,195,247,0.18)]'
                          : isCompleted
                          ? 'text-emerald-300/90 hover:bg-[#112240] cursor-pointer'
                          : 'text-slate-500 cursor-default'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <ChevronRight className="w-3.5 h-3.5 text-[#4FC3F7] shrink-0" />
                        ) : (
                          <span className="w-3.5 text-center telemetry-value text-[10px] text-slate-600 shrink-0">
                            ·
                          </span>
                        )}
                        <span className="truncate">{p.shortLabel}</span>
                      </span>
                      <span className="telemetry-value text-[9px] text-slate-500 shrink-0">
                        C{p.cml}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent 220px sidebar */}
      <div className="hidden lg:flex h-full shrink-0">{content}</div>

      {/* Tablet / mobile slide-over */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="relative z-10 h-full shadow-2xl">{content}</div>
          <div className="flex-1 bg-black/65" onClick={onClose} />
        </div>
      )}
    </>
  );
};
