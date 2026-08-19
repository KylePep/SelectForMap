<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiErrorMessage } from '../lib/apiClient'
import RegisterForm from '../components/RegisterForm.vue'

const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submit(payload) {
  error.value = ''
  try {
    await auth.register(payload)
    router.push('/map')
  } catch (e) {
    error.value = apiErrorMessage(e, 'Registration failed.')
  }
}
</script>

<template>
  <div class="sfm-auth-view">
    <RegisterForm :error="error" @submit="submit" />
  </div>
</template>

<style scoped>
.sfm-auth-view {
  display: flex;
  justify-content: center;
  padding: 3rem 1.5rem;
}
</style>
