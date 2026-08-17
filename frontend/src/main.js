import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { attachAuthInterceptor, attachUnauthorizedInterceptor } from './lib/apiClient'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

attachAuthInterceptor(() => useAuthStore().token)

attachUnauthorizedInterceptor(() => {
  useAuthStore().clearSession()
  // The login route is public, so redirecting there cannot trigger another 401 loop.
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
})

app.mount('#app')
