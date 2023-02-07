<script setup lang="ts">
import { ref, reactive, computed, watch, inject, toRaw, type Ref } from 'vue'
import { useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'
import type { Reservation } from '@/types/Reservation.type'
import { formatTime } from '@/use/helper'
import { useErrorHandling } from '@/use/errorHandling'

const blocks = inject('blocks') as Ref<Map<number, string>>

const db = useFirestore()
const { isSubmitLocked, beforeSubmit, handleSubmitError, unlockSubmit, validationErrors, validateName } =
	useErrorHandling()

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'saving'): void
	(event: 'saved'): void
}>()
const props = defineProps<{
	tables: TableDoc[]
	tableDoc: TableDoc
	isLoggedIn: boolean
	countdown: number
}>()

const form = reactive({ ...props.tableDoc })
const touchedSeats: Ref<Set<string>> = ref(new Set())
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
		const diff = props.tableDoc.seats - form.seats
		if (diff > 0) {
			let n = props.tableDoc.seats
			while (n > form.seats) {
				const key = `seat_${n--}`
				form[key] = ''
				touchedSeats.value.delete(key)
				validationErrors.value.delete(key)
			}
		}
	}
)

const reservations = computed(() => {
	const _reservations: Reservation[] = []
	props.tables
		.filter(item => item.id !== props.tableDoc.id)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}`
				if (!(table[key] as string).length) continue

				_reservations.push({
					name: table[key] as string,
					table: table.name,
				})
			}
		})

	return _reservations
})

const onChange = (key: string, el: HTMLInputElement) => {
	touchedSeats.value.add(key)
	validateName(key, form[key] as string, reservations.value)
	el.setCustomValidity(validationErrors.value.has(key) ? 'Eingabe ungültig' : '')
}

const resetValidation = (key: string) => {
	touchedSeats.value.delete(key)
	validationErrors.value.delete(key)
	;(document.querySelector(`#${key}`) as HTMLInputElement).setCustomValidity('')
}
const resetValue = (key: string) => {
	form[key] = ''
	resetValidation(key)
}

const onSubmit = async () => {
	if (!isSubmitLocked.value) {
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
			touchedSeats.value.forEach(key => {
				validateName(key, formData[key] as string, reservations.value)
			})
			if (validationErrors.value.size) return

			emit('saving')
			const tableRef = doc(db, 'tables', props.tableDoc.id)
			await updateDoc(tableRef, formData)
			emit('saved')
		} catch (error) {
			handleSubmitError(error)
		} finally {
			unlockSubmit()
		}
	}
}

const lockedAtFormatted = computed(() => {
	if (!props.tableDoc.locked_at) return ''

	return props.tableDoc.locked_at.nanoseconds
		? formatTime(props.tableDoc.locked_at.seconds * 1000 + props.tableDoc.locked_at.nanoseconds / 1000000)
		: formatTime(props.tableDoc.locked_at.seconds * 1000)
})

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
		<h2>Tisch {{ form.name }}</h2>

		<div class="timer-radial"></div>
		<div class="countdown">{{ countdownToTime }}</div>

		<div v-if="tableDoc.locked_at">
			locked at: {{ lockedAtFormatted }} // <code>{{ tableDoc.locked_at }}</code>
		</div>

		<form novalidate @submit.prevent="onSubmit">
			<template v-if="isLoggedIn">
				<div>
					<label for="name">Name</label>
					<input v-model.trim="form.name" type="text" id="name" autocomplete="off" maxlength="16" required />
				</div>
				<div>
					<label for="seats">Anzahl Sitzplätze</label>
					<!-- <input v-model.number="form.seats" type="number" inputmode="numeric" id="seats" min="1" max="8" /> -->
					{{ form.seats }}
					<button type="button" :disabled="form.seats === 1" @click="decrease">-</button>
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
				<ol>
					<li v-for="n in form.seats" :key="`seat-${n}`">
						<!-- <label :for="`seat_${n}`">Sitzplatz {{ n }}</label> -->
						<input
							v-model.trim="form[`seat_${n}`]"
							type="text"
							:id="`seat_${n}`"
							autocomplete="off"
							maxlength="36"
							placeholder="Vor- und Nachname"
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
	list-style: none;
	margin: unset;
	padding: unset;

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
@supports (background: paint(something)) {
	@property --angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.timer-radial {
		--angle: 0deg;
		position: relative;
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background-color: darkorange;
		/* https://css-tricks.com/making-a-real-time-clock-with-a-conic-gradient-face/ */
		background-image: conic-gradient(
			from 0deg,
			rgb(255 255 255) 2deg,
			rgb(0 0 0 / 0.5) var(--angle),
			rgb(255 255 255) 2deg,
			rgb(0 0 0 / 0.7)
		);
		background-blend-mode: multiply;
		transform: translateZ(0);

		.is-running > & {
			--angle: 360deg;
			transition: --angle calc(var(--duration) * 1ms) linear;
		}
	}
}
</style>
