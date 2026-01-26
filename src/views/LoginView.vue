<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from 'vue'
import AppToast from '@/components/AppToast.vue'
import { instant } from '@/instant'
import { useErrorHandling } from '@/use/errorHandling'
import { isEmpty } from '@/use/helper'
import { useToast } from '@/use/toast'

const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit } = useErrorHandling()
const { toasts, addToast, removeToast } = useToast()

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
		// await instant.auth.sendMagicCode({ email: email.value })
		const response = await fetch('/.netlify/functions/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.value }),
		})
		if (!response.ok) {
			const data = await response.json()
			addToast('error', data.error ?? 'Das hat nicht geklappt.', 2400)
			unlockSubmit()
			return
		}

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

	<transition-group name="toasted" tag="div" class="toaster" aria-live="assertive">
		<!-- /!\ als `:key` keinesfalls den Array-Index verwenden; Indizes werden bei `splice` neu geschrieben -->
		<AppToast
			v-for="toast in toasts"
			:key="toast.id"
			:class="toast.type"
			:duration="toast.duration"
			@click="removeToast(toast.id)"
			@remove-toast="removeToast(toast.id)"
		>
			{{ toast.message }}
		</AppToast>
	</transition-group>
</template>

<style lang="postcss">
.toaster {
	@apply bottom-16 max-w-sm gap-y-2.5;
	display: grid;
	position: fixed;
	width: calc(100vw - 2rem);
	pointer-events: none;
	left: 50%;
	z-index: 51;
	translate: -50%;
}

.toast {
	@apply rounded-md px-3 py-1.5 leading-5;
	margin-inline: auto;
	cursor: pointer;
	pointer-events: auto;
	white-space: pre-line;

	/* &.info {
		background-color: oklch(62.31% 0.188 259.81);
		color: var(--white);
	} */

	/* &.success {
		@apply bg-emerald-500;
		color: var(--white);
	} */

	/* &.warning {
		@apply bg-yellow-300;
	} */

	&.error {
		background-color: oklch(63.68% 0.208 25.33);
		color: var(--white);
	}
}

@keyframes scale-fade-in {
	from {
		opacity: 0;
		scale: 0.8;
	}
}

@keyframes scale-fade-out {
	to {
		opacity: 0;
		scale: 0.75;
	}
}

.toasted-enter-active {
	/* Open Props ease-out-2 */
	animation: scale-fade-in 120ms cubic-bezier(0, 0, 0.5, 1);
}

.toasted-leave-active {
	/* Open Props ease-elastic-in-out-4 */
	animation: scale-fade-out 500ms cubic-bezier(0.5, -0.7, 0.1, 1.5);
}
</style>
