<script setup lang="ts">
import { ref, computed } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Reservation } from '@/types/Reservation.type'
import { PROVIDE_TABLES } from '@/keys'
import { formatCount, injectStrict } from '@/use/helper'

const tables = injectStrict(PROVIDE_TABLES)

// @ts-ignore
const _sortByName = (a: Reservation, b: Reservation) => a.sortableName.localeCompare(b.sortableName, 'de')

const reservations = computed(() => {
	const _reservations: Reservation[] = []
	tables.value?.forEach(_table => {
		let n = 0
		while (n < _table.seats) {
			const key = `seat_${++n}`
			if (!(_table[key] as string).length) continue

			const name = (_table[key] as string).split(' ')
			_reservations.push({
				name: name.join(' '),
				// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
				sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : name[0] ?? '',
				table: _table.name,
			})
		}
	})

	_reservations.sort(_sortByName)
	return _reservations
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
	<main class="px-4">
		<h1 class="text-xl font-semibold">Liste</h1>

		<div v-if="reservations.length > 0">
			<div class="mb-4">{{ formatCount(reservations.length, ['Person', 'Personen']) }}</div>
			<div>
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

			<table class="re__list-table">
				<thead>
					<tr>
						<th class="text-left">Name</th>
						<th class="text-left">Tisch</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(entry, i) in filteredReservations" :key="i">
						<td>{{ entry.name }}</td>
						<td>{{ entry.table }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div v-else>keine Einträge</div>
	</main>
</template>

<style>
.re__list-table {
	margin-inline: -0.5rem;
	width: 32rem;
	max-width: calc(100% + 1rem);

	& :is(th, td) {
		padding: 0.125rem 0.5rem;
	}
}
</style>
