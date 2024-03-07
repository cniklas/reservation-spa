<script setup lang="ts">
import { ref } from 'vue'

const dialogEl = ref<HTMLDialogElement | null>(null)
const open = () => {
	dialogEl.value?.showModal()
}

defineExpose({ open })
</script>

<template>
	<dialog ref="dialogEl" class="dialog">
		<button
			type="button"
			class="close-button absolute right-0 top-0 h-8 w-8 -translate-x-1/4 translate-y-1/4"
			aria-label="Dialog schließen"
			@click="dialogEl?.close()"
		>
			<svg class="close-icon" aria-hidden="true" width="14" height="14">
				<use href="/app.svg#plus" />
			</svg>
		</button>
		<div class="whitespace-pre-line first-line:font-semibold"><slot /></div>
	</dialog>
</template>

<style>
.dialog {
	border-radius: 0.5rem;
	border: 1px solid hsl(0, 0%, 0%);
	width: 24rem;
	max-width: calc(100vw - 1.5rem);
	padding: 3.5rem 0.75rem 0.75rem;

	&::before {
		content: '';
		border-radius: 0.5rem 0.5rem 0 0;
		border-bottom: 1px solid hsl(0, 0%, 0%);
		height: 3rem;
		width: 100%;
		border-bottom: 0;
		background-color: hsl(220, 13%, 91%);
		position: absolute;
		top: 0;
		left: 0;
	}

	&::backdrop {
		background-color: hsla(0, 0%, 0%, 0.3);
	}
}
</style>
