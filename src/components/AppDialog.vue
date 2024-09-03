<script setup lang="ts">
import { useTemplateRef } from 'vue'

const dialogEl = useTemplateRef<HTMLDialogElement | null>('dialog')
const open = () => {
	dialogEl.value?.showModal()
}

defineExpose({ open })
</script>

<template>
	<dialog ref="dialog" class="dialog" role="alertdialog" aria-labelledby="js-dialog-content">
		<button type="button" class="close-button" aria-label="Dialog schließen" @click="dialogEl?.close()">
			<svg class="close-icon" aria-hidden="true" width="14" height="14">
				<use href="/app.svg#plus" />
			</svg>
		</button>
		<div class="whitespace-pre-line first-line:font-semibold" id="js-dialog-content"><slot /></div>
	</dialog>
</template>

<style>
.dialog {
	border-radius: 0.5rem;
	border: 1px solid var(--black);
	width: 24rem;
	max-width: calc(100vw - 1.5rem);
	padding: 3.5rem 0.75rem 0.75rem;

	&::before {
		content: '';
		border-top-left-radius: calc(0.5rem - 1px);
		border-top-right-radius: calc(0.5rem - 1px);
		border-bottom: 1px solid var(--black);
		height: 3rem;
		width: 100%;
		border-bottom: 0;
		background-color: oklch(92.78% 0.006 264.53);
		position: absolute;
		top: 0;
		left: 0;
	}

	&::backdrop {
		background-color: oklch(0% 0 0 / 30%);
	}

	.close-button {
		position: absolute;
		right: 0;
		top: 0;
		height: 2rem;
		aspect-ratio: 1;
		translate: -25% 25%;
	}
}
</style>
