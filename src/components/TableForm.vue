<script setup lang="ts">
import { useTemplateRef, reactive, computed, watch, toRaw } from 'vue'
import type { SeatKey, Table } from '@/types/Table.type'
import type { Reservation } from '@/types/Reservation.type'
import { useStore } from '@/use/store'
import { useErrorHandling } from '@/use/errorHandling'

const { config, state, updateEntry } = useStore()
const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit, validationErrors, validateName } =
	useErrorHandling()

const emit = defineEmits<{
	cancel: []
	saving: []
	saved: []
}>()
const props = defineProps<{
	entry: Table
}>()

const form = reactive({ ...props.entry })
const touchedSeats: Set<string> = reactive(new Set())
const decrease = () => {
	if (form.seats > config.minSeats) form.seats--
}
const increase = () => {
	if (form.seats < config.maxSeats) form.seats++
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
					table: `${_table.index}`,
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
	document.querySelector<HTMLInputElement>(`#${key}`)?.setCustomValidity('')
}
const resetValue = (key: string) => {
	form[key as SeatKey] = ''
	resetValidation(key)
	focus(key)
}

const formEl = useTemplateRef('formEl')
const focus = (key: string) => {
	;(
		formEl.value?.querySelector<HTMLInputElement>(`#${key}`) ??
		formEl.value?.querySelector<HTMLButtonElement>('button[type=submit]')
	)?.focus()
}

const onSubmit = async () => {
	if (isSubmitLocked.value) return

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
	<form ref="formEl" novalidate @submit.prevent="onSubmit">
		<template v-if="state.isAuthenticated">
			<div class="mb-4">
				<label for="name" class="mr-3">Name</label>
				<input v-model.trim="form.name" type="text" id="name" autocomplete="off" maxlength="16" />
			</div>
			<div class="mb-4">
				<span class="mr-3">Sitzplätze</span>
				<button
					type="button"
					class="secondary-button !p-unset w-9"
					:aria-disabled="form.seats === config.minSeats"
					data-test-decrease-button
					@click="decrease"
				>
					-
				</button>
				<span class="w-1ch mx-2 inline-block">{{ form.seats }}</span>
				<button
					type="button"
					class="secondary-button !p-unset w-9"
					:aria-disabled="form.seats === config.maxSeats"
					data-test-increase-button
					@click="increase"
				>
					+
				</button>
			</div>
			<div class="mb-4">
				<label for="active">
					verfügbar
					<input v-model="form.active" type="checkbox" id="active" />
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
				:aria-describedby="`seat_${n}-error`"
				@change="onChange(`seat_${n}`, $event.target as HTMLInputElement)"
			/>

			<template v-if="validationErrors.has(`seat_${n}`)">
				<template v-if="Array.isArray(validationErrors.get(`seat_${n}`))">
					<div :id="`seat_${n}-error`" class="col-start-2 mt-1">
						<div class="mb-0.5 text-[--validation-error]">Ist diese Person identisch mit:</div>
						<ul class="comma-separated">
							<li v-for="(hit, i) in validationErrors.get(`seat_${n}`)" v-html="hit" :key="`${n}-${i}`"></li>
						</ul>
					</div>

					<div class="button-wrapper col-start-2 my-2">
						<button type="button" class="secondary-button" @click="resetValue(`seat_${n}`)">ja</button>
						<button
							type="button"
							class="secondary-button"
							@click="(resetValidation(`seat_${n}`), focus(`seat_${n + 1}`))"
						>
							nein
						</button>
					</div>
				</template>

				<div v-else :id="`seat_${n}-error`" class="col-start-2 mt-1 text-[--validation-error]">
					{{ validationErrors.get(`seat_${n}`) }}
				</div>
			</template>
		</div>

		<div class="button-wrapper mt-5">
			<button type="submit" class="primary-button" :aria-disabled="isSubmitLocked || !!validationErrors.size">
				Speichern
			</button>
			<button type="button" class="secondary-button" data-test-cancel-button @click="cancel">Abbrechen</button>
		</div>
	</form>
</template>

<style lang="postcss">
.input-wrapper {
	@apply mb-4 grid grid-cols-[1ch_1fr] items-center gap-x-3;
}

.button-wrapper {
	@apply grid grid-cols-[repeat(2,min-content)] gap-x-3;
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
