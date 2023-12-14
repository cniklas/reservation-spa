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
		class="fixed bottom-0 right-0 top-0 z-20 w-full max-w-sm overflow-y-auto overscroll-y-contain border-l border-l-black bg-white px-3 pb-12 pt-5 transition-transform duration-[--sidebar-duration] sm:px-4"
		:class="{ 'translate-x-full': !slideIn }"
		:style="{ '--sidebar-duration': `${SLIDE_DURATION}ms` }"
		aria-label="Sidebar"
	>
		<h2 class="mb-4 text-2xl font-semibold empty:hidden" data-test-headline>
			<slot name="headline" />
		</h2>
		<slot />
	</section>
</template>
