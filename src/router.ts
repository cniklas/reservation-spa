import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from 'vuefire'
import { useErrorHandling } from './use/errorHandling'

import HomeView from './views/HomeView.vue'

const { resetErrorState, resetValidation } = useErrorHandling()

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
			meta: {
				requiresAuth: true,
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

router.beforeEach(async to => {
	if (to.meta.requiresAuth) {
		const currentUser = await getCurrentUser()
		if (!currentUser) {
			return {
				path: '/login',
				query: {
					redirectTo: to.fullPath,
				},
			}
		}
	}
})

router.afterEach((to, from) => {
	if (from.path !== to.path) {
		resetValidation()
		resetErrorState()
	}
})

export default router
