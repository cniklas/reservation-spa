<script setup lang="ts">
import { ref, watch, onMounted, type Ref } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useFirestore, useCollection } from 'vuefire'
import { collection, query, orderBy } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'

const route = useRoute()
const router = useRouter()
const auth = getAuth()

// @ts-ignore
// eslint-disable-next-line
const version: string = __APP_VERSION__
// @ts-ignore
// eslint-disable-next-line
const buildTime: string = `${new Date(__BUILD_TIME__).toLocaleDateString('de-DE', { hour: 'numeric', minute: 'numeric' })} Uhr`

const blocks: Map<number, string> = new Map([
	[1, 'Linker Block'],
	[2, 'Mittelblock'],
	[3, 'Rechter Block'],
])
const db = useFirestore()
const tables = useCollection(query(collection(db, 'tables'), orderBy('index')))

const logout = (): void => {
	try {
		signOut(auth)
	} catch (error) {
		console.log(error)
	}
}

const isLoggedIn: Ref<boolean> = ref(false)
watch(isLoggedIn, val => {
	if (!val && route.name === 'add') {
		router.push('/')
		return
	}

	if (val && route.name === 'login') {
		router.push((route.query.redirectTo as string) ?? '/')
		return
	}
})

onMounted(() => {
	onAuthStateChanged(auth, user => {
		isLoggedIn.value = !!user
	})
})
</script>

<template>
	<header>
		<img alt="Vue logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/liste">Liste</RouterLink>
			<RouterLink v-if="isLoggedIn" to="/add">Add</RouterLink>
			<RouterLink v-if="!isLoggedIn" to="/login">Login</RouterLink>
			<button v-else type="button" @click="logout">Logout</button>
		</nav>
	</header>

	<RouterView :blocks="blocks" :tables="tables" />

	<footer>
		<details>
			<summary>{{ version }}</summary>
			<div>{{ buildTime }}</div>
		</details>
	</footer>
</template>
