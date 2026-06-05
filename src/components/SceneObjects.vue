<!--
  SceneObjects.vue — 太阳系程序化场景对象
  ------------------------------------------------------------
  使用 Canvas 生成程序化行星纹理，通过 useTres() 构建完整太阳系场景。
  所有行星材质均使用 Canvas 2D 程序化生成，无需外部贴图。
-->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useTres, useLoop } from '@tresjs/core';
import * as THREE from 'three';

// ---- 行星定义 ----
interface PlanetDef {
  name: string;
  label: string;
  url: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  textureGen: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  hasRing?: boolean;
  hasAtmosphere?: boolean;
}

const planets: PlanetDef[] = [
  { name: 'Mercury', label: '水星 · Blog',    url: '/blog',    radius: 0.3,  orbitRadius: 3.5,  speed: 1.6, textureGen: genMercuryTexture },
  { name: 'Venus',   label: '金星 · Notes',   url: '/notes',   radius: 0.55, orbitRadius: 5.5,  speed: 1.2, textureGen: genVenusTexture },
  { name: 'Earth',   label: '地球 · Hobbies', url: '/hobbies', radius: 0.6,  orbitRadius: 7.5,  speed: 1.0, textureGen: genEarthTexture, hasAtmosphere: true },
  { name: 'Mars',    label: '火星 · About',   url: '/about',   radius: 0.4,  orbitRadius: 9.5,  speed: 0.8, textureGen: genMarsTexture },
  { name: 'Jupiter', label: '木星 · About',   url: '/about',   radius: 1.3,  orbitRadius: 12.5, speed: 0.5, textureGen: genJupiterTexture },
  { name: 'Saturn',  label: '土星 · Home',    url: '/',        radius: 1.0,  orbitRadius: 15.5, speed: 0.35, textureGen: genSaturnTexture, hasRing: true },
];

// ============================================================
//  程序化纹理生成函数（Canvas 2D）
// ============================================================

// 简易伪随机（用于噪声生成）
function seededRandom(x: number, y: number, s: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s) * 43758.5453;
  return n - Math.floor(n);
}

// 简易 simplex-like 噪声叠加
function noise(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, alpha: number, color: string, seed: number = 0) {
  const imageData = ctx.getImageData(0, 0, w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const v = seededRandom(x / scale, y / scale, seed);
      const idx = (y * w + x) * 4;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      imageData.data[idx] = imageData.data[idx] * (1 - alpha) + r * alpha * v;
      imageData.data[idx + 1] = imageData.data[idx + 1] * (1 - alpha) + g * alpha * v;
      imageData.data[idx + 2] = imageData.data[idx + 2] * (1 - alpha) + b * alpha * v;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// 水平条纹（用于木星、土星）
function horizontalBands(ctx: CanvasRenderingContext2D, w: number, h: number, bands: { y: number; h: number; color: string }[]) {
  bands.forEach((band) => {
    ctx.fillStyle = band.color;
    ctx.fillRect(0, band.y * h, w, band.h * h);
  });
}

// 圆形斑点（用于水星陨石坑）
function addCraters(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, baseColor: string, craterColor: string) {
  for (let i = 0; i < count; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 1 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = craterColor;
    ctx.fill();
    // 亮边
    ctx.beginPath();
    ctx.arc(cx + 0.5, cy - 0.5, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();
  }
}

// 水星：灰褐色 + 陨石坑
function genMercuryTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#B0A89C';
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, 8, 0.3, '#9E9688', 1);
  noise(ctx, w, h, 20, 0.2, '#8A8278', 2);
  addCraters(ctx, w, h, 80, '#B0A89C', '#8A8278');
  noise(ctx, w, h, 5, 0.15, '#C5BDB0', 4);
}

// 金星：暖橙色云层旋涡
function genVenusTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#E8C89E';
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, 6, 0.5, '#D4A87C', 1);
  noise(ctx, w, h, 20, 0.3, '#F0D4B0', 2);
  noise(ctx, w, h, 12, 0.25, '#C89870', 3);
  // 模糊模拟云层
  ctx.filter = 'blur(1.5px)';
  noise(ctx, w, h, 8, 0.2, '#E0BC90', 5);
  ctx.filter = 'none';
}

// 地球：蓝色海洋 + 绿棕色大陆 + 白色云层
function genEarthTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 海洋基底
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#3A75C4');
  oceanGrad.addColorStop(0.3, '#4A90D9');
  oceanGrad.addColorStop(0.5, '#2E6AB0');
  oceanGrad.addColorStop(0.7, '#4A90D9');
  oceanGrad.addColorStop(1, '#3A75C4');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // 大陆（使用大尺度噪声模拟）
  noise(ctx, w, h, 4, 0.6, '#5A9E4B', 10);
  noise(ctx, w, h, 7, 0.4, '#6DAE5B', 11);
  noise(ctx, w, h, 15, 0.3, '#8B7355', 12);
  noise(ctx, w, h, 3, 0.5, '#4A7C3F', 13);

  // 冰盖
  ctx.fillStyle = 'rgba(240, 245, 255, 0.7)';
  ctx.fillRect(0, 0, w, h * 0.1);
  ctx.fillRect(0, h * 0.9, w, h * 0.1);

  // 云层（大尺度柔和白色）
  noise(ctx, w, h, 10, 0.35, '#FFFFFF', 20);
  noise(ctx, w, h, 25, 0.2, '#F5F5FF', 21);
}

// 火星：红棕色 + 暗色区域
function genMarsTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#D4785A');
  grad.addColorStop(0.5, '#C45A3A');
  grad.addColorStop(1, '#D4785A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, 6, 0.4, '#B04A2A', 1);
  noise(ctx, w, h, 15, 0.3, '#8B3A20', 2);
  noise(ctx, w, h, 4, 0.35, '#E08860', 3);
  // 极冠
  ctx.fillStyle = 'rgba(255, 248, 240, 0.3)';
  ctx.fillRect(0, 0, w, h * 0.06);
}

// 木星：水平条纹 + 扰动 + 大红斑
function genJupiterTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 基底渐变
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#D4B896');
  base.addColorStop(0.2, '#C8A882');
  base.addColorStop(0.35, '#E8C898');
  base.addColorStop(0.45, '#C49A6C');
  base.addColorStop(0.55, '#D4A878');
  base.addColorStop(0.7, '#C09060');
  base.addColorStop(0.8, '#D4B080');
  base.addColorStop(1, '#C8A070');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // 条纹
  const bandColors = ['#C89860', '#E0C090', '#B88858', '#D4B080', '#C49868', '#E8C898', '#B08050', '#D0A870'];
  for (let i = 0; i < 28; i++) {
    const y = i / 28;
    ctx.fillStyle = bandColors[i % bandColors.length];
    ctx.fillRect(0, y * h, w, h / 28 * (0.6 + Math.random() * 0.4));
  }

  // 扰动噪声
  noise(ctx, w, h, 3, 0.25, '#C89860', 1);
  noise(ctx, w, h, 12, 0.15, '#E0C090', 2);
  noise(ctx, w, h, 8, 0.2, '#B08050', 3);

  // 大红斑
  const spotX = w * 0.45;
  const spotY = h * 0.38;
  const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, w * 0.12);
  spotGrad.addColorStop(0, '#E87860');
  spotGrad.addColorStop(0.5, '#D06048');
  spotGrad.addColorStop(1, 'rgba(200,140,100,0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, w * 0.1, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
}

// 土星：淡黄奶油色 + 细微条纹
function genSaturnTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#E8D8B0';
  ctx.fillRect(0, 0, w, h);
  horizontalBands(ctx, w, h, [
    { y: 0.1, h: 0.1, color: '#DCC898' },
    { y: 0.25, h: 0.08, color: '#E8D8B8' },
    { y: 0.4, h: 0.12, color: '#D4C090' },
    { y: 0.55, h: 0.08, color: '#E0D0A8' },
    { y: 0.7, h: 0.1, color: '#D8C898' },
    { y: 0.85, h: 0.08, color: '#E8D8B0' },
  ]);
  noise(ctx, w, h, 10, 0.12, '#D0C090', 1);
  noise(ctx, w, h, 20, 0.08, '#E8DCC0', 2);
}

// ============================================================
//  纹理生成工具函数
// ============================================================
function generateTexture(genFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  genFn(ctx, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapU = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

// ============================================================
//  主组件逻辑
// ============================================================
const props = defineProps<{
  planets: PlanetDef[];
  isMobile: boolean;
}>();

const emit = defineEmits<{
  'planet-click': [url: string];
  'planet-hover': [name: string | null, event: PointerEvent | null];
}>();

const { scene, camera } = useTres();
const { onRender } = useLoop();

const orbitGroups: THREE.Group[] = [];
const planetMeshes: THREE.Mesh[] = [];
let hoveredName: string | null = null;
let prefersReducedMotion = false;

// ---- 太阳光晕 ----
function createSunGlow(): THREE.Sprite {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d')!;
  const grad = gctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 220, 150, 1)');
  grad.addColorStop(0.15, 'rgba(255, 200, 100, 0.8)');
  grad.addColorStop(0.4, 'rgba(255, 150, 50, 0.25)');
  grad.addColorStop(0.7, 'rgba(255, 100, 20, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 256, 256);

  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(8, 8, 1);
  return sprite;
}

// ---- 轨道线 ----
function addOrbitLine(radius: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false })
  );
  scene.add(line);
}

// ---- 星点背景（大小不一） ----
function createStarField(count: number) {
  const group = new THREE.Group();

  // 小星点
  const positions1 = new Float32Array(Math.floor(count * 0.7) * 3);
  const R = 40;
  for (let i = 0; i < Math.floor(count * 0.7); i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = R * (0.4 + Math.random() * 0.6);
    positions1[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions1[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions1[i * 3 + 2] = r * Math.cos(phi);
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
  group.add(new THREE.Points(g1, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false,
  })));

  // 大亮星点
  const positions2 = new Float32Array(Math.floor(count * 0.15) * 3);
  for (let i = 0; i < Math.floor(count * 0.15); i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = R * (0.3 + Math.random() * 0.7);
    positions2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions2[i * 3 + 2] = r * Math.cos(phi);
  }
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
  const colors = ['#FFFFFF', '#FFE8D0', '#D0E8FF', '#FFD0E8', '#E8FFD0'];
  group.add(new THREE.Points(g2, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false,
  })));

  // 微小闪烁星点
  const positions3 = new Float32Array(Math.floor(count * 0.15) * 3);
  for (let i = 0; i < Math.floor(count * 0.15); i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = R * (0.2 + Math.random() * 0.8);
    positions3[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions3[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions3[i * 3 + 2] = r * Math.cos(phi);
  }
  const g3 = new THREE.BufferGeometry();
  g3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));
  group.add(new THREE.Points(g3, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false,
  })));

  scene.add(group);
}

// ---- 场景初始化 ----
onMounted(() => {
  if (!scene) return;
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = props.isMobile;

  // 太阳光晕（程序化 sprite）
  scene.add(createSunGlow());

  // 轨道线
  props.planets.forEach((p) => addOrbitLine(p.orbitRadius));

  // 星点
  createStarField(mobile ? 300 : 800);

  // 行星系统
  props.planets.forEach((planet) => {
    const group = new THREE.Group();
    scene.add(group);
    orbitGroups.push(group);

    // 程序化纹理
    const texture = generateTexture(planet.textureGen, planet.name === 'Jupiter' ? 1024 : 512);

    // 行星材质
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: planet.name === 'Earth' ? 0.55 : 0.7,
      metalness: 0.05,
    });

    const geo = new THREE.SphereGeometry(planet.radius, 64, 64);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = planet.orbitRadius;
    mesh.userData = { url: planet.url, name: planet.name };
    group.add(mesh);
    planetMeshes.push(mesh);

    // 大气层（地球）
    if (planet.hasAtmosphere) {
      const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.08, 64, 64);
      const atmoMat = new THREE.MeshStandardMaterial({
        color: '#88CCFF',
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const atmo = new THREE.Mesh(atmoGeo, atmoMat);
      atmo.position.x = planet.orbitRadius;
      group.add(atmo);
    }

    // 土星环（程序化纹理环）
    if (planet.hasRing) {
      // 环纹理
      const ringCanvas = document.createElement('canvas');
      ringCanvas.width = 512;
      ringCanvas.height = 64;
      const rctx = ringCanvas.getContext('2d')!;
      const ringGrad = rctx.createLinearGradient(0, 0, 512, 0);
      ringGrad.addColorStop(0, 'rgba(200, 180, 150, 0)');
      ringGrad.addColorStop(0.1, 'rgba(220, 200, 160, 0.7)');
      ringGrad.addColorStop(0.2, 'rgba(240, 220, 180, 0.9)');
      ringGrad.addColorStop(0.35, 'rgba(200, 180, 150, 0.6)');
      ringGrad.addColorStop(0.5, 'rgba(220, 200, 160, 0.85)');
      ringGrad.addColorStop(0.7, 'rgba(180, 160, 130, 0.4)');
      ringGrad.addColorStop(0.85, 'rgba(200, 180, 150, 0.2)');
      ringGrad.addColorStop(1, 'rgba(200, 180, 150, 0)');
      rctx.fillStyle = ringGrad;
      rctx.fillRect(0, 0, 512, 64);

      const ringTex = new THREE.CanvasTexture(ringCanvas);
      const rGeo = new THREE.TorusGeometry(planet.radius * 1.6, planet.radius * 0.25, 32, 128);
      const rMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        roughness: 0.7,
        metalness: 0.1,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.position.x = planet.orbitRadius;
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);
    }
  });

  setupRaycaster();
});

// ---- 动画循环 ----
onRender(({ delta }: { delta: number }) => {
  if (prefersReducedMotion) return;
  orbitGroups.forEach((g, i) => {
    g.rotation.y += delta * props.planets[i].speed * 0.25;
  });
  planetMeshes.forEach((m, i) => {
    const t = hoveredName === props.planets[i].name ? 1.12 : 1.0;
    m.scale.lerp(new THREE.Vector3(t, t, t), 0.08);
  });
});

// ---- Raycaster ----
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let canvasEl: HTMLCanvasElement | null = null;

function setupRaycaster() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  canvasEl = document.querySelector('canvas');
  if (!canvasEl) return;
  canvasEl.addEventListener('pointermove', onPointerMove);
  canvasEl.addEventListener('click', onClick);
}

function onPointerMove(event: PointerEvent) {
  if (!canvasEl) { canvasEl = document.querySelector('canvas'); if (!canvasEl) return; }
  const rect = canvasEl.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const cam = camera;
  if (!cam) return;
  raycaster.setFromCamera(mouse, cam);
  const intersects = raycaster.intersectObjects(planetMeshes, false);

  if (intersects.length > 0) {
    const obj = intersects[0].object as THREE.Mesh;
    const name = obj.userData.name as string | undefined;
    if (name) { hoveredName = name; emit('planet-hover', name, event); return; }
  }
  hoveredName = null;
  emit('planet-hover', null, null);
}

function onClick() {
  if (hoveredName) {
    const planet = props.planets.find((p) => p.name === hoveredName);
    if (planet) emit('planet-click', planet.url);
  }
}
</script>

<template>
  <!-- 纯程序化组件，不渲染 DOM -->
</template>
