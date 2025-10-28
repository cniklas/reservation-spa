<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from 'vue'
import { instant } from '@/instant'
import { useErrorHandling } from '@/use/errorHandling'
import { isEmpty } from '@/use/helper'

const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit } = useErrorHandling()

const email = ref('')
const passcode = ref('')
watch(passcode, input => {
	if (input.length === 6) onSubmit()
})

const formEl = useTemplateRef('formEl')
const isFirstStep = ref(true)
watch(isFirstStep, async () => {
	await nextTick()
	formEl.value!.querySelector('input')?.focus()
	unlockSubmit()
})

const onSubmit = () => {
	if (isFirstStep.value) _onSubmitEmail()
	else _onSubmitCode()
}

const _onSubmitEmail = async () => {
	if (isSubmitLocked.value || isEmpty(email)) return

	beforeSubmit()

	try {
		await instant.auth.sendMagicCode({ email: email.value })
		isFirstStep.value = false
	} catch (error) {
		handleSubmitError(error)
	}
}

const _onSubmitCode = async () => {
	if (isSubmitLocked.value || isEmpty(passcode, passcode)) return

	beforeSubmit()

	try {
		await instant.auth.signInWithMagicCode({ email: email.value, code: passcode.value })
	} catch (error) {
		handleSubmitError(error)

		// if ((error as AuthError).code === 'otp_expired') {
		// 	isFirstStep.value = true
		// 	passcode.value = ''
		// }
	}
}
</script>

<template>
	<main class="container py-5">
		<h1 id="aria-heading-login" class="mb-3 text-3xl font-semibold">Login</h1>

		<form ref="formEl" novalidate aria-labelledby="aria-heading-login" @submit.prevent="onSubmit">
			<div class="mb-2">
				<template v-if="isFirstStep">
					<label for="email" class="mb-1 block w-fit">E-Mail</label>
					<!-- eslint-disable-next-line vuejs-accessibility/no-autofocus -->
					<input v-model.trim="email" type="email" id="email" autocomplete="username" enterkeyhint="go" autofocus />
				</template>

				<template v-else>
					<label for="code" class="mb-1 block w-fit">Code</label>
					<input
						v-model.trim="passcode"
						type="text"
						id="code"
						inputmode="decimal"
						maxlength="6"
						pattern="\d{6,6}"
						autocomplete="one-time-code"
						enterkeyhint="go"
					/>
				</template>
			</div>

			<div class="mt-5">
				<button type="submit" class="primary-button" :aria-disabled="isSubmitLocked">
					{{ isFirstStep ? 'Gib ma’ Code' : 'Login' }}
				</button>
			</div>
		</form>
	</main>
</template>
