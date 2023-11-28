<script setup lang="ts">
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { useErrorHandling } from '@/use/errorHandling'

const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError } = useErrorHandling()

const email = ref('')
const password = ref('')

const onSubmit = /* async */ () => {
	if (isSubmitLocked.value || isEmpty(email, password)) return

	beforeSubmit()

	try {
		/* const { user } = await */ signInWithEmailAndPassword(auth, email.value, password.value)
	} catch (error) {
		handleSubmitError(error)
	}
}
</script>

<template>
	<main class="px-4 py-5">
		<h1 class="text-2xl font-semibold">Login</h1>

		<form novalidate @submit.prevent="onSubmit">
			<div>
				<label for="username">Benutzername</label>
				<input v-model.trim="email" type="email" id="username" autocomplete="username" />
			</div>
			<div>
				<label for="password">Passwort</label>
				<input
					v-model.trim="password"
					type="password"
					id="password"
					autocomplete="current-password"
					enterkeyhint="go"
				/>
			</div>
			<div>
				<button type="submit" class="re__primary-button" :disabled="isSubmitLocked">Login</button>
			</div>
		</form>
	</main>
</template>
