<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import SkateboardSpinner from '@/components/SkateboardSpinner.vue'
import type { SeatKey, TableDoc } from '@/types/TableDoc.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { formatTime, formatCount, sortByName, firstWord, remainingWords } from '@/use/helper'
import { useHighlight } from '@/use/highlight'

const emit = defineEmits<{
	(event: 'edit', id: string, triggerEl: HTMLElement): void
	(event: 'unlock', id: string): void
}>()
const props = defineProps<{
	tables: TableDoc[]
	uuid: string
	isAuthenticated: boolean
}>()

const countTakenSeats = (table: TableDoc) => {
	let n = 0,
		count = 0
	while (n < table.seats) {
		const key = `seat_${++n}` as SeatKey
		if (table[key].length) count++
	}

	return count
}

const emptySeats = (table: TableDoc) => {
	const count = table.seats - countTakenSeats(table)
	return count ? `${formatCount(count, ['Platz', 'Plätze'])} frei` : 'belegt'
}

const _sortByEmptySeats = (a: TableDoc, b: TableDoc) => countTakenSeats(a) - countTakenSeats(b)

const _search = ref('')
const onUpdateSearch = (input: string) => {
	_search.value = input
}
const filteredTables = computed(() => {
	const _tables = props.tables.filter(item => item.active || props.isAuthenticated)
	_tables.sort(_sortByEmptySeats)

	if (_search.value.length < 3) return _tables

	return _tables.filter(table => {
		let found = false
		for (let i = 0; i < table.seats; i++) {
			const key = `seat_${i + 1}` as SeatKey
			if (table[key].toLowerCase().indexOf(_search.value.toLowerCase()) !== -1) {
				found = true
				break
			}
		}
		return found
	})
})

onMounted(() => {
	useHighlight('.js-search-list', 'search-result', _search)
})

const sortedSeats = (table: TableDoc) => {
	const reservations: SortableReservation[] = []
	let n = 0
	while (n < table.seats) {
		const key = `seat_${++n}` as SeatKey
		if (!table[key].length) continue

		const name = table[key].split(' ')
		reservations.push({
			name: name.join(' '),
			// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
			sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : name[0] ?? '',
		})
	}

	reservations.sort(sortByName)
	return reservations
}

const onEditTable = (table: TableDoc, triggerEl: HTMLElement) => {
	if (table.locked_at) return
	emit('edit', table.id, triggerEl)
}
</script>

<template>
	<SearchBar class="mb-6" @update="onUpdateSearch" />

	<div
		class="container grid grid-cols-[10.5rem_1fr] items-start gap-x-4 gap-y-6 sm:grid-cols-[12rem_minmax(auto,34.5rem)] sm:gap-6"
	>
		<template v-for="table in filteredTables" :key="table.id">
			<div class="grid scroll-m-20 gap-4" :id="`table-${table.index}`">
				<button
					type="button"
					class="grid-table z-1 relative text-left"
					:class="{ 'is-available': table.seats - countTakenSeats(table) }"
					:aria-disabled="!!table.locked_at"
					data-test-edit-button
					data-test-table
					@click="onEditTable(table, $event.target as HTMLButtonElement)"
				>
					<span class="grid-table-number">
						<span class="grid-table-number-content">
							<span class="sr-only">Tisch</span>
							{{ firstWord(table.name) }}
						</span>
						<Transition name="fade" mode="out-in">
							<span v-if="table.locked_at" class="spinner-wrapper">
								<SkateboardSpinner class="spinner" />
							</span>
						</Transition>
					</span>

					<span>
						<span class="grid-table-label">
							{{ remainingWords(table.name) }}
						</span>
						<TransitionGroup name="exchange">
							<span v-if="table.locked_at" class="block text-sm/6">wird bearbeitet</span>
							<span v-else-if="table.active" class="block">{{ emptySeats(table) }}</span>
							<span v-else class="block text-[--validation-error]">nicht verfügbar</span>
						</TransitionGroup>
					</span>
				</button>

				<div v-if="isAuthenticated && table.locked_at && table.locked_by !== uuid" class="text-center">
					<div class="text-sm">seit {{ formatTime(table.locked_at.seconds * 1000) }} Uhr</div>
					<button type="button" class="primary-button mt-1" data-test-unlock-button @click="$emit('unlock', table.id)">
						🔑 entsperren
					</button>
				</div>
			</div>

			<ol
				class="js-search-list dot-separated <sm:leading-1.375rem"
				:class="{ 'line-through': !table.active }"
				role="list"
			>
				<li v-for="(seat, n) in sortedSeats(table)" :key="`${table.id}-${n}`">
					{{ seat.name }}
				</li>
			</ol>
		</template>
	</div>
</template>

<style lang="postcss">
.grid-table {
	@apply rounded-1.8125rem grid grid-cols-[3rem_1fr] items-center gap-x-2.5 border border-black bg-white p-1;
	box-shadow: 0 4px 0 -1px theme('colors.dark.50');

	&.is-available {
		box-shadow: 0 7px 0 -1px var(--lime);
	}
}

.grid-table-number {
	@apply rounded-50% grid h-12 w-12 border border-black text-xl font-semibold;
}

.grid-table-number-content {
	grid-area: 1 / 1 / 1 / 1;
	display: grid;
	place-content: center;
}

.grid-table-label {
	@apply rounded-3 grid min-h-6 w-fit items-center bg-gray-200 px-2.5 text-sm empty:hidden;
}

@screen sm {
	.dot-separated {
		display: flex;
		flex-wrap: wrap;

		> :not(:last-child)::after {
			content: '•';
			content: '•' / '';
			margin-inline: 0.25rem;
		}
	}
}

.spinner-wrapper {
	grid-area: 1 / 1 / 1 / 1;
	position: relative;
}

.spinner {
	position: absolute;
	left: 50%;
	height: 4rem;
	width: 4rem;
	transform: translate(-50%, -15px);
}

.pl__ring {
	display: none;
}

.fade-enter-active,
.fade-leave-active,
.exchange-enter-active,
.exchange-leave-active {
	transition: opacity 160ms;
}

.fade-enter-from,
.fade-leave-to,
.exchange-enter-from,
.exchange-leave-to {
	opacity: 0;
}

.exchange-leave-active {
	position: absolute;
}

::highlight(search-result) {
	background-color: var(--lime);
	color: var(--dark);
	padding: 0.625rem;
}
</style>
