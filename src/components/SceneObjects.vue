<!--
  SceneObjects.vue — 太阳系程序化场景对象
  ------------------------------------------------------------
  使用 Canvas 生成程序化行星纹理，通过 useTres() 构建场景。
  使用 unref() 兼容 TresJS 返回的 ref/raw 值。
-->
<script setup lang="ts">
import { onMounted, unref } from 'vue';
import { useTres, useLoop } from '@tresjs/core';
import * as THREE from 'three';

// ---- 行星定义 ----
interface PlanetDef {
  name: string; label: string; url: string;
  radius: number; orbitRadius: number; speed: number;
  textureGen: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  hasRing?: boolean; hasAtmosphere?: boolean;
}

const planets: PlanetDef[] = [
  { name: 'Mercury', label: '水星 · Blog',    url: '/blog',    radius: 0.3,  orbitRadius: 3.5,  speed: 1.6,  textureGen: genMercury },
  { name: 'Venus',   label: '金星 · Notes',   url: '/notes',   radius: 0.55, orbitRadius: 5.5,  speed: 1.2,  textureGen: genVenus },
  { name: 'Earth',   label: '地球 · Hobbies', url: '/hobbies', radius: 0.6,  orbitRadius: 7.5,  speed: 1.0,  textureGen: genEarth, hasAtmosphere: true },
  { name: 'Mars',    label: '火星 · About',   url: '/about',   radius: 0.4,  orbitRadius: 9.5,  speed: 0.8,  textureGen: genMars },
  { name: 'Jupiter', label: '木星 · About',   url: '/about',   radius: 1.3,  orbitRadius: 12.5, speed: 0.5,  textureGen: genJupiter },
  { name: 'Saturn',  label: '土星 · Home',    url: '/',        radius: 1.0,  orbitRadius: 15.5, speed: 0.35, textureGen: genSaturn, hasRing: true },
];

// ===== 程序化纹理 =====
function noise2d(x: number, y: number, s: number): number {
  return Math.sin(x * 12.9898 + y * 78.233 + s) * 43758.5453 % 1;
}
function applyNoise(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, alpha: number, r: number, g: number, b: number, seed: number) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = (noise2d(x / scale, y / scale, seed) + 1) / 2;
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i] * (1 - alpha) + r * alpha * v;
      img.data[i + 1] = img.data[i + 1] * (1 - alpha) + g * alpha * v;
      img.data[i + 2] = img.data[i + 2] * (1 - alpha) + b * alpha * v;
    }
  ctx.putImageData(img, 0, 0);
}

function genMercury(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#B0A89C'; ctx.fillRect(0, 0, w, h);
  applyNoise(ctx, w, h, 8, 0.35, 158, 150, 136, 1);
  applyNoise(ctx, w, h, 20, 0.25, 138, 130, 120, 2);
  for (let i = 0; i < 80; i++) {
    const cx = Math.random() * w, cy = Math.random() * h, rr = 1 + Math.random() * 4;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fillStyle = '#8A8278'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 0.5, cy - 0.5, rr * 0.8, 0, Math.PI * 2); ctx.fillStyle = '#C5BDB0'; ctx.fill();
  }
}
function genVenus(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#E8C89E'; ctx.fillRect(0, 0, w, h);
  applyNoise(ctx, w, h, 6, 0.5, 212, 168, 124, 1);
  applyNoise(ctx, w, h, 20, 0.35, 240, 212, 176, 2);
  applyNoise(ctx, w, h, 12, 0.3, 200, 152, 112, 3);
}
function genEarth(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3A75C4'); g.addColorStop(0.5, '#2E6AB0'); g.addColorStop(1, '#3A75C4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  applyNoise(ctx, w, h, 4, 0.6, 90, 158, 75, 10);
  applyNoise(ctx, w, h, 7, 0.4, 109, 174, 91, 11);
  applyNoise(ctx, w, h, 15, 0.3, 139, 115, 85, 12);
  applyNoise(ctx, w, h, 3, 0.5, 74, 124, 63, 13);
  applyNoise(ctx, w, h, 10, 0.3, 255, 255, 255, 20);
  ctx.fillStyle = 'rgba(240,245,255,0.7)'; ctx.fillRect(0, 0, w, h * 0.1); ctx.fillRect(0, h * 0.9, w, h * 0.1);
}
function genMars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#D4785A'); g.addColorStop(0.5, '#C45A3A'); g.addColorStop(1, '#D4785A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  applyNoise(ctx, w, h, 6, 0.4, 176, 74, 42, 1);
  applyNoise(ctx, w, h, 15, 0.3, 139, 58, 32, 2);
  applyNoise(ctx, w, h, 4, 0.35, 224, 136, 96, 3);
}
function genJupiter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#D4B896'); g.addColorStop(0.35, '#E8C898'); g.addColorStop(0.5, '#C49A6C'); g.addColorStop(0.7, '#C09060'); g.addColorStop(1, '#C8A070');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const colors = ['#C89860', '#E0C090', '#B88858', '#D4B080', '#C49868', '#E8C898', '#B08050', '#D0A870'];
  for (let i = 0; i < 28; i++) { ctx.fillStyle = colors[i % 8]; ctx.fillRect(0, (i / 28) * h, w, h / 28 * (0.6 + Math.random() * 0.4)); }
  applyNoise(ctx, w, h, 3, 0.25, 200, 152, 96, 1);
  applyNoise(ctx, w, h, 12, 0.15, 224, 192, 144, 2);
  const sx = w * 0.45, sy = h * 0.38;
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.12);
  sg.addColorStop(0, '#E87860'); sg.addColorStop(0.5, '#D06048'); sg.addColorStop(1, 'rgba(200,140,100,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(sx, sy, w * 0.1, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
}
function genSaturn(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#E8D8B0'; ctx.fillRect(0, 0, w, h);
  [{ y: 0.1, h: 0.1, c: '#DCC898' }, { y: 0.25, h: 0.08, c: '#E8D8B8' }, { y: 0.4, h: 0.12, c: '#D4C090' }, { y: 0.55, h: 0.08, c: '#E0D0A8' }, { y: 0.7, h: 0.1, c: '#D8C898' }, { y: 0.85, h: 0.08, c: '#E8D8B0' }]
    .forEach(b => { ctx.fillStyle = b.c; ctx.fillRect(0, b.y * h, w, b.h * h); });
  applyNoise(ctx, w, h, 10, 0.12, 208, 192, 144, 1);
}

function makeTexture(gen: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = size;
  gen(c.getContext('2d')!, size, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  return t;
}

// ===== 组件逻辑 =====
const props = defineProps<{ isMobile: boolean }>();
const emit = defineEmits<{ 'planet-click': [url: string]; 'planet-hover': [name: string | null, event: PointerEvent | null] }>();

const { onRender } = useLoop();
const tres = useTres();

const orbitGroups: THREE.Group[] = [];
const planetMeshes: THREE.Mesh[] = [];
let hoveredName: string | null = null;
let prefersReducedMotion = false;

onMounted(() => {
  // 使用 unref 兼容 ref 和原始值
  const s = unref(tres.scene) as THREE.Scene | null;
  if (!s) { console.error('[SceneObjects] scene is null after unref'); return; }
  if (typeof s.add !== 'function') { console.error('[SceneObjects] scene.add not a function, got:', Object.prototype.toString.call(s)); return; }

  console.log('[SceneObjects] scene OK, initializing...');
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = props.isMobile;

  // 太阳光晕
  try {
    const gc = document.createElement('canvas'); gc.width = gc.height = 256;
    const gctx = gc.getContext('2d')!;
    const grad = gctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,220,150,1)'); grad.addColorStop(0.15, 'rgba(255,200,100,0.8)');
    grad.addColorStop(0.4, 'rgba(255,150,50,0.25)'); grad.addColorStop(0.7, 'rgba(255,100,20,0.05)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = grad; gctx.fillRect(0, 0, 256, 256);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false }));
    glow.scale.set(8, 8, 1);
    s.add(glow);
  } catch (e) { console.error('[SceneObjects] sun glow failed:', e); }

  // 轨道线
  planets.forEach(p => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * p.orbitRadius, 0, Math.sin(a) * p.orbitRadius)); }
    s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false })));
  });

  // 星点
  const starGroup = new THREE.Group();
  const addStarLayer = (count: number, size: number, opacity: number) => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { const theta = Math.random() * Math.PI * 2; const phi = Math.acos(2 * Math.random() - 1); const r = 40 * (0.3 + Math.random() * 0.7); pos[i * 3] = r * Math.sin(phi) * Math.cos(theta); pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); pos[i * 3 + 2] = r * Math.cos(phi); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGroup.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false })));
  };
  addStarLayer(Math.floor((mobile ? 300 : 800) * 0.7), 0.05, 0.7);
  addStarLayer(Math.floor((mobile ? 300 : 800) * 0.15), 0.15, 0.9);
  addStarLayer(Math.floor((mobile ? 300 : 800) * 0.15), 0.03, 0.5);
  s.add(starGroup);

  // 行星
  planets.forEach(planet => {
    const group = new THREE.Group(); s.add(group); orbitGroups.push(group);
    const tex = makeTexture(planet.textureGen, planet.name === 'Jupiter' ? 1024 : 512);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: planet.name === 'Earth' ? 0.55 : 0.7, metalness: 0.05 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 64, 64), mat);
    mesh.position.x = planet.orbitRadius; mesh.userData = { url: planet.url, name: planet.name };
    group.add(mesh); planetMeshes.push(mesh);

    if (planet.hasAtmosphere) {
      const aMat = new THREE.MeshStandardMaterial({ color: '#88CCFF', roughness: 1, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.FrontSide });
      const aMesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius * 1.08, 64, 64), aMat);
      aMesh.position.x = planet.orbitRadius; group.add(aMesh);
    }
    if (planet.hasRing) {
      const rc = document.createElement('canvas'); rc.width = 512; rc.height = 64;
      const rctx = rc.getContext('2d')!;
      const rg = rctx.createLinearGradient(0, 0, 512, 0);
      rg.addColorStop(0, 'rgba(200,180,150,0)'); rg.addColorStop(0.1, 'rgba(220,200,160,0.7)'); rg.addColorStop(0.2, 'rgba(240,220,180,0.9)');
      rg.addColorStop(0.35, 'rgba(200,180,150,0.6)'); rg.addColorStop(0.5, 'rgba(220,200,160,0.85)'); rg.addColorStop(0.7, 'rgba(180,160,130,0.4)');
      rg.addColorStop(0.85, 'rgba(200,180,150,0.2)'); rg.addColorStop(1, 'rgba(200,180,150,0)');
      rctx.fillStyle = rg; rctx.fillRect(0, 0, 512, 64);
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(planet.radius * 1.6, planet.radius * 0.25, 32, 128), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(rc), side: THREE.DoubleSide, transparent: true, opacity: 0.85, roughness: 0.7, metalness: 0.1, depthWrite: false }));
      ringMesh.position.x = planet.orbitRadius; ringMesh.rotation.x = Math.PI / 2.4;
      group.add(ringMesh);
    }
  });
  console.log('[SceneObjects] Planets added:', planetMeshes.length);

  // Raycaster
  setupRaycaster();
});

// 动画
onRender(({ delta }: { delta: number }) => {
  if (prefersReducedMotion) return;
  orbitGroups.forEach((g, i) => { g.rotation.y += delta * planets[i].speed * 0.25; });
  planetMeshes.forEach((m, i) => {
    const t = hoveredName === planets[i].name ? 1.12 : 1.0;
    m.scale.lerp(new THREE.Vector3(t, t, t), 0.08);
  });
});

// Raycaster
let raycaster: THREE.Raycaster, mouse: THREE.Vector2, canvasEl: HTMLCanvasElement | null = null;
function setupRaycaster() {
  raycaster = new THREE.Raycaster(); mouse = new THREE.Vector2();
  canvasEl = document.querySelector('canvas');
  if (!canvasEl) { console.warn('[SceneObjects] no canvas element found'); return; }
  canvasEl.addEventListener('pointermove', onPointerMove);
  canvasEl.addEventListener('click', onClick);
}
function onPointerMove(event: PointerEvent) {
  if (!canvasEl) { canvasEl = document.querySelector('canvas'); if (!canvasEl) return; }
  const rect = canvasEl.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  const cam = unref(tres.camera) as THREE.Camera | null;
  if (!cam) return;
  raycaster.setFromCamera(mouse, cam);
  const hits = raycaster.intersectObjects(planetMeshes, false);
  if (hits.length > 0) {
    const name = (hits[0].object as THREE.Mesh).userData.name as string | undefined;
    if (name) { hoveredName = name; emit('planet-hover', name, event); return; }
  }
  hoveredName = null; emit('planet-hover', null, null);
}
function onClick() {
  if (hoveredName) { const p = planets.find(x => x.name === hoveredName); if (p) emit('planet-click', p.url); }
}
</script>

<template>
  <!-- 纯程序化，无 DOM -->
</template>
