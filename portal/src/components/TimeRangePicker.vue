<template>
  <div class="time-picker">
    <span class="time-label">统计时段</span>
    <el-select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" size="large" style="width:150px;">
      <el-option label="最近3个月" value="3m" />
      <el-option label="本月" value="thisMonth" />
      <el-option label="本年" value="thisYear" />
      <el-option label="自定义" value="custom" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.time-picker { display: flex; align-items: center; gap: 8px; }
.time-label { font-size: 14px; color: var(--text-tertiary); white-space: nowrap; }
</style>
