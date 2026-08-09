<template>
  <div class="page-container">
    <div class="page-title-row">
      <h1 class="page-title">保修须知设置</h1>
      <span class="title-line"></span>
    </div>
    <p class="ws-desc">编辑保修须知内容，保存后所有小票打印时将自动使用最新内容。</p>

    <div class="glass ws-card">
      <div class="ws-toolbar">
        <button class="ws-save-btn" :disabled="saving" @click="handleSave">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button class="ws-reset-btn" @click="handleReset">重置</button>
      </div>
      <div class="ws-editor-wrapper">
        <QuillEditor
          v-model:content="content"
          contentType="html"
          :options="editorOptions"
          style="height: 360px"
        />
      </div>
    </div>

    <div class="glass ws-card">
      <div class="ws-preview-title">打印预览效果</div>
      <div class="ws-receipt-preview" v-html="content || '（暂无内容）'"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { getSetting, updateSetting } from '@/api/settings'

const content = ref('')
const savedContent = ref('')
const saving = ref(false)

const editorOptions = {
  theme: 'snow',
  placeholder: '请输入保修须知内容...',
  modules: {
    toolbar: [
      [{ header: [false, 1, 2, 3] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  },
}

async function loadData() {
  try {
    const data = await getSetting('warranty_notice')
    content.value = data?.value || ''
    savedContent.value = content.value
  } catch {
    content.value = ''
    savedContent.value = ''
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateSetting('warranty_notice', content.value)
    savedContent.value = content.value
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleReset() {
  content.value = savedContent.value
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ws-desc { font-size: 14px; color: var(--text-secondary); margin: -12px 0 20px; }
.ws-card { padding: 20px 24px; border-radius: var(--radius); margin-bottom: 20px; }
.ws-toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.ws-save-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 18px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); }
.ws-save-btn:hover { background: var(--primary-dark); }
.ws-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ws-reset-btn { display: inline-flex; align-items: center; height: 36px; padding: 0 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: var(--transition); }
.ws-reset-btn:hover { border-color: var(--primary); color: var(--primary); }
.ws-editor-wrapper { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: #fff; }
.ws-editor-wrapper :deep(.ql-editor) { min-height: 280px; font-size: 14px; }
.ws-editor-wrapper :deep(.ql-toolbar) { border-color: var(--border); }
.ws-editor-wrapper :deep(.ql-container) { border-color: var(--border); }
.ws-preview-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; }
.ws-receipt-preview { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; color: #333; padding: 16px; background: #fafafa; border: 1px dashed var(--border); border-radius: var(--radius-sm); min-height: 60px; }
.ws-receipt-preview :deep(p) { margin: 4px 0; }
.ws-receipt-preview :deep(ul), .ws-receipt-preview :deep(ol) { margin: 4px 0; padding-left: 20px; }
.ws-receipt-preview :deep(li) { margin: 2px 0; }
.ws-receipt-preview :deep(strong) { font-weight: bold; }
</style>
