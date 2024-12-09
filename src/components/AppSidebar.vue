<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
	closing: []
	closed: []
}>()

const slideIn = ref(false)

const open = () => {
	slideIn.value = true
	sidebarEl.value?.focus()
}
const close = (cb?: () => void) => {
	_callback = cb
	slideIn.value = false
	emit('closing')
}

let _callback: (() => void) | undefined
const onTransitionEnd = () => {
	if (slideIn.value) return

	emit('closed')
	_callback?.()
}
const sidebarEl = useTemplateRef<HTMLDivElement | null>('sidebarEl')
onMounted(() => {
	sidebarEl.value?.addEventListener('transitionend', onTransitionEnd)
	sidebarEl.value?.addEventListener('transitioncancel', onTransitionEnd)
})
onBeforeUnmount(() => {
	sidebarEl.value?.removeEventListener('transitionend', onTransitionEnd)
	sidebarEl.value?.removeEventListener('transitioncancel', onTransitionEnd)
})

defineExpose({ open, close })
</script>

<template>
	<div ref="sidebarEl" class="sidebar" :class="{ 'slide-in': slideIn }" role="dialog" aria-modal="true" tabindex="-1">
		<slot />
	</div>
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
	border-left: 1.5px solid var(--black);
	background-color: var(--white);
	padding: 1.25rem 0.75rem 3rem;
	translate: 100%;
	transition: translate 360ms cubic-bezier(0.4, 0, 0.2, 1);

	@media (min-width: 40em) {
		padding-inline: 1rem;
	}

	&.slide-in {
		translate: unset;
	}
}
</style>
