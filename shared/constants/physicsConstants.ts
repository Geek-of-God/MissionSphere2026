import { OrbitRegime, TargetBody } from '../types/catalog.types';
import { PlayerRole } from '../types/mission.types';

export const SOLAR_FLUX_MULTIPLIER: Record<OrbitRegime, number> = {
  LEO: 1.0,
  SSO: 1.05, // Dawn-dusk / high sun-exposure polar geometry
  GEO: 1.1,
  LUNAR: 0.98,
  MARS: 0.43, // ~1.52 AU inverse-square solar irradiance
};

export const ORBIT_PAYLOAD_PENALTY: Record<OrbitRegime, number> = {
  LEO: 1.0,
  SSO: 0.72,
  GEO: 0.25,
  LUNAR: 0.22,
  MARS: 0.16,
};

export const ORBIT_LINK_BASE_DB: Record<OrbitRegime, number> = {
  LEO: 22,
  SSO: 19,
  GEO: 10,
  LUNAR: 2,
  MARS: -14,
};

export const ORBIT_DEFAULT_ALTITUDE_KM: Record<OrbitRegime, { min: number; max: number; default: number; inclination: number }> = {
  LEO: { min: 300, max: 1200, default: 500, inclination: 51.6 },
  SSO: { min: 450, max: 1000, default: 650, inclination: 98.0 },
  GEO: { min: 35786, max: 35786, default: 35786, inclination: 0.1 },
  LUNAR: { min: 50, max: 500, default: 100, inclination: 90.0 },
  MARS: { min: 150, max: 1500, default: 400, inclination: 74.0 },
};

export const ROLE_META: Record<
  PlayerRole,
  {
    labelFr: string;
    labelEn: string;
    color: string;
    shortTag: string;
    dutiesFr: string[];
    dutiesEn: string[];
  }
> = {
  MANAGER: {
    labelFr: 'Mission Manager',
    labelEn: 'Mission Manager',
    color: '#FACC15',
    shortTag: 'MGR',
    dutiesFr: ['Budget & Calendrier', 'Arbitrage & Votes', 'Feu vert final (MRR)'],
    dutiesEn: ['Budget & Schedule', 'Arbitration & Votes', 'Final Launch Go (MRR)'],
  },
  SCIENCE: {
    labelFr: 'Science Lead',
    labelEn: 'Science Lead',
    color: '#4FC3F7',
    shortTag: 'SCI',
    dutiesFr: ['Cible & Instruments', 'Résolution requise', 'Qualité des données'],
    dutiesEn: ['Target & Payloads', 'Required Resolution', 'Data Quality'],
  },
  SYSTEMS: {
    labelFr: 'Systems Engineer',
    labelEn: 'Systems Engineer',
    color: '#34D399',
    shortTag: 'SYS',
    dutiesFr: ['Structure & Énergie', 'Bilan de Masse', 'Choix du Lanceur'],
    dutiesEn: ['Bus & Power Margin', 'Mass Budget', 'Launcher Selection'],
  },
  OPERATIONS: {
    labelFr: 'Operations Lead',
    labelEn: 'Operations Lead',
    color: '#FB923C',
    shortTag: 'OPS',
    dutiesFr: ['Orbite 3D (GMAT)', 'Antennes & Données', 'Gestion des Crises'],
    dutiesEn: ['3D Orbit Design', 'Comms & Downlink', 'Anomaly Response'],
  },
};

export const PHASE_META: Array<{
  phase: number;
  cml: number;
  act: 1 | 2 | 3 | 4;
  shortLabel: string;
  titleFr: string;
  titleEn: string;
}> = [
  { phase: 1, cml: 1, act: 1, shortLabel: '01. Brief', titleFr: 'Mission Briefing', titleEn: 'Mission Briefing' },
  { phase: 2, cml: 1, act: 1, shortLabel: '02. Req.', titleFr: 'Définition des Exigences', titleEn: 'Requirements Definition' },
  { phase: 3, cml: 2, act: 1, shortLabel: '03. MDL', titleFr: 'Mission Design Lab', titleEn: 'Mission Design Lab' },
  { phase: 4, cml: 2, act: 1, shortLabel: '04. Trade', titleFr: 'Études de Compromis', titleEn: 'Trade Studies' },
  { phase: 5, cml: 3, act: 2, shortLabel: '05. Bus', titleFr: 'Spacecraft Builder (2.5D)', titleEn: 'Spacecraft Builder (2.5D)' },
  { phase: 6, cml: 3, act: 2, shortLabel: '06. Payld', titleFr: 'Charge Utile (Payload)', titleEn: 'Payload Design' },
  { phase: 7, cml: 4, act: 2, shortLabel: '07. Orbit', titleFr: 'Conception Orbitale (3D)', titleEn: 'Orbit Design (3D)' },
  { phase: 8, cml: 4, act: 2, shortLabel: '08. Lnchr', titleFr: 'Sélection du Lanceur', titleEn: 'Launch Vehicle' },
  { phase: 9, cml: 5, act: 3, shortLabel: '09. MRR', titleFr: 'Mission Readiness Review', titleEn: 'Mission Readiness Review' },
  { phase: 10, cml: 6, act: 3, shortLabel: '10. Lnch', titleFr: 'Séquence de Lancement', titleEn: 'Launch Sequence' },
  { phase: 11, cml: 6, act: 3, shortLabel: '11. Ops', titleFr: 'Opérations & Crises', titleEn: 'Mission Operations' },
  { phase: 12, cml: 6, act: 3, shortLabel: '12. Viz', titleFr: 'Mission Viz Center', titleEn: 'Mission Viz Center' },
  { phase: 13, cml: 6, act: 4, shortLabel: '13. Res', titleFr: 'Résultats Scientifiques', titleEn: 'Scientific Results' },
  { phase: 14, cml: 6, act: 4, shortLabel: '14. Bilan', titleFr: 'Analyse Post-Mission', titleEn: 'Post-Mission Analysis' },
  { phase: 15, cml: 6, act: 4, shortLabel: '15. NASA', titleFr: 'Comparaison NASA', titleEn: 'NASA Comparison' },
];

export const DSN_STATIONS = [
  { id: 'goldstone', name: 'Goldstone (USA)', latDeg: 35.4, lonDeg: -116.9 },
  { id: 'madrid', name: 'Madrid (ESP)', latDeg: 40.4, lonDeg: -4.2 },
  { id: 'canberra', name: 'Canberra (AUS)', latDeg: -35.4, lonDeg: 149.0 },
];

export const TARGET_PLANET_MAP: Record<TargetBody, 'EARTH' | 'MOON' | 'MARS'> = {
  FLOODS: 'EARTH',
  DEFORESTATION: 'EARTH',
  WILDFIRES: 'EARTH',
  OCEANS: 'EARTH',
  MOON: 'MOON',
  MARS: 'MARS',
};
