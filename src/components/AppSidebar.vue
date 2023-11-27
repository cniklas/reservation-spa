<script setup lang="ts">
import { ref, onBeforeUnmount, withDefaults } from 'vue'

const emit = defineEmits<{
	(event: 'closing'): void
	(event: 'closed'): void
}>()
withDefaults(
	defineProps<{
		headline?: string
	}>(),
	{
		headline: '',
	},
)

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
		ref="sidebarEl"
		class="fixed bottom-0 right-0 top-0 z-20 w-full max-w-sm overflow-y-auto overscroll-y-contain bg-white px-4 py-5 shadow-[-1px_0_0_#000] transition-transform duration-[--sidebar-duration]"
		:class="{ 'translate-x-full': !slideIn }"
		:style="{ '--sidebar-duration': `${SLIDE_DURATION}ms` }"
		aria-labelledby="sidebar-headline"
	>
		<h2 class="mb-6 text-2xl font-semibold empty:hidden" id="sidebar-headline" aria-hidden="true">
			{{ headline }}
		</h2>
		<slot />
	</section>
</template>
