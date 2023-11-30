<script setup lang="ts">
import { reactive, computed, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { PROVIDE_TABLES } from '@/keys'
import { useErrorHandling } from '@/use/errorHandling'
import { injectStrict } from '@/use/helper'

const router = useRouter()
const { isSubmitLocked, isEmpty, beforeSubmit, handleSubmitError, validationErrors, validateTableName } =
	useErrorHandling()

const tables = injectStrict(PROVIDE_TABLES)
const _getNextIndex = () => Math.max(...(tables.value?.map(item => item.index) ?? [-1])) + 1

const form = reactive({
	active: true,
	block_id: 1,
	name: '',
	seats: 8,
})

watch(
	() => form.seats,
	val => {
		if (val < 1) form.seats = 1
		else if (val > 8) form.seats = 8
	},
)

const _tableNames = computed(() => tables.value?.map(item => item.name) ?? [])
const checkTableName = (e: Event) => {
	validateTableName(form.name, _tableNames.value)
	;(e.target as HTMLInputElement).setCustomValidity(validationErrors.has('name') ? 'Eingabe ungültig' : '')
}

const onSubmit = async () => {
	if (isSubmitLocked.value || isEmpty(form.name)) return
	if (validationErrors.size) return

	beforeSubmit()

	try {
		const formData = {
			...toRaw(form),
			index: _getNextIndex(),
			modified: serverTimestamp(),
			seat_1: '',
			seat_2: '',
			seat_3: '',
			seat_4: '',
			seat_5: '',
			seat_6: '',
			seat_7: '',
			seat_8: '',
		}

		await addDoc(collection(db, 'tables'), formData)
		router.push({ name: 'home' })
	} catch (error) {
		handleSubmitError(error)
	}
}
</script>

<template>
	<main class="px-3 py-5 sm:px-4">
		<h1 class="mb-1 text-3xl font-semibold">Add</h1>

		<form novalidate @submit.prevent="onSubmit">
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
				<div class="text-red-600">{{ validationErrors.get('name') }}</div>
			</div>
			<!-- <div class="mb-4">
				<div>Block</div>
				<template v-for="[key, block] of blocks" :key="`block-${key}`">
					<input v-model.number="form.block_id" type="radio" :id="`block_id_${key}`" name="block_id" :value="key" />
					<label :for="`block_id_${key}`">{{ block }}</label>
				</template>
			</div> -->
			<div class="mb-4">
				<label for="seats" class="mr-3">Anzahl Sitzplätze</label>
				<input v-model.number="form.seats" type="number" inputmode="numeric" id="seats" min="4" max="8" />
			</div>
			<div class="mb-4">
				<label>
					verfügbar
					<input v-model="form.active" type="checkbox" id="active" />
				</label>
			</div>
			<div class="mt-5">
				<button type="submit" class="re__primary-button" :disabled="isEmpty(form.name) || isSubmitLocked">
					Speichern
				</button>
			</div>
		</form>
	</main>
</template>
