import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from 'vuefire'
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
			beforeEnter: async to => {
				const currentUser = await getCurrentUser()
				if (!currentUser)
					return {
						name: 'login',
						query: {
							redirectTo: to.fullPath,
						},
					}
			},
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('./views/LoginView.vue'),
		},
		{ path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
	],
	scrollBehavior(_to, _from, savedPosition) {
		return savedPosition ? savedPosition : { top: 0 }
	},
})

export default router
