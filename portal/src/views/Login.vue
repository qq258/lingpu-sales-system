<template>
  <div class="login-page">
    <div class="login-bg-orb login-bg-orb--1"></div>
    <div class="login-bg-orb login-bg-orb--2"></div>
    <div class="login-bg-orb login-bg-orb--3"></div>
    <div class="login-card glass-strong">
      <div class="login-brand">
        <svg class="login-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/></svg>
        <h1 class="login-title">手机销售</h1>
        <p class="login-subtitle">门店管理系统</p>
      </div>
      <div class="login-form">
        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>
        <div class="login-field">
          <label class="login-label">账号</label>
          <div class="login-input-wrap">
            <svg class="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input v-model="username" class="login-input" placeholder="请输入账号" @keyup.enter="handleLogin" />
          </div>
        </div>
        <div class="login-field">
          <label class="login-label">密码</label>
          <div class="login-input-wrap">
            <svg class="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input v-model="password" class="login-input" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
          </div>
        </div>
        <button class="login-btn" :disabled="loading" @click="handleLogin">
          <span v-if="loading" class="login-btn-loading"></span>
          <span v-else>{{ '登 录' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) { errorMsg.value = '请输入账号和密码'; return }
  errorMsg.value = ''
  loading.value = true
  try {
    await userStore.login(username.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 35%, #2563EB 65%, #3B82F6 100%);
  position: relative; overflow: hidden; padding: 20px;
}
.login-bg-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.login-bg-orb--1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); top: -150px; left: -100px; }
.login-bg-orb--2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); bottom: -100px; right: -80px; }
.login-bg-orb--3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%); bottom: 30%; right: 20%; }
.login-card { border-radius: var(--radius-lg); padding: 48px 40px 40px; max-width: 400px; width: 100%; position: relative; }
.login-brand { text-align: center; margin-bottom: 36px; }
.login-icon { margin-bottom: 16px; }
.login-title { font-size: 26px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: -0.5px; }
.login-subtitle { font-size: 15px; color: var(--text-tertiary); margin-top: 4px; }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.login-error { font-size: 14px; color: var(--danger); text-align: center; padding: 10px; background: var(--danger-light); border-radius: var(--radius-sm); }
.login-field { display: flex; flex-direction: column; gap: 6px; }
.login-label { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.login-input-wrap { position: relative; }
.login-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.login-input { width: 100%; height: 48px; padding: 0 14px 0 44px; font-size: 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); outline: none; font-family: inherit; background: #fff; transition: var(--transition); }
.login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
.login-input::placeholder { color: var(--text-tertiary); font-size: 15px; }
.login-btn { height: 52px; border: none; border-radius: var(--radius-sm); background: var(--primary); color: #fff; font-size: 17px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
.login-btn:hover { background: var(--primary-dark); box-shadow: 0 4px 16px var(--primary-glow); transform: translateY(-1px); }
.login-btn:active { transform: translateY(0); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
.login-btn-loading { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
