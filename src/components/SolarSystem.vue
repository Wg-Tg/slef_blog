<!--
  SolarSystem.vue — 太阳系 3D 交互首页
  ------------------------------------------------------------
  3D 场景通过 SceneObjects 子组件程序化构建，
  本组件负责 UI 层（tooltip、提示文字、背景）。
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import SceneObjects from './SceneObjects.vue';

// ---- 行星数据（与 SceneObjects 共享） ----
interface PlanetDef {
  name: string;
  label: string;
  url: string;
  radius: number;
  orbitRadius: number;
  speed: number;
  color: string;
  hasRing?: boolean;
}

const planets: PlanetDef[] = [
  { name: 'Mercury', label: '水星 · Blog',   url: '/blog',    radius: 0.35, orbitRadius: 3.5,  speed: 1.6,  color: '#9E9E9E' },
  { name: 'Venus',   label: '金星 · Notes',  url: '/notes',   radius: 0.55, orbitRadius: 5.5,  speed: 1.2,  color: '#E8A87C' },
  { name: 'Earth',   label: '地球 · Hobbies',url: '/hobbies', radius: 0.6,  orbitRadius: 7.5,  speed: 1.0,  color: '#6BAED6' },
  { name: 'Mars',    label: '火星 · About',  url: '/about',   radius: 0.45, orbitRadius: 9.5,  speed: 0.8,  color: '#D95A4A' },
  { name: 'Jupiter', label: '木星 · About',  url: '/about',   radius: 1.3,  orbitRadius: 12.5, speed: 0.5,  color: '#C9A87C' },
  { name: 'Saturn',  label: '土星 · Home',   url: '/',        radius: 1.0,  orbitRadius: 15.5, speed: 0.35, color: '#E8D5A3', hasRing: true },
];

// ---- 状态 ----
const isMobile = ref(false);
const showTooltip = ref(false);
const tooltipLabel = ref('');
const tooltipPos = ref({ x: 0, y: 0 });

onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;
});

// ---- 行星 hover ----
function onPlanetHover(name: string | null, event: PointerEvent | null) {
  if (name && event) {
    const p = planets.find((x) => x.name === name);
    tooltipLabel.value = p?.label ?? name;
    tooltipPos.value = { x: event.clientX + 16, y: event.clientY - 36 };
    showTooltip.value = true;
  } else {
    showTooltip.value = false;
  }
}

// ---- 行星点击 ----
function onPlanetClick(url: string) {
  document.dispatchEvent(new CustomEvent('planet-click', { detail: { url } }));
}
</script>

<template>
  <div class="solar-system-wrapper">
    <div class="solar-bg"></div>

    <!-- 浮动标签 -->
    <Transition name="tooltip">
      <div
        v-if="showTooltip"
        class="planet-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >
        {{ tooltipLabel }}
      </div>
    </Transition>

    <!-- 3D 场景 -->
    <TresCanvas
      class="solar-canvas"
      :alpha="true"
      window-size
      clear-color="#0B0A0A"
    >
      <TresPerspectiveCamera :position="[0, 8, 22]" :fov="50" :near="0.1" :far="200" />
      <OrbitControls
        :enable-damping="true"
        :damping-factor="0.08"
        :min-distance="6"
        :max-distance="40"
        :max-polar-angle="1.15"
        :auto-rotate="true"
        :auto-rotate-speed="0.15"
      />
      <TresAmbientLight :intensity="0.4" />
      <TresPointLight :position="[0, 0, 0]" :intensity="2.5" :distance="50" color="#FFE8C0" />

      <!-- 太阳 -->
      <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry :args="[1.2, 64, 64]" />
        <TresMeshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          :emissive-intensity="0.6"
          :roughness="0.4"
          :metalness="0.1"
        />
      </TresMesh>

      <!-- 太阳光环 -->
      <TresMesh :rotation="[Math.PI / 2, 0, 0]">
        <TresTorusGeometry :args="[1.6, 0.03, 16, 100]" />
        <TresMeshBasicMaterial color="#FFD700" :transparent="true" :opacity="0.35" :depth-write="false" />
      </TresMesh>

      <!-- 程序化对象：轨道线 + 星点 + 行星系统 -->
      <SceneObjects
        :planets="planets"
        :is-mobile="isMobile"
        @planet-click="onPlanetClick"
        @planet-hover="onPlanetHover"
      />
    </TresCanvas>

    <div class="solar-hint">拖拽旋转 · 点击行星探索</div>
  </div>
</template>

<style scoped>
.solar-system-wrapper { position: fixed; inset: 0; overflow: hidden; }
.solar-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, #1a1a2e 0%, #0b0a0a 70%);
  z-index: -1;
}
.solar-canvas { width: 100%; height: 100%; }
.solar-canvas :deep(canvas) { cursor: grab; }
.solar-canvas :deep(canvas:active) { cursor: grabbing; }

.planet-tooltip {
  position: fixed;
  background: #FBF9F6; color: #1A1A1A;
  border: 2px solid #2B2B2B;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  padding: 6px 14px; white-space: nowrap;
  pointer-events: none; z-index: 100;
  box-shadow: 4px 4px 0px #2B2B2B; border-radius: 4px;
}
.tooltip-enter-active { transition: opacity 0.15s ease-out, transform 0.15s ease-out; }
.tooltip-leave-active { transition: opacity 0.1s ease-in; }
.tooltip-enter-from { opacity: 0; transform: translateY(4px); }
.tooltip-leave-to { opacity: 0; }

.solar-hint {
  position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.4); font-family: sans-serif;
  font-size: 0.8rem; letter-spacing: 0.05em;
  pointer-events: none; user-select: none;
}
@media (max-width: 768px) { .solar-hint { bottom: 1.25rem; font-size: 0.7rem; } }
</style>
