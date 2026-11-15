export type ItemCategory =
  | 'BUS'
  | 'SOLAR'
  | 'BATTERY'
  | 'ANTENNA'
  | 'OBC'
  | 'PAYLOAD'
  | 'LAUNCHER';

export type TargetBody =
  | 'FLOODS'
  | 'DEFORESTATION'
  | 'WILDFIRES'
  | 'OCEANS'
  | 'MOON'
  | 'MARS';

export type OrbitRegime = 'LEO' | 'SSO' | 'GEO' | 'LUNAR' | 'MARS';

export interface CatalogItem {
  id: string;
  category: ItemCategory;
  name: string;
  shortLabel: string;
  description: string;
  cost: number; // $M USD
  mass: number; // kg
  power: number; // +W generated or -W consumed
  dataRate?: number; // Mbps downlink capacity (for ANTENNA)
  dataGenerated?: number; // Mbps generated (for PAYLOAD)
  scienceBase?: number; // Base science points (for PAYLOAD)
  riskDelta?: number; // % delta
  payloadSlots?: number; // Max payload slots (for BUS)
  maxMassLeo?: number; // Max capacity to LEO in kg (for LAUNCHER)
  fairingDiameterM?: number; // Fairing diameter in m (for LAUNCHER)
  batteryWh?: number; // Energy storage capacity (for BATTERY)
  radHard?: boolean; // Radiation hardened (for OBC)
  pointingAccuracyArcsec?: number; // For OBC / ADCS
  idealTargets?: TargetBody[]; // Optimal targets for payload bonus
  allWeather?: boolean; // Penetrates clouds / works at night
  spectralFocus?: string;
  specs: Record<string, string | number | boolean>;
}

export interface TargetScenario {
  id: TargetBody;
  body: 'EARTH' | 'MOON' | 'MARS';
  environmentLabel: string;
  nameFr: string;
  nameEn: string;
  subtitleFr: string;
  subtitleEn: string;
  nasaInspiration: string;
  nasaUrl?: string;
  challengeFr: string;
  challengeEn: string;
  scienceTarget: number;
  maxRevisitDays: number;
  requiredResolutionMeters: number;
  cloudCoverWarning: boolean;
  recommendedOrbits: OrbitRegime[];
  recommendedPayloads: string[];
  requirementsSummaryFr: [string, string, string];
  requirementsSummaryEn: [string, string, string];
}

export interface TradeStudyOption {
  id: 'ARCH_A' | 'ARCH_B' | 'ARCH_C';
  nameFr: string;
  nameEn: string;
  subtitleFr: string;
  subtitleEn: string;
  radarMetrics: {
    science: number; // 0-100
    budgetEfficiency: number; // 0-100
    massEfficiency: number; // 0-100
    powerMargin: number; // 0-100
    reliability: number; // 0-100
  };
  estimatedCost: number;
  estimatedMass: number;
  estimatedRisk: number;
  estimatedScience: number;
  presetDesign: {
    busId: string;
    solarPanelId: string;
    batteryId: string;
    antennaId: string;
    obcId: string;
    payloadIds: string[];
    orbitType: OrbitRegime;
    altitudeKm: number;
    launcherId: string;
  };
}
