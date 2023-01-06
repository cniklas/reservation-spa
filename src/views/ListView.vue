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

const names: ComputedRef<Name[]> = computed(() => {
	const _names: Name[] = []
	props.tables.forEach(table => {
		let n = 0
		while (n < table.seats) {
			const key = `seat_${++n}`
			if (!(table[key] as string).length) continue

			const name = (table[key] as string).split(' ')
			_names.push({
				name: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
				table: table.name,
			})
		}
	})

	_names.sort(_sortByName)
	return _names
})
</script>

<template>
	<main>
		<h1>Namensliste</h1>

		<table>
			<tr v-for="(item, i) in names" :key="i">
				<td>{{ i + 1 }}</td>
				<td>{{ item.name }}</td>
				<td>{{ item.table }}</td>
			</tr>
		</table>
	</main>
</template>
