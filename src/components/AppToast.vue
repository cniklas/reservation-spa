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

let _timeout: number
onMounted(() => {
	_timeout = window.setTimeout(emit, 2400, 'removeToast')
})

onUnmounted(() => {
	if (_timeout) window.clearTimeout(_timeout)
})
</script>
