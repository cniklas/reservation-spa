<script setup lang="ts">
import { reactive, computed, watch, inject, toRaw, type Ref } from 'vue'
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'
import { useErrorHandling } from '@/use/errorHandling'

const blocks = inject('blocks') as Map<number, string>
const tables = inject('tables') as Ref<TableDoc[] | undefined>

const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit, validationErrors, validateName } =
	useErrorHandling()

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'saving'): void
	(event: 'saved'): void
}>()
const props = defineProps<{
	entry: TableDoc
	isLoggedIn: boolean
	countdown: number
}>()

const form = reactive({ ...props.entry })
const touchedSeats: Set<string> = reactive(new Set())
const decrease = () => {
	if (form.seats > 1) form.seats--
}
const increase = () => {
	if (form.seats < 8) form.seats++
}
watch(
	() => form.seats,
	() => {
		// if (val < 1) form.seats = 1
		// else if (val > 8) form.seats = 8

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
	}
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
	if (isSubmitLocked.value) return

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
		const tableRef = doc(db, 'tables', props.entry.id)
		await updateDoc(tableRef, formData)
		emit('saved')
	} catch (error) {
		handleSubmitError(error)
	} finally {
		unlockSubmit()
	}
}

const countdownToTime = computed(() =>
	new Date(props.countdown * 1000).toLocaleTimeString('de-DE', { minute: 'numeric', second: 'numeric' })
)

const cancel = () => {
	emit('cancel')
}
</script>

<template>
	<section>
		<button type="button" @click="cancel">close</button>
		<h2>Tisch {{ entry.name }}</h2>

		<!-- <div class="timer-radial relative h-20 w-20 rounded-full bg-rose-500 bg-blend-multiply" /> -->
		<div class="countdown my-2">{{ countdownToTime }}</div>

		<form novalidate @submit.prevent="onSubmit">
			<template v-if="isLoggedIn">
				<div>
					<label for="name">Name</label>
					<input v-model.trim="form.name" type="text" id="name" autocomplete="off" maxlength="16" required />
				</div>
				<div>
					<label for="seats">Anzahl Sitzplätze</label>
					<!-- <input v-model.number="form.seats" type="number" inputmode="numeric" id="seats" min="1" max="8" /> -->
					<button type="button" :disabled="form.seats === 1" @click="decrease">-</button>
					{{ form.seats }}
					<button type="button" :disabled="form.seats === 8" @click="increase">+</button>
				</div>
				<div>
					<div>Block</div>
					<template v-for="[key, block] of blocks" :key="`block-${key}`">
						<input v-model.number="form.block_id" type="radio" :id="`block_id_${key}`" name="block_id" :value="key" />
						<label :for="`block_id_${key}`">{{ block }}</label>
					</template>
				</div>
				<div>
					<label for="active">verfügbar</label>
					<input v-model="form.active" type="checkbox" id="active" />
				</div>
			</template>
			<div>
				<div>Sitzplätze</div>
				<ol class="list-decimal pl-4">
					<li v-for="n in form.seats" :key="`seat-${n}`" class="my-2">
						<!-- <label :for="`seat_${n}`">Sitzplatz {{ n }}</label> -->
						<label :for="`seat_${n}`">Vor- und Nachname</label>
						<input
							v-model.trim="form[`seat_${n}`]"
							type="text"
							:id="`seat_${n}`"
							autocomplete="off"
							maxlength="36"
							@change="onChange(`seat_${n}`, $event.target as HTMLInputElement)"
						/>
						<template v-if="validationErrors.has(`seat_${n}`)">
							<template v-if="Array.isArray(validationErrors.get(`seat_${n}`))">
								<div style="color: red">Ist diese Person identisch mit</div>
								<ul class="comma-separated">
									<li v-for="(hit, i) in validationErrors.get(`seat_${n}`)" :key="`${n}-${i}`">{{ hit }}</li>
								</ul>
								<button type="button" @click="resetValidation(`seat_${n}`)">nein</button>
								<button type="button" @click="resetValue(`seat_${n}`)">ja</button>
							</template>
							<div v-else style="color: red">{{ validationErrors.get(`seat_${n}`) }}</div>
						</template>
					</li>
				</ol>
			</div>
			<div>
				<button type="submit" :disabled="isSubmitLocked">Speichern</button>
				<button type="button" @click="cancel">Abbrechen</button>
			</div>
		</form>
	</section>
</template>

<style lang="postcss">
.comma-separated {
	display: flex;

	& > :not(:last-child)::after {
		content: ', ';
		white-space: pre-wrap;
	}

	& > :nth-last-child(2)::after {
		content: ' oder ';
	}

	& > :last-child::after {
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
			transition: --angle calc(var(--duration) * 1ms) linear;
		}
	}
} */
</style>
