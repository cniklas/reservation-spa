<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent, nextTick } from 'vue'
import { deleteField, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@vueuse/firebase/useAuth'
// import { isSafari } from '@firebase/util'
import { auth } from '@/firebase'
import SidebarDialog from '@/components/SidebarDialog.vue'
import AppDialog from '@/components/AppDialog.vue'
import type { SeatKey } from '@/types/TableDoc.type'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from '@/keys'
import { formatCount, createUuid, injectStrict, firstWord } from '@/use/helper'
import { ONE_MINUTE, EDIT_TIMEOUT, RELEASE_TIME, useTimeout } from '@/use/timeout'

const tables = injectStrict(PROVIDE_TABLES)
const updateDocument = injectStrict(PROVIDE_UPDATE_DOCUMENT)

const TableGrid = defineAsyncComponent(() => import('@/components/TableGrid.vue'))
const TableForm = defineAsyncComponent(() => import('@/components/TableForm.vue'))

const title: string = import.meta.env.VITE_APP_NAME
const sitePlanImage = import.meta.env.VITE_SITE_PLAN_IMAGE?.split(',') // url,width,height

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

const sidebarEl = ref<InstanceType<typeof SidebarDialog> | null>(null)
const dialogEl = ref<InstanceType<typeof AppDialog> | null>(null)
const dialogMessage = ref('')
const _showDialog = (message: string) => {
	dialogMessage.value = message
	dialogEl.value?.open()
}

const reservations = computed(() => {
	let count = 0
	tables.value
		?.filter(item => item.active)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}` as SeatKey
				if (table[key].length) count++
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
	sidebarEl.value?.close(async () => {
		const id = selectedItem.value?.index
		_clearEditState()
		await nextTick()
		document.querySelector(`#table-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
	})
}
const onConflict = (message: string) => {
	sidebarEl.value?.close(() => {
		_clearEditState()
	})
	_showDialog(message)
}
const onEditTable = async (id: string) => {
	if (!isReleased.value && !isAuthenticated.value) {
		_showDialog(
			`Noch ein bisschen Geduld.\nEintragungen sind ab ${new Date(RELEASE_TIME).toLocaleDateString('de-DE', {
				hour: 'numeric',
				minute: 'numeric',
			})} Uhr möglich.`,
		)
		return
	}

	if (selectedItem.value) return

	itemId.value = id // `selectedItem` will be set
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
	itemId.value = null // `selectedItem` will be unset
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
	<div class="timer-bar" :class="{ 'is-running': isTimerRunning }" :style="{ '--edit-timeout': `${EDIT_TIMEOUT}ms` }" />

	<main class="py-5">
		<div class="container">
			<h1 class="relative mb-1 w-fit text-3xl font-semibold">
				{{ title }}
				<svg class="doodle -top-4.5 -right-10.5 absolute h-10 w-10" aria-hidden="true" width="40" height="40">
					<use href="/app.svg#star-doodle" />
				</svg>
			</h1>
			<div>{{ tables ? reservations : 'Lade Daten …' }}</div>

			<img
				v-if="tables && sitePlanImage"
				class="mt-5 w-full"
				:src="sitePlanImage[0]"
				:width="sitePlanImage[1]"
				:height="sitePlanImage[2]"
				alt="Aufstellung der Tische"
				fetchpriority="low"
			/>
		</div>

		<div v-if="tables" class="mb-10 mt-6">
			<TableGrid :tables :uuid :is-authenticated="isAuthenticated" @edit="onEditTable" @unlock="onUnlockTable" />
		</div>
	</main>

	<SidebarDialog v-if="tables" ref="sidebarEl" @cancel="onTimeoutOrCancel" @closing="clearTimer">
		<template v-if="selectedItem" #headline>{{ `Tisch ${selectedItem.name}` }}</template>
		<TableForm
			v-if="selectedItem"
			:entry="selectedItem"
			:is-authenticated="isAuthenticated"
			@cancel="onTimeoutOrCancel"
			@saving="isSaving = true"
			@saved="onSaved"
		>
			{{ countdownToTime }}
		</TableForm>
	</SidebarDialog>

	<AppDialog ref="dialogEl">
		{{ dialogMessage }}
	</AppDialog>

	<!-- <Teleport to="#debug-info">Client Offset: {{ clientOffset }}</Teleport> -->
</template>

<style lang="postcss">
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
		background-color: theme('colors.rose.500');
		transform: translateX(-100%);
		transition: transform 240ms;
	}

	&.is-running {
		background-color: theme('colors.rose.50');

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
