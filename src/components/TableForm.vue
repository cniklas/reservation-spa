<script setup lang="ts">
import { reactive, computed, watch, toRaw } from 'vue'
import { deleteField, serverTimestamp } from 'firebase/firestore'
import type { SeatKey, TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from '@/keys'
import { useErrorHandling } from '@/use/errorHandling'
import { injectStrict } from '@/use/helper'

const tables = injectStrict(PROVIDE_TABLES)
const updateDocument = injectStrict(PROVIDE_UPDATE_DOCUMENT)

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
	entry: TableDoc
	isAuthenticated: boolean
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
	tables.value
		?.filter(item => item.active && item.id !== props.entry.id)
		?.forEach(_table => {
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

const _tableNames = computed(() => tables.value?.map(item => item.name).filter(name => name !== props.entry.name) ?? [])
const checkTableName = ({ target }: Event) => {
	validateTableName(form.name, _tableNames.value)
	;(target as HTMLInputElement).setCustomValidity(validationErrors.has('name') ? 'Eingabe ungültig' : '')
}

const onSubmit = async () => {
	if (isSubmitLocked.value || isEmpty(form.name)) return

	beforeSubmit()

	try {
		const formData: TableDoc = {
			...toRaw(form),
			// @ts-ignore
			locked_by: deleteField(),
			// @ts-ignore
			locked_at: deleteField(),
			// @ts-ignore
			modified: serverTimestamp(),
		}

		// validate
		touchedSeats.forEach(key => {
			validateName(key, formData[key as SeatKey], reservations.value)
		})
		if (validationErrors.size) return

		emit('saving')
		await updateDocument(props.entry.id, formData)
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
	<div class="mb-3">
		Bearbeitungszeit: <span class="font-semibold"><slot /></span>
	</div>

	<form novalidate @submit.prevent="onSubmit">
		<template v-if="isAuthenticated">
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
				<div class="mt-1 text-red-600 empty:hidden">{{ validationErrors.get('name') }}</div>
			</div>
			<div class="mb-4">
				<span class="mr-3">Anzahl Sitzplätze</span>
				<button
					type="button"
					class="re__secondary-button !p-unset w-9"
					:disabled="form.seats === 4"
					data-test-decrease-button
					@click="decrease"
				>
					-
				</button>
				<span class="w-1ch mx-2 inline-block">{{ form.seats }}</span>
				<button
					type="button"
					class="re__secondary-button !p-unset w-9"
					:disabled="form.seats === 8"
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

		<ol>
			<li
				v-for="n in form.seats"
				:key="`seat-${n}`"
				class="mb-4 grid grid-cols-[1ch_1fr] items-center gap-x-2.5"
				data-test-seat
			>
				<label :for="`seat_${n}`" class="text-right text-lg font-semibold">
					<span class="sr-only">Platz</span>
					{{ n }}
				</label>
				<input
					v-model.trim="form[`seat_${n}` as SeatKey]"
					type="text"
					class="max-w-56 w-full"
					:id="`seat_${n}`"
					placeholder="Vor- und Nachname"
					autocomplete="off"
					maxlength="36"
					enterkeyhint="done"
					@change="onChange(`seat_${n}`, $event.target as HTMLInputElement)"
				/>

				<div v-if="validationErrors.has(`seat_${n}`)" class="col-start-2 mt-1 text-red-600">
					<template v-if="Array.isArray(validationErrors.get(`seat_${n}`))">
						<div class="mb-0.5">Ist diese Person identisch mit:</div>
						<ul class="re__comma-separated text-dark-700">
							<li v-for="(hit, i) in validationErrors.get(`seat_${n}`)" v-html="hit" :key="`${n}-${i}`"></li>
						</ul>

						<div class="my-2 grid w-fit grid-cols-2 gap-x-2.5">
							<button type="button" class="re__secondary-button" @click="resetValue(`seat_${n}`)">ja</button>
							<button type="button" class="re__secondary-button" @click="resetValidation(`seat_${n}`)">nein</button>
						</div>
					</template>

					<template v-else>{{ validationErrors.get(`seat_${n}`) }}</template>
				</div>
			</li>
		</ol>

		<div class="mt-5 grid w-fit grid-cols-2 gap-x-2.5">
			<button type="submit" class="re__primary-button" :disabled="isSubmitLocked">Speichern</button>
			<button type="button" class="re__secondary-button" data-test-cancel-button @click="cancel">Abbrechen</button>
		</div>
	</form>
</template>

<style>
.re__comma-separated {
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
