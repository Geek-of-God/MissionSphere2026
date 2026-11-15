import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { ClientToServerEvents, ServerToClientEvents } from './shared/types/socket.types';
import { SpaceMentor } from './server/src/ai/SpaceMentor';
import {
  getCompletedMissions,
  getRoomState,
  getUnlockedBadges,
} from './server/src/config/roomStore';
import { initSocketManager } from './server/src/sockets/socketManager';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  initSocketManager(io);

  // REST API endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'missionsphere' });
  });

  app.get('/api/badges', (_req, res) => {
    res.json({
      unlockedIds: getUnlockedBadges(),
      recentMissions: getCompletedMissions().slice(0, 10),
    });
  });

  app.post('/api/mentor/explain', async (req, res) => {
    try {
      const { roomId, question, fallbackState } = req.body || {};
      const liveState = roomId ? getRoomState(String(roomId)) : undefined;
      const stateToAnalyze = liveState || fallbackState;
      if (!stateToAnalyze) {
        res.status(400).json({ error: 'État de mission manquant.' });
        return;
      }
      const message = await SpaceMentor.explainTradeOff(stateToAnalyze, question);
      res.json({ message });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la consultation Space Mentor.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MissionSphere MCC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MissionSphere server:', err);
  process.exit(1);
});
