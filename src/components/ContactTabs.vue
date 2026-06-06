<template>
  <div class="contact-tabs">
    <div class="tab-buttons">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content" :key="activeTab">
      <template v-if="activeTab === 'qq'">
        <p class="tab-info"><span class="tab-label">QQ 号</span> <span class="tab-value">2306673403</span></p>
        <p class="tab-info"><span class="tab-label">昵称</span> <span class="tab-value">布局呆星</span></p>
      </template>
      <template v-else>
        <p class="tab-info">
          <span class="tab-label">GitHub</span>
          <a :href="githubUrl" target="_blank" rel="noopener" class="tab-value tab-link">@{{ githubUser }}</a>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  githubUser: { type: String, default: 'WG-TG' },
});

const githubUrl = `https://github.com/${props.githubUser}`;

const tabs = [
  { key: 'qq', label: 'QQ' },
  { key: 'github', label: 'GitHub' },
];

const activeTab = ref(tabs[0].key);
</script>

<style scoped>
.contact-tabs {
  margin-top: 1rem;
}
.tab-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tab-btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-light);
  font-family: var(--font-body);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s var(--ease-out);
}
.tab-btn:hover {
  border-color: var(--color-accent-purple);
  color: var(--color-accent-purple);
}
.tab-btn.active {
  background: linear-gradient(135deg, rgba(126,184,218,0.12) 0%, rgba(184,169,212,0.12) 100%);
  border-color: var(--color-accent-purple);
  color: var(--color-accent-purple);
  font-weight: 500;
}
.tab-content {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(126,184,218,0.04) 0%, rgba(184,169,212,0.04) 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}
.tab-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.4rem 0;
  font-size: 0.9rem;
}
.tab-label {
  color: var(--color-text-light);
  min-width: 3.5rem;
  font-weight: 300;
}
.tab-value {
  color: var(--color-text);
  font-weight: 500;
}
.tab-link {
  color: var(--color-accent-purple);
  text-decoration: none;
  border-bottom: 1px dashed var(--color-accent-purple);
  transition: all 0.2s;
}
.tab-link:hover {
  color: var(--color-accent-deep);
  border-bottom-color: var(--color-accent-deep);
}
</style>
