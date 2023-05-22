<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCurrentUser, useFirestore, useDocument, type _RefFirestore } from 'vuefire'
import { collection, doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
// import { isSafari } from '@firebase/util'
import type { TableDoc } from '@/types/TableDoc.type'
import TableForm from '@/components/TableForm.vue'
import TableGroup from '@/components/TableGroup.vue'
import { formatDateTime } from '@/use/helper'

const tables = inject('tables') as _RefFirestore<TableDoc[]>

const user = useCurrentUser()
const db = useFirestore()
const uuid = ref(`_${Math.random().toString(36).substring(2, 10)}`)

const dialogEl: Ref<HTMLDialogElement | null> = ref(null)
const dialogMessage = ref('')
const _showDialog = (message: string) => {
	dialogMessage.value = message
	dialogEl.value?.showModal()
}

const leftBlock = computed(() => tables.value.filter(item => item.block_id === 1))
const middleBlock = computed(() => tables.value.filter(item => item.block_id === 2))
const rightBlock = computed(() => tables.value.filter(item => item.block_id === 3))

let _interval: number | undefined

// 🔺 TODO mit `_fetchTime` verkuddeln, da clientseitige Zeit falsch sein kann
const _releaseTime = new Date(import.meta.env.VITE_RELEASE_DATE).getTime()
const _isReleasedNow = () => _releaseTime <= Date.now()
const isReleased = ref(_isReleasedNow())
if (!isReleased.value) {
	_interval = window.setInterval(() => {
		if (!_isReleasedNow()) return
		clearInterval(_interval)
		isReleased.value = true
	}, 2000)
}

const clientTime = ref('')
const serverTime = ref('')
const _fetchTime = async () => {
	try {
		// console.time('server time')
		// const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Berlin')
		const response = await fetch(import.meta.env.VITE_GET_TIME_URL)
		if (!response.ok) throw new Error('Could not retrieve server time')
		// console.timeEnd('server time')

		const dateNow = Date.now()
		clientTime.value = `${formatDateTime(dateNow)}.${new Date(dateNow).getMilliseconds()}`
		// const { datetime } = await response.json()
		// serverTime.value = `${formatDateTime(datetime)}.${new Date(datetime).getMilliseconds()}`
		const { atom, micro }: { atom: string; micro: number } = await response.json()
		serverTime.value = `${formatDateTime(atom)}.${Math.round(micro / 1000)}`
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

const MAX_EDIT_DURATION = 4 * 60 * 1000
let _editTimeout: number | undefined
const isTimerRunning = ref(false)
const editCountdown = ref(0)
const _decreaseCountdown = () => {
	editCountdown.value--
}

const onEditTable = async (id: string) => {
	if (!isReleased.value) {
		_showDialog(
			`Bitte noch etwas Geduld!\nEintragung ab ${new Date(_releaseTime).toLocaleDateString('de-DE', {
				hour: 'numeric',
				minute: 'numeric',
			})} Uhr möglich.`
		)
		return
	}

	if (selectedTable.value) return

	tableDocId.value = id
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	_editTimeout = window.setTimeout(closeForm, MAX_EDIT_DURATION)
	isTimerRunning.value = true
	editCountdown.value = MAX_EDIT_DURATION / 1000
	_interval = window.setInterval(_decreaseCountdown, 1000)

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
			_showDialog('Conflict')
			return
		}

		// if table is unlocked by admin user the open form needs to be closed
		if (!lockedBy && isTableDocIdValid.value && !isSaving.value) {
			cleanUp()
			_showDialog('Unlocked by admin user')
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

	clearTimeout(_editTimeout)
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
	document.documentElement.style.setProperty('--duration', `${MAX_EDIT_DURATION}`)
})
onBeforeUnmount(() => {
	closeForm()
	if (!isReleased.value) clearInterval(_interval)
})
onBeforeRouteLeave(() => {
	closeForm()
})
</script>

<template>
	<div class="timer-bar fixed left-0 top-0 h-1 w-full" :class="{ 'is-running': isTimerRunning }" />

	<main>
		<h1>Übersicht</h1>
		<div>Client Time: {{ clientTime }}</div>
		<div>Server Time: {{ serverTime }}</div>

		<div class="grid grid-cols-[repeat(3,1fr)]">
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
		:tables="tables"
		:table-doc="selectedTable"
		:is-logged-in="!!user"
		:countdown="editCountdown"
		@cancel="closeForm"
		@saving="isSaving = true"
		@saved="cleanUp"
	/>

	<dialog ref="dialogEl">
		<div class="whitespace-pre-line">{{ dialogMessage }}</div>
		<button type="button" @click="dialogEl?.close()">close</button>
	</dialog>
</template>

<style lang="postcss">
.timer-bar {
	&::after {
		@apply block bg-rose-500;
		content: '';
		height: inherit;
		/* background: linear-gradient(to right, darkorange, darkorange) no-repeat -100vw; */
		transform: translateX(-100%);
	}

	&.is-running {
		@apply bg-rose-50;

		&::after {
			/* background-position: 0; */
			transform: translateX(0);
			transition: transform calc(var(--duration) * 1ms) linear;
		}
	}
}
</style>
