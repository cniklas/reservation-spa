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
	slideIn.value = true
	dialogEl.value?.showModal()
	dialogEl.value?.scrollTo(0, 0)
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

defineExpose({ open, close })
</script>

<template>
	<dialog
		ref="dialogEl"
		class="sidebar-dialog"
		:class="{ 'slide-in': slideIn }"
		:style="{ '--slide-duration': SLIDE_DURATION }"
		@cancel.prevent="$emit('cancel')"
	>
		<slot />
	</dialog>
</template>

<style>
.sidebar-dialog {
	height: unset;
	max-height: unset;
	left: unset;

	top: 0.25rem;
	width: 100%;
	max-width: 24rem;
	overflow-y: auto;
	overscroll-behavior-y: contain;
	border-left: 1px solid hsl(0, 0%, 0%);
	background-color: hsl(0, 0%, 100%);
	padding: 1rem 0.75rem 3rem;
	translate: 100%;
	transition: translate calc(var(--slide-duration, 360) * 1ms) cubic-bezier(0.4, 0, 0.2, 1);

	@media (min-width: 40em) {
		& {
			padding-inline: 1rem;
		}
	}

	&.slide-in {
		translate: unset;
	}

	&::backdrop {
		background-color: transparent;
	}
}
</style>
