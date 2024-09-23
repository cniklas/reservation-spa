<script setup lang="ts">
import { reactive, computed, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import type { CreateTable } from '@/types/Table.type'
import { useStore } from '@/use/store'
import { useErrorHandling } from '@/use/errorHandling'

const router = useRouter()
const { state, fetchEntries, addEntry } = useStore()
const { isSubmitLocked, beforeSubmit, handleSubmitError, validationErrors } = useErrorHandling()

fetchEntries()

const form = reactive({
	active: true,
	name: '',
	seats: 8,
})

watch(
	() => form.seats,
	val => {
		if (typeof val !== 'number') return
		if (val < 4) form.seats = 4
		else if (val > 8) form.seats = 8
	},
)

const nextIndex = computed(() => Math.max(...state.tables.map(item => item.index)) + 1)

const isSubmitDisabled = computed(() => isSubmitLocked.value || !Number.isInteger(form.seats))

const onSubmit = async () => {
	if (isSubmitDisabled.value) return
	if (validationErrors.size) return

	beforeSubmit()

	try {
		const formData: CreateTable = {
			...toRaw(form),
			index: nextIndex.value,
			seat_1: '',
			seat_2: '',
			seat_3: '',
			seat_4: '',
			seat_5: '',
			seat_6: '',
			seat_7: '',
			seat_8: '',
		}

		await addEntry(formData)
		router.push({ name: 'home' })
	} catch (error) {
		handleSubmitError(error)
	}
}
</script>

<template>
	<main class="container py-5">
		<h1 class="mb-3 text-3xl font-semibold">Neuer Tisch</h1>

		<form novalidate @submit.prevent="onSubmit">
			<div class="mb-4">
				<div class="mr-3 inline-block">Nummer</div>
				<div class="inline-block">{{ nextIndex }}</div>
			</div>
			<div class="mb-4">
				<label for="name" class="mr-3">Name</label>
				<input v-model.trim="form.name" type="text" id="name" autocomplete="off" maxlength="16" />
			</div>
			<div class="mb-4">
				<label for="seats" class="mr-3">Sitzplätze</label>
				<input
					v-model.number="form.seats"
					type="text"
					class="w-9"
					id="seats"
					inputmode="numeric"
					autocomplete="off"
					pattern="[4-8]"
					required
				/>
			</div>
			<div class="mb-4">
				<label>
					verfügbar
					<input v-model="form.active" type="checkbox" id="active" />
				</label>
			</div>
			<div class="mt-5">
				<button type="submit" class="primary-button" :aria-disabled="isSubmitDisabled">Speichern</button>
			</div>
		</form>
	</main>
</template>
