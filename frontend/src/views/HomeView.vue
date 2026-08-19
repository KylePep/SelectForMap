<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiErrorMessage } from '../lib/apiClient'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'

const loginError = ref('')
const registerError = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submitLogin(payload) {
  loginError.value = ''
  try {
    await auth.login(payload)
    router.push('/map')
  } catch (e) {
    loginError.value = apiErrorMessage(e, 'Login failed.')
  }
}

async function submitRegister(payload) {
  registerError.value = ''
  try {
    await auth.register(payload)
    router.push('/map')
  } catch (e) {
    registerError.value = apiErrorMessage(e, 'Registration failed.')
  }
}
</script>

<template>
  <div class="sfm-home">
    <LoginForm :error="loginError" @submit="submitLogin" />
    <RegisterForm :error="registerError" @submit="submitRegister" />
  </div>
</template>

<style scoped>
.sfm-home {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 1.5rem;
  min-height: 100%;
  padding: 3rem 1.5rem;
}
</style>
