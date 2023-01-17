<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref, type ComputedRef, type WatchStopHandle } from 'vue'
import { useCurrentUser, useFirestore, useDocument } from 'vuefire'
import { collection, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
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
const uuid = ref(`_${Math.random().toString(36).substring(2, 10)}`)

/**
 * TODOs
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
let selectedTableDoc: any
let unWatchSelectedTableDoc: WatchStopHandle | undefined
const onEditTable = async (id: string): Promise<void> => {
	if (selectedTable.value) return

	selectedTableDoc = useDocument(doc(collection(db, 'tables'), id))
	unWatchSelectedTableDoc = watch(
		() => selectedTableDoc?.value?.locked_by,
		(lockedBy: string | undefined) => {
			if (lockedBy && lockedBy !== uuid.value) {
				// 🔺 TODO toast message
				console.warn('Conclict')
				cleanUp()
			}
		}
	)

	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	selectedTable.value = props.tables.find(item => item.id === id) ?? null
	_timeout = window.setTimeout(onClose, OFFSET)
}

const onClose = (): void => {
	if (!selectedTable.value) return

	_unlockTable(selectedTable.value.id)
	cleanUp()
}

const cleanUp = (): void => {
	if (!selectedTable.value) return

	clearTimeout(_timeout)
	unWatchSelectedTableDoc?.()
	selectedTable.value = null
	selectedTableDoc = undefined
}

const onUnlock = (id: string): void => {
	if (!user) return

	_unlockTable(id)
}

const _unlockTable = async (id: string): Promise<void> => {
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: deleteField(), locked_at: deleteField() })
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
		<div>uuid: {{ uuid }}</div>
		<div>Client Time: {{ clientTime }}</div>
		<div>Server Time: {{ serverTime }}</div>

		<ul>
			<li v-for="table in tables" :key="table.id">
				({{ table.index }})
				<template v-if="!user && !table.active">{{ table.name }}</template>
				<template v-else>
					<button type="button" :disabled="!!selectedTable || !!table.locked_at" @click="onEditTable(table.id)">
						{{ table.name }}
						<template v-if="table.locked_at">🔒</template>
					</button>
					<!-- <span>{{ formatDateTime(table.modified.seconds * 1000) }}</span> -->
					<template v-if="table.locked_at">
						<button v-if="user" type="button" @click="onUnlock(table.id)">🔑</button>
						<!-- <code
							>{{ new Date(table.locked_until).getSeconds() }}.{{
								new Date(table.locked_until).getMilliseconds()
							}}</code
						> -->
						<template v-if="selectedTable?.id === table.id && selectedTable.locked">
							|
							<!-- <code
								>{{ new Date(selectedTable.locked_until).getSeconds() }}.{{
									new Date(selectedTable.locked_until).getMilliseconds()
								}}</code
							> -->
						</template>
					</template>
				</template>
			</li>
		</ul>
	</main>

	<pre>{{ selectedTableDoc?.locked_by }}</pre>
	<pre>{{ selectedTableDoc?.locked_at }}</pre>

	<TableForm
		v-if="selectedTable"
		:blocks="blocks"
		:table-data="selectedTable"
		:is-logged-in="!!user"
		@cancel="onClose"
		@saved="cleanUp"
	/>
	<!-- <ol v-if="selectedTable && occupancy.length">
		<li v-for="(name, i) in occupancy" :key="`seat-${i}`">{{ name }}</li>
	</ol> -->
</template>
