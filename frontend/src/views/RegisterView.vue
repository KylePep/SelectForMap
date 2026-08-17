<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    router.push('/map')
  } catch (e) {
    error.value = e.response?.data?.errors?.email?.[0] || 'Registration failed.'
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="name" placeholder="Name" required />
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <input v-model="passwordConfirmation" type="password" placeholder="Confirm password" required />
    <button type="submit">Sign up</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
