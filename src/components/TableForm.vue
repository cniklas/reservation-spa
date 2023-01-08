<script setup lang="ts">
import { reactive } from 'vue'
import type { TableDoc } from '@/types/TableDoc.type'
import { formatTimestamp } from '@/use/helper'

const emit = defineEmits(['cancel'])
const props = defineProps<{
	blocks: Map<number, string>
	tableData: TableDoc
}>()
const form = reactive(props.tableData)

const onCancel = () => {
	emit('cancel')
}
</script>

<template>
	<section>
		<button type="button" @click="onCancel">close</button>
		<h2>{{ tableData.name }}</h2>
		<div>
			locked until: <code>{{ formatTimestamp(tableData.locked_until) }}</code>
		</div>

		<!-- <form novalidate @submit.prevent="onSubmit"> -->
		<form novalidate>
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
			<div>
				<!-- <button type="submit" :disabled="isEmpty(form.name) || isSubmitLocked">Speichern</button> -->
				<button type="button" @click="onCancel">Abbrechen</button>
			</div>
		</form>
	</section>
</template>
