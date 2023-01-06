<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useErrorHandling } from '@/use/errorHandling'

const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError } = useErrorHandling()

const email: Ref<string> = ref('')
const password: Ref<string> = ref('')

const onSubmit = async (): Promise<void> => {
	if (isEmpty(email, password)) return

	if (!isSubmitLocked.value) {
		beforeSubmit()

		try {
			const auth = getAuth()
			/* const { user } = */ await signInWithEmailAndPassword(auth, email.value, password.value)
		} catch (error) {
			handleSubmitError(error)
		}
	}
}
</script>

<template>
	<main>
		<h1>Login</h1>
		<form novalidate @submit.prevent="onSubmit">
			<div><input v-model.trim="email" type="email" enterkeyhint="go" /></div>
			<div><input v-model.trim="password" type="password" enterkeyhint="go" /></div>
			<div><button type="submit" :disabled="isSubmitLocked">Login</button></div>
		</form>
	</main>
</template>
