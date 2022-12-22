import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/liste',
			name: 'list',
			component: () => import('./views/ListView.vue'),
		},
		{
			path: '/add',
			name: 'add',
			component: () => import('./views/AddView.vue'),
			beforeEnter: (to, _from, next) => {
				/* state.hasAuthenticated ? next() : */ next({ name: 'login', query: { redirect: to.fullPath } })
			},
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('./views/LoginView.vue'),
			beforeEnter: (_to, _from, next) => {
				/* state.hasAuthenticated ? next({ name: 'recipes' }) : */ next()
			},
		},
		{ path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
	],
	scrollBehavior(_to, _from, savedPosition) {
		return savedPosition ? savedPosition : { top: 0 }
	},
})

export default router
