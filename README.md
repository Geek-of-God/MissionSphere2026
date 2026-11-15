# MissionSphere — NASA Space Mission Design Game

> **Design. Negotiate. Launch. Learn.**
> Serious game stratégique de conception de missions spatiales (Solo & Multijoueur temps réel) inspiré des méthodologies d'ingénierie système de la NASA (**CML 1–6**, **Systems Engineering Handbook**, **CubeSat 101**).

---

## 1. Pitch & Problématique (Pour vos Slides)

### Le constat
Concevoir une mission spatiale réelle (Terre, Lune ou Mars) n'est pas un puzzle linéaire : c'est un **exercice permanent de compromis** (*trade-offs*) entre scientifiques, ingénieurs système, chefs de mission et opérations sous contraintes physiques et budgétaires strictes.

### La solution : MissionSphere
Un simulateur interactif multi-rôles qui place les joueurs aux commandes d'un **Mission Control Center (MCC)** pour concevoir, négocier, vérifier en revue MRR, lancer et opérer en orbite une mission spatiale complète en **15 phases** et **6 niveaux de maturité (CML 1 → 6)**.

### Points forts clés (Slide « Valeur ajoutée »)
* **Moteur physique partagé client/serveur** : lois orbitales, bilan masse/lanceur, bilan énergétique (flux solaire à **43 % sur Mars**), bilan de liaison DSN (dB), débit scientifique (Mbps) et couverture nuageuse (ex. Radar SAR vs optique).
* **Coopération asymétrique temps réel (1 à 4 joueurs)** : chaque rôle possède ses propres leviers et objectifs, imposant la négociation en Mission Design Lab (MDL).
* **Visualisation 3D & Télémétrie live** : orbite 3D interactive (Three.js), stations Deep Space Network (Goldstone, Madrid, Canberra), ruban de télémétrie 7 jauges en temps réel.
* **Pédagogie active (Space Mentor)** : conseiller IA hybride (**Gemini API** côté serveur + moteur de règles déterministes en secours) et comparaison finale avec les vraies missions NASA (**SWOT, Landsat 9, Terra, PACE, LRO, MAVEN**).

---

## 2. Les 4 Rôles Asymétriques (Slide « Équipe & Gameplay »)

| Rôle | Couleur HUD | Responsabilités principales |
| :--- | :---: | :--- |
| **Mission Manager (`MGR`)** | Or `#FACC15` | Budget ($M), tolérance au risque, arbitrage des votes MDL, feu vert final en MRR |
| **Science Lead (`SCI`)** | Cyan `#4FC3F7` | Cible scientifique, instruments/charges utiles, résolution requise, qualité des données |
| **Systems Engineer (`SYS`)** | Émeraude `#34D399` | Bus satellite, panneaux solaires, batteries, OBC, marges masse/puissance, choix du lanceur |
| **Operations Lead (`OPS`)** | Orange `#FB923C` | Orbite 3D (LEO/SSO/GEO/Lune/Mars), antennes & liaison DSN, gestion des crises en vol |

* **Mode Solo** : bascule instantanée entre les 4 casquettes + mode **Démo rapide** + résilience locale 100 % navigateur si aucun serveur WebSocket n'est connecté.
* **Mode Collaboratif** : salles privées via code à 6 caractères, sélection des rôles, chat/pings MCC, votes en MDL/Crises et verrouillage des permissions par rôle.

---

## 3. Parcours des 15 Phases & Progression CML 1–6 (Slide « Boucle de jeu »)

| Acte | Phases | CML | Étapes clés |
| :--- | :--- | :---: | :--- |
| **Acte 1 — Concept & Compromis** | `01` Briefing · `02` Exigences · `03` MDL · `04` Trade Studies | `CML 1–2` | Choix du scénario, définition des exigences, propositions multi-rôles et sélection de l'architecture |
| **Acte 2 — Ingénierie & Orbite** | `05` Spacecraft Builder (2.5D) · `06` Payload · `07` Orbit Design (3D) · `08` Launch Vehicle | `CML 3–4` | Assemblage bus/énergie/OBC/antenne, capteurs scientifiques, paramétrage orbital 3D et lanceur |
| **Acte 3 — Validation & Vol** | `09` MRR · `10` Launch · `11` Operations & Crises · `12` Mission Viz Center | `CML 5–6` | Revue d'aptitude au lancement (GO/NO-GO), séquence d'ascension, résolution de 3 crises en orbite, suivi 3D |
| **Acte 4 — Bilan & NASA** | `13` Résultats Scientifiques · `14` Analyse Post-Mission · `15` Comparaison NASA | `CML 6` | Calcul du score `/1000`, diagnostic Space Mentor, attribution du grade et fiche mission NASA correspondante |

---

## 4. Scénarios & Missions NASA de Référence (Slide « Science & Réalisme »)

| Scénario jouable | Cible | Contrainte physique majeure | Mission NASA associée |
| :--- | :---: | :--- | :--- |
| **Inondations & Cycle de l'Eau** | Terre | Couverture nuageuse ~70 % (Radar SAR critique) | **SWOT** (2022) |
| **Déforestation & Biomasse** | Terre | Très haute résolution (< 5 m) | **Landsat 9** (2021) |
| **Détection des Méga-Feux** | Terre | Détection thermique IR à travers la fumée, revisite ≤ 2 j | **Terra MODIS** (1999) |
| **Santé des Océans & Plancton** | Terre | Spectrométrie couleur fine & pointage ADCS stable | **PACE** (2024) |
| **Glace Polaire Lunaire** | Lune | Orbite polaire LLO, liaison DSN, fort Δv | **LRO** (2009) |
| **Atmosphère & Climat de Mars** | Mars | Flux solaire à **43 %** (1,52 UA), OBC durci (Rad-Hard), Bande-Ka | **MAVEN** (2013) |

### Pondération du Score Final (`/1000`)
* **Science** : `35 %` · **Budget** : `20 %` · **Ingénierie** : `20 %` · **Collaboration** : `15 %` · **Survie satellite** : `10 %`

---

## 5. Sources Scientifiques & Références NASA (Slide « Crédibilité & Sources »)

* **NASA Systems Engineering Handbook (`SP-2016-6105`)** — Exigences, marges techniques, bilans et revues MRR (`https://www.nasa.gov/reference/systems-engineering-handbook/`)
* **NASA Concept Maturity Levels (`JPL 13-3547_A1b`) & Team X / GSFC MDL** — Maturation CML 1–6 et ingénierie concurrente (`https://www.jpl.nasa.gov/site/teamx/`)
* **NASA CubeSat 101 & SmallSat State-of-the-Art** — Bus 6U, panneaux GaAs, Li-Ion, liaisons S/X/Ka (`https://www.nasa.gov/smallsat-institute/sst-soa/`)
* **NASA GMAT & Earthdata Instruments** — Lois orbitales, éclipses, fauchée et capteurs SAR / Optique / IR / Hyperspectral (`https://opensource.gsfc.nasa.gov/projects/GMAT/`)
* **NASA Launch Services Program (LSP) & Orbital Debris Office** — Enveloppes lanceurs et risques débris/météo spatiale (`https://www.nasa.gov/kennedy/launch-services-program/` · `https://orbitaldebris.jsc.nasa.gov/`)
* **NASA Eyes / Deep Space Network (DSN Now)** — Couverture stations Goldstone, Madrid, Canberra (`https://eyes.nasa.gov/apps/dsn-now/dsn.html`)

---

## 6. Architecture Technique (Slide « Stack & Architecture »)

```text
MissionSphere/
├── src/                  # Frontend React 19 + TypeScript + Tailwind CSS v4 + Zustand + Three.js
│   ├── pages/            # Home, Lobby (création/rejoindre salle, rôles, Ready)
│   ├── components/       # WorkspaceShell, Header, TelemetryRibbon, PhaseTimeline, Phases 01–15
│   └── services/         # socketService.ts (Socket.io-client) & LocalSimulationAdapter.ts (Solo hors-ligne)
├── shared/               # Code isomorphe partagé Frontend ↔ Backend
│   ├── engine/           # PhysicsEngine, CrisisEngine, ScoreEngine, SpaceMentorRules, NasaMatcher
│   └── constants/        # Catalogue matériel, missions NASA, sources de données, constantes orbitales
├── server/               # Backend Node.js + Express + Socket.io
│   ├── src/sockets/      # roomHandlers.ts, missionHandlers.ts, socketManager.ts
│   └── src/ai/           # SpaceMentor.ts (Gemini API @google/genai + fallback déterministe)
└── server.ts             # Point d'entrée serveur HTTP + Vite / dist
```

---

## 7. Installation, Tests & Déploiement

### Variables d'environnement (`.env.example`)
```bash
cp .env.example .env
```
* `GEMINI_API_KEY` *(optionnelle)* : active les réponses IA dynamiques du Space Mentor côté serveur (sinon bascule automatique sur le moteur de règles déterministes).
* `PORT` : port HTTP du serveur (défaut `3000`).
* `VITE_SOCKET_URL` / `VITE_API_URL` *(optionnelles)* : URL du backend Node.js si le frontend est hébergé séparément (ex. Vercel).

### Commandes locales
```bash
npm install
npm run dev      # Serveur dev Express + Vite + Socket.io sur http://localhost:3000
npm run lint     # Vérification TypeScript (tsc --noEmit)
npm test         # Tests unitaires moteur (7/7 cas PhysicsEngine, CrisisEngine, ScoreEngine)
npm run build    # Build de production Vite (dist/)
```

### Déploiement sur Vercel (Mode Solo prêt à l'emploi)
Un fichier `vercel.json` est inclus pour le routage SPA Vite.
1. Importez le dépôt GitHub dans **Vercel** (`Framework: Vite`, `Build: npm run build`, `Output: dist`).
2. Le **Mode Solo complet** (15 phases, Three.js, physique, crises, badges `localStorage`, Space Mentor local) fonctionne immédiatement.
3. Pour activer aussi le **Multijoueur Socket.io** et **Gemini** depuis Vercel, déployez le serveur Node.js sur **Render / Railway / Cloud Run** (`NODE_ENV=production npx tsx server.ts`) et renseignez `VITE_SOCKET_URL` dans les variables d'environnement Vercel.

### Déploiement Full-Stack tout-en-un (Render / Railway / Cloud Run / Fly.io)
* **Build Command** : `npm install && npm run build`
* **Start Command** : `NODE_ENV=production npx tsx server.ts`
* **Variables d'environnement** : `GEMINI_API_KEY` *(optionnelle)*
