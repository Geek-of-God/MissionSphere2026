import React, { useState } from 'react';
import { BookOpen, ExternalLink, X } from 'lucide-react';
import { DATA_SOURCES } from '../../../shared/constants/dataSources';
import { useMissionStore } from '../../store/useMissionStore';
import { DataSourceStrip } from '../ui/DataSourceStrip';
import { Header } from './Header';
import { PhaseTimeline } from './PhaseTimeline';
import { RightCopilotDrawer } from './RightCopilotDrawer';
import { TelemetryRibbon } from './TelemetryRibbon';

interface WorkspaceShellProps {
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ children }) => {
  const mission = useMissionStore((s) => s.mission);
  const errorBanner = useMissionStore((s) => s.errorBanner);
  const clearError = useMissionStore((s) => s.clearError);

  const [helpOpen, setHelpOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  if (!mission) return null;

  const isCrisisAlert = Boolean(mission.activeCrisis);

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col bg-[#040812] text-slate-100 transition-colors duration-300 ${
        isCrisisAlert ? 'ring-2 ring-inset ring-red-500/80' : ''
      }`}
    >
      {/* TOP HEADER (52px) */}
      <Header
        onOpenHelp={() => setHelpOpen(true)}
        onToggleTimeline={() => {
          setCopilotOpen(false);
          setTimelineOpen((v) => !v);
        }}
        onToggleCopilot={() => {
          setTimelineOpen(false);
          setCopilotOpen((v) => !v);
        }}
        timelineOpen={timelineOpen}
        copilotOpen={copilotOpen}
      />

      {/* TELEMETRY RIBBON (64px) */}
      <TelemetryRibbon />

      {/* Error Notification Bar */}
      {errorBanner && (
        <div className="bg-red-950/90 border-b border-red-500/60 px-4 py-2 flex items-center justify-between text-xs text-red-100 shrink-0">
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={clearError}
            className="p-0.5 hover:text-white cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN WORKSPACE (220px left / fluid center / 320px right) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <PhaseTimeline mobileOpen={timelineOpen} onClose={() => setTimelineOpen(false)} />
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#040812] p-4 xl:p-5 relative flex flex-col justify-between">
          <div>{children}</div>
          <DataSourceStrip phase={mission.currentPhase} />
        </main>
        <RightCopilotDrawer mobileOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
      </div>

      {/* HELP & NASA DATA SOURCES MODAL */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="mcc-panel max-w-2xl w-full p-5 space-y-4 bg-[#0B162C] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#4FC3F7]/20 pb-2">
              <h3 className="font-display text-base font-bold text-white">
                Guide Rapide & Sources NASA — Mission Design Lab
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-4 pr-1">
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-[#4FC3F7]">7 Ressources Couplées :</strong> Chaque composant modifie en direct le Budget, la Masse, la Puissance, le Débit Data, le Bilan de Liaison, la Durée de vie et le Risque.
                </li>
                <li>
                  <strong className="text-emerald-400">Pings Rapides :</strong> Cliquez sur n&apos;importe quelle jauge du bandeau supérieur pour alerter le collègue responsable dans le chat.
                </li>
                <li>
                  <strong className="text-amber-400">Revue MRR (Phase 9) :</strong> Aucun voyant Rouge n&apos;est toléré pour décoller. Utilisez la timeline à gauche pour revenir ajuster les Phases 5 à 8 si nécessaire.
                </li>
              </ul>

              <div className="pt-3 border-t border-[#4FC3F7]/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4FC3F7]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Référentiels & Sources de Données Utilisées (Phases 1 à 15)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DATA_SOURCES.map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded border border-slate-800 bg-[#040812]/80 hover:border-[#4FC3F7]/60 transition-colors flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-snug">{src.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#4FC3F7] shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{src.descriptionFr}</p>
                      <div className="text-[10px] telemetry-value text-[#4FC3F7]/90">
                        {src.organization} · Phases {src.phases.join(', ')}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
