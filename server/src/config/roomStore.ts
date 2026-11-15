import fs from 'fs';
import path from 'path';
import { MissionState, NasaMatchResult, ScoreBreakdown } from '../../../shared/types/mission.types';

export interface CompletedMissionRecord {
  roomId: string;
  target: string;
  mode: 'SOLO' | 'MULTI';
  score: ScoreBreakdown;
  nasaMatch: NasaMatchResult;
  completedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PERSIST_FILE = path.join(DATA_DIR, 'missions.json');
const ACTIVE_ROOMS_FILE = path.join(DATA_DIR, 'active_rooms.json');

// Hot in-memory room state (equivalent to Redis 7 room:{code}:state cache)
const rooms = new Map<string, MissionState>();
// SocketId -> { roomId, playerId }
const socketRegistry = new Map<string, { roomId: string; playerId: string }>();

let persistedRecords: CompletedMissionRecord[] = [];
let flushRoomsTimer: NodeJS.Timeout | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersisted() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const raw = fs.readFileSync(PERSIST_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        persistedRecords = parsed;
      }
    }
    if (fs.existsSync(ACTIVE_ROOMS_FILE)) {
      const rawRooms = fs.readFileSync(ACTIVE_ROOMS_FILE, 'utf-8');
      const parsedRooms = JSON.parse(rawRooms);
      if (Array.isArray(parsedRooms)) {
        for (const st of parsedRooms) {
          if (st && typeof st.roomId === 'string') {
            // Reset activeCrisis to null if stale or keep room state intact
            rooms.set(st.roomId.toUpperCase(), st);
          }
        }
      }
    }
  } catch {
    persistedRecords = [];
  }
}

function flushPersisted() {
  try {
    ensureDataDir();
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(persistedRecords.slice(0, 100), null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only environments
  }
}

function scheduleRoomsFlush() {
  if (flushRoomsTimer) return;
  flushRoomsTimer = setTimeout(() => {
    flushRoomsTimer = null;
    try {
      ensureDataDir();
      const snapshot = Array.from(rooms.values()).slice(-50);
      fs.writeFileSync(ACTIVE_ROOMS_FILE, JSON.stringify(snapshot), 'utf-8');
    } catch {
      // Non-fatal in read-only environments
    }
  }, 400);
}

loadPersisted();

export function getRoomState(roomId: string): MissionState | undefined {
  return rooms.get(roomId.toUpperCase());
}

export function saveRoomState(roomId: string, state: MissionState): void {
  rooms.set(roomId.toUpperCase(), state);
  scheduleRoomsFlush();
}

export function registerSocket(socketId: string, roomId: string, playerId: string): void {
  socketRegistry.set(socketId, { roomId: roomId.toUpperCase(), playerId });
}

export function getSocketBinding(socketId: string) {
  return socketRegistry.get(socketId);
}

export function unregisterSocket(socketId: string): { roomId: string; playerId: string } | undefined {
  const binding = socketRegistry.get(socketId);
  socketRegistry.delete(socketId);
  return binding;
}

export function recordCompletedMission(state: MissionState): void {
  if (!state.finalResults) return;
  const exists = persistedRecords.some((r) => r.roomId === state.roomId);
  if (exists) return;

  persistedRecords.unshift({
    roomId: state.roomId,
    target: state.design.target || 'FLOODS',
    mode: state.mode,
    score: state.finalResults.score,
    nasaMatch: state.finalResults.nasaMatch,
    completedAt: Date.now(),
  });
  flushPersisted();
}

export function getCompletedMissions(): CompletedMissionRecord[] {
  return persistedRecords;
}

export function getUnlockedBadges(): string[] {
  return Array.from(new Set(persistedRecords.map((r) => r.nasaMatch.missionId)));
}
