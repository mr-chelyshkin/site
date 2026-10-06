import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    // Unknown client-side paths show the home page; CloudFront serves
    // `public/404.html` for missing files.
    {
      path: '/:pathMatch(.*)*',
      component: HomeView,
    },
  ],
})

export default router
