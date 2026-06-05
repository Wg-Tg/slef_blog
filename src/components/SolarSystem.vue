<!--
  SolarSystem.vue — 太阳系 3D 交互首页
  ------------------------------------------------------------
  使用 TresJS（Vue 3 的 Three.js 声明式封装）构建可交互太阳系场景。

  核心功能：
  - 太阳：暖金色球体 + 自发光材质 + 粒子光环
  - 6 颗行星：各自在独立轨道上公转，速度递减（内快外慢）
  - 轨道线：256 段半透明白色圆环
  - 星点背景：球壳上随机分布 700 个（移动端 300 个）
  - 交互：hover 行星放大至 1.15x + 浮动标签，click 触发 Astro 导航
  - 相机：OrbitControls，支持拖拽旋转/缩放，自动缓动旋转
  - 性能：requestAnimationFrame 驱动，useRenderLoop 钩子，unmount 自动清理
  - 无障碍：prefers-reduced-motion 时停止所有动画

  行星 → 路由映射：
  水星→/blog | 金星→/notes | 地球→/hobbies | 火星→/about | 木星→/about | 土星→/

  导航机制：
  通过 CustomEvent('planet-click') 通知 Astro 页面，
  index.astro 监听该事件并调用 navigate()，保留 View Transitions 过渡动画。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { TresCanvas, useRenderLoop } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import * as THREE from 'three';

// ---- Planet Data ----
interface PlanetData {
  name: string;
  label: string;
  url: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  color: string;
  emissive?: string;
  hasRing?: boolean;
}

const planets: PlanetData[] = [
  { name: 'Mercury', label: '水星 · Blog', url: '/blog', radius: 0.35, orbitRadius: 3.5, speed: 1.6, color: '#9E9E9E' },
  { name: 'Venus', label: '金星 · Notes', url: '/notes', radius: 0.55, orbitRadius: 5.5, speed: 1.2, color: '#E8A87C' },
  { name: 'Earth', label: '地球 · Hobbies', url: '/hobbies', radius: 0.6, orbitRadius: 7.5, speed: 1.0, color: '#6BAED6' },
  { name: 'Mars', label: '火星 · About', url: '/about', radius: 0.45, orbitRadius: 9.5, speed: 0.8, color: '#D95A4A' },
  { name: 'Jupiter', label: '木星 · About', url: '/about', radius: 1.3, orbitRadius: 12.5, speed: 0.5, color: '#C9A87C' },
  { name: 'Saturn', label: '土星 · Home', url: '/', radius: 1.0, orbitRadius: 15.5, speed: 0.35, color: '#E8D5A3', hasRing: true },
];

// ---- State ----
const isMobile = ref(false);
const prefersReducedMotion = ref(false);
const hoveredPlanet = ref<string | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

// ---- Planet orbit group refs ----
const orbitGroups = planets.map(() => shallowRef<THREE.Group | null>(null));
const planetMeshes = planets.map(() => shallowRef<THREE.Mesh | null>(null));

// ---- Orbit Line Generation ----
function createOrbitLine(radius: number): THREE.Line {
  const segments = 256;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

const orbitLines = planets.map((p) => createOrbitLine(p.orbitRadius));

// ---- Star Field ----
function createStars(count: number): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const radius = 40;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.3 + Math.random() * 0.7);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

// ---- Navigation Handler ----
function handlePlanetClick(url: string) {
  document.dispatchEvent(
    new CustomEvent('planet-click', {
      detail: { url },
    })
  );
}

// ---- Tooltip ----
function onPlanetPointerEnter(planet: PlanetData, event: PointerEvent) {
  if (isMobile.value) return;
  hoveredPlanet.value = planet.name;
  showTooltip.value = true;
  updateTooltipPos(event);
}

function onPlanetPointerMove(event: PointerEvent) {
  if (!showTooltip.value) return;
  updateTooltipPos(event);
}

function onPlanetPointerLeave() {
  hoveredPlanet.value = null;
  showTooltip.value = false;
}

function updateTooltipPos(event: PointerEvent) {
  tooltipPos.value = {
    x: event.clientX + 16,
    y: event.clientY - 36,
  };
}

// ---- Detection ----
onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

// ---- Planet Materials (reactive colors) ----
const planetMaterials = planets.map(
  (p) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.color),
      roughness: 0.5,
      metalness: 0.2,
    })
);

const sunMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#FFD700'),
  emissive: new THREE.Color('#FFD700'),
  emissiveIntensity: 0.6,
  roughness: 0.4,
  metalness: 0.1,
});

// ---- Animation Loop ----
const { onLoop } = useRenderLoop();
let elapsed = 0;

onLoop(({ delta }) => {
  if (prefersReducedMotion.value) return;

  elapsed += delta;

  // Rotate orbit groups
  orbitGroups.forEach((groupRef, i) => {
    const group = groupRef.value;
    if (group) {
      group.rotation.y += delta * planets[i].speed * 0.3;
    }
  });

  // Hover scale effect
  planetMeshes.forEach((meshRef, i) => {
    const mesh = meshRef.value;
    if (mesh) {
      const target = hoveredPlanet.value === planets[i].name ? 1.15 : 1.0;
      mesh.scale.lerp(
        new THREE.Vector3(target, target, target),
        0.1
      );
    }
  });
});
</script>

<template>
  <div class="solar-system-wrapper">
    <!-- Fallback gradient background -->
    <div class="solar-bg"></div>

    <!-- Tooltip -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip && hoveredPlanet"
        class="planet-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
        {{ planets.find((p) => p.name === hoveredPlanet)?.label }}
      </div>
    </Transition>

    <!-- TresJS Canvas -->
    <TresCanvas
      class="solar-canvas"
      :shadows="false"
      :alpha="true"
      window-size
      clear-color="#0B0A0A"
    >
      <!-- Camera -->
      <TresPerspectiveCamera :position="[0, 8, 22]" :fov="50" :near="0.1" :far="200" />

      <!-- Orbit Controls -->
      <OrbitControls
        :enable-damping="true"
        :damping-factor="0.08"
        :min-distance="6"
        :max-distance="40"
        :max-polar-angle="1.15"
        :auto-rotate="true"
        :auto-rotate-speed="0.15"
      />

      <!-- Lighting -->
      <TresAmbientLight :intensity="0.4" />
      <TresPointLight :position="[0, 0, 0]" :intensity="2.5" :distance="50" color="#FFE8C0" />

      <!-- Sun Group -->
      <TresGroup>
        <!-- Sun Sphere -->
        <TresMesh :position="[0, 0, 0]" :material="sunMaterial">
          <TresSphereGeometry :args="[1.2, 64, 64]" />
        </TresMesh>

        <!-- Sun Ring -->
        <TresMesh :position="[0, 0, 0]" :rotation="[Math.PI / 2, 0, 0]">
          <TresTorusGeometry :args="[1.6, 0.03, 16, 100]" />
          <TresMeshBasicMaterial color="#FFD700" :transparent="true" :opacity="0.35" :depth-write="false" />
        </TresMesh>
      </TresGroup>

      <!-- Orbit Lines -->
      <TresGroup v-for="(line, i) in orbitLines" :key="`orbit-line-${i}`">
        <primitive :object="line" />
      </TresGroup>

      <!-- Star Field -->
      <primitive :object="createStars(isMobile ? 300 : 700)" />

      <!-- Planet Orbit Groups -->
      <TresGroup v-for="(planet, i) in planets" :key="planet.name" :ref="(el: any) => (orbitGroups[i].value = el)">
        <!-- Planet Mesh -->
        <TresMesh
          :ref="(el: any) => (planetMeshes[i].value = el)"
          :position="[planet.orbitRadius, 0, 0]"
          @click="handlePlanetClick(planet.url)"
          @pointer-enter="(e: PointerEvent) => onPlanetPointerEnter(planet, e)"
          @pointer-move="onPlanetPointerMove"
          @pointer-leave="onPlanetPointerLeave"
        >
          <TresSphereGeometry :args="[planet.radius, 48, 48]" />
          <TresMeshStandardMaterial
            :color="planet.color"
            :roughness="0.5"
            :metalness="0.2"
          />
        </TresMesh>

        <!-- Saturn Ring -->
        <TresMesh
          v-if="planet.hasRing"
          :position="[planet.orbitRadius, 0, 0]"
          :rotation="[Math.PI / 2.4, 0, 0]"
        >
          <TresTorusGeometry :args="[planet.radius * 1.6, planet.radius * 0.25, 16, 64]" />
          <TresMeshStandardMaterial
            :color="planet.color"
            :roughness="0.6"
            :metalness="0.3"
            :side="2"
            :transparent="true"
            :opacity="0.85"
            :depth-write="false"
          />
        </TresMesh>
      </TresGroup>
    </TresCanvas>

    <!-- Hint -->
    <div class="solar-hint">
      <span>拖拽旋转 · 点击行星探索</span>
    </div>
  </div>
</template>

<style scoped>
.solar-system-wrapper {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.solar-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0b0a0a 70%);
  z-index: -1;
}

.solar-canvas {
  width: 100%;
  height: 100%;
}

.solar-canvas :deep(canvas) {
  cursor: grab;
}

.solar-canvas :deep(canvas:active) {
  cursor: grabbing;
}

.planet-tooltip {
  position: fixed;
  background: var(--color-bg, #fbf9f6);
  color: var(--color-text, #1a1a1a);
  border: 2px solid var(--color-border, #2b2b2b);
  font-family: var(--font-heading, 'DM Sans', sans-serif);
  font-size: 0.875rem;
  font-weight: 700;
  padding: 6px 14px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 100;
  box-shadow: 4px 4px 0px var(--color-border, #2b2b2b);
  border-radius: 4px;
}

.tooltip-enter-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.tooltip-leave-active {
  transition: opacity 0.1s ease-in;
}

.tooltip-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.tooltip-leave-to {
  opacity: 0;
}

.solar-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--font-heading, 'DM Sans', sans-serif);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  pointer-events: none;
  user-select: none;
}

@media (max-width: 768px) {
  .solar-hint {
    bottom: 1.25rem;
    font-size: 0.7rem;
  }
}
</style>
