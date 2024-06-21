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
	<div class="sticky top-0 z-10 border-b border-b-black bg-white py-3">
		<search class="search container flex items-center">
			<label class="mr-3" for="search">Suche</label>
			<div class="relative max-w-56 grow">
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
					class="close-button"
					:class="{ 'sr-only': !search.length }"
					aria-label="Suche zurücksetzen"
					:aria-disabled="!search.length"
					data-test-search-button
					@click="resetSearch"
				>
					<svg class="close-icon" aria-hidden="true" width="14" height="14">
						<use href="/app.svg#plus" />
					</svg>
				</button>
			</div>
		</search>
	</div>
</template>

<style>
.search {
	.close-button {
		position: absolute;
		right: 0.25rem;
		top: 50%;
		height: 1.75rem;
		aspect-ratio: 1;
		translate: 0 -50%;
	}
}
</style>
