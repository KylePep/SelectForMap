import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "../views/HomeView.vue"
import MapView from '../views/MapView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/home', component: HomeView },
    { path: '/map', component: MapView, meta: { requiresAuth: true } },
    { path: '/', redirect: '/home' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/home'
  }
})

export default router
