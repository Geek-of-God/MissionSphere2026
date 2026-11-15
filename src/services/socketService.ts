import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types/socket.types';
import { MissionState, PlayerRole } from '../../shared/types/mission.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  timeout: 8000,
});

export const socketService = {
  connect(timeoutMs = 7000): Promise<void> {
    if (socket.connected) return Promise.resolve();
    socket.connect();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timer);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
      };
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        // Ignore single transient error while polling fallback is still negotiating unless timed out
        if (!socket.active) {
          cleanup();
          reject(err);
        }
      };
      const timer = window.setTimeout(() => {
        cleanup();
        if (!socket.connected) socket.disconnect();
        reject(new Error('Socket timeout'));
      }, timeoutMs);
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
    });
  },

  disconnect() {
    if (socket.connected) socket.disconnect();
  },

  createRoom(username: string, mode: 'SOLO' | 'MULTI', demoMode = false) {
    return new Promise<{ roomId: string; playerId: string }>((resolve) => {
      socket.emit('room:create', { username, mode, demoMode }, resolve);
    });
  },

  joinRoom(roomId: string, username: string) {
    return new Promise<{ success: boolean; error?: string; playerId?: string }>((resolve) => {
      socket.emit('room:join', { roomId: roomId.trim().toUpperCase(), username }, resolve);
    });
  },

  rejoinRoom(roomId: string, playerId: string) {
    return new Promise<{ success: boolean; error?: string; playerId?: string }>((resolve) => {
      socket.emit('room:rejoin', { roomId: roomId.trim().toUpperCase(), playerId }, resolve);
    });
  },

  selectRole(roomId: string, role: PlayerRole) {
    socket.emit('room:selectRole', { roomId, role });
  },

  toggleReady(roomId: string) {
    socket.emit('room:toggleReady', { roomId });
  },

  onStateSync(cb: (state: MissionState) => void) {
    socket.on('mission:stateSync', cb);
    return () => {
      socket.off('mission:stateSync', cb);
    };
  },

  onError(cb: (message: string) => void) {
    socket.on('mission:error', cb);
    return () => {
      socket.off('mission:error', cb);
    };
  },
};
