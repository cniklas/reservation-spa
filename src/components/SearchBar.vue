<script setup lang="ts">
import { ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { blurInput } from '@/use/helper'

const emit = defineEmits<{
	(event: 'update', input: string): void
}>()

const search = ref('')
const resetSearch = () => {
	search.value = ''
}

const searchDebounced = refDebounced(search, 240)
watch(searchDebounced, val => {
	emit('update', val)
})
</script>

<template>
	<div class="sticky top-0 z-10 -mx-3 flex items-center border-b border-b-black bg-white px-3 py-3 sm:-mx-4 sm:px-4">
		<label class="mr-3" for="search">Suche</label>
		<div class="max-w-14rem relative grow">
			<input
				v-model.trim="search"
				type="text"
				class="rounded-4.5 h-9 w-full pl-3 pr-9"
				id="search"
				autocorrect="off"
				autocomplete="off"
				data-test-search-input
				@keyup.esc="resetSearch"
				@keyup.enter="blurInput"
			/>
			<button
				type="button"
				class="rounded-50% absolute right-1 top-1/2 inline-grid h-7 w-7 -translate-y-1/2 place-content-center bg-slate-800 text-white focus-visible:outline-slate-800"
				:class="{ '!hidden': !search.length }"
				aria-label="Reset"
				data-test-search-button
				@click="resetSearch"
			>
				<svg class="re__close-icon" aria-hidden="true" width="14" height="14">
					<use href="@/assets/app.svg#plus" />
				</svg>
			</button>
		</div>
	</div>
</template>
