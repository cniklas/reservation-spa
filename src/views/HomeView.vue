<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import { useCurrentUser, useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import { formatTimestamp } from '@/use/helper'

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()
const db = useFirestore()

const OFFSET: number = 5 * 60 * 1000
let _timeout: number | undefined
const _setLockedUntil = (): number => new Date().getTime() + OFFSET

const selectedTable: Ref<TableDoc | null> = ref(null)
const onEditTable = async (id: string): Promise<void> => {
	if (selectedTable.value) return

	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_until: _setLockedUntil() })
	selectedTable.value = props.tables.find(item => item.id === id) ?? null
	_timeout = window.setTimeout(onClose, OFFSET)
}

const onClose = (): void => {
	if (!selectedTable.value) return

	clearTimeout(_timeout)
	const id = selectedTable.value.id
	selectedTable.value = null
	_unlockTable(id)
}

const onUnlock = (id: string): void => {
	if (!user) return

	_unlockTable(id)
}

const _unlockTable = async (id: string): Promise<void> => {
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

onMounted(() => {
	// 🔺 especially on mobile, the `beforeunload` event is not reliably fired
	// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
	window.addEventListener('beforeunload', onClose)
})
onBeforeUnmount(() => {
	onClose()
})
</script>

<template>
	<main>
		<h1>Übersicht</h1>

		<ul>
			<li v-for="table in tables" :key="table.id">
				({{ table.index }})
				<template v-if="!user && !table.active">{{ table.name }}</template>
				<template v-else>
					<button type="button" :disabled="!!selectedTable || !!table.locked_until" @click="onEditTable(table.id)">
						{{ table.name }}
						<template v-if="table.locked_until">🔒</template>
					</button>
					<template v-if="user && table.locked_until">
						<code>{{ formatTimestamp(table.locked_until) }}</code>
						<button type="button" @click="onUnlock(table.id)">🔑</button>
					</template>
				</template>
			</li>
		</ul>
	</main>

	<TableForm v-if="selectedTable" :blocks="blocks" :table-data="selectedTable" @cancel="onClose" />
	<!-- <section v-if="selectedTable">
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
	</section> -->
</template>
