<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, type Ref, type ComputedRef } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCurrentUser, useFirestore, useDocument } from 'vuefire'
import { collection, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import TableGroup from '@/components/TableGroup.vue'
import { formatDateTime, formatTime } from '@/use/helper'

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()

const user = useCurrentUser()
const db = useFirestore()
const uuid = ref(`_${Math.random().toString(36).substring(2, 10)}`)

const dialogEl: Ref<HTMLDialogElement | null> = ref(null)
const dialogMessage = ref('')

const leftBlock: ComputedRef<TableDoc[]> = computed(() => props.tables.filter(item => item.block_id === 1))
const middleBlock: ComputedRef<TableDoc[]> = computed(() => props.tables.filter(item => item.block_id === 2))
const rightBlock: ComputedRef<TableDoc[]> = computed(() => props.tables.filter(item => item.block_id === 3))

const OFFSET: number = 5 * 60 * 1000
let _timeout: number | undefined
// const _setLockedUntil = (): number => new Date().getTime() + OFFSET

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
const isTableDocIdValid: ComputedRef<boolean> = computed(() => tableDocId.value !== FAUX_ID)
const _tableDoc = computed(() => doc(collection(db, 'tables'), tableDocId.value))
// will always be in sync with the data source
const selectedTable = useDocument(_tableDoc) as unknown as Ref<TableDoc | null>
const isFormOpen: ComputedRef<boolean> = computed(() => isTableDocIdValid.value && !!selectedTable.value)

const isSaving: Ref<boolean> = ref(false)

const onEditTable = async (id: string): Promise<void> => {
	if (selectedTable.value) return

	tableDocId.value = id
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	_timeout = window.setTimeout(closeForm, OFFSET)

	// 🔺 TODO remove when final layout has been set up
	await nextTick()
	document.querySelector('#table-form')?.scrollIntoView({ behavior: 'smooth' })
}
watch(
	() => selectedTable.value?.locked_by,
	(lockedBy: string | undefined) => {
		// another user owned the table at the same moment
		if (lockedBy && lockedBy !== uuid.value) {
			console.warn('Conflict')
			cleanUp()
			dialogMessage.value = 'Conflict'
			dialogEl.value?.showModal()
			return
		}

		// if table is unlocked by admin user the open form needs to be closed
		if (!lockedBy && isTableDocIdValid.value && !isSaving.value) {
			cleanUp()
			dialogMessage.value = 'Unlocked by admin user'
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
	isSaving.value = false
}

const onUnlockTable = (id: string): void => {
	if (!user) return

	_unlockTable(id)
}

const _unlockTable = async (id: string): Promise<void> => {
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: deleteField(), locked_at: deleteField() })
}

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
		<div>Client Time: {{ clientTime }}</div>
		<div>Server Time: {{ serverTime }}</div>

		<div style="display: grid; grid-template-columns: repeat(3, 1fr)">
			<TableGroup
				:tables="leftBlock"
				:uuid="uuid"
				:is-logged-in="!!user"
				:is-form-open="isFormOpen"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
			<TableGroup
				:tables="middleBlock"
				:uuid="uuid"
				:is-logged-in="!!user"
				:is-form-open="isFormOpen"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
			<TableGroup
				:tables="rightBlock"
				:uuid="uuid"
				:is-logged-in="!!user"
				:is-form-open="isFormOpen"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
		</div>
	</main>

	<TableForm
		v-if="isTableDocIdValid && !!selectedTable"
		id="table-form"
		:blocks="blocks"
		:tables="tables"
		:table-doc="selectedTable"
		:is-logged-in="!!user"
		@cancel="closeForm"
		@saving="isSaving = true"
		@saved="cleanUp"
	/>

	<dialog ref="dialogEl">
		<div>{{ dialogMessage }}</div>
		<button type="button" @click="dialogEl?.close()">close</button>
	</dialog>
</template>
