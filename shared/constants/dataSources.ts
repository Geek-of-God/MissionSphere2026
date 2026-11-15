export interface DataSourceLink {
  id: string;
  label: string;
  organization: string;
  descriptionFr: string;
  descriptionEn: string;
  url: string;
  phases: number[];
}

export const DATA_SOURCES: DataSourceLink[] = [
  {
    id: 'nasa-science-missions',
    label: 'NASA Science Missions Catalog',
    organization: 'NASA SMD',
    descriptionFr: 'Objectifs scientifiques, cibles planétaires et fiches des missions Terre/Lune/Mars.',
    descriptionEn: 'Science objectives, planetary targets, and Earth/Moon/Mars mission profiles.',
    url: 'https://science.nasa.gov/missions/',
    phases: [1, 2, 13, 15],
  },
  {
    id: 'nasa-se-handbook',
    label: 'NASA Systems Engineering Handbook (SP-2016-6105)',
    organization: 'NASA HQ',
    descriptionFr: 'Méthodologie des exigences, marges techniques, bilans de masse/puissance et revues MRR.',
    descriptionEn: 'Requirements engineering, technical margins, mass/power budgets, and MRR gates.',
    url: 'https://www.nasa.gov/reference/systems-engineering-handbook/',
    phases: [2, 4, 9, 14],
  },
  {
    id: 'nasa-mdl-teamx',
    label: 'NASA Concept Maturity Levels (CML) & JPL Team X / GSFC MDL',
    organization: 'NASA JPL / GSFC',
    descriptionFr: 'Conception concurrente en Mission Design Lab, maturation CML 1–6 et matrice Trade Space.',
    descriptionEn: 'Concurrent Mission Design Lab workflow, CML 1–6 gates, and trade-space studies.',
    url: 'https://www.jpl.nasa.gov/site/teamx/',
    phases: [3, 4],
  },
  {
    id: 'nasa-cubesat-101',
    label: 'NASA CubeSat 101 & SmallSat State-of-the-Art',
    organization: 'NASA Small Spacecraft Institute',
    descriptionFr: 'Référentiel des bus (6U/SmallSat), panneaux GaAs, batteries Li-Ion, antennes S/X/Ka et OBC.',
    descriptionEn: 'Reference metrics for 6U/SmallSat buses, GaAs arrays, Li-Ion batteries, S/X/Ka radios, and OBCs.',
    url: 'https://www.nasa.gov/smallsat-institute/sst-soa/',
    phases: [5, 8],
  },
  {
    id: 'nasa-earthdata-instruments',
    label: 'NASA Earthdata Sensors & Payloads',
    organization: 'NASA EOSDIS',
    descriptionFr: 'Caractéristiques des instruments SAR Bande-C, Optique HR, Spectromètre hyperspectral et IR.',
    descriptionEn: 'Specifications for C-Band SAR, HR Optical, Hyperspectral Spectrometer, and Thermal IR payloads.',
    url: 'https://www.earthdata.nasa.gov/data/instruments',
    phases: [6, 13],
  },
  {
    id: 'nasa-gmat',
    label: 'NASA GMAT (General Mission Analysis Tool)',
    organization: 'NASA Goddard',
    descriptionFr: 'Lois orbitales LEO/SSO/GEO/Lune/Mars, durée d\'éclipse, revisite, résolution et flux solaire (43% sur Mars).',
    descriptionEn: 'LEO/SSO/GEO/Lunar/Mars astrodynamics, eclipse windows, revisit cadence, and solar irradiance.',
    url: 'https://opensource.gsfc.nasa.gov/projects/GMAT/',
    phases: [7, 12],
  },
  {
    id: 'nasa-lsp',
    label: 'NASA Launch Services Program (LSP)',
    organization: 'NASA Kennedy',
    descriptionFr: 'Capacités d\'emport par orbite, diamètres de coiffe et séquences de vol (Max-Q, MECO, SECO).',
    descriptionEn: 'Launch vehicle payload mass curves by orbit, fairing envelopes, and ascent milestones.',
    url: 'https://www.nasa.gov/kennedy/launch-services-program/',
    phases: [8, 9, 10],
  },
  {
    id: 'nasa-space-weather-debris',
    label: 'NASA Heliophysics & Orbital Debris Office',
    organization: 'NASA GSFC / JSC',
    descriptionFr: 'Scénarios d\'anomalies en orbite : éruptions solaires (CME), conjonctions de débris et anomalies thermiques.',
    descriptionEn: 'On-orbit anomaly profiles: X-class CME solar storms, debris conjunctions, and thermal drift.',
    url: 'https://orbitaldebris.jsc.nasa.gov/',
    phases: [11],
  },
  {
    id: 'nasa-dsn-eyes',
    label: 'NASA Eyes & Deep Space Network (DSN Now)',
    organization: 'NASA JPL',
    descriptionFr: 'Visualisation 3D, traces au sol, fauchée capteur et stations Goldstone / Madrid / Canberra.',
    descriptionEn: '3D mission visualization, ground tracks, sensor swath, and Goldstone/Madrid/Canberra DSN links.',
    url: 'https://eyes.nasa.gov/apps/dsn-now/dsn.html',
    phases: [12],
  },
  {
    id: 'nasa-earth-observatory',
    label: 'NASA Earth Observatory & Planetary Data',
    organization: 'NASA GSFC',
    descriptionFr: 'Imagerie scientifique comparée (SWOT, Landsat 9, Terra MODIS, PACE, LRO, MAVEN).',
    descriptionEn: 'Comparative Earth & planetary science datasets (SWOT, Landsat 9, Terra, PACE, LRO, MAVEN).',
    url: 'https://earthobservatory.nasa.gov/',
    phases: [13, 14, 15],
  },
];

export function getDataSourcesForPhase(phase: number): DataSourceLink[] {
  return DATA_SOURCES.filter((src) => src.phases.includes(phase));
}
