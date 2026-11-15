import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitRegime } from '../../../shared/types/catalog.types';
import {
  afterDraw,
  createCompositeSatelliteGroup,
  createProceduralPlanetTexture,
  createRendererAndEnv,
  createStarfieldPoints,
  detectSoftwareGl,
  disposeScene,
} from './threeHelpers';

interface OrbitViewport3DProps {
  planet: 'EARTH' | 'MOON' | 'MARS';
  orbitType: OrbitRegime;
  altitudeKm: number;
  inclinationDeg: number;
}

export const OrbitViewport3D: React.FC<OrbitViewport3DProps> = ({
  planet,
  orbitType,
  altitudeKm,
  inclinationDeg,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [simSpeed, setSimSpeed] = useState<1 | 100>(1);
  const [camPreset, setCamPreset] = useState<'ORBIT' | 'PLANET' | 'SWATH'>('ORBIT');
  const [webglError, setWebglError] = useState(false);

  const paramsRef = useRef({ planet, orbitType, altitudeKm, inclinationDeg, simSpeed, camPreset });
  paramsRef.current = { planet, orbitType, altitudeKm, inclinationDeg, simSpeed, camPreset };

  const cameraActionRef = useRef<((preset: 'ORBIT' | 'PLANET' | 'SWATH') => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const { renderer, envTexture } = createRendererAndEnv(container, isSoftwareGl);
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const scene = new THREE.Scene();
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 640) / (container.clientHeight || 360),
      0.1,
      120
    );
    camera.position.set(0, 3.2, 6.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.minDistance = 3.2;
    controls.maxDistance = 13;

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.0);
    sunLight.position.set(9, 4, 5);
    scene.add(sunLight);

    const hemi = new THREE.HemisphereLight(0x4fc3f7, 0x040812, 0.35);
    scene.add(hemi);

    const stars = createStarfieldPoints(750);
    scene.add(stars);

    const planetRadius = 1.95;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 40, 40);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = {
      EARTH: createProceduralPlanetTexture('EARTH', maxAniso),
      MOON: createProceduralPlanetTexture('MOON', maxAniso),
      MARS: createProceduralPlanetTexture('MARS', maxAniso),
    };
    const planetMat = new THREE.MeshStandardMaterial({
      map: textures[paramsRef.current.planet],
      roughness: 0.72,
      metalness: 0.08,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planetMesh);

    // Atmosphere shell for Earth/Mars
    const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.03, 36, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Orbit Ring Line
    const segments = 96;
    const orbitPositions = new Float32Array((segments + 1) * 3);
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x4fc3f7 });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // Satellite + Swath Cone
    const satGroup = createCompositeSatelliteGroup();
    scene.add(satGroup);

    const swathGeo = new THREE.ConeGeometry(0.45, 1.0, 24, 1, true);
    const swathMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const swathCone = new THREE.Mesh(swathGeo, swathMat);
    scene.add(swathCone);

    const _satPos = new THREE.Vector3();
    const _origin = new THREE.Vector3(0, 0, 0);
    const _up = new THREE.Vector3(0, 1, 0);
    const _dir = new THREE.Vector3();
    const _camTarget = new THREE.Vector3();

    let camGoalPos: THREE.Vector3 | null = null;
    controls.addEventListener('start', () => {
      camGoalPos = null;
    });

    cameraActionRef.current = (preset) => {
      if (preset === 'ORBIT') camGoalPos = new THREE.Vector3(0, 3.4, 6.8);
      else if (preset === 'PLANET') camGoalPos = new THREE.Vector3(0, 0.8, 5.2);
      else camGoalPos = new THREE.Vector3(2.8, 1.8, 3.6);
    };

    let lastPlanet = paramsRef.current.planet;
    let lastOrbitRadius = -1;
    let lastInclination = -1;
    let orbitalTheta = 0;
    let frameId = 0;
    let disposed = false;

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());
      const { planet: curPlanet, orbitType: curType, altitudeKm: alt, inclinationDeg: inc, simSpeed: spd } =
        paramsRef.current;

      if (curPlanet !== lastPlanet) {
        planetMat.map = textures[curPlanet];
        planetMat.needsUpdate = true;
        atmoMesh.visible = curPlanet !== 'MOON';
        atmoMat.color.setHex(curPlanet === 'MARS' ? 0xfb923c : 0x4fc3f7);
        lastPlanet = curPlanet;
      }

      const visualOffset =
        curType === 'GEO' ? 2.15 : Math.min(1.65, Math.max(0.28, alt / 1100));
      const orbitR = planetRadius + visualOffset;
      const incRad = (inc * Math.PI) / 180;

      if (Math.abs(orbitR - lastOrbitRadius) > 0.001 || Math.abs(incRad - lastInclination) > 0.001) {
        const posAttr = orbitGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i <= segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          posAttr.setXYZ(
            i,
            Math.cos(a) * orbitR,
            Math.sin(a) * orbitR * Math.sin(incRad),
            Math.sin(a) * orbitR * Math.cos(incRad)
          );
        }
        posAttr.needsUpdate = true;
        lastOrbitRadius = orbitR;
        lastInclination = incRad;
      }

      orbitalTheta += dt * (spd === 100 ? 1.85 : 0.45);
      _satPos.set(
        Math.cos(orbitalTheta) * orbitR,
        Math.sin(orbitalTheta) * orbitR * Math.sin(incRad),
        Math.sin(orbitalTheta) * orbitR * Math.cos(incRad)
      );
      satGroup.position.copy(_satPos);
      satGroup.lookAt(_origin);
      satGroup.rotateX(Math.PI / 2);

      // Update swath cone bridging satellite to planet surface
      const coneLen = orbitR - planetRadius * 0.96;
      swathCone.scale.set(0.8 + visualOffset * 0.4, coneLen, 0.8 + visualOffset * 0.4);
      _dir.copy(_satPos).normalize();
      swathCone.position.copy(_dir).multiplyScalar(planetRadius * 0.96 + coneLen * 0.5);
      swathCone.quaternion.setFromUnitVectors(_up, _dir);

      planetMesh.rotation.y += dt * (spd === 100 ? 0.18 : 0.03);

      if (camGoalPos) {
        camera.position.lerp(camGoalPos, 1 - Math.exp(-5 * dt));
        if (camera.position.distanceTo(camGoalPos) < 0.05) camGoalPos = null;
      }
      controls.target.copy(_camTarget);
      controls.update();

      renderer.render(scene, camera);
      if (isSoftwareGl) frameId = afterDraw(renderer, tick);
      else frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      Object.values(textures).forEach((t) => t.dispose());
      disposeScene(scene);
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handlePreset = (p: 'ORBIT' | 'PLANET' | 'SWATH') => {
    setCamPreset(p);
    cameraActionRef.current?.(p);
  };

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#040812] border border-[#4FC3F7]/20 rounded text-xs text-slate-400">
        Rendu 3D suspendu — Vue orbitale {orbitType} ({altitudeKm} km / {inclinationDeg}°)
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#040812] rounded overflow-hidden border border-[#4FC3F7]/25">
      <div ref={mountRef} className="w-full h-full" />

      {/* Compact bottom camera & speed controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded bg-[#060C1B]/90 border border-[#4FC3F7]/30 text-[11px]">
        <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
          {(['ORBIT', 'PLANET', 'SWATH'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePreset(p)}
              className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                camPreset === p ? 'bg-[#0B3D91] text-[#4FC3F7]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'ORBIT' ? 'Orbite' : p === 'PLANET' ? 'Planète' : 'Swath'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSimSpeed(1)}
            className={`px-2 py-0.5 rounded telemetry-value cursor-pointer ${
              simSpeed === 1 ? 'bg-[#4FC3F7]/20 text-[#4FC3F7]' : 'text-slate-400 hover:text-white'
            }`}
          >
            1x
          </button>
          <button
            type="button"
            onClick={() => setSimSpeed(100)}
            className={`px-2 py-0.5 rounded telemetry-value cursor-pointer ${
              simSpeed === 100 ? 'bg-[#4FC3F7]/20 text-[#4FC3F7]' : 'text-slate-400 hover:text-white'
            }`}
          >
            100x
          </button>
        </div>
      </div>
    </div>
  );
};
