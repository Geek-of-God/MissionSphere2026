import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Layers, Rocket, Sparkles, Users, X } from 'lucide-react';
import { ROLE_META } from '../../shared/constants/physicsConstants';
import {
  DifficultyLevel,
  MissionModifier,
  PlayerRole,
} from '../../shared/types/mission.types';
import { useMissionStore } from '../store/useMissionStore';
import { UI_COPY } from '../utils/i18n';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { roomId: paramRoomId } = useParams<{ roomId?: string }>();

  const mission = useMissionStore((s) => s.mission);
  const myPlayerId = useMissionStore((s) => s.myPlayerId);
  const language = useMissionStore((s) => s.language);
  const errorBanner = useMissionStore((s) => s.errorBanner);
  const clearError = useMissionStore((s) => s.clearError);
  const createMultiRoom = useMissionStore((s) => s.createMultiRoom);
  const joinMultiRoom = useMissionStore((s) => s.joinMultiRoom);
  const selectRole = useMissionStore((s) => s.selectRole);
  const toggleReady = useMissionStore((s) => s.toggleReady);
  const updateOptions = useMissionStore((s) => s.updateOptions);
  const applyDemoPreset = useMissionStore((s) => s.applyDemoPreset);
  const startMissionFromLobby = useMissionStore((s) => s.startMissionFromLobby);
  const leaveMission = useMissionStore((s) => s.leaveMission);

  const [username, setUsername] = useState('Commander');
  const [joinCode, setJoinCode] = useState(paramRoomId?.toUpperCase() || '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = UI_COPY[language];

  useEffect(() => {
    if (paramRoomId) {
      setJoinCode(paramRoomId.toUpperCase());
    }
  }, [paramRoomId]);

  const handleBackHome = () => {
    leaveMission();
    navigate('/');
  };

  const handleCreateRoom = async () => {
    setBusy(true);
    const createdId = await createMultiRoom(username);
    setBusy(false);
    if (createdId) {
      navigate(`/lobby/${createdId}`);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    const ok = await joinMultiRoom(clean, username);
    setBusy(false);
    if (ok) {
      navigate(`/lobby/${clean}`);
    }
  };

  // If user navigated directly to /lobby or /lobby/:roomId without an active room session,
  // provide the Create / Join room gateway directly inside Lobby.tsx
  if (!mission) {
    return (
      <div className="min-h-screen w-full bg-[#040812] text-white flex flex-col">
        <header className="px-6 py-4 border-b border-[#4FC3F7]/20 bg-[#060C1B] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 hover:border-[#4FC3F7] text-xs font-semibold text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{copy.back}</span>
          </button>
          <h1 className="font-display text-base sm:text-lg font-bold tracking-wider">
            {copy.lobbyTitle}
          </h1>
          <div className="w-20" />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="mcc-panel max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#4FC3F7]/20 pb-3">
              <Users className="w-5 h-5 text-[#4FC3F7]" />
              <h2 className="font-display text-base font-bold text-white">
                Créer ou Rejoindre une Salle MDL
              </h2>
            </div>

            {errorBanner && (
              <div className="px-3 py-2 rounded border border-red-500/60 bg-red-950/80 text-xs text-red-100 flex items-center justify-between">
                <span>{errorBanner}</span>
                <button type="button" onClick={clearError} className="cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {copy.usernameLabel}
              </label>
              <input
                type="text"
                value={username}
                maxLength={24}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#040812] border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-[#4FC3F7]"
              />
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handleCreateRoom}
              className="w-full py-2.5 px-5 rounded bg-[#0B3D91] hover:bg-[#1455C0] border border-[#4FC3F7]/70 text-white font-display text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-4 h-4 text-[#4FC3F7]" />
              <span>{copy.createRoom}</span>
            </button>

            <form onSubmit={handleJoinRoom} className="pt-3 border-t border-white/10 space-y-2.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rejoindre avec un code d&apos;accès
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={copy.roomPlaceholder}
                  maxLength={8}
                  className="flex-1 px-3 py-2 rounded bg-[#040812] border border-slate-700 text-xs telemetry-value uppercase text-white focus:outline-none focus:border-[#4FC3F7]"
                />
                <button
                  type="submit"
                  disabled={busy || !joinCode.trim()}
                  className="px-4 py-2 rounded border border-[#4FC3F7]/50 bg-[#112240] hover:bg-[#0B3D91] text-xs font-bold text-white uppercase tracking-wider cursor-pointer disabled:opacity-45"
                >
                  {copy.joinRoom}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const me = mission.players.find((p) => p.id === myPlayerId);
  const isHost = !mission.hostId || myPlayerId === mission.hostId;
  const connectedPlayers = mission.players.filter((p) => p.isConnected);
  const readyCount = connectedPlayers.filter((p) => p.isReady && p.role !== null).length;
  const allReady = connectedPlayers.length > 0 && readyCount === connectedPlayers.length;
  const canLaunch = mission.mode === 'SOLO' || (isHost && allReady);
  const roles: PlayerRole[] = ['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'];

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}/lobby/${mission.roomId}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#040812] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[#4FC3F7]/20 bg-[#060C1B] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 hover:border-[#4FC3F7] text-xs font-semibold text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{copy.back}</span>
          </button>
          <h1 className="font-display text-base sm:text-lg font-bold tracking-wider">
            {copy.lobbyTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded bg-[#0B162C] border border-[#4FC3F7]/40 text-xs">
            <span className="text-slate-400 mr-2">{copy.accessCode} :</span>
            <span className="telemetry-value font-bold text-[#4FC3F7] tracking-widest">
              {mission.roomId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0B3D91] hover:bg-[#1455C0] border border-[#4FC3F7]/50 text-xs font-semibold cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? copy.copied : copy.copyLink}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs font-bold tracking-wider uppercase text-[#4FC3F7] mb-4">
            {copy.chooseRole}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role, idx) => {
              const meta = ROLE_META[role];
              const occupant = mission.players.find((p) => p.isConnected && p.role === role);
              const isMine = occupant?.id === myPlayerId;
              const isTaken = Boolean(occupant && !isMine);

              return (
                <div
                  key={role}
                  className={`rounded-md border p-4 flex flex-col justify-between transition-all ${
                    occupant
                      ? 'bg-[#0B3D91]/75 border-[#4FC3F7]/70 shadow-[0_0_20px_rgba(11,61,145,0.45)]'
                      : 'bg-[#0B162C]/80 border-[#4FC3F7]/20 hover:border-[#4FC3F7]/55'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="telemetry-value text-xs font-bold"
                        style={{ color: meta.color }}
                      >
                        0{idx + 1}. {meta.shortTag}
                      </span>
                      {occupant?.isReady && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          READY
                        </span>
                      )}
                    </div>

                    <h2 className="font-display text-base font-bold text-white mb-1">
                      {language === 'FR' ? meta.labelFr : meta.labelEn}
                    </h2>

                    <div className="text-xs mb-4 pb-2 border-b border-white/10 flex items-center justify-between gap-2">
                      {occupant ? (
                        <span className="text-cyan-200 font-semibold truncate">
                          {occupant.username} {isMine ? '(Vous)' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">Poste libre</span>
                      )}
                      {occupant && occupant.id === mission.hostId && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0B3D91] border border-[#4FC3F7]/50 text-[#FACC15] shrink-0">
                          HÔTE
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-200 mb-5">
                      {(language === 'FR' ? meta.dutiesFr : meta.dutiesEn).map((d) => (
                        <li key={d} className="flex items-start gap-1.5">
                          <span className="text-[#4FC3F7]">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isMine ? (
                    <button
                      type="button"
                      onClick={toggleReady}
                      className={`w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                        me?.isReady
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-[#040812]/80 border-[#4FC3F7]/60 text-[#4FC3F7] hover:bg-[#0B162C]'
                      }`}
                    >
                      {me?.isReady ? `${copy.ready} ✓` : copy.notReady}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isTaken}
                      onClick={() => selectRole(role)}
                      className="w-full py-2 px-3 rounded text-xs font-bold uppercase tracking-wider border border-[#4FC3F7]/40 bg-[#060C1B] hover:bg-[#0B3D91] text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isTaken ? copy.occupied : copy.pickRole}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Options & Launch Bar */}
        <div className="mcc-panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">{copy.difficulty} :</span>
              <select
                value={mission.difficulty}
                onChange={(e) => updateOptions({ difficulty: e.target.value as DifficultyLevel })}
                className="px-2.5 py-1.5 rounded bg-[#040812] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#4FC3F7]"
              >
                <option value="STANDARD">Standard</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">{copy.modifier} :</span>
              <select
                value={mission.modifier}
                onChange={(e) => updateOptions({ modifier: e.target.value as MissionModifier })}
                className="px-2.5 py-1.5 rounded bg-[#040812] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#4FC3F7]"
              >
                <option value="NONE">Aucun</option>
                <option value="BUDGET_CRISIS">Crise Budgétaire (-30%)</option>
                <option value="SOLAR_STORM_GUARANTEED">Tempête Solaire Majeure</option>
                <option value="CUBESAT_ONLY">Mode CubeSat Uniquement</option>
              </select>
            </div>

            <button
              type="button"
              onClick={applyDemoPreset}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer ${
                mission.demoMode
                  ? 'border-[#FACC15] bg-amber-950/40 text-[#FACC15]'
                  : 'border-slate-700 bg-[#040812] text-slate-300 hover:border-[#4FC3F7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{copy.demoPreset}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {mission.mode === 'MULTI' && (
              <span className="text-xs telemetry-value text-slate-300">
                Équipe prête :{' '}
                <strong className={allReady ? 'text-emerald-400' : 'text-amber-300'}>
                  {readyCount}/{connectedPlayers.length}
                </strong>
                {!isHost ? ' · En attente de l\'hôte' : !allReady ? ' · Tous doivent cliquer PRÊT' : ''}
              </span>
            )}
            <button
              type="button"
              disabled={!canLaunch}
              onClick={startMissionFromLobby}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-display text-xs font-bold tracking-wider uppercase cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Rocket className="w-4 h-4" />
              <span>{copy.launchBriefing}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
