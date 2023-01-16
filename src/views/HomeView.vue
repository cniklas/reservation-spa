<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import { useCurrentUser, useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import { formatDateTime, formatTime } from '@/use/helper'

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()
const db = useFirestore()

/**
 * TODOs
 * (1) `locked_until` muss über die Serverzeit von Firebase gesetzt werden, sonst gibt es keine eindeutige zeitl. Referenz
 * (2) auch die Freischaltung der Seite muss über eine externe Referenz kommen
 * (3) wenn der Admin einen Tisch freigibt, sollte sich das geöffnete Formular beim Client schließen
 */
const OFFSET: number = 5 * 60 * 1000
let _timeout: number | undefined
const _setLockedUntil = (): number => new Date().getTime() + OFFSET

const clientTime = ref('')
const serverTime = ref('')
const _fetchTime = async () => {
	try {
		const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Berlin')
		if (!response.ok) throw new Error('Could not retrieve server time')

		const dateNow = Date.now()
		clientTime.value = `${formatDateTime(dateNow)}.${new Date(dateNow).getMilliseconds()}`
		const { datetime } = await response.json()
		serverTime.value = `${formatDateTime(datetime)}.${new Date(datetime).getMilliseconds()}`
	} catch (error) {
		console.error(error)
	}
}

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

const onSaved = (): void => {
	if (!selectedTable.value) return

	clearTimeout(_timeout)
	selectedTable.value = null
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
	_fetchTime()
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
		<div>Client Time: {{ clientTime }}</div>
		<div>Server Time: {{ serverTime }}</div>

		<ul>
			<li v-for="table in tables" :key="table.id">
				({{ table.index }})
				<template v-if="!user && !table.active">{{ table.name }}</template>
				<template v-else>
					<button type="button" :disabled="!!selectedTable || !!table.locked_until" @click="onEditTable(table.id)">
						{{ table.name }}
						<template v-if="table.locked_until">🔒</template>
					</button>
					<!-- <span>{{ formatDateTime(table.modified.seconds * 1000) }}</span> -->
					<template v-if="table.locked_until">
						<button v-if="user" type="button" @click="onUnlock(table.id)">🔑</button>
						<code
							>{{ new Date(table.locked_until).getSeconds() }}.{{
								new Date(table.locked_until).getMilliseconds()
							}}</code
						>
						<template v-if="selectedTable?.id === table.id && selectedTable.locked_until">
							|
							<code
								>{{ new Date(selectedTable.locked_until).getSeconds() }}.{{
									new Date(selectedTable.locked_until).getMilliseconds()
								}}</code
							>
						</template>
					</template>
				</template>
			</li>
		</ul>
	</main>

	<TableForm
		v-if="selectedTable"
		:blocks="blocks"
		:table-data="selectedTable"
		:is-logged-in="!!user"
		@cancel="onClose"
		@saved="onSaved"
	/>
	<!-- <ol v-if="selectedTable && occupancy.length">
		<li v-for="(name, i) in occupancy" :key="`seat-${i}`">{{ name }}</li>
	</ol> -->
</template>
