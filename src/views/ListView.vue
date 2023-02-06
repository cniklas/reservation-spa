<script setup lang="ts">
import { computed, inject, type Ref, type ComputedRef } from 'vue'
import type { TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'

const tables = inject('tables') as Ref<TableDoc[]>

const _sortByName = (a: Reservation, b: Reservation): number => {
	return a.name.localeCompare(b.name, 'de')
}

const reservations: ComputedRef<Reservation[]> = computed(() => {
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
</script>

<template>
	<main>
		<h1>Namensliste</h1>

		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Name</th>
					<th>Tisch</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(entry, i) in reservations" :key="i">
					<td>{{ i + 1 }}</td>
					<td>{{ entry.name }}</td>
					<td>{{ entry.table }}</td>
				</tr>
			</tbody>
		</table>
	</main>
</template>
