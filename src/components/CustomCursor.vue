<!--
  CustomCursor.vue — 自定义鼠标光标
  ------------------------------------------------------------
  替换默认光标为朱红色圆点，仅桌面端显示。

  特性：
  - 20px 朱红圆点，混合模式 difference 实现颜色反转
  - requestAnimationFrame + 缓动系数 0.1 实现平滑跟随
  - 悬浮在链接/按钮上时放大至 40px，显示"阅读"文字
  - 移动端/触摸设备自动隐藏（检测 hover:none + pointer:coarse）
  - 组件卸载时清理所有事件监听和动画帧

  注意：太阳系首页自动禁用此光标（3D 场景自带 grab/grabbing 光标样式）。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// ---- State ----
const cursorX = ref(-100);
const cursorY = ref(-100);
const currentX = ref(-100);
const currentY = ref(-100);
const isHovering = ref(false);
const isVisible = ref(false);
const isMobile = ref(true);

const easing = 0.1;
let rafId: number | null = null;

// ---- Methods ----
function animate() {
  // Smooth follow with lerp
  currentX.value += (cursorX.value - currentX.value) * easing;
  currentY.value += (cursorY.value - currentY.value) * easing;
  rafId = requestAnimationFrame(animate);
}

function onMouseMove(e: MouseEvent) {
  if (isMobile.value) return;
  cursorX.value = e.clientX;
  cursorY.value = e.clientY;
  if (!isVisible.value) {
    isVisible.value = true;
    // Snap to position on first move
    currentX.value = e.clientX;
    currentY.value = e.clientY;
  }
}

function onMouseEnter() {
  if (!isMobile.value) {
    isVisible.value = true;
  }
}

function onMouseLeave() {
  isVisible.value = false;
}

function checkHoverTargets(e: MouseEvent) {
  if (isMobile.value) return;

  const target = e.target as HTMLElement;
  const interactive = target.closest('a, button, input, textarea, [role="button"], .planet-tooltip');
  isHovering.value = !!interactive;
}

// ---- Detection ----
onMounted(() => {
  // Check if mobile/touch device
  isMobile.value =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (isMobile.value || typeof window === 'undefined') return;

  // Start animation loop
  rafId = requestAnimationFrame(animate);

  // Event listeners
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousemove', checkHoverTargets, { passive: true });
  document.body.addEventListener('mouseenter', onMouseEnter);
  document.body.addEventListener('mouseleave', onMouseLeave);
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (typeof window === 'undefined') return;

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mousemove', checkHoverTargets);
  document.body.removeEventListener('mouseenter', onMouseEnter);
  document.body.removeEventListener('mouseleave', onMouseLeave);
});
</script>

<template>
  <div
    v-if="!isMobile"
    class="custom-cursor"
    :class="{ visible: isVisible, hovering: isHovering }"
    :style="{
      transform: `translate(${currentX - 10}px, ${currentY - 10}px) scale(${isHovering ? 2 : 1})`,
    }"
    aria-hidden="true"
  >
    <span v-if="isHovering" class="cursor-label">阅读</span>
  </div>
</template>

<style scoped>
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #E63946;
  mix-blend-mode: difference;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.08s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-cursor.visible {
  opacity: 1;
}

.custom-cursor.hovering {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E63946;
}

.cursor-label {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  color: #FFFFFF;
  mix-blend-mode: normal;
  user-select: none;
  letter-spacing: 0.05em;
}
</style>
