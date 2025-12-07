<script setup lang="ts">
import { ref, useTemplateRef, computed, watch, onBeforeUnmount, onUnmounted, defineAsyncComponent, nextTick } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import TableForm from '@/components/TableForm.vue'
import AppDialog from '@/components/AppDialog.vue'
import type { SeatKey } from '@/types/Table.type'
import { useStore } from '@/use/store'
import { formatCount, createUuid } from '@/use/helper'
import { ONE_MINUTE, EDIT_TIMEOUT, RELEASE_TIME, useTimeout } from '@/use/timeout'
import { COUNT_UP_THRESHOLD, useCountUp } from '@/use/countUp'

const TableGrid = defineAsyncComponent(() => import('@/components/TableGrid.vue'))

const title: string = import.meta.env.VITE_APP_NAME
const sitePlanImage = import.meta.env.VITE_SITE_PLAN_IMAGE?.split(',') // url,width,height

const { state, fetchEntries, updateEntry } = useStore()
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

fetchTime()

const sidebarEl = useTemplateRef<InstanceType<typeof AppSidebar>>('sidebarEl')
const dialogEl = useTemplateRef<InstanceType<typeof AppDialog>>('dialogEl')
const dialogMessage = ref('')
const _showDialog = (message: string) => {
	dialogMessage.value = message
	dialogEl.value!.open()
}

const count = computed(() => {
	let count = 0
	state.tables
		.filter(item => item.active)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}` as SeatKey
				if (table[key].length) count++
			}
		})

	// return `${count ? formatCount(count, ['Person', 'Personen']) : 'niemand'} eingetragen`
	return count
})
const { countUp } = useCountUp(count)

const uuid = ref(sessionStorage.getItem('uuid') ?? createUuid())
sessionStorage.setItem('uuid', uuid.value)

const itemId = ref<string | null>(null)
// will always be in sync with the data source
const selectedItem = computed(() => (itemId.value ? state.tables.find(item => item.id === itemId.value) : null))
watch(itemId, val => {
	if (val) sidebarEl.value!.open()
})

const onTimeoutOrCancel = () => {
	sidebarEl.value!.close(() => {
		_unlockAndClear()
	})
}
const onSaved = () => {
	sidebarEl.value!.close(() => {
		_clearEditState()
	})
}
const _onConflict = (message: string) => {
	sidebarEl.value!.close(() => {
		_clearEditState()
	})
	_showDialog(message)
}
let triggerEl: HTMLElement | null = null
const onEditTable = async (id: string, _triggerEl: HTMLElement) => {
	if (!isReleased.value && !state.isAuthenticated) {
		_showDialog(
			`Noch ein bisschen Geduld.\nEintragungen sind ab ${new Date(RELEASE_TIME).toLocaleDateString('de', {
				day: '2-digit',
				month: 'short',
				hour: 'numeric',
				minute: 'numeric',
			})} Uhr möglich.`,
		)
		return
	}

	if (selectedItem.value) return

	itemId.value = id // `selectedItem` will be set
	/* await */ updateEntry(id, { locked_by: uuid.value, locked_at: Date.now() + clientOffset.value })
	triggerEl = _triggerEl
	setTimer(onTimeoutOrCancel)
}

const isSaving = ref(false)
watch(
	() => selectedItem.value?.locked_by,
	(lockedBy, previousState) => {
		// when `selectedItem` is set/unset or `updateEntry` has run
		if ([previousState, lockedBy].includes(undefined) || previousState === null) return

		// another user owned the table at the same moment
		if (lockedBy && lockedBy !== uuid.value) {
			_onConflict('Entschuldigung!\nEin anderer Benutzer hat diesen Tisch im selben Moment geöffnet wie du.')
			return
		}

		// admin user unlocked the table
		if (!lockedBy && itemId.value !== null && !isSaving.value) {
			_onConflict(`Tisch ${selectedItem.value?.index} wurde wieder freigegeben.`)
		}
	},
)

// called by `onSaved`, `_onConflict` and `_unlockAndClear`
const _clearEditState = async () => {
	if (!selectedItem.value) return

	clearTimer()
	itemId.value = null // `selectedItem` will be unset
	isSaving.value = false

	await nextTick()
	triggerEl?.focus()
}

const _unlockTable = async (id: string) => {
	await updateEntry(id, { locked_by: '', locked_at: null })
}

// called by `onTimeoutOrCancel` and 'onBeforeUnmount' hook
const _unlockAndClear = () => {
	if (!selectedItem.value) return

	_unlockTable(selectedItem.value.id)
	_clearEditState()
}

const onUnlockTable = (id: string) => {
	if (state.isAuthenticated) _unlockTable(id)
}

// onMounted(() => {
// 	// 🔺 the `beforeunload` event is not reliably fired
// 	// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#usage_notes
// 	window.addEventListener('beforeunload', _unlockAndClear)
// })
onBeforeUnmount(() => {
	_unlockAndClear()
	clearReleaseInterval()
	// window.removeEventListener('beforeunload', _unlockAndClear)
})

// unlock table if user reloads page
const _unlockTableAfterPageReload = () => {
	const abandonedTable = state.tables.find(item => item.locked_by === uuid.value)
	if (abandonedTable) _unlockTable(abandonedTable.id)
}
// wait for data to be fetched
const _stopWatcher = watch(
	() => state.subscribed,
	subscribed => {
		if (subscribed) _unlockTableAfterPageReload()
		_stopWatcher()
	},
)

fetchEntries()

// On iOS (maybe also on other mobile devices) if the browser runs in the background,
// because the user switches to another app, the edit timeout callback (closeForm) never gets called.
// So we need to setup some auto unlock mechanism.
// This requires an authenticated user!
let _expiredTablesIntervalId: number
const _unlockExpiredTables = () => {
	if (!state.isAuthenticated) {
		window.clearInterval(_expiredTablesIntervalId)
		return
	}

	const dateNow = Date.now() + clientOffset.value
	state.tables.map(item => {
		if (item.locked_at && item.locked_at + EDIT_TIMEOUT + ONE_MINUTE < dateNow) {
			_unlockTable(item.id)
		}
	})
}
if (state.isAuthenticated) {
	_expiredTablesIntervalId = window.setInterval(_unlockExpiredTables, ONE_MINUTE / 6)
	_unlockExpiredTables()
}
onUnmounted(() => {
	window.clearInterval(_expiredTablesIntervalId)
})
</script>

<template>
	<div class="timer-bar" :class="{ 'is-running': isTimerRunning }" :style="{ '--edit-timeout': `${EDIT_TIMEOUT}ms` }" />

	<main class="py-5" :inert="!!selectedItem">
		<div class="container">
			<h1 class="relative mb-1 w-fit text-3xl font-semibold">
				{{ title }}
				<svg class="doodle absolute -top-4.5 -right-10.5 size-10" aria-hidden="true" width="40" height="40">
					<use href="/app.svg#star-doodle" />
				</svg>
			</h1>
			<div v-if="state.tables.length" class="sr-only">Es sind {{ state.tables.length }} Tische aufgestellt.</div>

			<div v-if="count >= COUNT_UP_THRESHOLD" class="count-up" :style="{ '--count-up': countUp }">
				Personen eingetragen
			</div>
			<div v-else>
				{{
					state.tables.length
						? `${count ? formatCount(count, ['Person', 'Personen']) : 'niemand'} eingetragen`
						: 'Lade Daten …'
				}}
			</div>

			<img
				v-if="state.tables.length && sitePlanImage"
				class="mt-5 w-full"
				:src="sitePlanImage[0]"
				:width="sitePlanImage[1]"
				:height="sitePlanImage[2]"
				alt="Aufstellung der Tische"
				fetchpriority="low"
			/>
		</div>

		<div v-if="state.tables.length" class="mt-6 mb-10">
			<TableGrid :uuid :selected-id="selectedItem?.id" @edit="onEditTable" @unlock="onUnlockTable" />
		</div>
	</main>

	<AppSidebar v-if="state.tables.length" ref="sidebarEl" @closing="clearTimer">
		<template v-if="selectedItem" #heading>
			{{ `Tisch ${selectedItem.index}` }} {{ selectedItem.name }}
			<span class="sr-only">bearbeiten</span>
		</template>
		<template v-if="selectedItem">
			<div class="mb-3">
				Bearbeitungszeit: <span class="font-semibold" role="timer">{{ countdownToTime }}</span>
			</div>
			<TableForm :entry="selectedItem" @cancel="onTimeoutOrCancel" @saving="isSaving = true" @saved="onSaved" />
		</template>
	</AppSidebar>

	<AppDialog ref="dialogEl">
		{{ dialogMessage }}
	</AppDialog>
</template>

<style>
.timer-bar {
	position: fixed;
	left: 0;
	top: 0;
	z-index: 30;
	height: 0.25rem;
	width: 100%;
	transition: background-color 240ms;

	&::after {
		content: '';
		display: block;
		height: inherit;
		background-color: oklch(64.5% 0.215 16.44); /* theme('colors.rose.500') */
		transform: translateX(-100%);
		transition: transform 240ms;
	}

	&.is-running {
		background-color: oklch(96.94% 0.015 12.42); /* theme('colors.rose.50') */

		&::after {
			transform: translateX(0);
			transition-duration: var(--edit-timeout);
			transition-timing-function: linear;
		}
	}
}

@media not all and (min-width: 21em) {
	.doodle {
		display: none;
	}
}
</style>
