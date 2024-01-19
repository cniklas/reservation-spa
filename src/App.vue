<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'

const route = useRoute()
const router = useRouter()

// @ts-ignore
const version: string = __APP_VERSION__
// @ts-ignore
const buildYear = new Date(__BUILD_TIME__).getFullYear()
// @ts-ignore
const buildTime = `${new Date(__BUILD_TIME__).toLocaleDateString('de-DE', { hour: 'numeric', minute: 'numeric' })} Uhr`

const logout = () => {
	try {
		signOut(auth)
	} catch (error) {
		console.log(error)
	}
}

const isLoggedIn = ref(false)
onAuthStateChanged(auth, user => {
	isLoggedIn.value = !!user
})
watch(isLoggedIn, val => {
	if (!val && route.name === 'add') {
		router.push('/')
		return
	}

	if (val && route.name === 'login') {
		router.replace((route.query.redirectTo as string) ?? '/')
		return
	}
})

// const _now = new Date()
// if (_now.getMonth() === 11 && _now.getDate() === 31) {
// 	router.replace('/liste')
// }
</script>

<template>
	<header v-if="isLoggedIn" class="container py-5">
		<nav class="flex items-center gap-2">
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/liste">Liste</RouterLink>
			<RouterLink v-if="isLoggedIn" to="/add">Neuer Tisch</RouterLink>
			<button v-if="isLoggedIn" type="button" class="re__primary-button" @click="logout">Logout</button>
		</nav>
	</header>

	<RouterView />

	<Teleport to="body">
		<footer class="top-100vh container sticky py-5">
			<details class="font-mono text-sm">
				<summary class="inline-block cursor-help">© 2023 - {{ buildYear }} Christian Niklas v{{ version }}</summary>
				<div>{{ buildTime }}</div>
				<!-- <div id="debug-info"></div> -->
				<a href="https://github.com/cniklas/reservation-spa" ping="https://cniklas.uber.space/backfeed-ep/cron/jobs/ncapkygazmxftqdhnmstdimn" class="mt-2 inline-block h-6 w-6" rel="noopener">
					<span class="sr-only">GitHub repo</span>
					<svg aria-hidden="true" class="h-6 w-6 fill-current" viewBox="0 0 16 16" width="24" height="24">
						<path
							fill-rule="evenodd"
							d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
						/>
					</svg>
				</a>
			</details>
		</footer>
	</Teleport>
</template>
