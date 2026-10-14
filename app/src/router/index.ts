import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to, _from, saved) => {
    if (saved) return { ...saved, behavior: 'instant' }
    return to.hash ? { el: to.hash } : { top: 0, behavior: 'instant' }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/works/ci-platform',
      name: 'ci-platform',
      component: () => import('@/views/CiPlatformView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      component: HomeView,
    },
  ],
})

export default router
