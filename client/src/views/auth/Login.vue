<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <el-icon :size="40" color="#409eff"><Phone /></el-icon>
        </div>
        <h2>手机销售管理系统</h2>
        <p>请登录您的账户</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%;"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <p>默认账号：admin / 密码：123456</p>
      </div>
    </div>

    <!-- 门店选择弹窗 -->
    <el-dialog
      v-model="storeDialogVisible"
      title="选择门店"
      width="380px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      align-center
    >
      <div class="store-select-hint">请选择要登录的门店：</div>
      <div class="store-list">
        <div
          v-for="store in userStore.availableStores"
          :key="store.id"
          class="store-item"
          :class="{ active: selectedStoreId === store.id }"
          @click="selectedStoreId = store.id"
        >
          <el-icon :size="20" color="#409eff"><Shop /></el-icon>
          <span>{{ store.name }}</span>
          <el-icon v-if="selectedStoreId === store.id" class="check-icon" color="#409eff"><Check /></el-icon>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" size="large" style="width: 100%;" @click="confirmStore">
          进入系统
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Shop, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const storeDialogVisible = ref(false)
const selectedStoreId = ref<number | null>(null)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const stores = await userStore.login(form)
    if (stores.length > 1) {
      // 多门店用户，弹出选择门店
      selectedStoreId.value = stores[0].id
      storeDialogVisible.value = true
    } else {
      // 单门店或无门店用户，直接进入
      ElMessage.success('登录成功')
      router.push('/dashboard')
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || '登录失败，请检查用户名和密码'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

function confirmStore() {
  if (selectedStoreId.value) {
    userStore.switchStore(selectedStoreId.value)
  }
  storeDialogVisible.value = false
  ElMessage.success('登录成功')
  router.push('/dashboard')
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-container {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-logo {
  margin-bottom: 16px;
}
.login-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}
.login-header p {
  font-size: 14px;
  color: #909399;
}
.login-footer {
  text-align: center;
  margin-top: 16px;
}
.login-footer p {
  font-size: 12px;
  color: #c0c4cc;
}

.store-select-hint {
  text-align: center;
  color: #606266;
  margin-bottom: 16px;
  font-size: 14px;
}
.store-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.store-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  color: #303133;
}
.store-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}
.store-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.store-item .check-icon {
  margin-left: auto;
}
</style>
