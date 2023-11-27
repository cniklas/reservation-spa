<script setup lang="ts">
import { ref, computed } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Timestamp, TableDoc } from '@/types/TableDoc.type'
import type { SortableReservation } from '@/types/Reservation.type'
import { formatTime, formatCount, sortByName } from '@/use/helper'

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

const firstWord = (str: string) => str.split(' ')[0]
const restOfWords = (str: string) => str.split(' ').slice(1).join(' ')

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
// const sortedTables = computed(() => {
// 	const _tables = [...(props.tables ?? [])]
// 	_tables.sort(_sortByEmptySeats)
// 	return _tables
// })

const search = ref('')
const searchDebounced = refDebounced(search, 240)
const resetSearch = () => {
	search.value = ''
}

const filteredTables = computed(() => {
	const _tables = [...(props.tables ?? [])]
	_tables.sort(_sortByEmptySeats)

	if (searchDebounced.value.length < 3) return _tables

	return _tables.filter(table => {
		let found = false
		for (let i = 0; i < table.seats; i++) {
			const key = `seat_${i + 1}`
			if ((table[key] as string).toLowerCase().indexOf(searchDebounced.value.toLowerCase()) !== -1) {
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
	<div class="sticky top-0 z-10 -mx-4 mb-10 border-b border-b-black bg-white p-4">
		<label class="mr-2" for="search">Suche</label>
		<input
			v-model.trim="search"
			type="text"
			id="search"
			autocorrect="off"
			autocomplete="off"
			@keyup.esc="resetSearch"
		/>
		<button type="button" :class="{ hidden: !search.length }" @click="resetSearch">reset</button>
	</div>

	<div
		class="w-2xl grid max-w-full grid-cols-[10.5rem_1fr] items-start gap-x-4 gap-y-6 sm:grid-cols-[12rem_1fr] sm:gap-6"
	>
		<template v-for="table in filteredTables" :key="table.id">
			<button
				type="button"
				class="re__grid-table-button"
				:disabled="isFormOpen || !!table.locked_at"
				data-test-edit-button
				@click="$emit('edit', table.id)"
			>
				<dl class="re__grid-table" :class="{ 'is-available': table.seats - countTakenSeats(table) }">
					<dt class="re__grid-table-number">
						{{ firstWord(table.name) }}
					</dt>
					<dd>
						<div class="re__grid-table-label">
							{{ restOfWords(table.name) }}
						</div>
						<div>{{ formatEmptySeats(table) }}</div>
					</dd>
				</dl>
			</button>

			<ol class="dot-separated text-sm">
				<!-- <li v-for="n in countTakenSeats(table)" :key="`${table.id}-${n}`">
					{{ table[`seat_${n}`] }}
				</li> -->
				<li v-for="(seat, n) in sortedSeats(table)" :key="`${table.id}-${n}`">
					{{ seat.name }}
				</li>
			</ol>
		</template>
	</div>
</template>

<style lang="postcss">
.re__grid-table-button {
	@apply rounded-[1.8125rem] text-left;
}

.re__grid-table {
	@apply grid grid-cols-[3rem_2fr] items-center gap-x-2.5 rounded-[1.8125rem] border border-black bg-white p-1;

	box-shadow: 0 4px 0 -1px theme('colors.dark.50'); /* theme('colors.neutral.500') */

	&.is-available {
		box-shadow: 0 7px 0 -1px theme('colors.lime.500');
	}
}

.re__grid-table-number {
	@apply grid h-12 w-12 place-content-center rounded-[50%] border border-black text-xl font-semibold; /* text-dark-500 */
}

.re__grid-table-label {
	@apply rounded-3 min-h-6 grid w-fit items-center bg-gray-200 px-2.5 text-sm empty:hidden;
}

.dot-separated {
	@apply sm:flex sm:flex-wrap;

	> :not(:last-child)::after {
		@apply mx-1 hidden content-['•'] sm:inline-block;
	}
}
</style>
