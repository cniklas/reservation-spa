<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import SkateboardSpinner from '@/components/SkateboardSpinner.vue'
import type { SeatKey, TableDoc } from '@/types/TableDoc.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { formatTime, formatCount, sortByName, firstWord, remainingWords } from '@/use/helper'
import { useHighlight } from '@/use/highlight'

defineEmits<{
	(event: 'edit', id: string): void
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
					class="rounded-1.8125rem z-1 relative text-left"
					:disabled="!!table.locked_at"
					data-test-edit-button
					@click="$emit('edit', table.id)"
				>
					<dl class="re__grid-table" :class="{ 'is-available': table.seats - countTakenSeats(table) }" data-test-table>
						<dt class="re__grid-table-number">
							<div class="re__grid-table-number-content">
								<span class="sr-only">Tisch</span>
								{{ firstWord(table.name) }}
							</div>
							<Transition name="fade" mode="out-in">
								<div v-if="table.locked_at" class="re__spinner-wrapper">
									<SkateboardSpinner class="re__spinner" />
								</div>
							</Transition>
						</dt>
						<dd>
							<div class="re__grid-table-label">
								{{ remainingWords(table.name) }}
							</div>
							<TransitionGroup name="exchange">
								<div v-if="table.locked_at" class="text-sm/6">wird bearbeitet</div>
								<div v-else-if="table.active">{{ emptySeats(table) }}</div>
								<div v-else class="text-[--validation-error]">nicht verfügbar</div>
							</TransitionGroup>
						</dd>
					</dl>
				</button>

				<div v-if="isAuthenticated && table.locked_at && table.locked_by !== uuid" class="text-center">
					<div class="text-sm">seit {{ formatTime(table.locked_at.seconds * 1000) }} Uhr</div>
					<button
						type="button"
						class="re__primary-button mt-1"
						data-test-unlock-button
						@click="$emit('unlock', table.id)"
					>
						🔑 entsperren
					</button>
				</div>
			</div>

			<ol class="js-search-list re__dot-separated <sm:leading-1.375rem" :class="{ 'line-through': !table.active }">
				<li v-for="(seat, n) in sortedSeats(table)" :key="`${table.id}-${n}`">
					{{ seat.name }}
				</li>
			</ol>
		</template>
	</div>
</template>

<style lang="postcss">
.re__grid-table {
	@apply rounded-1.8125rem grid grid-cols-[3rem_1fr] items-center gap-x-2.5 border border-black bg-white p-1;
	box-shadow: 0 4px 0 -1px theme('colors.dark.50');

	&.is-available {
		box-shadow: 0 7px 0 -1px var(--lime);
	}
}

.re__grid-table-number {
	@apply rounded-50% grid h-12 w-12 border border-black text-xl font-semibold;
}

.re__grid-table-number-content {
	grid-area: 1 / 1 / 1 / 1;
	display: grid;
	place-content: center;
}

.re__grid-table-label {
	@apply rounded-3 grid min-h-6 w-fit items-center bg-gray-200 px-2.5 text-sm empty:hidden;
}

@screen sm {
	.re__dot-separated {
		@apply flex flex-wrap;

		> :not(:last-child)::after {
			@apply mx-1 content-['•'];
		}
	}
}

.re__spinner-wrapper {
	grid-area: 1 / 1 / 1 / 1;
	position: relative;
}

.re__spinner {
	@apply absolute left-1/2 h-16 w-16;
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
