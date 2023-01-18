<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCurrentUser, useFirestore, useDocument } from 'vuefire'
import { collection, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc, LockedTableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import { formatDateTime, formatTime } from '@/use/helper'

defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()
const db = useFirestore()
const uuid = ref(`_${Math.random().toString(36).substring(2, 10)}`)

const dialogEl: Ref<HTMLDialogElement | null> = ref(null)
const dialogMessage = ref('')

const OFFSET: number = 5 * 60 * 1000
let _timeout: number | undefined
const _setLockedUntil = (): number => new Date().getTime() + OFFSET

// 🔺 TODO Freischaltung der Seite zum Zeitpunkt x muss über eine externe Referenz kommen
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

const FAUX_ID = 'nope'
const tableDocId: Ref<string> = ref(FAUX_ID)
const _tableDoc = computed(() => doc(collection(db, 'tables'), tableDocId.value))
// will always be in sync with the data source
const selectedTable = useDocument(_tableDoc) as unknown as Ref<LockedTableDoc | null>

const onEditTable = async (id: string): Promise<void> => {
	if (selectedTable.value) return

	tableDocId.value = id
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	_timeout = window.setTimeout(closeForm, OFFSET)
}
watch(
	() => selectedTable.value?.locked_by,
	(lockedBy: string | undefined) => {
		if (lockedBy && lockedBy !== uuid.value) {
			console.warn('Conflict')
			cleanUp()
			dialogMessage.value = 'Conflict'
			dialogEl.value?.showModal()
		}
	}
)

const closeForm = (): void => {
	if (!selectedTable.value) return

	cleanUp()
	_unlockTable(selectedTable.value.id)
}

const cleanUp = (): void => {
	if (!selectedTable.value) return

	clearTimeout(_timeout)
	tableDocId.value = FAUX_ID
}

// 🔺 TODO wenn der Admin einen Tisch freigibt, muss das geöffnete Formular beim Client geschlossen werden
const onUnlock = (id: string): void => {
	if (!user) return

	_unlockTable(id)
}

const _unlockTable = async (id: string): Promise<void> => {
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: deleteField(), locked_at: deleteField() })
}

// const occupancy: ComputedRef<string[]> = computed(() => {
// 	if (!selectedTable.value) return []

// 	const _occupancy: string[] = []
// 	let n = 0
// 	while (n < selectedTable.value.seats) {
// 		const key = `seat_${++n}`
// 		/* if (selectedTable.value[key].length) */ _occupancy.push(selectedTable.value[key] as string)
// 	}
// 	return _occupancy
// })

onMounted(() => {
	_fetchTime()
	// 🔺 especially on mobile, the `beforeunload` event is not reliably fired
	// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
	window.addEventListener('beforeunload', closeForm)
})
onBeforeUnmount(() => {
	closeForm()
})
onBeforeRouteLeave(() => {
	closeForm()
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
						<!-- <code>{{ new Date(table.locked_at).getSeconds() }}.{{ new Date(table.locked_at).getMilliseconds() }}</code> -->
						<!-- <template v-if="selectedTable?.id === table.id && selectedTable.locked_at">
							|
							<code>
								{{ new Date(selectedTable.locked_at).getSeconds() }}.{{
									new Date(selectedTable.locked_at).getMilliseconds()
								}}
							</code>
						</template> -->
					</template>
				</template>
			</li>
		</ul>
	</main>

	<pre>{{ selectedTable?.locked_by }}</pre>
	<pre>{{ selectedTable?.locked_at }}</pre>

	<TableForm
		v-if="selectedTable"
		:blocks="blocks"
		:table-doc="selectedTable"
		:is-logged-in="!!user"
		@cancel="closeForm"
		@saved="cleanUp"
	/>
	<!-- <ol v-if="selectedTable && occupancy.length">
		<li v-for="(name, i) in occupancy" :key="`seat-${i}`">{{ name }}</li>
	</ol> -->

	<dialog ref="dialogEl">
		<div>{{ dialogMessage }}</div>
		<button type="button" @click="dialogEl?.close()">close</button>
	</dialog>
</template>
