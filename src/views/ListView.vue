<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import type { SeatKey } from '@/types/Table.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { useStore } from '@/use/store'
import { formatCount, sortByName } from '@/use/helper'
import { COUNT_UP_THRESHOLD, useCountUp } from '@/use/countUp'

const title: string = import.meta.env.VITE_APP_NAME

const { state, fetchEntries } = useStore()
fetchEntries()

const _search = ref('')
const onUpdateSearch = (input: string) => {
	_search.value = input
}

const reservations = computed(() => {
	const reservations: SortableReservation[] = []
	state.tables
		.filter(item => item.active)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}` as SeatKey
				if (!table[key].length) continue

				const name = table[key].split(' ')
				reservations.push({
					name: name.join(' '),
					sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : (name.at(0) ?? ''),
					table: `${table.index} ${table.name}`,
					hidden: _search.value.length >= 3 && table[key].toLowerCase().indexOf(_search.value.toLowerCase()) === -1,
				})
			}
		})

	reservations.sort(sortByName)
	return reservations
})
const count = computed(() => reservations.value.length)
const { countUp } = useCountUp(count)
</script>

<template>
	<main class="py-5">
		<div class="container">
			<h1 class="relative mb-1 w-fit text-3xl font-semibold">
				{{ title }}
				<svg class="doodle -top-4.5 -right-10.5 absolute size-10" aria-hidden="true" width="40" height="40">
					<use href="/app.svg#star-doodle" />
				</svg>
			</h1>

			<div v-if="count >= COUNT_UP_THRESHOLD" class="count-up" :style="{ '--count-up': countUp }">Personen</div>
			<div v-else>{{ count > 0 ? formatCount(count, ['Person', 'Personen']) : 'niemand eingetragen' }}</div>
		</div>

		<div v-if="count > 0" class="mb-10 mt-6">
			<SearchBar class="mb-3" @update="onUpdateSearch" />

			<div class="container">
				<table class="list-table -mx-2">
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
		</div>
	</main>
</template>

<style>
.list-table :is(th, td) {
	padding: 0.125rem 0.5rem;
	vertical-align: top;
}
</style>
