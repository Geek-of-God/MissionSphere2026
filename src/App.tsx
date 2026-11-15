import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { WorkspaceShell } from './components/layout/WorkspaceShell';
import { Phase01Briefing } from './components/phases/Phase01Briefing';
import { Phase02Requirements } from './components/phases/Phase02Requirements';
import { Phase03MDL } from './components/phases/Phase03MDL';
import { Phase04TradeStudies } from './components/phases/Phase04TradeStudies';
import { Phase05SpacecraftBuilder } from './components/phases/Phase05SpacecraftBuilder';
import { Phase06PayloadDesign } from './components/phases/Phase06PayloadDesign';
import { Phase07OrbitDesign } from './components/phases/Phase07OrbitDesign';
import { Phase08LaunchVehicle } from './components/phases/Phase08LaunchVehicle';
import { Phase09MRR } from './components/phases/Phase09MRR';
import { Phase10Launch } from './components/phases/Phase10Launch';
import { Phase11Operations } from './components/phases/Phase11Operations';
import { Phase12MissionViz } from './components/phases/Phase12MissionViz';
import { SummaryView } from './components/phases/SummaryView';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { getSavedSession, useMissionStore } from './store/useMissionStore';

function renderWorkspacePhase(phase: number) {
  switch (phase) {
    case 1:
      return <Phase01Briefing />;
    case 2:
      return <Phase02Requirements />;
    case 3:
      return <Phase03MDL />;
    case 4:
      return <Phase04TradeStudies />;
    case 5:
      return <Phase05SpacecraftBuilder />;
    case 6:
      return <Phase06PayloadDesign />;
    case 7:
      return <Phase07OrbitDesign />;
    case 8:
      return <Phase08LaunchVehicle />;
    case 9:
      return <Phase09MRR />;
    case 10:
      return <Phase10Launch />;
    case 11:
      return <Phase11Operations />;
    case 12:
      return <Phase12MissionViz />;
    default:
      return <Phase01Briefing />;
  }
}

function MissionRouterSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const screen = useMissionStore((s) => s.screen);
  const mission = useMissionStore((s) => s.mission);
  const initListeners = useMissionStore((s) => s.initListeners);
  const rejoinRoom = useMissionStore((s) => s.rejoinRoom);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    initListeners();
  }, [initListeners]);

  // Attempt automatic session recovery on page reload (F5)
  useEffect(() => {
    if (mission) return;
    const match = location.pathname.match(/^\/(?:lobby|mission)\/([A-Za-z0-9]{4,8})/i);
    const urlRoom = match?.[1]?.toUpperCase();
    const saved = getSavedSession();
    if (urlRoom && saved && saved.roomId.toUpperCase() === urlRoom) {
      setRestoring(true);
      rejoinRoom(urlRoom).finally(() => setRestoring(false));
    }
  }, [mission, location.pathname, rejoinRoom]);

  useEffect(() => {
    if (restoring) return;
    if (!mission) {
      if (location.pathname.startsWith('/mission')) {
        navigate('/', { replace: true });
      }
      return;
    }

    if (screen === 'LOBBY') {
      const target = `/lobby/${mission.roomId}`;
      if (location.pathname !== target) navigate(target, { replace: true });
    } else if (screen === 'WORKSPACE') {
      const target = `/mission/${mission.roomId}`;
      if (location.pathname !== target) navigate(target, { replace: true });
    } else if (screen === 'SUMMARY') {
      const target = `/mission/${mission.roomId}/summary`;
      if (location.pathname !== target) navigate(target, { replace: true });
    } else if (screen === 'HOME' && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [screen, mission, restoring, location.pathname, navigate]);

  if (restoring) {
    return (
      <div className="min-h-screen w-full bg-[#040812] text-[#4FC3F7] flex items-center justify-center text-xs font-display tracking-widest uppercase">
        Reconnexion au Mission Control Center...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/lobby/:roomId" element={<Lobby />} />
      <Route
        path="/mission/:roomId"
        element={
          mission ? (
            <WorkspaceShell>{renderWorkspacePhase(mission.currentPhase)}</WorkspaceShell>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/mission/:roomId/summary"
        element={mission ? <SummaryView /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MissionRouterSync />
    </BrowserRouter>
  );
}
