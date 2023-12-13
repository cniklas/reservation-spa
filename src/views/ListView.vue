<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import type { SeatKey } from '@/types/TableDoc.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { PROVIDE_TABLES } from '@/keys'
import { formatCount, sortByName, injectStrict } from '@/use/helper'

const tables = injectStrict(PROVIDE_TABLES)

const title: string = import.meta.env.VITE_APP_NAME

const _search = ref('')
const onUpdateSearch = (input: string) => {
	_search.value = input
}

const reservations = computed(() => {
	const reservations: SortableReservation[] = []
	tables.value
		?.filter(item => item.active)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}` as SeatKey
				if (!table[key].length) continue

				const name = table[key].split(' ')
				reservations.push({
					name: name.join(' '),
					// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
					sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : name[0] ?? '',
					table: table.name,
					hidden: _search.value.length >= 3 && table[key].toLowerCase().indexOf(_search.value.toLowerCase()) === -1,
				})
			}
		})

	reservations.sort(sortByName)
	return reservations
})
</script>

<template>
	<main class="px-3 py-5 sm:px-4">
		<h1 class="mb-1 text-3xl font-semibold">{{ title }}</h1>

		<template v-if="reservations.length > 0">
			<div>{{ formatCount(reservations.length, ['Person', 'Personen']) }}</div>

			<div class="mb-10 mt-6">
				<SearchBar class="mb-3" @update="onUpdateSearch" />

				<table class="re__list-table -mx-2">
					<thead>
						<tr>
							<th class="text-left font-semibold">Name</th>
							<th class="text-left font-semibold">Tisch</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(entry, i) in reservations" :key="i" :class="{ hidden: entry.hidden }">
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
