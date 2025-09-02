<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { instant } from '@/instant'
import { useStore } from './use/store'

const route = useRoute()
const router = useRouter()
const { state, setAuthState } = useStore()

// @ts-expect-error vite.config variable
const buildYear = new Date(__BUILD_TIME__).getFullYear()
// @ts-expect-error vite.config variable
const buildTime = `${new Date(__BUILD_TIME__).toLocaleDateString('de-DE', { hour: 'numeric', minute: 'numeric' })} Uhr`

const logout = async () => {
	try {
		await instant.auth.signOut()
	} catch (error) {
		console.error(error)
	}
}

instant.subscribeAuth(auth => {
	// if (auth.error) addToast(auth.error.message, false)
	setAuthState(!!auth.user)
})

watch(
	() => state.isAuthenticated,
	async isLoggedIn => {
		await router.isReady()

		if (!isLoggedIn && route.name === 'add') {
			router.push('/')
			return
		}

		if (isLoggedIn && route.name === 'login') {
			router.replace((route.query.redirectTo as LocationQueryValue) ?? '/')
			return
		}
	},
)
</script>

<template>
	<nav v-if="state.isAuthenticated" class="container flex items-center gap-x-3 py-5">
		<RouterLink to="/">Home</RouterLink>
		<RouterLink to="/liste">Liste</RouterLink>
		<RouterLink to="/add">Neuer Tisch</RouterLink>
		<button type="button" class="secondary-button" @click="logout">Logout</button>
	</nav>

	<RouterView />

	<Teleport to="body">
		<footer v-once class="top-100vh container sticky flex gap-x-4 py-5">
			<details class="font-mono text-sm">
				<summary class="inline-block cursor-help">© 2023 - {{ buildYear }} Christian Niklas</summary>
				<div>{{ buildTime }}</div>
			</details>
			<a
				href="https://github.com/cniklas/reservation-spa"
				style="translate: 0 -0.125rem"
				aria-label="GitHub repo"
				rel="noopener"
			>
				<svg aria-hidden="true" class="size-6 fill-current" viewBox="0 0 16 16" width="24" height="24">
					<path
						fill-rule="evenodd"
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
					/>
				</svg>
			</a>
		</footer>
	</Teleport>
</template>
