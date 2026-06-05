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
    onEnter: () => {
      gsap.fromTo(
        wrapper.value!,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: props.delay,
          ease: 'power3.out',
          overwrite: 'auto',
        }
      );
    },
  });
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
