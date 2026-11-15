import { OrbitRegime, TargetBody } from '../types/catalog.types';

export interface NasaReferenceMission {
  id: string;
  name: string;
  fullTitle: string;
  launchYear: number;
  status: string;
  targetId: TargetBody;
  orbitType: OrbitRegime;
  altitudeKm: number;
  massKg: number;
  costMusd: number;
  primaryInstruments: string[];
  summary: string;
  badgeTitle: string;
  anecdote: string;
  nasaUrl: string;
  // Normalized vector: [TargetIndex/6, OrbitIndex/5, MassNorm, CostNorm, AllWeatherOrDeepSpace]
  featureVector: number[];
}

export const NASA_MISSIONS: NasaReferenceMission[] = [
  {
    id: 'SWOT',
    name: 'SWOT',
    fullTitle: 'Surface Water and Ocean Topography',
    launchYear: 2022,
    status: 'Active',
    targetId: 'FLOODS',
    orbitType: 'SSO',
    altitudeKm: 891,
    massKg: 2000,
    costMusd: 1200,
    primaryInstruments: ['Radar Interféromètre KaRIn', 'Radiomètre Micro-ondes'],
    summary:
      'Première mission mondiale mesurant la hauteur de presque toute l\'eau à la surface de la Terre, même sous couverture nuageuse.',
    badgeTitle: 'Hydrologue Orbital',
    anecdote:
      'Développé conjointement par la NASA et le CNES, SWOT déploie deux antennes radar distantes de 10 mètres pour mesurer l\'élévation des fleuves et océans au centimètre près.',
    nasaUrl: 'https://science.nasa.gov/mission/swot/',
    featureVector: [1 / 6, 2 / 5, 0.45, 0.75, 0.95],
  },
  {
    id: 'LANDSAT9',
    name: 'Landsat 9',
    fullTitle: 'Landsat Data Continuity Mission 9',
    launchYear: 2021,
    status: 'Active',
    targetId: 'DEFORESTATION',
    orbitType: 'SSO',
    altitudeKm: 705,
    massKg: 2711,
    costMusd: 750,
    primaryInstruments: ['Caméra Optique OLI-2', 'Capteur Thermique TIRS-2'],
    summary:
      'Surveillance continue des forêts, des cultures, de la déforestation et de l\'occupation des sols terrestres.',
    badgeTitle: 'Sentinelle des Forêts',
    anecdote:
      'Landsat 9 poursuit un enregistrement continu de la surface terrestre entamé en 1972, capturant plus de 700 scènes par jour à travers le globe.',
    nasaUrl: 'https://science.nasa.gov/mission/landsat-9/',
    featureVector: [2 / 6, 2 / 5, 0.55, 0.6, 0.6],
  },
  {
    id: 'TERRA',
    name: 'Terra (EOS AM-1)',
    fullTitle: 'Earth Observing System Flagship',
    launchYear: 1999,
    status: 'Active',
    targetId: 'WILDFIRES',
    orbitType: 'SSO',
    altitudeKm: 705,
    massKg: 4864,
    costMusd: 1300,
    primaryInstruments: ['Spectroradiomètre MODIS', 'Capteur Thermique ASTER'],
    summary:
      'Observation multi-instrumentale des incendies de forêt, panaches de fumée, aérosols et bilans thermiques de la Terre.',
    badgeTitle: 'Vigie Thermique',
    anecdote:
      'Conçue initialement pour 6 ans, Terra observe les méga-feux et le climat terrestre depuis plus de deux décennies grâce à ses marges d\'ingénierie robustes.',
    nasaUrl: 'https://science.nasa.gov/mission/terra/',
    featureVector: [3 / 6, 2 / 5, 0.85, 0.85, 0.75],
  },
  {
    id: 'PACE',
    name: 'PACE',
    fullTitle: 'Plankton, Aerosol, Cloud, ocean Ecosystem',
    launchYear: 2024,
    status: 'Active',
    targetId: 'OCEANS',
    orbitType: 'SSO',
    altitudeKm: 676,
    massKg: 1700,
    costMusd: 948,
    primaryInstruments: ['Spectromètre Hyperspectral OCI', 'Polarimètres HARP2/SPEXone'],
    summary:
      'Analyse hyperspectrale de la couleur des océans et du phytoplancton pour comprendre le cycle mondial du carbone.',
    badgeTitle: 'Biologiste Marin Spatial',
    anecdote:
      'L\'instrument OCI de PACE observe l\'arc-en-ciel continu de la lumière réfléchie par les océans, distinguant pour la première fois les espèces de phytoplancton depuis l\'orbite.',
    nasaUrl: 'https://science.nasa.gov/mission/pace/',
    featureVector: [4 / 6, 2 / 5, 0.4, 0.65, 0.7],
  },
  {
    id: 'LRO',
    name: 'LRO',
    fullTitle: 'Lunar Reconnaissance Orbiter',
    launchYear: 2009,
    status: 'Active',
    targetId: 'MOON',
    orbitType: 'LUNAR',
    altitudeKm: 50,
    massKg: 1916,
    costMusd: 583,
    primaryInstruments: ['Caméra Haute Résolution LROC', 'Altimètre Laser LOLA', 'Détecteur Neutrons LEND'],
    summary:
      'Cartographie 3D haute précision de la Lune et recherche de glace d\'eau dans les cratères polaires.',
    badgeTitle: 'Cartographe Sélénite',
    anecdote:
      'LRO a permis d\'identifier les sites d\'alunissage d\'Artemis III près du pôle Sud lunaire en confirmant la présence de dépôts de glace d\'eau.',
    nasaUrl: 'https://science.nasa.gov/mission/lro/',
    featureVector: [5 / 6, 4 / 5, 0.48, 0.5, 0.9],
  },
  {
    id: 'MAVEN',
    name: 'MAVEN',
    fullTitle: 'Mars Atmosphere and Volatile Evolution',
    launchYear: 2013,
    status: 'Active',
    targetId: 'MARS',
    orbitType: 'MARS',
    altitudeKm: 150,
    massKg: 2454,
    costMusd: 671,
    primaryInstruments: ['Spectromètre de Masse NGIMS', 'Magnétomètre', 'Analyseur Vent Solaire'],
    summary:
      'Étude de la haute atmosphère martienne et du rôle du vent solaire dans la perte historique de l\'eau sur Mars.',
    badgeTitle: 'Explorateur Martien',
    anecdote:
      'MAVEN sert aussi de relais de communication crucial entre les rovers Curiosity/Perseverance au sol et les stations du Deep Space Network sur Terre.',
    nasaUrl: 'https://science.nasa.gov/mission/maven/',
    featureVector: [6 / 6, 5 / 5, 0.6, 0.58, 0.95],
  },
];
