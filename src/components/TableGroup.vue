<script setup lang="ts">
import type { Timestamp, TableDoc } from '@/types/TableDoc.type'
import { formatTime } from '@/use/helper'

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

const edit = (id: string) => {
	emit('edit', id)
}

const unlock = (id: string) => {
	emit('unlock', id)
}

const lockedAtFormatted = (lockedAt: Timestamp) =>
	lockedAt.nanoseconds
		? formatTime(lockedAt.seconds * 1000 + lockedAt.nanoseconds / 1000000)
		: formatTime(lockedAt.seconds * 1000)
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
				<template v-if="isLoggedIn && table.locked_at">
					<button v-if="table.locked_by !== uuid" type="button" @click="unlock(table.id)">🔑</button>
					<div>
						locked at: {{ lockedAtFormatted(table.locked_at) }} // <code>{{ table.locked_at }}</code>
					</div>
				</template>
			</template>
		</li>
	</ul>
</template>
