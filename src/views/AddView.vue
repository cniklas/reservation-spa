<script setup lang="ts">
import { reactive, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useFirestore } from 'vuefire'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import type { TableDoc } from '@/types/TableDoc.type'
import { useErrorHandling } from '@/use/errorHandling'

const router = useRouter()
const db = useFirestore()
const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError } = useErrorHandling()

const props = defineProps<{
	blocks: Map<number, string>
	tables: TableDoc[]
}>()
const _getNextIndex = (): number => Math.max(...props.tables.map(item => item.index)) + 1

const form = reactive({
	active: true,
	block_id: 1,
	name: '',
	seats: 8,
})

const onSubmit = async (): Promise<void> => {
	// if (!state.hasAuthenticated) return
	if (isEmpty(form.name)) return

	if (!isSubmitLocked.value) {
		beforeSubmit()

		try {
			const formData = {
				...toRaw(form),
				index: _getNextIndex(),
				modified: Timestamp.fromDate(new Date()),
				seat_1: '',
				seat_2: '',
				seat_3: '',
				seat_4: '',
				seat_5: '',
				seat_6: '',
				seat_7: '',
				seat_8: '',
				seats: form.seats || 0,
			}

			/* const { id } = */ await addDoc(collection(db, 'tables'), formData)
			router.push({ name: 'home' })
		} catch (error) {
			handleSubmitError(error)
		}
	}
}
</script>

<template>
	<main>
		<h1>Add</h1>

		<form novalidate @submit.prevent="onSubmit">
			<div>
				<label for="name">Name</label>
				<input v-model.trim="form.name" type="text" id="name" autocomplete="off" required />
			</div>
			<div>
				<label for="seats">Anzahl Sitzplätze</label>
				<input v-model.number="form.seats" type="number" inputmode="numeric" id="seats" min="0" max="8" />
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
			<div><button type="submit" :disabled="isEmpty(form.name) || isSubmitLocked">Speichern</button></div>
		</form>
	</main>
</template>
