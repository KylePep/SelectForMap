import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { attachAuthInterceptor } from './lib/apiClient'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

attachAuthInterceptor(() => useAuthStore().token)

app.mount('#app')
