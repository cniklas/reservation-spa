<script setup lang="ts">
import { ref } from 'vue'

const dialogEl = ref<HTMLDialogElement | null>(null)
const open = () => {
	dialogEl.value?.showModal()
}

defineExpose({ open })
</script>

<template>
	<dialog ref="dialogEl">
		<button
			type="button"
			class="rounded-50% absolute right-0 top-0 inline-grid h-8 w-8 -translate-x-1/4 translate-y-1/4 place-content-center bg-slate-800 text-white focus-visible:outline-slate-800"
			autofocus
			aria-label="Dialog schließen"
			@click="dialogEl?.close()"
		>
			<svg class="re__close-icon" aria-hidden="true" width="14" height="14">
				<use href="/app.svg#plus" />
			</svg>
		</button>
		<div class="whitespace-pre-line first-line:font-semibold"><slot /></div>
	</dialog>
</template>

<style lang="postcss">
dialog {
	@apply color-inherit rounded-2 w-sm fixed max-w-[calc(100vw-1.5rem)] border border-black p-3 pt-14;

	&::before {
		content: '';
		@apply rounded-t-2 absolute left-0 top-0 h-12 w-full border-b border-b-black bg-gray-200;
	}

	&::backdrop {
		@apply fixed inset-0 bg-black/30;
	}
}
</style>
