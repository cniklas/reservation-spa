<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/supabase'
import { useErrorHandling } from '@/use/errorHandling'

const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError } = useErrorHandling()

const email = ref('')
const password = ref('')

const onSubmit = async () => {
	if (isSubmitLocked.value || isEmpty(email, password)) return

	beforeSubmit()

	try {
		const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
		if (error) throw error
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
				<button type="submit" class="primary-button" :aria-disabled="isSubmitLocked">Login</button>
			</div>
		</form>
	</main>
</template>
