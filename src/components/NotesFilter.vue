<!--
  NotesFilter.vue — 碎片流过滤器（客户端交互组件）
  ------------------------------------------------------------
  为 /notes 页面提供标签过滤 + 文本搜索功能。

  功能：
  - 从所有碎片中提取唯一标签，渲染为切换按钮
  - 标签过滤使用 OR 逻辑（选中多个标签时显示包含任一标签的碎片）
  - 文本搜索：大小写不敏感，匹配内容和标签
  - 标签和搜索可组合使用
  - 过滤结果变化时使用 GSAP stagger 动画平滑过渡
  - 空状态提示："还没有这样的碎片。"

  数据流：
  Astro 页面在服务端通过 getCollection('notes') 获取数据，
  序列化后通过 props 传入，客户端仅增强过滤和动画。

  mood → 颜色映射：
  思考 → 芥末黄 (#F4A261) | 灵感 → 朱红 (#E63946) | 发现 → 深灰 (#2B2B2B)
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import gsap from 'gsap';

// ---- Types ----
interface Note {
  slug: string;
  data: {
    content: string;
    date: Date;
    tags?: string[];
    mood?: '思考' | '灵感' | '发现';
  };
}

const props = defineProps<{
  notes: Note[];
}>();

// ---- State ----
const searchQuery = ref('');
const activeTags = ref<Set<string>>(new Set());
const containerRef = ref<HTMLElement | null>(null);
const prevFiltered = ref<Note[]>([]);

// ---- Computed: all unique tags ----
const allTags = computed(() => {
  const tags = new Set<string>();
  props.notes.forEach((n) => {
    n.data.tags?.forEach((t) => tags.add(t));
  });
  return Array.from(tags).sort();
});

// ---- Computed: filtered notes ----
const filteredNotes = computed(() => {
  let result = props.notes;

  // Tag filter (OR logic)
  if (activeTags.value.size > 0) {
    result = result.filter(
      (n) => n.data.tags?.some((t) => activeTags.value.has(t))
    );
  }

  // Text search (case-insensitive)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    result = result.filter(
      (n) =>
        n.data.content.toLowerCase().includes(q) ||
        n.data.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  return result.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
});

// ---- Methods ----
function toggleTag(tag: string) {
  const next = new Set(activeTags.value);
  if (next.has(tag)) {
    next.delete(tag);
  } else {
    next.add(tag);
  }
  activeTags.value = next;
}

function clearFilters() {
  searchQuery.value = '';
  activeTags.value = new Set();
}

// ---- Mood color mapping ----
function moodColor(mood?: string): string {
  switch (mood) {
    case '思考':
      return 'var(--color-accent-alt, #F4A261)';
    case '灵感':
      return 'var(--color-accent, #E63946)';
    case '发现':
      return 'var(--color-border, #2B2B2B)';
    default:
      return 'var(--color-border, #2B2B2B)';
  }
}

// ---- GSAP FLIP animation on filter change ----
watch(
  () => filteredNotes.value.map((n) => n.slug).join(','),
  async () => {
    if (typeof window === 'undefined') return;
    await nextTick();
    if (!containerRef.value) return;

    const cards = containerRef.value.querySelectorAll('.note-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', overwrite: 'auto' }
    );
  }
);
</script>

<template>
  <div class="notes-filter">
    <!-- Search Input -->
    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索碎片..."
        class="w-full input"
      />
    </div>

    <!-- Tag Pills -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        v-for="tag in allTags"
        :key="tag"
        @click="toggleTag(tag)"
        class="tag-pill"
        :class="{ active: activeTags.has(tag) }"
      >
        {{ tag }}
      </button>
      <button
        v-if="activeTags.size > 0 || searchQuery"
        @click="clearFilters"
        class="tag-pill clear"
      >
        ✕ Clear
      </button>
    </div>

    <!-- Notes List with TransitionGroup -->
    <div ref="containerRef" class="notes-list">
      <TransitionGroup name="note-card">
        <article
          v-for="note in filteredNotes"
          :key="note.slug"
          class="note-card card card-hover"
        >
          <!-- Mood indicator bar -->
          <div
            class="mood-bar"
            :style="{ backgroundColor: moodColor(note.data.mood) }"
          ></div>

          <div class="flex-1">
            <!-- Date -->
            <time
              class="note-date"
              :datetime="new Date(note.data.date).toISOString()"
            >
              {{ new Date(note.data.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }) }}
            </time>

            <!-- Content -->
            <div class="note-content" v-html="renderMarkdown(note.data.content)"></div>

            <!-- Tags -->
            <div v-if="note.data.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="tag in note.data.tags"
                :key="tag"
                class="text-xs font-mono text-muted border border-border px-2 py-0.5 rounded-sm"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </article>
      </TransitionGroup>

      <!-- Empty State -->
      <div v-if="filteredNotes.length === 0" class="empty-state card">
        <p class="text-lg font-heading font-700 m-0">还没有这样的碎片。</p>
        <p class="text-muted mt-2 m-0">尝试调整搜索条件或清除过滤器。</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Simple markdown-to-HTML renderer (inline for client-side use)
export function renderMarkdown(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}
</script>

<style scoped>
.tag-pill {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  padding: 4px 12px;
  border: 2px solid var(--color-border, #2b2b2b);
  background: var(--color-surface, #fff);
  color: var(--color-text, #1a1a1a);
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 4px;
  user-select: none;
}

.tag-pill:hover {
  background: var(--color-bg, #fbf9f6);
}

.tag-pill.active {
  background: var(--color-accent, #e63946);
  color: #fff;
  border-color: var(--color-accent, #e63946);
}

.tag-pill.clear {
  border-style: dashed;
  font-size: 0.75rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.note-card {
  display: flex;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.mood-bar {
  width: 4px;
  flex-shrink: 0;
  border-radius: 2px;
}

.note-date {
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--color-muted, #6b6b6b);
  display: block;
  margin-bottom: 0.5rem;
}

.note-content {
  font-family: var(--font-body, Georgia, serif);
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--color-text, #1a1a1a);
}

.note-content :deep(pre) {
  margin: 0.5rem 0;
  padding: 0.75rem;
  font-size: 0.8rem;
}

.note-content :deep(code) {
  font-size: 0.85em;
}

.note-content :deep(a) {
  color: var(--color-accent, #e63946);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

/* TransitionGroup animations */
.note-card-enter-active {
  transition: all 0.35s ease-out;
}

.note-card-leave-active {
  transition: all 0.25s ease-in;
  position: absolute;
}

.note-card-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.note-card-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.note-card-move {
  transition: transform 0.3s ease;
}
</style>
