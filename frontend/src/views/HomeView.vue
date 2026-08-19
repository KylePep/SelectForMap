<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function submitLogin() {
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    router.push('/map')
  } catch (e) {
    error.value = e.response?.data?.errors?.email?.[0] || 'Login failed.'
  }
}
async function submitRegister() {
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

<style lang="scss" scoped></style>

<template>
  <form @submit.prevent="submit">
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Log in</button>
    <p v-if="error">{{ error }}</p>
  </form>

  <form @submit.prevent="submit">
    <input v-model="name" placeholder="Name" required />
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <input v-model="passwordConfirmation" type="password" placeholder="Confirm password" required />
    <button type="submit">Sign up</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>