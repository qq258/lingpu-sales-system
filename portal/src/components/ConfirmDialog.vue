<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-box glass-strong">
          <div class="dialog-icon" v-html="iconSvg"></div>
          <div class="dialog-title">{{ title }}</div>
          <div class="dialog-message">{{ message }}</div>
          <div class="dialog-actions">
            <button class="dialog-btn dialog-btn--cancel" @click="handleCancel">{{ cancelText }}</button>
            <button :class="['dialog-btn', `dialog-btn--${type || 'primary'}`]" @click="handleConfirm">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ visible: boolean; title: string; message: string; confirmText?: string; cancelText?: string; type?: string }>()
const emit = defineEmits<{ confirm: []; cancel: []; 'update:visible': [boolean] }>()

const iconMap: Record<string, string> = {
  primary: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  success: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="1.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  danger: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
}

const iconSvg = computed(() => iconMap[props.type || 'primary'])

function handleConfirm() { emit('confirm') }
function handleCancel() { emit('cancel'); emit('update:visible', false) }
</script>

<style scoped>
.dialog-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(6px); }
.dialog-box { border-radius: var(--radius-lg); padding: 36px; max-width: 380px; width: 90%; text-align: center; }
.dialog-icon { margin-bottom: 16px; display: flex; justify-content: center; }
.dialog-title { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
.dialog-message { font-size: 16px; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.6; }
.dialog-actions { display: flex; gap: 12px; }
.dialog-btn { flex: 1; height: 48px; border: none; border-radius: var(--radius-sm); font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.dialog-btn:hover { filter: brightness(0.95); transform: translateY(-1px); }
.dialog-btn--cancel { background: var(--border); color: var(--text-secondary); }
.dialog-btn--primary { background: var(--primary); color: #fff; }
.dialog-btn--danger { background: var(--danger); color: #fff; }
.dialog-btn--success { background: var(--success); color: #fff; }

.dialog-enter-active { transition: all 0.25s ease; }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.92); }
.dialog-leave-to { opacity: 0; transform: scale(0.92); }
</style>
