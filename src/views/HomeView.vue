<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { deleteField, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@vueuse/firebase/useAuth'
// import { isSafari } from '@firebase/util'
import { auth } from '@/firebase'
import TableGrid from '@/components/TableGrid.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from '@/keys'
import { formatCount, createUuid, injectStrict, firstWord } from '@/use/helper'
import { ONE_MINUTE, EDIT_TIMEOUT, RELEASE_TIME, useTimeout } from '@/use/timeout'

const tables = injectStrict(PROVIDE_TABLES)
const updateDocument = injectStrict(PROVIDE_UPDATE_DOCUMENT)

const TableForm = defineAsyncComponent(() => import('@/components/TableForm.vue'))

const title: string = import.meta.env.VITE_APP_NAME

const { isAuthenticated } = useAuth(auth)
const {
	clientOffset,
	isReleased,
	clearReleaseInterval,
	fetchTime,
	isTimerRunning,
	countdownToTime,
	setTimer,
	clearTimer,
} = useTimeout()

const sidebarEl = ref<InstanceType<typeof AppSidebar> | null>(null)
const dialogEl = ref<HTMLDialogElement | null>(null)
const dialogMessage = ref('')
const _showDialog = (message: string) => {
	dialogMessage.value = message
	dialogEl.value?.showModal()
	// https://www.matuzo.at/blog/2023/focus-dialog/#conclusion
	dialogEl.value?.focus()
}

const reservations = computed(() => {
	let count = 0
	tables.value?.forEach(table => {
		let n = 0
		while (n < table.seats) {
			const key = `seat_${++n}`
			if ((table[key] as string).length) count++
		}
	})

	return `${formatCount(count, ['Person', 'Personen'])} eingetragen`
})

const uuid = ref(sessionStorage.getItem('uuid') ?? createUuid())
sessionStorage.setItem('uuid', uuid.value)

const itemId = ref<string | null>(null)
// will always be in sync with the data source
const selectedItem = computed(() => tables.value?.find(item => item.id === itemId.value))
watch(itemId, val => {
	if (val) sidebarEl.value?.open()
})

const onTimeoutOrCancel = () => {
	sidebarEl.value?.close(() => {
		_clearAndUnlock()
	})
}
const onSaved = () => {
	sidebarEl.value?.close(() => {
		_clearEditState()
	})
}
const onConflict = (message: string) => {
	sidebarEl.value?.close(() => {
		_clearEditState()
	})
	_showDialog(message)
}
const onEditTable = async (id: string) => {
	if (!isReleased.value) {
		_showDialog(
			`Noch ein bisschen Geduld.\nEintragungen sind ab ${new Date(RELEASE_TIME).toLocaleDateString('de-DE', {
				hour: 'numeric',
				minute: 'numeric',
			})} Uhr möglich.`,
		)
		return
	}

	if (selectedItem.value) return

	itemId.value = id // now `selectedItem` will be set
	/* await */ updateDocument(id, { locked_by: uuid.value, locked_at: serverTimestamp() })
	setTimer(onTimeoutOrCancel)
}

const isSaving = ref(false)
watch(
	() => selectedItem.value?.locked_by,
	(lockedBy: string | undefined) => {
		// another user owned the table at the same moment
		if (lockedBy && lockedBy !== uuid.value) {
			onConflict('Entschuldigung!\nEin anderer Benutzer hat diesen Tisch einen Augenblick früher geöffnet als du.')
			return
		}

		// if table is unlocked by admin user the open form needs to be closed
		if (!lockedBy && itemId.value !== null && !isSaving.value) {
			onConflict(`Tisch ${firstWord(selectedItem.value?.name)} wurde wieder freigegeben.`)
		}
	},
)

const _clearEditState = () => {
	if (!selectedItem.value) return

	clearTimer()
	itemId.value = null // now `selectedItem` will be unset
	isSaving.value = false
}

const _unlockTable = async (id: string) => {
	await updateDocument(id, { locked_by: deleteField(), locked_at: deleteField() })
}

const _clearAndUnlock = () => {
	if (!selectedItem.value) return

	const id = selectedItem.value.id
	_clearEditState()
	_unlockTable(id)
}

const onUnlockTable = (id: string) => {
	if (isAuthenticated.value) _unlockTable(id)
}

onMounted(() => {
	fetchTime()
	// 🔺 especially on mobile, the `beforeunload` event is not reliably fired
	// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
	window.addEventListener('beforeunload', _clearAndUnlock)
})
onBeforeUnmount(() => {
	_clearAndUnlock()
	clearReleaseInterval()
})

// unlock table if user reloads page on mobile (see `beforeunload` section)
const _unlockTableAfterPageReload = () => {
	const abandonedTable = tables.value?.find(item => item.locked_by === uuid.value)
	if (abandonedTable) _unlockTable(abandonedTable.id)
}
// wait for firebase data to be fetched
const _unwatchTables = watch(tables, (_, oldVal) => {
	if (oldVal === undefined) _unlockTableAfterPageReload()
	_unwatchTables() // stop watcher
})

// On iOS (maybe also on other mobile devices) if the browser runs in the background,
// because the user switches to another app, the edit timeout callback (closeForm) never gets called.
// So we need to setup some auto unlock mechanism.
let _expiredTablesIntervalId: number
const _unlockExpiredTables = () => {
	const dateNow = Date.now() + clientOffset.value
	tables.value?.map(item => {
		if (item.locked_at && item.locked_at.seconds * 1000 + EDIT_TIMEOUT + ONE_MINUTE < dateNow) {
			_unlockTable(item.id)
		}
	})
}
watch(
	isAuthenticated,
	val => {
		if (val) {
			_unlockExpiredTables()
			_expiredTablesIntervalId = window.setInterval(_unlockExpiredTables, ONE_MINUTE / 6)
		}
	},
	{ immediate: true },
)
onBeforeUnmount(() => {
	clearInterval(_expiredTablesIntervalId)
})
</script>

<template>
	<div
		class="re__timer-bar fixed left-0 top-0 z-30 h-1 w-full"
		:class="{ 'is-running': isTimerRunning }"
		:style="{ '--edit-timeout': `${EDIT_TIMEOUT}ms` }"
	/>

	<main class="px-3 py-5 sm:px-4">
		<h1 class="relative mb-1 w-fit text-3xl font-semibold">
			{{ title }}
			<svg class="-top-4.5 -right-10.5 absolute h-10 w-10" aria-hidden="true" width="40" height="40">
				<use href="@/assets/app.svg#star-doodle" />
			</svg>
		</h1>

		<template v-if="tables">
			<div>{{ reservations }}</div>

			<div class="mb-10 mt-6">
				<TableGrid
					:tables="tables"
					:uuid="uuid"
					:is-logged-in="isAuthenticated"
					:is-form-open="!!selectedItem"
					@edit="onEditTable"
					@unlock="onUnlockTable"
				/>
			</div>
		</template>
		<div v-else>Lade Daten …</div>
	</main>

	<AppSidebar
		v-if="tables"
		ref="sidebarEl"
		:headline="!!selectedItem ? `Tisch ${selectedItem.name}` : ''"
		@closing="clearTimer"
	>
		<TableForm
			v-if="!!selectedItem"
			:entry="selectedItem"
			:is-logged-in="isAuthenticated"
			@cancel="onTimeoutOrCancel"
			@saving="isSaving = true"
			@saved="onSaved"
		>
			{{ countdownToTime }}
		</TableForm>
	</AppSidebar>

	<dialog ref="dialogEl">
		<div class="whitespace-pre-line first-line:font-semibold">{{ dialogMessage }}</div>
		<button
			type="button"
			class="rounded-50% absolute right-0 top-0 inline-grid h-8 w-8 -translate-x-1/4 translate-y-1/4 place-content-center bg-slate-800 text-white"
			@click="dialogEl?.close()"
		>
			<svg class="re__close-icon" aria-hidden="true" width="14" height="14">
				<use href="@/assets/app.svg#plus" />
			</svg>
		</button>
	</dialog>

	<Teleport to="#debug-info">Client Offset: {{ clientOffset }}</Teleport>
</template>

<style lang="postcss">
.re__timer-bar {
	transition: background-color 240ms;

	&::after {
		@apply h-inherit block bg-rose-500;
		content: '';
		transform: translateX(-100%);
		transition: transform 240ms;
	}

	&.is-running {
		@apply bg-rose-50;

		&::after {
			transform: translateX(0);
			transition-duration: var(--edit-timeout);
			transition-timing-function: linear;
		}
	}
}
</style>
