<script setup lang="ts">
import { ref, computed } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { SortableReservation } from '@/types/Reservation.type'
import { PROVIDE_TABLES } from '@/keys'
import { formatCount, sortByName, injectStrict } from '@/use/helper'

const tables = injectStrict(PROVIDE_TABLES)

const reservations = computed(() => {
	const reservations: SortableReservation[] = []
	tables.value?.forEach(table => {
		let n = 0
		while (n < table.seats) {
			const key = `seat_${++n}`
			if (!(table[key] as string).length) continue

			const name = (table[key] as string).split(' ')
			reservations.push({
				name: name.join(' '),
				// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
				sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : name[0] ?? '',
				table: table.name,
			})
		}
	})

	reservations.sort(sortByName)
	return reservations
})

const search = ref('')
const searchDebounced = refDebounced(search, 240)
const resetSearch = () => {
	search.value = ''
}

const filteredReservations = computed(() => {
	if (searchDebounced.value.length < 3) return reservations.value

	return reservations.value.filter(item => item.name.toLowerCase().indexOf(searchDebounced.value.toLowerCase()) !== -1)
})
</script>

<template>
	<main class="px-3 py-5 sm:px-4">
		<h1 class="mb-1 text-3xl font-semibold">Liste</h1>

		<template v-if="reservations.length > 0">
			<div>{{ formatCount(reservations.length, ['Person', 'Personen']) }}</div>

			<div class="mb-10 mt-6">
				<div class="sticky top-0 z-10 -mx-3 mb-3 border-b border-b-black bg-white px-3 py-4 sm:-mx-4 sm:px-4">
					<label class="mr-2" for="search">Suche</label>
					<input
						v-model.trim="search"
						type="text"
						id="search"
						autocorrect="off"
						autocomplete="off"
						@keyup.esc="resetSearch"
					/>
					<button type="button" :class="{ hidden: !search.length }" @click="resetSearch">reset</button>
				</div>

				<table class="re__list-table -mx-2">
					<thead>
						<tr>
							<th class="text-left font-semibold">Name</th>
							<th class="text-left font-semibold">Tisch</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(entry, i) in filteredReservations" :key="i">
							<td>{{ entry.sortableName }}</td>
							<td>{{ entry.table }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
		<div v-else>keine Einträge</div>
	</main>
</template>

<style>
.re__list-table :is(th, td) {
	padding: 0.125rem 0.5rem;
}
</style>
