<script setup lang="ts">
import type { Timestamp, TableDoc } from '@/types/TableDoc.type'
import { formatTime } from '@/use/helper'

defineEmits<{
	(event: 'edit', id: string): void
	(event: 'unlock', id: string): void
}>()
defineProps<{
	tables: TableDoc[]
	uuid: string
	isLoggedIn: boolean
	isFormOpen: boolean
}>()

const lockedAtFormatted = (lockedAt: Timestamp) =>
	lockedAt.nanoseconds
		? formatTime(lockedAt.seconds * 1000 + lockedAt.nanoseconds / 1000000)
		: formatTime(lockedAt.seconds * 1000)
</script>

<template>
	<ul>
		<li v-for="table in tables" :key="table.id">
			<template v-if="!isLoggedIn && !table.active">{{ table.name }}</template>

			<template v-else>
				<button type="button" :disabled="isFormOpen || !!table.locked_at" @click="$emit('edit', table.id)">
					{{ table.name }}
					<template v-if="table.locked_at">🔒</template>
				</button>

				<template v-if="isLoggedIn && table.locked_at">
					<button v-if="table.locked_by !== uuid" type="button" @click="$emit('unlock', table.id)">🔑</button>
					<div>
						locked at: {{ lockedAtFormatted(table.locked_at) }} // <code>{{ table.locked_at }}</code>
					</div>
				</template>
			</template>
		</li>
	</ul>
</template>
