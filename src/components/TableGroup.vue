<script setup lang="ts">
import type { TableDoc } from '@/types/TableDoc.type'

const emit = defineEmits<{
	(event: 'edit', id: string): void
	(event: 'unlock', id: string): void
}>()
defineProps<{
	tables: TableDoc[]
	uuid: string
	isLoggedIn: boolean
	isFormOpen: boolean
}>()

const edit = (id: string): void => {
	emit('edit', id)
}

const unlock = (id: string): void => {
	emit('unlock', id)
}
</script>

<template>
	<ul>
		<li v-for="table in tables" :key="table.id">
			({{ table.index }})
			<template v-if="!isLoggedIn && !table.active">{{ table.name }}</template>

			<template v-else>
				<button type="button" :disabled="isFormOpen || !!table.locked_at" @click="edit(table.id)">
					{{ table.name }}
					<template v-if="table.locked_at">🔒</template>
				</button>
				<!-- <span>{{ formatDateTime(table.modified.seconds * 1000) }}</span> -->
				<template v-if="table.locked_at">
					<button v-if="isLoggedIn && table.locked_by !== uuid" type="button" @click="unlock(table.id)">🔑</button>
					<!-- <code>{{ new Date(table.locked_at).getSeconds() }}.{{ new Date(table.locked_at).getMilliseconds() }}</code> -->
					<!-- <template v-if="selectedTable?.id === table.id && selectedTable.locked_at">
						|
						<code>
							{{ new Date(selectedTable.locked_at).getSeconds() }}.{{
								new Date(selectedTable.locked_at).getMilliseconds()
							}}
						</code>
					</template> -->
				</template>
			</template>
		</li>
	</ul>
</template>
