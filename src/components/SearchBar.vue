<script setup lang="ts">
import { ref, useTemplateRef, watch, nextTick } from 'vue'
import { refDebounced } from '@vueuse/core'

const emit = defineEmits<{
	update: [input: string]
}>()

const inputEl = useTemplateRef<HTMLInputElement | null>('inputEl')
const search = ref('')
const resetSearch = async () => {
	search.value = ''
	await nextTick()
	inputEl.value?.focus()
	/**
	 * if we'd use `@keyup.enter="…blur()"` on the input element instead of `@keydown.enter="…blur()"` it would go like this:
	 * - reset button is triggered by the enter key and fires the 'resetSearch' method
	 * - input element receives focus
	 * - input element receives the keyup event from step 1 and fires the blur method
	 * - input element loses focus
	 */
}

const searchDebounced = refDebounced(search, 240)
watch(searchDebounced, val => {
	emit('update', val)
})
</script>

<template>
	<div class="border-b-1.5 sticky top-0 z-10 border-b-black bg-white py-3">
		<search class="search container flex items-center gap-x-3">
			<label for="search">Suche</label>
			<div class="relative max-w-56 grow">
				<input
					ref="inputEl"
					v-model.trim="search"
					type="text"
					class="rounded-4.5 h-9 w-full pl-3 pr-9"
					id="search"
					autocorrect="off"
					autocomplete="off"
					data-test-search-input
					@keyup.esc="resetSearch"
					@keydown.enter="($event.target as HTMLInputElement).blur()"
				/>
				<button
					type="button"
					class="close-button"
					:class="{ '!hidden': !search.length }"
					aria-label="Suche zurücksetzen"
					data-test-search-button
					@click="resetSearch"
				>
					<svg class="close-icon" aria-hidden="true" width="14" height="14"><use href="/app.svg#plus" /></svg>
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
