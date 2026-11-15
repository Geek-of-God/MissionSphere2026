import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  afterDraw,
  createCompositeSatelliteGroup,
  createProceduralPlanetTexture,
  createRendererAndEnv,
  createStarfieldPoints,
  detectSoftwareGl,
  disposeScene,
} from './threeHelpers';

interface LaunchViewport3DProps {
  progress: number; // 0 to 100
  planet: 'EARTH' | 'MOON' | 'MARS';
}

export const LaunchViewport3D: React.FC<LaunchViewport3DProps> = ({ progress, planet }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

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
      (container.clientWidth || 640) / (container.clientHeight || 340),
      0.1,
      120
    );
    camera.position.set(2.5, 1.5, 5.5);

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.0);
    sun.position.set(8, 6, 4);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x4fc3f7, 0x040812, 0.35));

    const stars = createStarfieldPoints(700);
    scene.add(stars);

    // Curved Planet Horizon below
    const pTex = createProceduralPlanetTexture(planet, renderer.capabilities.getMaxAnisotropy());
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(6.5, 48, 48),
      new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.78 })
    );
    planetMesh.position.set(0, -7.2, 0);
    scene.add(planetMesh);

    // Multi-stage Rocket Group
    const rocketGroup = new THREE.Group();

    const stage1 = new THREE.Group();
    const s1Body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 1.15, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.35, roughness: 0.35 })
    );
    const s1Nozzle = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.18, 14),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 })
    );
    s1Nozzle.position.y = -0.64;
    const plume = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.55, 12),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.85 })
    );
    plume.rotation.x = Math.PI;
    plume.position.y = -0.98;
    stage1.add(s1Body, s1Nozzle, plume);
    rocketGroup.add(stage1);

    const stage2 = new THREE.Group();
    const s2Body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.14, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.4 })
    );
    s2Body.position.y = 0.85;
    stage2.add(s2Body);
    rocketGroup.add(stage2);

    // Fairing nosecone
    const fairing = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.52, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.35 })
    );
    fairing.position.y = 1.38;
    rocketGroup.add(fairing);

    // Payload satellite revealed after fairing jettison
    const payloadSat = createCompositeSatelliteGroup();
    payloadSat.scale.setScalar(0.55);
    payloadSat.position.y = 1.25;
    payloadSat.visible = false;
    rocketGroup.add(payloadSat);

    scene.add(rocketGroup);

    // Trajectory arc line
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      arcPts.push(new THREE.Vector3(t * 2.8, -0.5 + Math.sin(t * Math.PI * 0.6) * 2.4, -t * 1.4));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    const arcLine = new THREE.Line(
      arcGeo,
      new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.5 })
    );
    scene.add(arcLine);

    let frameId = 0;
    let disposed = false;

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const tick = () => {
      if (disposed) return;
      const pct = Math.max(0, Math.min(100, progressRef.current)) / 100;

      // Ascent along ballistic arc
      const rx = pct * 2.6;
      const ry = -0.3 + Math.sin(pct * Math.PI * 0.58) * 2.2;
      const rz = -pct * 1.2;
      rocketGroup.position.set(rx, ry, rz);
      rocketGroup.rotation.z = -pct * 1.15;

      // Stage 1 separation at 45%
      if (pct > 0.45) {
        const sep = (pct - 0.45) * 4.5;
        stage1.position.set(-sep * 0.4, -sep * 0.9, 0);
        plume.visible = false;
      } else {
        stage1.position.set(0, 0, 0);
        plume.visible = pct > 0.03;
        plume.scale.y = 0.8 + Math.sin(performance.now() * 0.03) * 0.25;
      }

      // Fairing jettison & satellite deploy at 72%
      if (pct > 0.72) {
        fairing.visible = false;
        payloadSat.visible = true;
        payloadSat.rotation.y += 0.02;
      } else {
        fairing.visible = true;
        payloadSat.visible = false;
      }

      camera.position.set(rx + 2.4, ry + 1.1, rz + 4.4);
      camera.lookAt(rx, ry + 0.4, rz);
      planetMesh.rotation.y += 0.0005;

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
      pTex.dispose();
      disposeScene(scene);
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planet]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full bg-[#040812] rounded overflow-hidden border border-[#4FC3F7]/25"
    />
  );
};
