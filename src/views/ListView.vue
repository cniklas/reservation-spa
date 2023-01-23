<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'
import type { TableDoc } from '@/types/TableDoc.type'

type Name = {
	name: string
	table: string
}

const props = defineProps<{
	tables: TableDoc[]
}>()

const _sortByName = (a: Name, b: Name): 1 | -1 | 0 => {
	const nameA = a.name.toLowerCase()
	const nameB = b.name.toLowerCase()
	if (nameA < nameB) return -1
	if (nameA > nameB) return 1
	return 0
}

const reservations: ComputedRef<Name[]> = computed(() => {
	const _reservations: Name[] = []
	props.tables.forEach(table => {
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
			<tr v-for="(entry, i) in reservations" :key="i">
				<td>{{ i + 1 }}</td>
				<td>{{ entry.name }}</td>
				<td>{{ entry.table }}</td>
			</tr>
		</table>
	</main>
</template>
