<!--
  NotesFilter.vue — 碎片流过滤器
  ------------------------------------------------------------
  标签切换 + 文本搜索，GSAP 动画过渡。
  匹配温柔优雅设计系统：天蓝+浅粉紫。
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import gsap from 'gsap';

interface Note {
  slug: string;
  data: { content: string; date: string; tags?: string[]; mood?: '思考' | '灵感' | '发现' };
}

const props = defineProps<{ notes: Note[] }>();

const searchQuery = ref('');
const activeTags = ref<Set<string>>(new Set());
const containerRef = ref<HTMLElement | null>(null);

const allTags = computed(() => {
  const tags = new Set<string>();
  props.notes.forEach((n) => n.data.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
});

const filteredNotes = computed(() => {
  let result = props.notes;
  if (activeTags.value.size > 0)
    result = result.filter((n) => n.data.tags?.some((t) => activeTags.value.has(t)));
  const q = searchQuery.value.trim().toLowerCase();
  if (q)
    result = result.filter((n) => n.data.content.toLowerCase().includes(q) || n.data.tags?.some((t) => t.toLowerCase().includes(q)));
  return result.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
});

function toggleTag(tag: string) {
  const next = new Set(activeTags.value);
  next.has(tag) ? next.delete(tag) : next.add(tag);
  activeTags.value = next;
}
function clearFilters() { searchQuery.value = ''; activeTags.value = new Set(); }

function moodColor(m?: string) {
  switch (m) {
    case '思考': return 'var(--color-accent-warm)';
    case '灵感': return 'var(--color-accent-pink)';
    case '发现': return 'var(--color-accent-purple)';
    default: return 'var(--color-border)';
  }
}

// FLIP 动画
watch(() => filteredNotes.value.map((n) => n.slug).join(','), async () => {
  if (typeof window === 'undefined') return;
  await nextTick();
  if (!containerRef.value) return;
  const cards = containerRef.value.querySelectorAll('.note-item');
  gsap.fromTo(cards, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', overwrite: 'auto' });
});
</script>

<template>
  <div class="notes-filter">
    <!-- 搜索 -->
    <input v-model="searchQuery" type="text" placeholder="搜索碎片..." class="nf-search" />

    <!-- 标签 -->
    <div class="nf-tags">
      <button v-for="tag in allTags" :key="tag" @click="toggleTag(tag)" class="nf-tag" :class="{ active: activeTags.has(tag) }">{{ tag }}</button>
      <button v-if="activeTags.size > 0 || searchQuery" @click="clearFilters" class="nf-clear">✕ 清除</button>
    </div>

    <!-- 列表 -->
    <div ref="containerRef" class="nf-list">
      <TransitionGroup name="nf-item">
        <article v-for="note in filteredNotes" :key="note.slug" class="note-item">
          <div class="note-mood" :style="{ background: moodColor(note.data.mood) }"></div>
          <div class="note-body">
            <time class="note-time" :datetime="note.data.date">
              {{ new Date(note.data.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }}
            </time>
            <div class="note-text" v-html="renderMd(note.data.content)"></div>
            <div v-if="note.data.tags?.length" class="note-tags">
              <span v-for="t in note.data.tags" :key="t" class="note-tag">#{{ t }}</span>
            </div>
          </div>
        </article>
      </TransitionGroup>

      <div v-if="filteredNotes.length === 0" class="nf-empty">
        <p>还没有这样的碎片。</p>
        <span>试试调整搜索条件或清除过滤。</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export function renderMd(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}
</script>

<style scoped>
.nf-search {
  width: 100%; padding: 0.65rem 1rem;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  outline: none; margin-bottom: 1rem;
  transition: all 0.2s;
}
.nf-search:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(126,184,218,0.12); }
.nf-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.5rem; }
.nf-tag, .nf-clear {
  font-size: 0.78rem; padding: 0.3rem 0.75rem;
  border-radius: 2rem; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text-light);
  cursor: pointer; transition: all 0.15s;
  font-family: var(--font-body);
}
.nf-tag:hover { border-color: var(--color-accent); color: var(--color-accent-deep); }
.nf-tag.active { background: var(--color-accent); color: #FFF; border-color: var(--color-accent); }
.nf-clear { border-style: dashed; font-size: 0.72rem; }
.nf-clear:hover { border-color: var(--color-accent-pink); color: var(--color-accent-pink); }

.nf-list { display: flex; flex-direction: column; gap: 1rem; }
.note-item {
  display: flex; gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease-out);
  overflow: hidden;
}
.note-item:hover { box-shadow: var(--shadow-hover); border-color: var(--color-accent); }
.note-mood { width: 4px; flex-shrink: 0; border-radius: 2px; }
.note-body { flex: 1; min-width: 0; }
.note-time {
  font-family: var(--font-mono); font-size: 0.72rem;
  color: var(--color-text-light); display: block; margin-bottom: 0.4rem;
}
.note-text {
  font-size: 0.92rem; line-height: 1.75; color: var(--color-text);
}
.note-text :deep(pre) { margin: 0.4rem 0; padding: 0.6rem 0.8rem; font-size: 0.78rem; }
.note-text :deep(code) { font-size: 0.85em; }
.note-text :deep(a) { color: var(--color-accent-deep); }
.note-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.note-tag {
  font-family: var(--font-mono); font-size: 0.68rem;
  color: var(--color-accent-purple);
  background: rgba(184,169,212,0.1);
  padding: 0.1rem 0.45rem; border-radius: 4px;
}

.nf-empty {
  text-align: center; padding: 3rem 1.5rem;
  background: var(--color-surface); border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}
.nf-empty p { font-size: 1.1rem; font-weight: 500; margin-bottom: 0.3rem; }
.nf-empty span { color: var(--color-text-light); font-size: 0.85rem; }

/* TransitionGroup */
.nf-item-enter-active { transition: all 0.3s ease-out; }
.nf-item-leave-active { transition: all 0.2s ease-in; position: absolute; }
.nf-item-enter-from { opacity: 0; transform: translateY(8px); }
.nf-item-leave-to { opacity: 0; transform: translateY(-4px); }
.nf-item-move { transition: transform 0.25s ease; }
</style>
