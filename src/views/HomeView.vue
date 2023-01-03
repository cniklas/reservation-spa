<script setup>
import { ref, computed } from 'vue'
import { useCurrentUser } from 'vuefire'

const props = defineProps({
	tables: {
		type: Array,
		default: () => [],
	},
	blocks: {
		type: Map,
		default: () => new Map(),
	},
})

const user = useCurrentUser()

const selectedTable = ref(null)
const onEditTable = id => {
	if (selectedTable.value) return
	selectedTable.value = props.tables.find(item => item.id === id)
}
const onClose = () => {
	selectedTable.value = null
}

const occupancy = computed(() => {
	if (selectedTable.value === null) return []
	const _occupancy = []
	let n = 0
	while (n < selectedTable.value.seats) {
		const key = `seat_${++n}`
		/* if (selectedTable.value[key].length) */ _occupancy.push(selectedTable.value[key])
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
