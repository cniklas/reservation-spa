<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import SkateboardSpinner from '@/components/SkateboardSpinner.vue'
import type { TableDoc } from '@/types/TableDoc.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { formatTime, formatCount, sortByName, firstWord, remainingWords } from '@/use/helper'

defineEmits<{
	(event: 'edit', id: string): void
	(event: 'unlock', id: string): void
}>()
const props = defineProps<{
	tables: TableDoc[] | undefined
	uuid: string
	isLoggedIn: boolean
	isFormOpen: boolean
}>()

const countTakenSeats = (table: TableDoc) => {
	let n = 0,
		count = 0
	while (n < table.seats) {
		const key = `seat_${++n}`
		if ((table[key] as string).length) count++
	}

	return count
}

const formatEmptySeats = (table: TableDoc) => {
	const count = table.seats - countTakenSeats(table)
	return count ? `${formatCount(count, ['Platz', 'Plätze'])} frei` : 'belegt'
}

const _sortByEmptySeats = (a: TableDoc, b: TableDoc) => countTakenSeats(a) - countTakenSeats(b)

const search = ref('')
const onUpdateSearch = (input: string) => {
	search.value = input
}
const filteredTables = computed(() => {
	const _tables = [...(props.tables ?? [])]
	_tables.sort(_sortByEmptySeats)

	if (search.value.length < 3) return _tables

	return _tables.filter(table => {
		let found = false
		for (let i = 0; i < table.seats; i++) {
			const key = `seat_${i + 1}`
			if ((table[key] as string).toLowerCase().indexOf(search.value.toLowerCase()) !== -1) {
				found = true
				break
			}
		}
		return found
	})
})

const sortedSeats = (table: TableDoc) => {
	const reservations: SortableReservation[] = []
	let n = 0
	while (n < table.seats) {
		const key = `seat_${++n}`
		if (!(table[key] as string).length) continue

		const name = (table[key] as string).split(' ')
		reservations.push({
			name: name.join(' '),
			// sortableName: name.length > 1 ? `${name.at(-1)}, ${name.slice(0, -1).join(' ')}` : name.at(0) ?? '',
			sortableName: name.length > 1 ? `${name[name.length - 1]}, ${name.slice(0, -1).join(' ')}` : name[0] ?? '',
			table: '',
		})
	}

	reservations.sort(sortByName)
	return reservations
}
</script>

<template>
	<SearchBar class="mb-6" @update="onUpdateSearch" />

	<div
		class="w-3xl grid max-w-full grid-cols-[10.5rem_1fr] items-start gap-x-4 gap-y-6 sm:grid-cols-[12rem_1fr] sm:gap-6"
	>
		<template v-for="table in filteredTables" :key="table.id">
			<div class="re__grid-table-button-wrapper">
				<button
					type="button"
					class="re__grid-table-button"
					:disabled="isFormOpen || !!table.locked_at"
					data-test-edit-button
					@click="$emit('edit', table.id)"
				>
					<dl class="re__grid-table" :class="{ 'is-available': table.seats - countTakenSeats(table) }">
						<dt class="re__grid-table-number">
							<div class="re__grid-table-number-wrapper">
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
								<div v-if="table.locked_at" class="text-sm leading-[1.5rem]">wird bearbeitet</div>
								<div v-else>{{ formatEmptySeats(table) }}</div>
							</TransitionGroup>
						</dd>
					</dl>
				</button>

				<div v-if="isLoggedIn && table.locked_at && table.locked_by !== uuid" class="text-center">
					<div class="text-sm">seit {{ formatTime(table.locked_at.seconds * 1000) }} Uhr</div>
					<button type="button" class="re__primary-button mt-1" @click="$emit('unlock', table.id)">
						🔑 entsperren
					</button>
				</div>
			</div>

			<ol class="re__dot-separated __text-sm">
				<li v-for="(seat, n) in sortedSeats(table)" :key="`${table.id}-${n}`">
					{{ seat.name }}
				</li>
			</ol>
		</template>
	</div>
</template>

<style lang="postcss">
.re__grid-table-button-wrapper {
	@apply grid gap-4;
}

.re__grid-table-button {
	@apply rounded-[1.8125rem] text-left;
}

.re__grid-table {
	@apply grid grid-cols-[3rem_1fr] items-center gap-x-2.5 rounded-[1.8125rem] border border-black bg-white p-1;
	box-shadow: 0 4px 0 -1px theme('colors.dark.50');

	&.is-available {
		box-shadow: 0 7px 0 -1px theme('colors.lime.500');
	}
}

.re__grid-table-number {
	@apply rounded-50% grid h-12 w-12 border border-black text-xl font-semibold;
}

.re__grid-table-number-wrapper {
	@apply col-start-1 col-end-1 row-start-1 row-end-1 grid place-content-center;
}

.re__grid-table-label {
	@apply rounded-3 min-h-6 grid w-fit items-center bg-gray-200 px-2.5 text-sm empty:hidden;
}

.re__dot-separated {
	@apply leading-[1.375] sm:flex sm:flex-wrap sm:leading-normal;

	> :not(:last-child)::after {
		@apply mx-1 hidden content-['•'] sm:inline-block;
	}
}

.re__spinner-wrapper {
	@apply relative col-start-1 col-end-1 row-start-1 row-end-1;
}

.re__spinner {
	@apply absolute left-1/2 h-16 w-16;
	transform: translate(-50%, -15px);
}

.pl__ring {
	@apply hidden;
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
	@apply opacity-0;
}

.exchange-leave-active {
	@apply absolute;
}
</style>