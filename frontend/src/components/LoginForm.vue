<!-- frontend/src/components/LoginForm.vue -->
<script setup>
import { ref } from 'vue'

defineProps({ error: { type: String, default: '' } })
const emit = defineEmits(['submit'])

const email = ref('')
const password = ref('')

function submit() {
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <form class="sfm-auth-form" @submit.prevent="submit">
    <header class="sfm-auth-form__header">
      <h2>Log In</h2>
      <p class="sfm-auth-form__subtitle">Welcome back, adventurer.</p>
    </header>
    <input data-test="email" v-model="email" type="email" placeholder="Email" required />
    <input data-test="password" v-model="password" type="password" placeholder="Password" required />
    <button data-test="submit" type="submit">Log in</button>
    <p v-if="error" class="sfm-auth-form__error" data-test="error">{{ error }}</p>
  </form>
</template>

<style scoped>
.sfm-auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 22rem;
  padding: 1.5rem;
  border: 2px solid var(--sfm-panel-border);
  border-radius: 10px;
  background: var(--sfm-panel-bg);
  color: var(--sfm-panel-text);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.sfm-auth-form__header {
  margin-bottom: 0.25rem;
  text-align: center;
}

.sfm-auth-form__subtitle {
  margin-top: 0.25rem;
  color: var(--sfm-muted-text);
  font-size: 0.9em;
}

.sfm-auth-form input {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--sfm-panel-border);
  border-radius: 6px;
  font: inherit;
}

.sfm-auth-form button {
  padding: 0.625rem;
  border: 2px solid var(--sfm-panel-border);
  border-radius: 999px;
  background: var(--sfm-accent);
  color: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.sfm-auth-form button:hover {
  filter: brightness(1.08);
}

.sfm-auth-form__error {
  margin: 0;
  color: var(--sfm-danger);
  text-align: center;
}
</style>
