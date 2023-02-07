<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCurrentUser, useFirestore, useDocument } from 'vuefire'
import { collection, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import TableGroup from '@/components/TableGroup.vue'
import { formatDateTime } from '@/use/helper'

const tables = inject('tables') as Ref<TableDoc[]>

const user = useCurrentUser()
const db = useFirestore()
const uuid = ref(`_${Math.random().toString(36).substring(2, 10)}`)

const dialogEl: Ref<HTMLDialogElement | null> = ref(null)
const dialogMessage = ref('')

const leftBlock = computed(() => tables.value.filter(item => item.block_id === 1))
const middleBlock = computed(() => tables.value.filter(item => item.block_id === 2))
const rightBlock = computed(() => tables.value.filter(item => item.block_id === 3))

const OFFSET = 5 * 60 * 1000
let _timeout: number | undefined
const timerDuration = ref(OFFSET)
const isTimerRunning = ref(false)
let _interval: number | undefined
const countdown = ref(0)
const decreaseCountdown = () => {
	countdown.value--
}

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
const tableDocId = ref(FAUX_ID)
const isTableDocIdValid = computed(() => tableDocId.value !== FAUX_ID)
const _tableDoc = computed(() => doc(collection(db, 'tables'), tableDocId.value))
// will always be in sync with the data source
const selectedTable = useDocument(_tableDoc) as unknown as Ref<TableDoc | null>
const isFormOpen = computed(() => isTableDocIdValid.value && !!selectedTable.value)

const isSaving = ref(false)

const onEditTable = async (id: string) => {
	if (selectedTable.value) return

	tableDocId.value = id
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	_timeout = window.setTimeout(closeForm, OFFSET)
	isTimerRunning.value = true
	countdown.value = OFFSET / 1000
	_interval = window.setInterval(decreaseCountdown, 1000)

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

const closeForm = () => {
	if (!selectedTable.value) return

	cleanUp()
	_unlockTable(selectedTable.value.id)
}

const cleanUp = () => {
	if (!selectedTable.value) return

	clearTimeout(_timeout)
	isTimerRunning.value = false
	clearInterval(_interval)
	tableDocId.value = FAUX_ID
	isSaving.value = false
}

const onUnlockTable = (id: string) => {
	if (!user) return

	_unlockTable(id)
}

const _unlockTable = async (id: string) => {
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
	<div class="timer-bar" :class="{ 'is-running': isTimerRunning }" :style="{ '--duration': timerDuration }" />

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
		:class="{ 'is-running': isTimerRunning }"
		:style="{ '--duration': timerDuration }"
		:tables="tables"
		:table-doc="selectedTable"
		:is-logged-in="!!user"
		:countdown="countdown"
		@cancel="closeForm"
		@saving="isSaving = true"
		@saved="cleanUp"
	/>

	<dialog ref="dialogEl">
		<div>{{ dialogMessage }}</div>
		<button type="button" @click="dialogEl?.close()">close</button>
	</dialog>
</template>

<style lang="postcss">
.timer-bar {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	height: 0.25rem;

	&::after {
		content: '';
		display: block;
		height: inherit;
		/* background: linear-gradient(to right, darkorange, darkorange) no-repeat -100vw; */
		background-color: darkorange;
		transform: translateX(-100%);
	}

	&.is-running {
		background-color: wheat;

		&::after {
			/* background-position: 0; */
			transform: translateX(0);
			transition: transform calc(var(--duration) * 1ms) linear;
		}
	}
}
</style>
