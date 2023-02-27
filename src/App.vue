<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const auth = getAuth()

// @ts-ignore
// eslint-disable-next-line
const version: string = __APP_VERSION__
// @ts-ignore
// eslint-disable-next-line
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

const now = new Date()
if (now.getMonth() === 11 && now.getDate() === 31) {
	router.replace('/liste')
}
</script>

<template>
	<header>
		<img alt="Vue logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav class="flex items-center gap-2">
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/liste">Liste</RouterLink>
			<RouterLink v-if="isLoggedIn" to="/add">Add</RouterLink>
			<RouterLink v-if="!isLoggedIn" to="/login">Login</RouterLink>
			<button v-else type="button" @click="logout">Logout</button>
		</nav>
	</header>

	<RouterView />

	<footer>
		<details class="font-mono text-sm">
			<summary class="inline-block cursor-help">{{ version }}</summary>
			<div>{{ buildTime }}</div>
		</details>
	</footer>
</template>
