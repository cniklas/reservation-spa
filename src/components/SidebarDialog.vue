<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'closing'): void
	(event: 'closed'): void
}>()

const SLIDE_DURATION = 360
const slideIn = ref(false)

let _timeoutId: number
onBeforeUnmount(() => {
	clearTimeout(_timeoutId)
})

const dialogEl = ref<HTMLDialogElement | null>(null)
const open = () => {
	dialogEl.value?.showModal()
	slideIn.value = true
}
const close = (cb?: Function) => {
	slideIn.value = false
	emit('closing')

	_timeoutId = window.setTimeout(() => {
		dialogEl.value?.close()
		emit('closed')
		cb?.()
	}, SLIDE_DURATION)
}

const onCancel = (e: Event) => {
	e.preventDefault()
	emit('cancel')
}

defineExpose({ open, close })
</script>

<template>
	<dialog
		ref="dialogEl"
		class="re__sidebar-dialog top-1 w-full max-w-sm overflow-y-auto overscroll-y-contain border-l border-l-black bg-white px-3 pb-12 pt-4 transition-transform duration-[--sidebar-duration] sm:px-4"
		:class="{ 'translate-x-full': !slideIn }"
		:style="{ '--sidebar-duration': `${SLIDE_DURATION}ms` }"
		@cancel="onCancel"
	>
		<h2 class="mb-4 text-2xl font-semibold empty:hidden" data-test-headline>
			<slot name="headline" />
		</h2>
		<slot />
	</dialog>
</template>

<style lang="postcss">
.re__sidebar-dialog {
	height: unset;
	max-height: unset;
	left: unset;

	&::backdrop {
		background-color: transparent;
	}
}
</style>
