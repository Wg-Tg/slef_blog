<!--
  ScrollReveal.vue — 滚动显示动画组件
  ------------------------------------------------------------
  使用 GSAP ScrollTrigger 实现元素进入视口时的淡入动画。

  用法：
  <ScrollReveal client:load :delay="0.1">
    <YourContent />
  </ScrollReveal>

  参数：
  - delay: 动画延迟（秒），默认 0
  - threshold: 触发阈值（0-1），默认 0.15（元素 15% 进入视口时触发）

  特性：
  - once: true — 只触发一次，元素不会回退隐藏
  - 从下方 40px 淡入，duration 0.6s，Power3.out 缓动
  - prefers-reduced-motion 时直接显示，跳过动画
  - 组件卸载时自动 kill ScrollTrigger 实例，防止内存泄漏
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const props = withDefaults(
  defineProps<{
    delay?: number;
    threshold?: number;
  }>(),
  {
    delay: 0,
    threshold: 0.15,
  }
);

const wrapper = ref<HTMLElement | null>(null);
let st: ScrollTrigger | null = null;

onMounted(() => {
  if (typeof window === 'undefined' || !wrapper.value) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Just show content immediately
    if (wrapper.value) {
      wrapper.value.style.opacity = '1';
      wrapper.value.style.transform = 'none';
    }
    return;
  }

  st = ScrollTrigger.create({
    trigger: wrapper.value,
    start: `top bottom-=${Math.round(props.threshold * 100)}%`,
    once: true,
    onEnter: () => animateIn(),
  });

  // 兜底：View Transitions 场景下元素可能已在视口内
  requestAnimationFrame(() => {
    if (!wrapper.value) return;
    const rect = wrapper.value.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animateIn();
    }
  });

  function animateIn() {
    if (!wrapper.value) return;
    gsap.fromTo(
      wrapper.value,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, delay: props.delay, ease: 'power3.out', overwrite: 'auto' }
    );
  }
});

onUnmounted(() => {
  if (st) st.kill();
});
</script>

<template>
  <div ref="wrapper" class="scroll-reveal" :style="{ opacity: 0 }">
    <slot />
  </div>
</template>

<style scoped>
.scroll-reveal {
  will-change: transform, opacity;
}
</style>
