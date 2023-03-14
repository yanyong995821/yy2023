import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/panorama',
    name: 'panorama',
    component: () => import('../views/PanoramaView.vue'),
    meta: {
      title: '全景图'
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})
router.beforeEach((to, from, next) => {
  if (to.meta.title) document.title = to.meta.title
  next()
})
export default router
