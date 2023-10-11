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

const _now = new Date()
if (_now.getMonth() === 11 && _now.getDate() === 31) {
	router.replace('/liste')
}
</script>

<template>
	<header class="mb-5 p-4">
		<!-- <img alt="Vue logo" src="@/assets/logo.svg" width="125" height="125" /> -->

		<nav class="flex items-center gap-2">
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/liste">Liste</RouterLink>
			<RouterLink v-if="isLoggedIn" to="/add">Add</RouterLink>
			<button v-if="isLoggedIn" type="button" @click="logout">Logout</button>
		</nav>
	</header>

	<RouterView />

	<footer class="mt-10 p-4">
		<details class="font-mono text-sm">
			<summary class="inline-block cursor-help">{{ version }}</summary>
			<div>{{ buildTime }}</div>
		</details>
	</footer>
</template>
