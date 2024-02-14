<script setup lang="ts">
import { ref } from 'vue'

const dialogEl = ref<HTMLDialogElement | null>(null)
const open = () => {
	dialogEl.value?.showModal()
}

defineExpose({ open })
</script>

<template>
	<dialog
		ref="dialogEl"
		class="rounded-2 w-sm before:rounded-t-2 max-w-[calc(100vw-1.5rem)] border border-black p-3 pt-14 backdrop:bg-black/30 before:absolute before:left-0 before:top-0 before:h-12 before:w-full before:border-b before:border-b-black before:bg-gray-200 before:content-['']"
	>
		<button
			type="button"
			class="rounded-50% absolute right-0 top-0 inline-grid h-8 w-8 -translate-x-1/4 translate-y-1/4 place-content-center bg-slate-800 text-white focus-visible:outline-slate-800"
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
