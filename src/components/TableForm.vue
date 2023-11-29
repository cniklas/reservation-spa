<script setup lang="ts">
import { reactive, computed, watch, toRaw } from 'vue'
import { deleteField, serverTimestamp } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from '@/keys'
import { useErrorHandling } from '@/use/errorHandling'
import { injectStrict } from '@/use/helper'

const tables = injectStrict(PROVIDE_TABLES)
const updateDocument = injectStrict(PROVIDE_UPDATE_DOCUMENT)

const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError, unlockSubmit, validationErrors, validateName } =
	useErrorHandling()

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'saving'): void
	(event: 'saved'): void
}>()
const props = defineProps<{
	entry: TableDoc
	isLoggedIn: boolean
}>()

// eslint-disable-next-line vue/no-setup-props-destructure
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
				const key = `seat_${n--}`
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
		?.filter(item => item.id !== props.entry.id)
		?.forEach(_table => {
			let n = 0
			while (n < _table.seats) {
				const key = `seat_${++n}`
				if (!(_table[key] as string).length) continue

				_reservations.push({
					name: _table[key] as string,
					table: _table.name,
				})
			}
		})

	return _reservations
})

const onChange = (key: string, el: HTMLInputElement) => {
	touchedSeats.add(key)
	validateName(key, form[key] as string, reservations.value)
	el.setCustomValidity(validationErrors.has(key) ? 'Eingabe ungültig' : '')
}

const resetValidation = (key: string) => {
	touchedSeats.delete(key)
	validationErrors.delete(key)
	;(document.querySelector(`#${key}`) as HTMLInputElement).setCustomValidity('')
}
const resetValue = (key: string) => {
	form[key] = ''
	resetValidation(key)
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
			validateName(key, formData[key] as string, reservations.value)
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
	<!-- <div class="timer-radial relative h-20 w-20 rounded-full bg-rose-500 bg-blend-multiply" /> -->
	<div class="mb-2 font-semibold empty:hidden"><slot /></div>

	<form novalidate @submit.prevent="onSubmit">
		<template v-if="isLoggedIn">
			<div>
				<label for="name">Name</label>
				<input v-model.trim="form.name" type="text" id="name" autocomplete="off" maxlength="16" required />
			</div>
			<div>
				<span>Anzahl Sitzplätze</span>
				<button
					type="button"
					class="re__secondary-button"
					:disabled="form.seats === 4"
					data-test-decrease-button
					@click="decrease"
				>
					-
				</button>
				<span class="w-1ch mx-2 inline-block">{{ form.seats }}</span>
				<button
					type="button"
					class="re__secondary-button"
					:disabled="form.seats === 8"
					data-test-increase-button
					@click="increase"
				>
					+
				</button>
			</div>
			<!-- <div>
				<div>Block</div>
				<template v-for="[key, block] of blocks" :key="`block-${key}`">
					<input v-model.number="form.block_id" type="radio" :id="`block_id_${key}`" name="block_id" :value="key" />
					<label :for="`block_id_${key}`">{{ block }}</label>
				</template>
			</div> -->
			<div>
				<label>
					verfügbar
					<input v-model="form.active" type="checkbox" />
				</label>
			</div>
		</template>

		<ol>
			<li v-for="n in form.seats" :key="`seat-${n}`" class="mb-4" data-test-seat>
				<div class="grid w-fit grid-cols-2 gap-2">
					<label :for="`seat_${n}`">Vor- und Nachname</label>
					<input
						v-model.trim="form[`seat_${n}`]"
						type="text"
						:id="`seat_${n}`"
						autocomplete="off"
						maxlength="36"
						enterkeyhint="done"
						@change="onChange(`seat_${n}`, $event.target as HTMLInputElement)"
					/>
				</div>
				<template v-if="validationErrors.has(`seat_${n}`)">
					<template v-if="Array.isArray(validationErrors.get(`seat_${n}`))">
						<div class="text-red-500">Ist diese Person identisch mit:</div>
						<ul class="re__comma-separated">
							<li v-for="(hit, i) in validationErrors.get(`seat_${n}`)" :key="`${n}-${i}`">{{ hit }}</li>
						</ul>
						<div class="mt-2 grid w-fit grid-cols-2 gap-x-2">
							<button type="button" class="re__secondary-button" @click="resetValue(`seat_${n}`)">ja</button>
							<button type="button" class="re__secondary-button" @click="resetValidation(`seat_${n}`)">nein</button>
						</div>
					</template>
					<div v-else class="text-red-500">{{ validationErrors.get(`seat_${n}`) }}</div>
				</template>
			</li>
		</ol>

		<div class="mt-5 grid w-fit grid-cols-2 gap-x-2">
			<button type="submit" class="re__primary-button" :disabled="isSubmitLocked">Speichern</button>
			<button type="button" class="re__secondary-button" data-test-cancel-button @click="cancel">Abbrechen</button>
		</div>
	</form>
</template>

<style lang="postcss">
.re__comma-separated {
	@apply flex flex-wrap;

	> :not(:last-child)::after {
		@apply white-space-pre-wrap;
		content: ', ';
	}

	> :nth-last-child(2)::after {
		content: ' oder ';
	}

	> :last-child::after {
		content: '?';
	}
}

/* https://web.dev/at-property/ */
/* https://dev.to/afif/we-can-finally-animate-css-gradient-kdk */
/* Chrome only, see https://caniuse.com/?search=%40property */
/* https://css-tricks.com/making-a-real-time-clock-with-a-conic-gradient-face/ */
/* @supports (background: paint(something)) {
	@property --angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.timer-radial {
		--angle: 0deg;
		background-image: conic-gradient(
			from 0deg,
			rgb(255 255 255) 2deg,
			rgb(0 0 0 / 0.5) var(--angle),
			rgb(255 255 255) 2deg,
			rgb(0 0 0 / 0.7)
		);
		transform: translateZ(0);

		.is-running > & {
			--angle: 360deg;
			transition: --angle var(--edit-timeout) linear;
		}
	}
} */
</style>
