<template>
	<div class="toast">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
	removeToast: []
}>()
const props = defineProps<{
	duration: number | null
}>()

let _timeout: number
onMounted(() => {
	if (props.duration) _timeout = window.setTimeout(emit, props.duration, 'removeToast')
})

// https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/
onUnmounted(() => {
	if (_timeout) window.clearTimeout(_timeout)
})
</script>
