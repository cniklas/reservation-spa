<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'

const tables = inject('tables') as Ref<TableDoc[]>

const _sortByName = (a: Reservation, b: Reservation) => {
	return a.name.localeCompare(b.name, 'de')
}

const reservations = computed(() => {
	const _reservations: Reservation[] = []
	tables.value.forEach(table => {
		let n = 0
		while (n < table.seats) {
			const key = `seat_${++n}`
			if (!(table[key] as string).length) continue

			const name = (table[key] as string).split(' ')
			_reservations.push({
				name: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
				table: table.name,
			})
		}
	})

	_reservations.sort(_sortByName)
	return _reservations
})

const search = ref('')
const searchDebounced = refDebounced(search, 360)
const resetSearch = () => {
	search.value = ''
}

const filteredReservations = computed(() => {
	if (searchDebounced.value.length)
		return reservations.value.filter(
			item => item.name.toLowerCase().indexOf(searchDebounced.value.toLowerCase()) !== -1
		)
	return reservations.value
})
</script>

<template>
	<main>
		<h1>Namensliste</h1>

		<div v-if="reservations.length > 0">
			<div>
				<input
					v-model.trim="search"
					type="search"
					placeholder="Suche"
					autocorrect="off"
					autocomplete="off"
					enterkeyhint="search"
					@keyup.esc="resetSearch"
				/>
				<button type="button" :class="{ hidden: !search.length }" @click="resetSearch">reset</button>
			</div>

			<table class="table-fixed">
				<thead>
					<tr>
						<th>#</th>
						<th>Name</th>
						<th>Tisch</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(entry, i) in filteredReservations" :key="i">
						<td>{{ i + 1 }}</td>
						<td>{{ entry.name }}</td>
						<td>{{ entry.table }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div v-else>keine Einträge</div>
	</main>
</template>
