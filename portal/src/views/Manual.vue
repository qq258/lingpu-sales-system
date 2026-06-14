<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">使用手册</h1>
      <span class="title-line"></span>
      <span class="badge">建设中</span>
    </div>

    <div class="glass" style="padding:32px;border-radius:var(--radius);text-align:center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" style="margin-bottom:16px;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <p style="font-size:17px;color:var(--text-secondary);margin-bottom:8px;">使用手册正在编写中</p>
      <p style="font-size:14px;color:var(--text-tertiary);">后续将包含常见问题解答和常用功能操作指导</p>
    </div>

    <div class="manual-sections" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:24px;">
      <div v-for="s in sections" :key="s.title" class="glass" style="padding:20px;border-radius:var(--radius);">
        <h3 style="font-size:16px;font-weight:600;color:var(--text);margin:0 0 8px;">{{ s.title }}</h3>
        <p style="font-size:14px;color:var(--text-tertiary);margin:0;">{{ s.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sections = [
  { title: '采购入库', desc: '如何新建入库单、添加 IMEI、确认入库' },
  { title: '销售开单', desc: '扫码开单、收款、打印小票操作说明' },
  { title: '库存查询', desc: '查询库存、搜索 IMEI、查看库存流水' },
  { title: '门店调货', desc: '发起调货申请、确认出库/入库' },
  { title: '数据看板', desc: '看板上的数据含义和统计说明' },
  { title: '常见问题', desc: 'IMEI 重复、库存不一致等常见问题处理' },
]
</script>

<style scoped>
.badge { font-size: 12px; font-weight: 600; background: var(--warning-light); color: var(--warning); padding: 2px 12px; border-radius: 6px; }
</style>
