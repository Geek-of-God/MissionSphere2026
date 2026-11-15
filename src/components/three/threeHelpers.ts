import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function createRendererAndEnv(
  container: HTMLElement,
  isSoftwareGl: boolean
): { renderer: THREE.WebGLRenderer; envTexture: THREE.Texture } {
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 640, container.clientHeight || 420);
  renderer.setClearColor(0x040812, 1);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  return { renderer, envTexture };
}

export function afterDraw(renderer: THREE.WebGLRenderer, cb: () => void): number {
  try {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          window.setTimeout(cb, 80);
        }
      };
      return window.setTimeout(poll, 6);
    }
  } catch {
    // fallback
  }
  return window.setTimeout(cb, 80);
}

export function createProceduralPlanetTexture(
  body: 'EARTH' | 'MOON' | 'MARS',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (body === 'EARTH') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f2957');
    grad.addColorStop(0.5, '#0B3D91');
    grad.addColorStop(1, '#0f2957');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Continents stylized polygons
    ctx.fillStyle = '#1e5f4b';
    const blobs = [
      [110, 85, 52, 28],
      [140, 155, 34, 42],
      [255, 78, 48, 25],
      [275, 130, 38, 45],
      [345, 82, 72, 34],
      [405, 165, 32, 24],
    ];
    blobs.forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Polar caps
    ctx.fillStyle = '#dce9f7';
    ctx.fillRect(0, 0, w, 14);
    ctx.fillRect(0, h - 14, w, 14);

    // Subtle cloud bands
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.ellipse(
        (i * 67) % w,
        30 + ((i * 29) % (h - 60)),
        26 + (i % 3) * 14,
        6,
        0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (body === 'MOON') {
    ctx.fillStyle = '#737882';
    ctx.fillRect(0, 0, w, h);

    // Maria
    ctx.fillStyle = '#535863';
    [
      [160, 100, 54, 38],
      [280, 95, 45, 32],
      [220, 145, 38, 28],
    ].forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Craters
    for (let i = 0; i < 95; i++) {
      const cx = (i * 53 + 17) % w;
      const cy = (i * 37 + 23) % h;
      const r = 3 + (i % 7) * 1.8;
      ctx.strokeStyle = 'rgba(210, 215, 225, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // MARS
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#c86a3a');
    grad.addColorStop(0.5, '#a8441c');
    grad.addColorStop(1, '#c86a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#732910';
    [
      [150, 115, 64, 30],
      [310, 140, 78, 35],
      [420, 95, 40, 25],
    ].forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, -0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    // Polar CO2 ice caps
    ctx.fillStyle = '#f1e6df';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
  }

  // Subtle lat/lon engineering grid
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.14)';
  ctx.lineWidth = 0.8;
  for (let gx = 0; gx < w; gx += 64) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 32; gy < h; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createCompositeSatelliteGroup(): THREE.Group {
  const group = new THREE.Group();

  // 1. Primary Bus (Gold MLI + Titanium)
  const busGeo = new THREE.BoxGeometry(0.18, 0.14, 0.16);
  const busMat = new THREE.MeshStandardMaterial({
    color: 0xd4a438,
    metalness: 0.78,
    roughness: 0.28,
  });
  const bus = new THREE.Mesh(busGeo, busMat);
  group.add(bus);

  // 2. Solar Wings (Left & Right)
  const wingGeo = new THREE.BoxGeometry(0.46, 0.014, 0.14);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x16428c,
    metalness: 0.55,
    roughness: 0.22,
    emissive: 0x0b2a5e,
    emissiveIntensity: 0.35,
  });
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.35, 0, 0);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.35, 0, 0);
  group.add(leftWing, rightWing);

  // Strut bar
  const strutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.96, 8);
  strutGeo.rotateZ(Math.PI / 2);
  const strutMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });
  group.add(new THREE.Mesh(strutGeo, strutMat));

  // 3. Parabolic High-Gain Dish
  const dishGeo = new THREE.ConeGeometry(0.08, 0.04, 16, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.4,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(0, 0.1, 0);
  dish.rotation.x = Math.PI;
  group.add(dish);

  // 4. Nadir Payload Optical/SAR Barrel
  const sensorGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.08, 12);
  const sensorMat = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    emissive: 0x4fc3f7,
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.25,
  });
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.position.set(0, -0.09, 0);
  group.add(sensor);

  return group;
}

export function createStarfieldPoints(count = 900): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 24 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xcbe8ff, size: 0.11, transparent: true, opacity: 0.75 });
  return new THREE.Points(geo, mat);
}

export function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        });
      } else {
        (mesh.material as THREE.MeshStandardMaterial).map?.dispose();
        mesh.material.dispose();
      }
    }
  });
}
