<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useFirestore, useCollection } from 'vuefire'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const auth = getAuth()

const db = useFirestore()
const tables = useCollection(collection(db, 'tables'))

const logout = () => {
	try {
		signOut(auth)
	} catch (error) {
		console.log(error)
	}
}

const isLoggedIn = ref(false)
watch(isLoggedIn, val => {
	if (!val && route.name === 'add') {
		router.push('/')
		return
	}

	if (val && route.name === 'login') {
		router.push(route.query.redirectTo ?? '/')
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

	<RouterView :tables="tables" />
</template>
