<script setup>
import { computed } from 'vue'

const props = defineProps({
	tables: {
		type: Array,
		default: () => [],
	},
})

const _sortByName = (a, b) => {
	const nameA = a.name.toLowerCase()
	const nameB = b.name.toLowerCase()
	if (nameA < nameB) return -1
	if (nameA > nameB) return 1
	return 0
}

const names = computed(() => {
	const _names = []
	props.tables.forEach(table => {
		let n = 0
		while (n < table.seats) {
			const key = `seat_${++n}`
			if (!table[key].length) continue

			const name = table[key].split(' ')
			_names.push({
				name: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0),
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
