<template>
  <div class="warranty-setting">
    <div class="page-header">
      <h2>保修须知设置</h2>
      <p class="page-desc">编辑保修须知内容，保存后所有小票打印时将自动使用最新内容。</p>
    </div>

    <el-card shadow="never" class="editor-card">
      <div class="editor-toolbar">
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="editor-wrapper">
        <QuillEditor
          ref="quillRef"
          v-model:content="content"
          contentType="html"
          :options="editorOptions"
          style="height: 400px"
        />
      </div>
    </el-card>

    <el-card shadow="never" class="preview-card">
      <template #header>
        <span>打印预览效果</span>
      </template>
      <div class="receipt-preview" v-html="content || '（暂无内容）'"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { getSetting, updateSetting } from '@/api/settings'

const content = ref('')
const saving = ref(false)
const savedContent = ref('')

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
    // 使用默认内容
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
.warranty-setting {
  padding: 24px;
  max-width: 900px;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 20px;
}
.page-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
.editor-card {
  margin-bottom: 24px;
}
.editor-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.editor-wrapper :deep(.ql-editor) {
  min-height: 300px;
  font-size: 14px;
}
.editor-wrapper :deep(.ql-container) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.preview-card {
  margin-bottom: 24px;
}
.receipt-preview {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  padding: 16px;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  min-height: 60px;
}
.receipt-preview :deep(p) {
  margin: 4px 0;
}
.receipt-preview :deep(ul),
.receipt-preview :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}
.receipt-preview :deep(li) {
  margin: 2px 0;
}
.receipt-preview :deep(strong) {
  font-weight: bold;
}
</style>
