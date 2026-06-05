<!--
  CursorSparkles.vue — 光标星星拖尾
  ------------------------------------------------------------
  鼠标移动时生成微小星点，随机方向飘散淡出。
  仅非首页显示，移动端自动禁用。
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const isActive = ref(false);
const isMobile = ref(true);
let throttled = false;

// 创建一颗小星点
function spawnSparkle(x: number, y: number) {
  const star = document.createElement('span');
  star.className = 'cursor-sparkle';

  // 随机大小、方向、颜色
  const size = 4 + Math.random() * 6;
  const angle = Math.random() * Math.PI * 2;
  const distance = 15 + Math.random() * 35;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  const hue = Math.random() > 0.5 ? 'var(--color-accent)' : 'var(--color-accent-pink)';
  const opacity = 0.3 + Math.random() * 0.5;
  const duration = 400 + Math.random() * 600;

  star.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: ${hue};
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    opacity: ${opacity};
    transition: all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;

  document.body.appendChild(star);

  // 触发动画
  requestAnimationFrame(() => {
    star.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
    star.style.opacity = '0';
  });

  // 动画结束后清理
  setTimeout(() => star.remove(), duration + 50);
}

let lastX = 0, lastY = 0;

function onMouseMove(e: MouseEvent) {
  if (!isActive.value || isMobile.value) return;

  // 节流
  if (throttled) return;
  throttled = true;
  requestAnimationFrame(() => { throttled = false; });

  // 只在移动一定距离后生成新星点
  const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
  if (dist < 30) return;
  lastX = e.clientX;
  lastY = e.clientY;

  spawnSparkle(e.clientX, e.clientY);
}

// 检测是否在首页
function checkPage() {
  const isHome = !!document.querySelector('.solar-system-wrapper');
  isActive.value = !isHome;
}

onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (isMobile.value) return;

  checkPage();
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('astro:after-swap', checkPage);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('astro:after-swap', checkPage);
});
</script>

<template>
  <!-- 纯 JS 组件，无 DOM -->
</template>
