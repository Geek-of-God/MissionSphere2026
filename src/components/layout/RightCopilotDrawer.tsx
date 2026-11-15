import React, { useState } from 'react';
import { Bot, MessageSquare, Radio, Send, Sparkles, X } from 'lucide-react';
import { ROLE_META } from '../../../shared/constants/physicsConstants';
import { PlayerRole } from '../../../shared/types/mission.types';
import { useMissionStore } from '../../store/useMissionStore';
import { UI_COPY } from '../../utils/i18n';

interface RightCopilotDrawerProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const RightCopilotDrawer: React.FC<RightCopilotDrawerProps> = ({
  mobileOpen = false,
  onClose,
}) => {
  const mission = useMissionStore((s) => s.mission);
  const language = useMissionStore((s) => s.language);
  const isExplaining = useMissionStore((s) => s.isExplainingMentor);
  const askSpaceMentor = useMissionStore((s) => s.askSpaceMentor);
  const sendChat = useMissionStore((s) => s.sendChat);

  const [mentorQuestion, setMentorQuestion] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');

  if (!mission) return null;
  const copy = UI_COPY[language];

  const latestMentor = mission.mentorFeed[0];
  const filteredChat =
    roleFilter === 'ALL'
      ? mission.chatMessages
      : mission.chatMessages.filter((m) => m.role === roleFilter);

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorQuestion.trim() || isExplaining) return;
    const q = mentorQuestion.trim();
    setMentorQuestion('');
    await askSpaceMentor(q);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChat(chatInput, false);
    setChatInput('');
  };

  const drawerContent = (
    <aside className="w-[320px] shrink-0 h-full bg-[#060C1B] border-l border-[#4FC3F7]/20 flex flex-col overflow-hidden">
      {/* TOP HALF: SPACE MENTOR (IA) */}
      <div className="flex-1 min-h-0 flex flex-col border-b border-[#4FC3F7]/20 p-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#4FC3F7]/15">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0B3D91] border border-[#4FC3F7]/60 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#4FC3F7]" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-white">
                {copy.spaceMentor}
              </div>
              <div className="text-[10px] text-[#4FC3F7]/80">Copilote Socratique MDL</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px] h-4" aria-hidden="true">
              {[0.4, 0.9, 0.6, 1.0, 0.5].map((h, idx) => (
                <span
                  key={idx}
                  className={`w-[2px] rounded-full bg-[#4FC3F7] transition-all ${
                    isExplaining ? 'animate-bounce' : ''
                  }`}
                  style={{ height: `${Math.round(h * 14)}px` }}
                />
              ))}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
                aria-label="Fermer le tiroir copilote"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advice feed */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
          {latestMentor && (
            <div
              className={`p-2.5 rounded border text-xs leading-relaxed ${
                latestMentor.severity === 'CRITICAL'
                  ? 'border-red-500/60 bg-red-950/35 text-red-100'
                  : latestMentor.severity === 'WARNING'
                  ? 'border-amber-500/50 bg-amber-950/30 text-amber-100'
                  : 'border-[#4FC3F7]/30 bg-[#0B162C] text-slate-200'
              }`}
            >
              <div className="font-semibold text-[11px] uppercase tracking-wide mb-1 text-[#4FC3F7]">
                {latestMentor.title}
              </div>
              <p className="text-slate-200">{latestMentor.explanation}</p>
              <p className="mt-1.5 text-[11px] text-cyan-200/90 italic">
                {latestMentor.tradeOffTip}
              </p>
            </div>
          )}

          {mission.mentorFeed.slice(1, 4).map((msg) => (
            <div
              key={msg.id}
              className="p-2 rounded border border-slate-800 bg-[#081022] text-[11px] text-slate-400"
            >
              <div className="font-semibold text-slate-300">{msg.title}</div>
              <div className="mt-0.5 line-clamp-2">{msg.explanation}</div>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-1.5">
          <button
            type="button"
            disabled={isExplaining}
            onClick={() => askSpaceMentor()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded border border-[#4FC3F7]/40 bg-[#0B3D91]/50 hover:bg-[#0B3D91] text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4FC3F7]" />
            <span>{isExplaining ? 'Analyse en cours...' : copy.explainTradeOff}</span>
          </button>

          <form onSubmit={handleMentorSubmit} className="flex gap-1">
            <input
              type="text"
              value={mentorQuestion}
              onChange={(e) => setMentorQuestion(e.target.value)}
              placeholder="Question à Space Mentor..."
              className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded bg-[#040812] border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#4FC3F7]"
            />
            <button
              type="submit"
              disabled={isExplaining}
              className="px-2 py-1 rounded bg-[#112240] border border-[#4FC3F7]/30 text-[#4FC3F7] hover:bg-[#0B3D91] cursor-pointer"
              aria-label="Poser une question"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM HALF: TEAM COMMS & PINGS */}
      <div className="h-[44%] min-h-[210px] flex flex-col p-3">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#4FC3F7]/15">
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-200">
            <MessageSquare className="w-3.5 h-3.5 text-[#4FC3F7]" />
            {copy.teamComms}
          </span>
        </div>

        <div className="flex items-center gap-1 py-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-[#4FC3F7]/20 text-[#4FC3F7]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            TOUS
          </button>
          {(['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'] as PlayerRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                roleFilter === r ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={{ color: roleFilter === r ? ROLE_META[r].color : undefined }}
            >
              {ROLE_META[r].shortTag}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 py-1 pr-1">
          {filteredChat.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic py-4 text-center">
              Cliquez sur une jauge en haut pour envoyer un Ping ciblé ou discutez ici.
            </div>
          ) : (
            filteredChat.map((msg) => (
              <div
                key={msg.id}
                className={`px-2 py-1.5 rounded text-[11px] border ${
                  msg.isPing
                    ? 'border-amber-500/45 bg-amber-950/30 text-amber-100'
                    : 'border-slate-800/80 bg-[#0B162C]/70 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="font-bold text-[10px]"
                    style={{ color: ROLE_META[msg.role]?.color || '#4FC3F7' }}
                  >
                    [{ROLE_META[msg.role]?.shortTag || msg.role}] {msg.sender}
                  </span>
                  {msg.isPing && <Radio className="w-3 h-3 text-amber-400 shrink-0" />}
                </div>
                <div className="mt-0.5 break-words">{msg.text}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 py-1">
          <button
            type="button"
            onClick={() => sendChat('Ping Masse : vérifions la compatibilité lanceur.', true)}
            className="flex-1 py-1 px-1.5 rounded border border-emerald-500/30 bg-emerald-950/25 text-[10px] text-emerald-300 hover:bg-emerald-900/40 cursor-pointer truncate"
          >
            Ping Masse
          </button>
          <button
            type="button"
            onClick={() => sendChat('Ping Énergie : vérifions les éclipses !', true)}
            className="flex-1 py-1 px-1.5 rounded border border-amber-500/30 bg-amber-950/25 text-[10px] text-amber-300 hover:bg-amber-900/40 cursor-pointer truncate"
          >
            Ping Énergie
          </button>
        </div>

        <form onSubmit={handleChatSubmit} className="flex gap-1 pt-1">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message équipe..."
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded bg-[#040812] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#4FC3F7]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded bg-[#0B3D91] border border-[#4FC3F7]/40 text-white hover:bg-[#1455C0] text-xs font-semibold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop persistent 320px drawer */}
      <div className="hidden lg:flex h-full shrink-0">{drawerContent}</div>

      {/* Tablet / mobile slide-over */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
          <div className="flex-1 bg-black/65" onClick={onClose} />
          <div className="relative z-10 h-full shadow-2xl">{drawerContent}</div>
        </div>
      )}
    </>
  );
};
