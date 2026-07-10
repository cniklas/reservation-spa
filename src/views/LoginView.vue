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
	formEl.value?.focus()
	await nextTick()
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
			addToast(data.error ?? 'Das hat nicht geklappt.')
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
		<h1 id="aria-heading-login" class="font-600 mb-3 text-3xl">Anmelden</h1>

		<form
			ref="formEl"
			class="max-w-106"
			novalidate
			tabindex="-1"
			aria-labelledby="aria-heading-login"
			@submit.prevent="onSubmit"
		>
			<Transition name="drag" mode="out-in">
				<div v-if="isFirstStep">
					<div>
						<label for="email" class="mb-1 block w-fit">E-Mail</label>
						<!-- eslint-disable-next-line vuejs-accessibility/no-autofocus -->
						<input v-model.trim="email" type="email" id="email" autocomplete="username" enterkeyhint="go" autofocus />
					</div>

					<div class="mt-5">
						<button type="submit" class="primary-button login-button" :aria-disabled="isSubmitLocked">
							Login-Code anfordern
						</button>
					</div>
				</div>

				<div v-else>
					<div>
						<label for="code" class="mb-1 block w-fit">Login-Code</label>
						<input
							v-model.trim="passcode"
							type="text"
							id="code"
							inputmode="decimal"
							maxlength="6"
							pattern="\d{6}"
							autocomplete="one-time-code"
							enterkeyhint="go"
							placeholder="123456"
						/>
					</div>

					<div class="mt-5">
						<button type="submit" class="primary-button login-button" :aria-disabled="isSubmitLocked">Anmelden</button>
					</div>
				</div>
			</Transition>
		</form>
	</main>

	<TransitionGroup name="toasted" tag="div" class="toaster" aria-live="assertive">
		<AppToast
			v-for="toast in toasts"
			:key="toast.id"
			@click="removeToast(toast.id)"
			@remove-toast="removeToast(toast.id)"
		>
			{{ toast.message }}
		</AppToast>
	</TransitionGroup>
</template>

<style lang="postcss">
.drag-enter-active,
.drag-leave-active {
	transition:
		opacity 360ms,
		translate 400ms;
}

.drag-enter-from {
	opacity: 0;
	translate: -100%;
	transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
}

.drag-leave-to {
	opacity: 0;
	translate: 100%;
	transition-timing-function: cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

@keyframes spin {
	to {
		transform: rotate(1turn);
	}
}

.login-button {
	@apply gap-x-3;
	display: inline-flex;
	align-items: center;

	&[aria-disabled='true']::before {
		@apply size-4;
		content: '';
		border-radius: 50%;
		border-width: 2px;
		border-color: transparent currentColor currentColor transparent;
		animation: spin 1200ms linear infinite;
	}
}

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
	background-color: oklch(63.68% 0.208 25.33);
	color: var(--white);
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
