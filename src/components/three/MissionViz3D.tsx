import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DSN_STATIONS } from '../../../shared/constants/physicsConstants';
import {
  afterDraw,
  createCompositeSatelliteGroup,
  createProceduralPlanetTexture,
  createRendererAndEnv,
  createStarfieldPoints,
  detectSoftwareGl,
  disposeScene,
} from './threeHelpers';

interface MissionViz3DProps {
  planet: 'EARTH' | 'MOON' | 'MARS';
  altitudeKm: number;
  inclinationDeg: number;
  showGroundTrack: boolean;
  showSwath: boolean;
  showDsnLinks: boolean;
}

function latLonToVec3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lon)
  );
}

export const MissionViz3D: React.FC<MissionViz3DProps> = ({
  planet,
  altitudeKm,
  inclinationDeg,
  showGroundTrack,
  showSwath,
  showDsnLinks,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const flagsRef = useRef({ showGroundTrack, showSwath, showDsnLinks });
  flagsRef.current = { showGroundTrack, showSwath, showDsnLinks };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const { renderer, envTexture } = createRendererAndEnv(container, isSoftwareGl);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || 640) / (container.clientHeight || 400),
      0.1,
      120
    );
    camera.position.set(0, 2.8, 6.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.minDistance = 3.2;
    controls.maxDistance = 12;

    const sun = new THREE.DirectionalLight(0xfff7e6, 2.0);
    sun.position.set(9, 4, 6);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x4fc3f7, 0x040812, 0.38));

    scene.add(createStarfieldPoints(800));

    const planetRadius = 2.0;
    const pTex = createProceduralPlanetTexture(planet, renderer.capabilities.getMaxAnisotropy());
    const planetGroup = new THREE.Group();
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(planetRadius, 44, 44),
      new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.72, metalness: 0.08 })
    );
    planetGroup.add(planetMesh);

    // DSN ground stations attached to rotating planet
    const stationMeshes: THREE.Mesh[] = [];
    DSN_STATIONS.forEach((st) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      m.position.copy(latLonToVec3(st.latDeg, st.lonDeg, planetRadius * 1.01));
      planetGroup.add(m);
      stationMeshes.push(m);
    });

    // Progressive Sinusoidal Ground Track drawn on planet surface
    const maxTrackPoints = 220;
    const trackPositions = new Float32Array(maxTrackPoints * 3);
    const trackGeo = new THREE.BufferGeometry();
    trackGeo.setAttribute('position', new THREE.BufferAttribute(trackPositions, 3));
    trackGeo.setDrawRange(0, 0);
    const trackLine = new THREE.Line(
      trackGeo,
      new THREE.LineBasicMaterial({ color: 0xfacc15 })
    );
    planetGroup.add(trackLine);

    scene.add(planetGroup);

    // Orbit ring
    const orbitR = planetRadius + Math.min(1.6, Math.max(0.32, altitudeKm / 1100));
    const incRad = (inclinationDeg * Math.PI) / 180;
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      orbitPts.push(
        new THREE.Vector3(
          Math.cos(a) * orbitR,
          Math.sin(a) * orbitR * Math.sin(incRad),
          Math.sin(a) * orbitR * Math.cos(incRad)
        )
      );
    }
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.5 })
      )
    );

    const sat = createCompositeSatelliteGroup();
    scene.add(sat);

    const swathCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, orbitR - planetRadius * 0.96, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    scene.add(swathCone);

    // DSN Link Laser Lines (3 stations)
    const linkLines: THREE.Line[] = DSN_STATIONS.map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x10b981 }));
      scene.add(l);
      return l;
    });

    const _satPos = new THREE.Vector3();
    const _localSat = new THREE.Vector3();
    const _dir = new THREE.Vector3();
    const _up = new THREE.Vector3(0, 1, 0);
    const _stWorld = new THREE.Vector3();
    const _origin = new THREE.Vector3(0, 0, 0);

    let theta = 0;
    let trackCount = 0;
    let lastTrackSample = 0;
    let frameId = 0;
    let disposed = false;

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());

      planetGroup.rotation.y += dt * 0.1;
      theta += dt * 0.85;

      _satPos.set(
        Math.cos(theta) * orbitR,
        Math.sin(theta) * orbitR * Math.sin(incRad),
        Math.sin(theta) * orbitR * Math.cos(incRad)
      );
      sat.position.copy(_satPos);
      sat.lookAt(_origin);
      sat.rotateX(Math.PI / 2);

      swathCone.visible = flagsRef.current.showSwath;
      if (swathCone.visible) {
        _dir.copy(_satPos).normalize();
        const len = orbitR - planetRadius * 0.96;
        swathCone.position.copy(_dir).multiplyScalar(planetRadius * 0.96 + len * 0.5);
        swathCone.quaternion.setFromUnitVectors(_up, _dir);
      }

      // Ground track sampling
      trackLine.visible = flagsRef.current.showGroundTrack;
      lastTrackSample += dt;
      if (lastTrackSample > 0.08) {
        lastTrackSample = 0;
        _localSat.copy(_satPos).applyAxisAngle(_up, -planetGroup.rotation.y).normalize().multiplyScalar(planetRadius * 1.012);
        const attr = trackGeo.getAttribute('position') as THREE.BufferAttribute;
        if (trackCount < maxTrackPoints) {
          attr.setXYZ(trackCount, _localSat.x, _localSat.y, _localSat.z);
          trackCount += 1;
        } else {
          for (let i = 0; i < maxTrackPoints - 1; i++) {
            attr.setXYZ(i, attr.getX(i + 1), attr.getY(i + 1), attr.getZ(i + 1));
          }
          attr.setXYZ(maxTrackPoints - 1, _localSat.x, _localSat.y, _localSat.z);
        }
        attr.needsUpdate = true;
        trackGeo.setDrawRange(0, trackCount);
      }

      // DSN links when station is on visible hemisphere facing satellite
      stationMeshes.forEach((stMesh, idx) => {
        const line = linkLines[idx];
        if (!flagsRef.current.showDsnLinks) {
          line.visible = false;
          return;
        }
        stMesh.getWorldPosition(_stWorld);
        const dot = _stWorld.clone().normalize().dot(_satPos.clone().normalize());
        if (dot > 0.25) {
          line.visible = true;
          const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
          pos.setXYZ(0, _satPos.x, _satPos.y, _satPos.z);
          pos.setXYZ(1, _stWorld.x, _stWorld.y, _stWorld.z);
          pos.needsUpdate = true;
        } else {
          line.visible = false;
        }
      });

      controls.update();
      renderer.render(scene, camera);
      if (isSoftwareGl) frameId = afterDraw(renderer, tick);
      else frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      pTex.dispose();
      disposeScene(scene);
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planet, altitudeKm, inclinationDeg]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full bg-[#040812] rounded overflow-hidden border border-[#4FC3F7]/25"
    />
  );
};
