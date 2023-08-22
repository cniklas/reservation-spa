<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent, type Ref } from 'vue'
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@vueuse/firebase/useAuth'
// import { isSafari } from '@firebase/util'
import { auth, db } from '@/firebase'
import type { TableDoc } from '@/types/TableDoc.type'
import TableGroup from '@/components/TableGroup.vue'
import { formatDateTime, createUuid } from '@/use/helper'

const tables = inject('tables') as Ref<TableDoc[] | undefined>
const leftBlock = computed(() => tables.value?.filter(item => item.block_id === 1))
const middleBlock = computed(() => tables.value?.filter(item => item.block_id === 2))
const rightBlock = computed(() => tables.value?.filter(item => item.block_id === 3))

const { isAuthenticated } = useAuth(auth)

const TableForm = defineAsyncComponent(() => import('@/components/TableForm.vue'))

const dialogEl = ref<HTMLDialogElement | null>(null)
const dialogMessage = ref('')
const _showDialog = (message: string) => {
	dialogMessage.value = message
	dialogEl.value?.showModal()
	// https://www.matuzo.at/blog/2023/focus-dialog/#conclusion
	dialogEl.value?.focus()
}

let _intervalId: number | undefined

const clientTime = ref('')
const clientOffset = ref(0)
const serverTime = ref('')
const _releaseTime = new Date(import.meta.env.VITE_RELEASE_DATE).getTime()
const isReleased = ref(false)
// takes into account that the client time may not be set correctly
const _isReleasedNow = () => _releaseTime <= Date.now() + clientOffset.value

const _fetchTime = async () => {
	try {
		// console.time('server time')
		// const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Berlin')
		const response = await fetch(import.meta.env.VITE_GET_TIME_URL)
		if (!response.ok) throw new Error('Could not retrieve server time')
		// console.timeEnd('server time')

		const clientNow = Date.now()
		// 🔺 getMilliseconds() ist missverständlich, da z.B. für 2 ms `2` und nicht `002` zurückgegeben wird
		// clientTime.value = `${formatDateTime(clientNow)}.${new Date(clientNow).getMilliseconds()}`
		clientTime.value = formatDateTime(clientNow)

		// const { datetime } = await response.json()
		const { atom, micro }: { atom: string; micro: number } = await response.json()
		const serverNow = new Date(atom).getTime() + Math.round(micro / 1000)
		serverTime.value = formatDateTime(serverNow)

		const _clientOffset = serverNow - clientNow
		if (Math.abs(_clientOffset) > 2000) clientOffset.value = _clientOffset

		isReleased.value = _isReleasedNow()
		if (isReleased.value) return

		_intervalId = window.setInterval(() => {
			if (!_isReleasedNow()) return
			clearInterval(_intervalId)
			isReleased.value = true
		}, 2000)
	} catch (error) {
		console.error(error)
	}
}

const uuid = ref(sessionStorage.getItem('uuid') ?? createUuid())
sessionStorage.setItem('uuid', uuid.value)

const itemId = ref<string | null>(null)
// will always be in sync with the data source
const selectedItem = computed(() => tables.value?.find(item => item.id === itemId.value))

const EDIT_TIMEOUT = 4 * 60 * 1000
let _editTimeoutId: number | undefined
const isTimerRunning = ref(false)
const countdown = ref(0)
const _decreaseCountdown = () => {
	countdown.value--
}

const onEditTable = async (id: string) => {
	if (!isReleased.value) {
		_showDialog(
			`Bitte noch etwas Geduld!\nEintragung ab ${new Date(_releaseTime).toLocaleDateString('de-DE', {
				hour: 'numeric',
				minute: 'numeric',
			})} Uhr möglich.`,
		)
		return
	}

	if (selectedItem.value) return

	itemId.value = id // now `selectedItem` will be set
	const tableRef = doc(db, 'tables', id)
	await updateDoc(tableRef, { locked_by: uuid.value, locked_at: serverTimestamp() })
	_editTimeoutId = window.setTimeout(closeForm, EDIT_TIMEOUT)
	isTimerRunning.value = true
	countdown.value = EDIT_TIMEOUT / 1000
	_intervalId = window.setInterval(_decreaseCountdown, 1000)

	// 🔺 TODO remove when final layout has been set up
	await nextTick()
	document.querySelector('#table-form')?.scrollIntoView({ behavior: 'smooth' })
}
const isSaving = ref(false)

watch(
	() => selectedItem.value?.locked_by,
	(lockedBy: string | undefined) => {
		// another user owned the table at the same moment
		if (lockedBy && lockedBy !== uuid.value) {
			console.warn('Conflict')
			cleanUp()
			_showDialog('Conflict')
			return
		}

		// if table is unlocked by admin user the open form needs to be closed
		if (!lockedBy && itemId.value !== null && !isSaving.value) {
			cleanUp()
			_showDialog('Unlocked by admin user')
		}
	},
)

// called in any case EXCEPT "save form"
const closeForm = () => {
	if (!selectedItem.value) return

	const id = selectedItem.value.id
	cleanUp()
	_unlockTable(id)
}

const cleanUp = () => {
	if (!selectedItem.value) return

	clearTimeout(_editTimeoutId)
	isTimerRunning.value = false
	clearInterval(_intervalId)
	itemId.value = null // now `selectedItem` will be unset
	isSaving.value = false
}

const onUnlockTable = (id: string) => {
	if (isAuthenticated.value) _unlockTable(id)
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
	document.documentElement.style.setProperty('--duration', `${EDIT_TIMEOUT}`)
})
onBeforeUnmount(() => {
	closeForm()

	clearInterval(_intervalId)
})
// onBeforeRouteLeave(() => {
// 	closeForm()
// })

// unlock table if user accidentally reloads page on mobile (see `beforeunload` section)
const _unlockTableAfterPageReload = () => {
	const abandonedTable = tables.value?.find(item => item.locked_by === uuid.value)
	if (abandonedTable) _unlockTable(abandonedTable.id)
}
// wait for firebase data to be fetched
const unwatch = watch(tables, (_, oldVal) => {
	if (oldVal === undefined) _unlockTableAfterPageReload()
	unwatch() // stop watcher
})
</script>

<template>
	<div class="timer-bar fixed left-0 top-0 h-1 w-full" :class="{ 'is-running': isTimerRunning }" />

	<main>
		<h1>Home</h1>
		<div>Server Time: {{ serverTime }}</div>
		<div>Client Time: {{ clientTime }}</div>
		<div>Client Offset: {{ clientOffset }}</div>

		<div class="grid grid-cols-[repeat(3,1fr)]">
			<TableGroup
				:tables="leftBlock"
				:uuid="uuid"
				:is-logged-in="isAuthenticated"
				:is-form-open="!!selectedItem"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
			<TableGroup
				:tables="middleBlock"
				:uuid="uuid"
				:is-logged-in="isAuthenticated"
				:is-form-open="!!selectedItem"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
			<TableGroup
				:tables="rightBlock"
				:uuid="uuid"
				:is-logged-in="isAuthenticated"
				:is-form-open="!!selectedItem"
				@edit="onEditTable"
				@unlock="onUnlockTable"
			/>
		</div>
	</main>

	<TableForm
		v-if="!!selectedItem"
		id="table-form"
		:entry="selectedItem"
		:is-logged-in="isAuthenticated"
		:countdown="countdown"
		@cancel="closeForm"
		@saving="isSaving = true"
		@saved="cleanUp"
	/>

	<dialog ref="dialogEl" tabindex="-1">
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
		transform: translateX(-100%);
	}

	&.is-running {
		@apply bg-rose-50;

		&::after {
			transform: translateX(0);
			transition: transform calc(var(--duration) * 1ms) linear;
		}
	}
}
</style>
