import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types/socket.types';
import { registerMissionHandlers } from './missionHandlers';
import { registerRoomHandlers } from './roomHandlers';

export function initSocketManager(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerMissionHandlers(io, socket);
  });
}
