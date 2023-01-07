<script setup lang="ts">
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useCurrentUser, useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()
const db = useFirestore()

// plus 5 minutes
const _setLockedUntil = () => new Date().getTime() + 5 * 60 * 1000

const selectedTable: Ref<TableDoc | null> = ref(null)
const onEditTable = async (id: string): Promise<void> => {
	if (selectedTable.value) return

	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_until: _setLockedUntil() })
	selectedTable.value = props.tables.find(item => item.id === id) ?? null
}

const onClose = async (id: string): Promise<void> => {
	if (!selectedTable.value) return

	selectedTable.value = null
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_until: deleteField() })
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
				<button v-else type="button" :disabled="!!selectedTable || !!table.locked_until" @click="onEditTable(table.id)">
					{{ table.name }}
					<template v-if="table.locked_until">🔒</template>
				</button>
			</li>
		</ul>
	</main>

	<section v-if="selectedTable">
		<button type="button" @click="onClose(selectedTable!.id)">close</button>
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
