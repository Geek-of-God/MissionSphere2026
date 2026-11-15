import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Award, ChevronDown, Compass, ExternalLink, Layers, Lock, Map, Orbit, Play, Shield, Users, Volume2, VolumeX, X } from 'lucide-react';
import { NASA_MISSIONS } from '../../shared/constants/nasaMissions';
import { ROLE_META } from '../../shared/constants/physicsConstants';
import { HomeEarthCanvas } from '../components/three/HomeEarthCanvas';
import { MissionRoadmap } from '../components/ui/MissionRoadmap';
import { useMissionStore } from '../store/useMissionStore';
import { UI_COPY } from '../utils/i18n';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const language = useMissionStore((s) => s.language);
  const muted = useMissionStore((s) => s.muted);
  const unlockedBadges = useMissionStore((s) => s.unlockedBadges);
  const errorBanner = useMissionStore((s) => s.errorBanner);
  const setLanguage = useMissionStore((s) => s.setLanguage);
  const toggleMute = useMissionStore((s) => s.toggleMute);
  const clearError = useMissionStore((s) => s.clearError);
  const loadBadges = useMissionStore((s) => s.loadBadges);
  const startSoloMission = useMissionStore((s) => s.startSoloMission);
  const createMultiRoom = useMissionStore((s) => s.createMultiRoom);
  const joinMultiRoom = useMissionStore((s) => s.joinMultiRoom);

  const [username, setUsername] = useState('Commander');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  const copy = UI_COPY[language];

  useEffect(() => {
    loadBadges();
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setJoinCode(roomParam.toUpperCase());
    }
  }, [loadBadges, searchParams]);

  const handleSolo = async (demo = false) => {
    setBusy(true);
    const roomId = await startSoloMission(username, demo);
    setBusy(false);
    if (roomId) {
      navigate(`/mission/${roomId}`);
    }
  };

  const handleCreateMulti = async () => {
    setBusy(true);
    const roomId = await createMultiRoom(username);
    setBusy(false);
    if (roomId) {
      navigate(`/lobby/${roomId}`);
    }
  };

  const handleJoinMulti = async (e: React.FormEvent) => {
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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#040812] text-white flex flex-col justify-between">
      <HomeEarthCanvas />

      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-[#4FC3F7]/15 bg-[#040812]/65">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-[0.2em] text-[#4FC3F7] uppercase whitespace-nowrap">
            NASA SPACE APPS EDITION
          </span>
          <nav className="hidden sm:flex items-center gap-3 text-xs">
            <Link to="/" className="text-white font-semibold hover:text-[#4FC3F7] transition-colors">
              Accueil
            </Link>
            <span
              className="inline-flex items-center gap-1 text-slate-600 cursor-not-allowed select-none"
              title={
                language === 'FR'
                  ? 'Mode multijoueur bientôt disponible en ligne'
                  : 'Multiplayer mode coming soon online'
              }
            >
              <Lock className="w-3 h-3" />
              <span>
                {language === 'FR' ? 'Lobby Multijoueur (Bientôt)' : 'Multiplayer Lobby (Soon)'}
              </span>
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowCollection(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#4FC3F7]/30 bg-[#0B162C]/85 hover:border-[#4FC3F7] text-xs font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>
              {copy.collectionBtn} ({unlockedBadges.length}/{NASA_MISSIONS.length})
            </span>
          </button>

          <div className="flex items-center rounded border border-[#4FC3F7]/30 bg-[#0B162C]/85 p-0.5">
            {(['FR', 'EN'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                  language === l ? 'bg-[#0B3D91] text-[#4FC3F7]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded border border-[#4FC3F7]/30 bg-[#0B162C]/85 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Audio"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#4FC3F7]" />}
          </button>
        </div>
      </header>

      {/* Main Hero & Mode Selection */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center max-w-2xl mb-7">
          <div className="mx-auto w-14 h-14 rounded-lg bg-[#0B3D91]/80 border border-[#4FC3F7]/60 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(79,195,247,0.25)]">
            <Orbit className="w-8 h-8 text-[#4FC3F7]" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[0.18em] text-white">
            MISSIONSPHERE
          </h1>
          <p className="mt-2.5 text-sm sm:text-base font-medium tracking-wide text-[#4FC3F7]">
            {copy.slogan}
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() =>
                document.getElementById('mission-roadmap')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-[#4FC3F7]/40 bg-[#0B162C]/85 hover:border-[#4FC3F7] text-xs font-semibold text-[#4FC3F7] hover:text-white transition-colors cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              <span>
                {language === 'FR'
                  ? 'Voir la roadmap des 15 phases avant de lancer'
                  : 'View 15-phase roadmap before launch'}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Operator callsign */}
        <div className="w-full max-w-xs mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
            {copy.usernameLabel}
          </label>
          <input
            type="text"
            value={username}
            maxLength={24}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3.5 py-2 rounded bg-[#0B162C]/90 border border-[#4FC3F7]/30 text-center text-sm font-semibold text-white focus:outline-none focus:border-[#4FC3F7]"
          />
        </div>

        {errorBanner && (
          <div className="mb-5 max-w-xl w-full px-4 py-2.5 rounded border border-red-500/60 bg-red-950/80 text-xs text-red-100 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button type="button" onClick={clearError} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Two Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {/* SOLO CARD */}
          <div className="mcc-panel-glass p-6 flex flex-col justify-between transition-all hover:border-[#4FC3F7]/70">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold tracking-wider text-white">
                  {copy.soloTitle}
                </h2>
                <Compass className="w-5 h-5 text-[#4FC3F7]" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {copy.soloDesc}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSolo(false)}
                className="w-full py-3 px-5 rounded bg-[#0B3D91] hover:bg-[#1455C0] border border-[#4FC3F7]/70 text-white font-display text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-[#4FC3F7]" />
                <span>{copy.soloBtn}</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleSolo(true)}
                className="w-full py-2 px-4 rounded border border-slate-700 bg-[#081022]/80 hover:border-[#4FC3F7]/50 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copy.demoPreset} (Timers accélérés 10s)
              </button>
            </div>
          </div>

          {/* COLLABORATIVE CARD (GRAYED OUT / COMING SOON) */}
          <div
            aria-disabled="true"
            className="mcc-panel-glass p-6 flex flex-col justify-between border-slate-800 bg-[#070D1D]/70 opacity-50 grayscale select-none cursor-not-allowed"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold tracking-wider text-slate-300">
                    {copy.multiTitle}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-700 bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <Lock className="w-2.5 h-2.5" />
                    {language === 'FR' ? 'Bientôt disponible' : 'Coming soon'}
                  </span>
                </div>
                <Users className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {copy.multiDesc}
              </p>

              {/* 4 Roles preview strip */}
              <div className="grid grid-cols-4 gap-1.5 mb-5">
                {(['MANAGER', 'SCIENCE', 'SYSTEMS', 'OPERATIONS'] as const).map((r) => (
                  <div
                    key={r}
                    className="px-2 py-1.5 rounded bg-[#040812]/80 border border-slate-800 text-center"
                  >
                    <div
                      className="text-[10px] font-bold telemetry-value"
                      style={{ color: ROLE_META[r].color }}
                    >
                      {ROLE_META[r].shortTag}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-display text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>{copy.createRoom}</span>
              </button>

              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  disabled
                  placeholder={copy.roomPlaceholder}
                  maxLength={8}
                  className="flex-1 min-w-0 px-3 py-2 rounded bg-[#040812]/60 border border-slate-800 text-xs telemetry-value uppercase text-slate-500 placeholder:text-slate-600 cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled
                  className="px-4 py-2 rounded border border-slate-800 bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-not-allowed"
                >
                  {copy.joinRoom}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Pre-launch 15-Phase Roadmap */}
        <MissionRoadmap language={language} />
      </main>

      {/* Footer attribution with official NASA source links */}
      <footer className="relative z-10 py-3 px-6 text-center text-xs text-slate-400 border-t border-[#4FC3F7]/10 bg-[#040812]/70 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Sources & méthodologies NASA :</span>
        {[
          { label: 'CML / Systems Engineering', url: 'https://www.nasa.gov/reference/systems-engineering-handbook/' },
          { label: 'Mission Design Lab (Team X)', url: 'https://www.jpl.nasa.gov/site/teamx/' },
          { label: 'GMAT', url: 'https://opensource.gsfc.nasa.gov/projects/GMAT/' },
          { label: 'Mission Viz / DSN', url: 'https://eyes.nasa.gov/apps/dsn-now/dsn.html' },
          { label: 'CubeSat 101 & SST SoA', url: 'https://www.nasa.gov/smallsat-institute/sst-soa/' },
        ].map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx > 0 && <span className="text-slate-600">·</span>}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-[#4FC3F7] font-medium transition-colors"
            >
              <span>{item.label}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </React.Fragment>
        ))}
      </footer>

      {/* NASA Heritage Collection Modal */}
      {showCollection && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="mcc-panel max-w-3xl w-full bg-[#0B162C] p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#4FC3F7]/20">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FACC15]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Collection Historique NASA Heritage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollection(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pt-4">
              {NASA_MISSIONS.map((nm) => {
                const unlocked = unlockedBadges.includes(nm.id);
                return (
                  <div
                    key={nm.id}
                    className={`p-3.5 rounded border ${
                      unlocked
                        ? 'border-[#FACC15]/60 bg-[#112240]'
                        : 'border-slate-800 bg-[#060C1B] opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-white">
                        {nm.name} ({nm.launchYear})
                      </span>
                      <span className="text-[11px] font-semibold text-[#4FC3F7]">
                        {unlocked ? nm.badgeTitle : 'Verrouillé'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {unlocked
                        ? nm.summary
                        : 'Complétez une mission correspondante jusqu\'à la Phase 15 pour débloquer cette fiche.'}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <a
                        href={nm.nasaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4FC3F7] hover:text-white transition-colors"
                      >
                        <span>Fiche officielle NASA ({nm.name})</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
