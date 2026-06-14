<template>
  <div class="layout-root">
    <TopNav />
    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
</script>

<style scoped>
.layout-root { display: flex; flex-direction: column; height: 100vh; }
.layout-main { flex: 1; overflow-y: auto; margin-top: var(--nav-height); background: var(--color-bg); }
</style>
