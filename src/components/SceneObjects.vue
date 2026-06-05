<!--
  SceneObjects.vue — 太阳系程序化场景对象
  ------------------------------------------------------------
  在 TresCanvas 内部使用，通过 useTres() 获取 scene 引用，
  程序化创建轨道线、星点背景和行星系统。
-->
<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
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
  color: string;
  hasRing?: boolean;
}

const props = defineProps<{
  planets: PlanetDef[];
  isMobile: boolean;
}>();

const emit = defineEmits<{
  'planet-click': [url: string];
  'planet-hover': [name: string | null, event: PointerEvent | null];
}>();

// ---- TresJS 上下文 ----
const { scene, camera } = useTres();
const { onRender } = useLoop();

const orbitGroups: THREE.Group[] = [];
const planetMeshes: THREE.Mesh[] = [];
const hoveredName = shallowRef<string | null>(null);
const prefersReducedMotion = shallowRef(false);

// ---- 创建轨道线 ----
function addOrbitLine(radius: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
  );
  scene.value.add(line);
}

// ---- 创建星点背景 ----
function addStars(count: number) {
  const positions = new Float32Array(count * 3);
  const R = 40;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = R * (0.3 + Math.random() * 0.7);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.value.add(
    new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
    )
  );
}

// ---- 场景初始化 ----
onMounted(() => {
  if (!scene.value) {
    console.error('SceneObjects: scene is null — 确保在 TresCanvas 内部使用');
    return;
  }

  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 添加轨道线
  props.planets.forEach((p) => addOrbitLine(p.orbitRadius));

  // 添加星点
  addStars(props.isMobile ? 300 : 700);

  // 创建行星系统
  props.planets.forEach((planet) => {
    const group = new THREE.Group();
    scene.value.add(group);
    orbitGroups.push(group);

    // 行星球体
    const geo = new THREE.SphereGeometry(planet.radius, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(planet.color),
      roughness: 0.5,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = planet.orbitRadius;
    mesh.userData = { url: planet.url, name: planet.name };
    group.add(mesh);
    planetMeshes.push(mesh);

    // 土星环
    if (planet.hasRing) {
      const rGeo = new THREE.TorusGeometry(
        planet.radius * 1.6,
        planet.radius * 0.25,
        16,
        64
      );
      const rMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(planet.color),
        roughness: 0.6,
        metalness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.position.x = planet.orbitRadius;
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);
    }
  });

  // 设置 raycaster 交互
  setupRaycaster();
});

// ---- 动画循环 ----
onRender(({ delta }: { delta: number }) => {
  if (prefersReducedMotion.value) return;

  // 行星公转
  orbitGroups.forEach((g, i) => {
    g.rotation.y += delta * props.planets[i].speed * 0.3;
  });

  // hover 缩放
  planetMeshes.forEach((m, i) => {
    const target = hoveredName.value === props.planets[i].name ? 1.15 : 1.0;
    m.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
  });
});

// ---- Raycaster 交互 ----
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let canvasEl: HTMLCanvasElement | null = null;

function setupRaycaster() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 直接从 DOM 获取 canvas
  canvasEl = document.querySelector('canvas');
  if (!canvasEl) {
    console.warn('SceneObjects: 找不到 canvas 元素');
    return;
  }

  canvasEl.addEventListener('pointermove', onPointerMove);
  canvasEl.addEventListener('click', onClick);
}

function onPointerMove(event: PointerEvent) {
  if (!canvasEl) { canvasEl = document.querySelector('canvas'); if (!canvasEl) return; }

  const rect = canvasEl.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // 使用 useTres() 返回的相机
  const cam = camera.value;
  if (!cam) return;

  raycaster.setFromCamera(mouse, cam);
  const intersects = raycaster.intersectObjects(planetMeshes, false);

  if (intersects.length > 0) {
    const obj = intersects[0].object as THREE.Mesh;
    const name = obj.userData.name as string | undefined;
    if (name) {
      hoveredName.value = name;
      emit('planet-hover', name, event);
      return;
    }
  }

  hoveredName.value = null;
  emit('planet-hover', null, null);
}

function onClick() {
  if (hoveredName.value) {
    const planet = props.planets.find((p) => p.name === hoveredName.value);
    if (planet) {
      emit('planet-click', planet.url);
    }
  }
}
</script>

<template>
  <!-- 纯程序化组件，不渲染任何 DOM -->
</template>
