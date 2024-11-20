<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import SkateboardSpinner from '@/components/SkateboardSpinner.vue'
import type { SeatKey, Table } from '@/types/Table.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { useStore } from '@/use/store'
import { formatTime, formatCount, sortByName } from '@/use/helper'
import { useHighlight } from '@/use/highlight'

const { state } = useStore()

const emit = defineEmits<{
	edit: [id: number, triggerEl: HTMLElement]
	unlock: [id: number]
}>()
defineProps<{
	uuid: string
}>()

const countTakenSeats = (table: Table) => {
	let n = 0,
		count = 0
	while (n < table.seats) {
		const key = `seat_${++n}` as SeatKey
		if (table[key].length) count++
	}

	return count
}

const emptySeats = (table: Table) => {
	const count = table.seats - countTakenSeats(table)
	return count ? `${formatCount(count, ['Platz', 'Plätze'])} frei` : 'belegt'
}

const _sortByEmptySeats = (a: Table, b: Table) => countTakenSeats(a) - countTakenSeats(b)

const _search = ref('')
const onUpdateSearch = (input: string) => {
	_search.value = input
}
const filteredTables = computed(() => {
	const _tables = state.tables.filter(item => item.active || state.isAuthenticated)
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
	useHighlight('.searchable-list', 'search-result', _search)
})

const sortedSeats = (table: Table) => {
	const reservations: SortableReservation[] = []
	let n = 0
	while (n < table.seats) {
		const key = `seat_${++n}` as SeatKey
		if (!table[key].length) continue

		const name = table[key].split(' ')
		reservations.push({
			name: name.join(' '),
			// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
			sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : (name[0] ?? ''),
		})
	}

	reservations.sort(sortByName)
	return reservations
}

const onEditTable = ({ id, locked_at }: Table, triggerEl: HTMLElement) => {
	if (locked_at) return
	emit('edit', id, triggerEl)
}
</script>

<template>
	<SearchBar class="mb-6" @update="onUpdateSearch" />

	<div
		class="on-start-fade-in container grid grid-cols-[10.5rem_1fr] items-start gap-x-4 gap-y-6 sm:grid-cols-[12rem_minmax(auto,34.5rem)] sm:gap-6"
	>
		<template v-for="table in filteredTables" :key="table.id">
			<div>
				<button
					type="button"
					class="grid-table"
					:class="{ 'is-available': table.seats - countTakenSeats(table) }"
					:aria-disabled="!!table.locked_at"
					data-test-edit-button
					data-test-table
					@click="onEditTable(table, $event.currentTarget as HTMLButtonElement)"
				>
					<span class="grid-table-number">
						<span class="grid-table-number-content">
							<span class="sr-only">Tisch</span>
							{{ table.index }}
						</span>
						<Transition name="fade" mode="out-in">
							<span v-if="table.locked_at" class="spinner-wrapper">
								<SkateboardSpinner class="spinner" />
							</span>
						</Transition>
					</span>

					<span>
						<span class="grid-table-label">{{ table.name }}</span>
						<TransitionGroup name="exchange">
							<span v-if="table.locked_at" class="block text-sm/6">wird bearbeitet</span>
							<span v-else-if="table.active" class="block">
								<span class="sr-only">bearbeiten.</span>
								{{ emptySeats(table) }}
							</span>
							<span v-else class="block text-[--validation-error]">nicht verfügbar</span>
						</TransitionGroup>
					</span>
				</button>

				<div v-if="state.isAuthenticated && table.locked_at && table.locked_by !== uuid" class="mt-4 text-center">
					<div class="text-sm">seit {{ formatTime(table.locked_at) }} Uhr</div>
					<button type="button" class="primary-button mt-1" data-test-unlock-button @click="$emit('unlock', table.id)">
						🔑 entsperren
					</button>
				</div>
			</div>

			<ol
				class="searchable-list"
				:class="{ 'line-through': !table.active }"
				role="list"
				:aria-label="`Personen an Tisch ${table.index}`"
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
	display: grid;
	grid-template-columns: 3rem 1fr;
	column-gap: 0.625rem;
	align-items: center;
	padding: 0.25rem;
	border: 1.5px solid var(--black);
	border-radius: 1.8125rem;
	background-color: var(--white);
	box-shadow: 0 4px 0 -1px oklch(40.91% 0 0); /* theme('colors.dark.50') */
	text-align: left;
	width: 100%;

	&.is-available {
		box-shadow: 0 7px 0 -1px var(--lime);
	}

	@media (hover: hover) and (pointer: fine) {
		&[aria-disabled='false'] {
			will-change: box-shadow, translate;
			transition:
				box-shadow 250ms,
				translate 600ms cubic-bezier(0.3, 0.7, 0.4, 1);

			/* inspired by https://www.joshwcomeau.com/animation/3d-button/ */
			&:hover {
				translate: 0 -2px;
				transition:
					box-shadow 250ms,
					translate 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);

				&.is-available {
					box-shadow: 0 7px 0 -1px oklch(82.38% 0.2193 130.94); /* corresponds to `filter: brightness(110%)` */
				}
			}
		}
	}
}

.grid-table-number {
	@apply h-12 w-12 text-xl;
	display: grid;
	border: 1px solid var(--black);
	border-radius: 50%;
	font-weight: 600;
}

.grid-table-number-content {
	grid-area: 1 / 1 / 1 / 1;
	display: grid;
	place-content: center;
	color: var(--slate);
}

.grid-table-label {
	@apply text-sm;
	display: grid;
	align-items: center;
	width: fit-content;
	min-height: 1.5rem;
	padding-inline: 0.625rem;
	border-radius: 0.75rem;
	background-color: oklch(92.76% 0.006 264.53);

	&:empty {
		display: none;
	}
}

.searchable-list {
	@media not all and (min-width: 40em) {
		& {
			line-height: 1.375;
		}
	}

	@media (min-width: 40em) {
		& {
			display: flex;
			flex-wrap: wrap;

			> :not(:last-child)::after {
				content: '•';
				content: '•' / '';
				margin-inline: 0.25rem;
			}
		}
	}

	&:empty {
		visibility: hidden;
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

.on-start-fade-in {
	opacity: unset;
	transition: opacity 720ms;

	@starting-style {
		opacity: 0;
	}
}

@keyframes appear {
	from {
		opacity: 0;
		scale: 0.8;
	}
	to {
		opacity: unset;
		scale: unset;
	}
}

@supports (animation-timeline: view()) {
	@media (prefers-reduced-motion: no-preference) {
		.grid-table,
		.searchable-list {
			animation: appear linear;
			animation-timeline: view();
			animation-range: entry 0 cover 7rem;
		}

		.grid-table {
			transform-origin: center right;
		}

		.searchable-list {
			transform-origin: center left;
		}
	}
}
</style>
