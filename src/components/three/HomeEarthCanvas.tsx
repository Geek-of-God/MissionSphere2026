import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  afterDraw,
  createProceduralPlanetTexture,
  createRendererAndEnv,
  createStarfieldPoints,
  detectSoftwareGl,
  disposeScene,
} from './threeHelpers';

export const HomeEarthCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const { renderer, envTexture } = createRendererAndEnv(container, isSoftwareGl);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 1280) / (container.clientHeight || 720),
      0.1,
      100
    );
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, -1.6, 0);

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.9);
    keyLight.position.set(7, 4, 2);
    scene.add(keyLight);

    const hemi = new THREE.HemisphereLight(0x4fc3f7, 0x040812, 0.35);
    scene.add(hemi);

    const stars = createStarfieldPoints(600);
    scene.add(stars);

    const tex = createProceduralPlanetTexture('EARTH', renderer.capabilities.getMaxAnisotropy());
    const earthGeo = new THREE.SphereGeometry(3.8, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.72,
      metalness: 0.08,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(0, -3.55, -1.2);
    scene.add(earth);

    // Subtle atmospheric rim glow
    const atmoGeo = new THREE.SphereGeometry(3.92, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.11,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    atmo.position.copy(earth.position);
    scene.add(atmo);

    let frameId = 0;
    let disposed = false;

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      const dt = clock.getDelta();
      earth.rotation.y += dt * 0.035;
      stars.rotation.y += dt * 0.004;
      renderer.render(scene, camera);
      if (isSoftwareGl) {
        frameId = afterDraw(renderer, tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };
    tick();

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      disposeScene(scene);
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-65"
      aria-hidden="true"
    />
  );
};
