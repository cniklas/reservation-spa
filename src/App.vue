<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
	<header>
		<img alt="Vue logo" src="@/assets/logo.svg" width="125" height="125" />

		<nav>
			<RouterLink to="/">Home</RouterLink>
			<RouterLink to="/liste">Liste</RouterLink>
			<RouterLink to="/add">Add</RouterLink>
			<RouterLink to="/login">Login</RouterLink>
		</nav>
	</header>

	<RouterView />
</template>
