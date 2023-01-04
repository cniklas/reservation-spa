<script setup lang="ts">
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useCurrentUser } from 'vuefire'

// 🚩 TODO export
type Timestamp = {
	seconds: number
	nanoseconds: number
}
type TableDoc = {
	[index: string]: boolean | number | string | Timestamp
	active: boolean
	block_id: number
	id: string
	index: number
	name: string
	modified: Timestamp
	seat_1: string
	seat_2: string
	seat_3: string
	seat_4: string
	seat_5: string
	seat_6: string
	seat_7: string
	seat_8: string
	seats: number
}

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()

const selectedTable: Ref<TableDoc | null> = ref(null)
const onEditTable = (id: string): void => {
	if (selectedTable.value) return

	selectedTable.value = props.tables.find(item => item.id === id) ?? null
}
const onClose = (): void => {
	selectedTable.value = null
}

const occupancy: ComputedRef<string[]> = computed(() => {
	if (!selectedTable.value) return []

	const _occupancy: string[] = []
	let n = 0
	while (n < selectedTable.value.seats) {
		const key = `seat_${++n}`
		/* if (selectedTable.value[key].length) */ _occupancy.push(selectedTable.value[key] as string)
	}
	return _occupancy
})
</script>

<template>
	<main>
		<h1>Übersicht</h1>

		<ul>
			<li v-for="table in tables" :key="table.id">
				<template v-if="!user && !table.active">
					{{ table.name }}
				</template>
				<button v-else type="button" :disabled="!!selectedTable" @click="onEditTable(table.id)">
					{{ table.name }}
				</button>
			</li>
		</ul>
	</main>

	<section v-if="selectedTable">
		<button type="button" @click="onClose">close</button>
		<h2>{{ selectedTable.name }}</h2>

		<dl>
			<dt>Index</dt>
			<dd>{{ selectedTable.index }}</dd>
			<dt>Block</dt>
			<dd>{{ blocks.get(selectedTable.block_id) }}</dd>
			<dt>aktiv</dt>
			<dd>{{ selectedTable.active }}</dd>
			<dt>Sitzplätze</dt>
			<dd>{{ selectedTable.seats }}</dd>
			<dt>zuletzt geändert</dt>
			<dd>
				{{
					new Date(selectedTable.modified.seconds * 1000).toLocaleDateString('de-DE', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: 'numeric',
						minute: 'numeric',
						second: 'numeric',
					})
				}}
			</dd>
		</dl>

		<ol v-if="occupancy.length">
			<li v-for="(name, i) in occupancy" :key="`seat-${i}`">{{ name }}</li>
		</ol>
	</section>
</template>
