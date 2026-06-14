<template>
  <div class="page-title-row">
    <button v-if="showBack" class="page-back" @click="$router.back()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <h1 class="page-title">{{ title }}</h1>
    <span class="title-line"></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; showBack?: boolean }>()
</script>

<style scoped>
.page-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
.page-back { background: rgba(255,255,255,0.72); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.35); width: 40px; height: 40px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-family: inherit; transition: var(--transition); flex-shrink: 0; }
.page-back:hover { background: var(--primary-light); color: var(--primary); }
.page-title { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; margin: 0; }
.title-line { flex: 1; height: 1px; background: linear-gradient(to right, var(--border), transparent); }
</style>
