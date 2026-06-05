<!--
  SolarSystem.vue — 太阳系 3D 交互首页
  ------------------------------------------------------------
  渲染 TresJS 画布 + UI（tooltip、提示文字），
  3D 场景由子组件 SceneObjects 程序化构建。
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import SceneObjects from './SceneObjects.vue';

// ---- 行星标签（与 SceneObjects 内行星顺序一致） ----
const planetLabels: Record<string, string> = {
  Mercury: '水星 · Blog',
  Venus:   '金星 · Notes',
  Earth:   '地球 · Hobbies',
  Mars:    '火星 · About',
  Jupiter: '木星 · About',
  Saturn:  '土星 · Home',
};

// ---- 状态 ----
const isMobile = ref(false);
const showTooltip = ref(false);
const tooltipLabel = ref('');
const tooltipPos = ref({ x: 0, y: 0 });
const touchDevice = ref(false);

onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;
  touchDevice.value = 'ontouchstart' in window;
});

// ---- 事件处理 ----
function onHover(name: string | null, event: PointerEvent | null) {
  if (name && event) {
    tooltipLabel.value = planetLabels[name] ?? name;
    tooltipPos.value = { x: event.clientX + 14, y: event.clientY - 32 };
    showTooltip.value = true;
  } else {
    showTooltip.value = false;
  }
}

function onClick(url: string) {
  document.dispatchEvent(new CustomEvent('planet-click', { detail: { url } }));
}
</script>

<template>
  <div class="solar-root">
    <!-- CSS 背景 -->
    <div class="solar-bg"></div>

    <!-- 3D 画布 -->
    <TresCanvas
      class="solar-canvas"
      :alpha="true"
      window-size
      clear-color="#050510"
    >
      <TresPerspectiveCamera :position="[0, 8, 22]" :fov="50" :near="0.1" :far="200" />
      <OrbitControls
        :enable-damping="true"
        :damping-factor="0.06"
        :min-distance="5"
        :max-distance="45"
        :max-polar-angle="1.2"
        :auto-rotate="true"
        :auto-rotate-speed="0.12"
        :enable-pan="false"
      />
      <TresAmbientLight :intensity="0.5" />
      <TresPointLight :position="[0, 0, 0]" :intensity="3" :distance="60" color="#FFF5E8" />

      <!-- 太阳球体 -->
      <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry :args="[1.2, 64, 64]" />
        <TresMeshBasicMaterial color="#FFE8B0" />
      </TresMesh>

      <!-- 场景对象 -->
      <SceneObjects
        :is-mobile="isMobile"
        @planet-click="onClick"
        @planet-hover="onHover"
      />
    </TresCanvas>

    <!-- 浮动标签 -->
    <Transition name="tip">
      <div
        v-if="showTooltip"
        class="solar-tooltip"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
      >{{ tooltipLabel }}</div>
    </Transition>

    <!-- 底部提示 -->
    <div class="solar-hint" v-if="!touchDevice">
      <span>拖拽旋转 &middot; 滚轮缩放 &middot; 点击行星探索</span>
    </div>
  </div>
</template>

<style scoped>
.solar-root { position: fixed; inset: 0; overflow: hidden; }
.solar-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, #0D0D2B 0%, #050510 60%, #000008 100%);
  z-index: -1;
}
.solar-canvas { width: 100%; height: 100%; }
.solar-canvas :deep(canvas) { cursor: grab; }
.solar-canvas :deep(canvas:active) { cursor: grabbing; }

.solar-tooltip {
  position: fixed;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  color: #3D405B;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 0.85rem; font-weight: 500;
  padding: 6px 14px;
  white-space: nowrap;
  pointer-events: none; z-index: 100;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}
.tip-enter-active { transition: opacity 0.15s ease-out, transform 0.15s ease-out; }
.tip-leave-active { transition: opacity 0.1s ease-in; }
.tip-enter-from { opacity: 0; transform: translateY(3px); }
.tip-leave-to { opacity: 0; }

.solar-hint {
  position: absolute; bottom: 1.75rem; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.35);
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 0.78rem; font-weight: 300;
  pointer-events: none; user-select: none;
  letter-spacing: 0.04em;
}
@media (max-width: 768px) { .solar-hint { display: none; } }
</style>
