<script setup>
defineProps({
	tables: {
		type: Array,
		default: () => [],
	},
})
</script>

<template>
	<ul>
		<li v-for="table in tables" :key="table.id">
			{{ table.name }}
		</li>
	</ul>
</template>
