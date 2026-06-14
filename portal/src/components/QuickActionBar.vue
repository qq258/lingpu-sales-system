<template>
  <div class="quick-actions">
    <button v-for="act in actions" :key="act.to" class="quick-btn glass" @click="$router.push(act.to)">
      <span class="quick-btn-icon" v-html="act.iconSvg"></span>
      <span class="quick-btn-label">{{ act.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ actions: Array<{ label: string; to: string; iconSvg: string }> }>()
</script>

<style scoped>
.quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 80px; border: none; border-radius: var(--radius); cursor: pointer; font-family: inherit; transition: var(--transition); }
.quick-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.quick-btn:active { transform: translateY(0); }
.quick-btn-icon { display: flex; }
.quick-btn-label { font-size: 17px; font-weight: 600; color: var(--text); }
</style>
