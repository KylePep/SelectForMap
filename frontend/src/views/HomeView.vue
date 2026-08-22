<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiErrorMessage } from '../lib/apiClient'
import Modal from '../components/Modal.vue'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'

const showLogin = ref(false)
const showRegister = ref(false)
const loginError = ref('')
const registerError = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submitLogin(payload) {
  loginError.value = ''
  try {
    await auth.login(payload)
    showLogin.value = false
    router.push('/map')
  } catch (e) {
    loginError.value = apiErrorMessage(e, 'Login failed.')
  }
}

async function submitRegister(payload) {
  registerError.value = ''
  try {
    await auth.register(payload)
    showRegister.value = false
    router.push('/map')
  } catch (e) {
    registerError.value = apiErrorMessage(e, 'Registration failed.')
  }
}
</script>

<template>
  <div class="sfm-home">
    <h1>Select for Map</h1>
    <button type="button" @click="showLogin = true">Log In</button>
    <button type="button" @click="showRegister = true">Register</button>

    <Modal v-model="showLogin">
      <LoginForm :error="loginError" @submit="submitLogin" />
    </Modal>

    <Modal v-model="showRegister">
      <RegisterForm :error="registerError" @submit="submitRegister" />
    </Modal>
  </div>
</template>

<style scoped>
.sfm-home {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 100%;
  padding: 3rem 1.5rem;
}
</style>
