<script setup lang="ts">
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useErrorHandling } from '@/use/errorHandling'

const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError } = useErrorHandling()

const email = ref('')
const password = ref('')

const onSubmit = async () => {
	if (isSubmitLocked.value || isEmpty(email, password)) return

	beforeSubmit()

	try {
		// without `await` the error handling will not work
		await signInWithEmailAndPassword(auth, email.value, password.value)
	} catch (error) {
		handleSubmitError(error)
	}
}
</script>

<template>
	<main class="container py-5">
		<h1 class="mb-3 text-3xl font-semibold">Login</h1>

		<form novalidate @submit.prevent="onSubmit">
			<div class="mb-4">
				<label for="username" class="mr-3">Benutzername</label>
				<input v-model.trim="email" type="email" id="username" autocomplete="username" />
			</div>
			<div class="mb-4">
				<label for="password" class="mr-3">Passwort</label>
				<input
					v-model.trim="password"
					type="password"
					id="password"
					autocomplete="current-password"
					enterkeyhint="go"
				/>
			</div>
			<div class="mt-5">
				<button type="submit" class="re__primary-button" :disabled="isSubmitLocked">Login</button>
			</div>
		</form>
	</main>
</template>
