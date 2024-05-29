<script setup lang="ts">
import { reactive, computed, watch, toRaw } from 'vue'
import type { SeatKey, Table } from '@/types/Table.type'
import type { Reservation } from '@/types/Reservation.type'
import { useStore } from '@/use/store'
import { useErrorHandling } from '@/use/errorHandling'

const { state, updateEntry } = useStore()
const {
	isSubmitLocked,
	isEmpty,
	beforeSubmit,
	handleSubmitError,
	unlockSubmit,
	validationErrors,
	validateName,
	validateTableName,
} = useErrorHandling()

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'saving'): void
	(event: 'saved'): void
}>()
const props = defineProps<{
	entry: Table
}>()

const form = reactive({ ...props.entry })
const touchedSeats: Set<string> = reactive(new Set())
const decrease = () => {
	if (form.seats > 4) form.seats--
}
const increase = () => {
	if (form.seats < 8) form.seats++
}
watch(
	() => form.seats,
	() => {
		// clear names and error messages
		const diff = props.entry.seats - form.seats
		if (diff > 0) {
			let n = props.entry.seats
			while (n > form.seats) {
				const key = `seat_${n--}` as SeatKey
				form[key] = ''
				touchedSeats.delete(key)
				validationErrors.delete(key)
			}
		}
	},
)

const reservations = computed(() => {
	const _reservations: Reservation[] = []
	state.tables
		.filter(item => item.active && item.id !== props.entry.id)
		.forEach(_table => {
			let n = 0
			while (n < _table.seats) {
				const key = `seat_${++n}` as SeatKey
				if (!_table[key].length) continue

				_reservations.push({
					name: _table[key],
					table: _table.name,
				})
			}
		})

	return _reservations
})

const onChange = (key: string, el: HTMLInputElement) => {
	touchedSeats.add(key)
	validateName(key, form[key as SeatKey], reservations.value)
	el.setCustomValidity(validationErrors.has(key) ? 'Eingabe ungültig' : '')
}

const resetValidation = (key: string) => {
	touchedSeats.delete(key)
	validationErrors.delete(key)
	;(document.querySelector(`#${key}`) as HTMLInputElement).setCustomValidity('')
}
const resetValue = (key: string) => {
	form[key as SeatKey] = ''
	resetValidation(key)
}

const _tableNames = computed(() => state.tables.map(item => item.name).filter(name => name !== props.entry.name))
const checkTableName = ({ target }: Event) => {
	validateTableName(form.name, _tableNames.value)
	;(target as HTMLInputElement).setCustomValidity(validationErrors.has('name') ? 'Eingabe ungültig' : '')
}

const onSubmit = async () => {
	if (isSubmitLocked.value || isEmpty(form.name)) return

	beforeSubmit()

	try {
		const formData: Table = {
			...toRaw(form),
			locked_by: null,
			locked_at: null,
		}

		// validate
		touchedSeats.forEach(key => {
			validateName(key, formData[key as SeatKey], reservations.value)
		})
		if (validationErrors.size) return

		emit('saving')
		await updateEntry(props.entry.id, formData)
		emit('saved')
	} catch (error) {
		handleSubmitError(error)
	} finally {
		unlockSubmit()
	}
}

const cancel = () => {
	emit('cancel')
}
</script>

<template>
	<form novalidate @submit.prevent="onSubmit">
		<template v-if="state.isAuthenticated">
			<div class="mb-4">
				<label for="name" class="mr-3">Name</label>
				<input
					v-model.trim="form.name"
					type="text"
					id="name"
					autocomplete="off"
					maxlength="16"
					required
					@input="checkTableName"
				/>
				<div class="mt-1 text-[--validation-error] empty:hidden">{{ validationErrors.get('name') }}</div>
			</div>
			<div class="mb-4">
				<span class="mr-3">Anzahl Sitzplätze</span>
				<button
					type="button"
					class="secondary-button !p-unset w-9"
					:aria-disabled="form.seats === 4"
					data-test-decrease-button
					@click="decrease"
				>
					-
				</button>
				<span class="w-1ch mx-2 inline-block">{{ form.seats }}</span>
				<button
					type="button"
					class="secondary-button !p-unset w-9"
					:aria-disabled="form.seats === 8"
					data-test-increase-button
					@click="increase"
				>
					+
				</button>
			</div>
			<div class="mb-4">
				<label>
					verfügbar
					<input v-model="form.active" type="checkbox" />
				</label>
			</div>
		</template>

		<div class="mb-3">Bitte Vor- und Nachnamen eintragen.</div>
		<div v-for="n in form.seats" :key="`seat-${n}`" class="input-wrapper" data-test-seat>
			<label :for="`seat_${n}`" class="text-right text-lg font-semibold">
				<span class="sr-only">Platz</span>
				{{ n }}
			</label>
			<input
				v-model.trim="form[`seat_${n}` as SeatKey]"
				type="text"
				class="w-full max-w-56"
				:id="`seat_${n}`"
				autocomplete="off"
				maxlength="36"
				enterkeyhint="done"
				@change="onChange(`seat_${n}`, $event.target as HTMLInputElement)"
			/>

			<div v-if="validationErrors.has(`seat_${n}`)" class="col-start-2 mt-1 text-[--validation-error]">
				<template v-if="Array.isArray(validationErrors.get(`seat_${n}`))">
					<div class="mb-0.5">Ist diese Person identisch mit:</div>
					<ul class="comma-separated text-[--dark]">
						<li v-for="(hit, i) in validationErrors.get(`seat_${n}`)" v-html="hit" :key="`${n}-${i}`"></li>
					</ul>

					<div class="button-wrapper my-2">
						<button type="button" class="secondary-button" @click="resetValue(`seat_${n}`)">ja</button>
						<button type="button" class="secondary-button" @click="resetValidation(`seat_${n}`)">nein</button>
					</div>
				</template>

				<template v-else>{{ validationErrors.get(`seat_${n}`) }}</template>
			</div>
		</div>

		<div class="button-wrapper mt-5">
			<button type="submit" class="primary-button" :aria-disabled="isSubmitLocked">Speichern</button>
			<button type="button" class="secondary-button" data-test-cancel-button @click="cancel">Abbrechen</button>
		</div>
	</form>
</template>

<style lang="postcss">
.input-wrapper {
	@apply mb-4 grid grid-cols-[1ch_1fr] items-center gap-x-2.5;
}

.button-wrapper {
	@apply grid grid-cols-[repeat(2,min-content)] gap-x-2.5;
}
</style>

<style>
.comma-separated {
	display: flex;
	flex-wrap: wrap;

	> :not(:last-child)::after {
		content: ', ';
		white-space: pre-wrap;
	}

	> :nth-last-child(2)::after {
		content: ' oder ';
	}

	> :last-child::after {
		content: '?';
	}
}
</style>
