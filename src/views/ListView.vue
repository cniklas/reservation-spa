<script setup>
import { ref, watch } from 'vue'
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'

const db = useFirestore()
const tables = useCollection(collection(db, 'tables'))
const names = ref([])

watch(tables, () => {
	const _names = []
	tables.value.forEach(table => {
		;['seat_1', 'seat_2', 'seat_3', 'seat_4', 'seat_5', 'seat_6', 'seat_7', 'seat_8'].forEach(key => {
			if (table[key].length) {
				let name = table[key].split(' ')
				name = name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name[0]
				_names.push({
					name,
					table: table.name,
				})
			}
		})
	})

	_names.sort((a, b) => {
		const nameA = a.name.toLowerCase()
		const nameB = b.name.toLowerCase()
		if (nameA < nameB) return -1
		if (nameA > nameB) return 1
		return 0
	})

	names.value = [..._names]
})
</script>

<template>
	<main>
		<h1>Namensliste</h1>

		<table style="table-layout: fixed">
			<tr v-for="(item, i) in names" :key="i">
				<td>{{ i + 1 }}</td>
				<td>{{ item.name }}</td>
				<td>{{ item.table }}</td>
			</tr>
		</table>
	</main>
</template>
