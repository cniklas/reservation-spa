<script setup>
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'

const db = useFirestore()
const tables = useCollection(collection(db, 'tables'))
</script>

<template>
	<ul>
		<li v-for="table in tables" :key="table.id">
			<span>{{ table.name }}</span>
		</li>
	</ul>
</template>
