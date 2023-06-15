import 'virtual:windi.css'
import './main.css'

import { createApp } from 'vue'
import { collection, query, orderBy } from 'firebase/firestore'
import { useFirestore } from '@vueuse/firebase/useFirestore'
import App from './App.vue'
import router from './router'
import { db } from './firebase'

const blocks = new Map([
	[1, 'Linker Block'],
	[2, 'Mittelblock'],
	[3, 'Rechter Block'],
])
const tables = useFirestore(query(collection(db, 'tables'), orderBy('index')))

const app = createApp(App)
app.provide('blocks', blocks)
app.provide('tables', tables)
app.use(router)
app.mount('#app')
