<script setup lang="ts">
import { reactive, watch, toRaw } from 'vue'
import { useFirestore } from 'vuefire'
import { doc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'
import { formatTime } from '@/use/helper'
import { useErrorHandling } from '@/use/errorHandling'

const db = useFirestore()
const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError, unlockSubmit } = useErrorHandling()

const emit = defineEmits(['cancel', 'saved'])
const props = defineProps<{
	blocks: Map<number, string>
	tableData: TableDoc
	isLoggedIn: boolean
}>()
const form = reactive({ ...props.tableData })

watch(
	() => form.seats,
	val => {
		if (val < 1) form.seats = 1
		else if (val > 8) form.seats = 8
	}
)

const onSubmit = async (): Promise<void> => {
	if (isEmpty(form.name)) return

	if (!isSubmitLocked.value) {
		beforeSubmit()

		try {
			const formData = {
				...toRaw(form),
				locked_until: deleteField(),
				modified: serverTimestamp(),
			}

			const diff = props.tableData.seats - formData.seats
			if (diff > 0) {
				// clear names
				let n = props.tableData.seats
				while (n > formData.seats) {
					formData[`seat_${n--}`] = ''
				}
			}

			const tableRef = doc(db, 'tables', props.tableData.id)
			await updateDoc(tableRef, formData)
			emit('saved')
		} catch (error) {
			handleSubmitError(error)
		} finally {
			unlockSubmit()
		}
	}
}

const cancel = (): void => {
	emit('cancel')
}
</script>

<template>
	<section>
		<button type="button" @click="cancel">close</button>
		<h2>{{ tableData.name }}</h2>
		<div>
			locked until:
			<code>{{ formatTime(tableData.locked_until) }}</code>
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
				<label :for="`seat-${n}`">Sitzplatz {{ n }}</label>
				<input v-model.trim="form[`seat_${n}`]" type="text" :id="`seat-${n}`" autocomplete="off" />
			</div>
			<div>
				<button type="submit" :disabled="isEmpty(form.name) || isSubmitLocked">Speichern</button>
				<button type="button" @click="cancel">Abbrechen</button>
			</div>
		</form>
	</section>
</template>
