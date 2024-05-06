<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
	(event: 'closing'): void
	(event: 'closed'): void
}>()

const SLIDE_DURATION = 360
const slideIn = ref(false)

let _timeoutId: number
onBeforeUnmount(() => {
	clearTimeout(_timeoutId)
})

const open = () => {
	slideIn.value = true
}
const close = (cb?: Function) => {
	slideIn.value = false
	emit('closing')

	_timeoutId = window.setTimeout(() => {
		emit('closed')
		cb?.()
	}, SLIDE_DURATION)
}

defineExpose({ open, close })
</script>

<template>
	<section
		class="sidebar"
		:class="{ 'slide-in': slideIn }"
		:style="{ '--slide-duration': SLIDE_DURATION }"
		aria-labelledby="aria-section-heading"
	>
		<slot />
	</section>
</template>

<style>
.sidebar {
	position: fixed;
	bottom: 0;
	right: 0;
	top: 0;
	z-index: 20;
	width: 100%;
	max-width: 24rem;
	overflow-y: auto;
	overscroll-behavior-y: contain;
	border-left: 1px solid hsl(0, 0%, 0%);
	background-color: hsl(0, 0%, 100%);
	padding: 1.25rem 0.75rem 3rem;
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
}
</style>
