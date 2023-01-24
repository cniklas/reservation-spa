<script setup lang="ts">
import { ref, reactive, computed, watch, toRaw, type Ref, type ComputedRef } from 'vue'
import { useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'
import { formatTime } from '@/use/helper'
import { useErrorHandling } from '@/use/errorHandling'

const db = useFirestore()
const {
	isSubmitLocked,
	isEmpty,
	beforeSubmit,
	handleSubmitError,
	unlockSubmit,
	errorsList,
	validateName,
	resetValidation,
} = useErrorHandling()

const emit = defineEmits<{
	(event: 'cancel'): void
	(event: 'saving'): void
	(event: 'saved'): void
}>()
const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
	tableDoc: TableDoc
	isLoggedIn: boolean
}>()

const form = reactive({ ...props.tableDoc })
const touchedSeats: Ref<Set<string>> = ref(new Set())
watch(
	() => form.seats,
	val => {
		if (val < 1) form.seats = 1
		else if (val > 8) form.seats = 8

		// clear names and error messages
		const diff = props.tableDoc.seats - form.seats
		if (diff > 0) {
			let n = props.tableDoc.seats
			while (n > form.seats) {
				const key = `seat_${n--}`
				form[key] = ''
				touchedSeats.value.delete(key)
				errorsList.delete(key)
			}
		}
	}
)

const reservations: ComputedRef<string[]> = computed(() => {
	const _reservations: string[] = []
	props.tables
		.filter(item => item.id !== props.tableDoc.id)
		.forEach(table => {
			let n = 0
			while (n < table.seats) {
				const key = `seat_${++n}`
				if (!(table[key] as string).length) continue
				_reservations.push(table[key] as string)
			}
		})

	return _reservations
})

const onChange = (key: string) => {
	touchedSeats.value.add(key)
	validateName(key, form[key] as string, reservations.value)
}

const onSubmit = async (): Promise<void> => {
	if (isEmpty(form.name)) return

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
			if (errorsList.size) return

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

const lockedAtFormatted: ComputedRef<string> = computed(() => {
	if (!props.tableDoc.locked_at) return ''

	return props.tableDoc.locked_at.nanoseconds
		? formatTime(props.tableDoc.locked_at.seconds * 1000 + props.tableDoc.locked_at.nanoseconds / 1000000)
		: formatTime(props.tableDoc.locked_at.seconds * 1000)
})

const cancel = (): void => {
	emit('cancel')
	resetValidation()
}
</script>

<template>
	<section>
		<button type="button" @click="cancel">close</button>
		<h2>{{ tableDoc.name }}</h2>

		<div v-if="tableDoc.locked_by">locked by: {{ tableDoc.locked_by }}</div>
		<div v-if="tableDoc.locked_at">
			locked at: {{ lockedAtFormatted }} // <code>{{ tableDoc.locked_at }}</code>
		</div>

		<form novalidate @submit.prevent="onSubmit">
			<template v-if="isLoggedIn">
				<div>
					<label for="name">Name</label>
					<input v-model.trim="form.name" type="text" id="name" autocomplete="off" required />
				</div>
				<div>
					<label for="seats">Anzahl Sitzplätze</label>
					<input v-model.number="form.seats" type="number" inputmode="numeric" id="seats" min="1" max="8" />
				</div>
				<div>
					<div>Block</div>
					<template v-for="[key, block] of blocks" :key="`block-${key}`">
						<input
							v-model.number="form.block_id"
							type="radio"
							:id="`block_id_${key}`"
							name="block_id"
							:value="key"
						/><label :for="`block_id_${key}`">{{ block }}</label>
					</template>
				</div>
				<div>
					<label for="active">verfügbar</label>
					<input v-model="form.active" type="checkbox" id="active" />
				</div>
			</template>
			<div v-for="n in form.seats" :key="`seat-${n}`">
				<label :for="`seat_${n}`">Sitzplatz {{ n }}</label>
				<!-- @change="validateName(`seat_${n}`, ($event.target as HTMLInputElement).value)" -->
				<input
					v-model.trim="form[`seat_${n}`]"
					type="text"
					:id="`seat_${n}`"
					autocomplete="off"
					placeholder="Vor- und Nachname"
					@change="onChange(`seat_${n}`)"
				/>
				<div style="color: red">
					{{ errorsList.get(`seat_${n}`) }}
				</div>
			</div>
			<div>
				<button type="submit" :disabled="isEmpty(form.name) || isSubmitLocked">Speichern</button>
				<button type="button" @click="cancel">Abbrechen</button>
			</div>
		</form>
	</section>
</template>
