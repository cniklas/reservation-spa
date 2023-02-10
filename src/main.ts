import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useFirestore, useCollection, VueFire, VueFireAuth } from 'vuefire'
import { collection, query, orderBy } from 'firebase/firestore'
import { firebaseApp } from './firebase'

import 'virtual:windi.css'
import './assets/main.css'

document.title = import.meta.env.VITE_APP_NAME

const blocks = new Map([
	[1, 'Linker Block'],
	[2, 'Mittelblock'],
	[3, 'Rechter Block'],
])
const db = useFirestore()
const tables = useCollection(query(collection(db, 'tables'), orderBy('index')))

const app = createApp(App)
app.provide('blocks', blocks)
app.provide('tables', tables)
app.use(router)
app.use(VueFire, {
	firebaseApp,
	modules: [VueFireAuth()],
})
app.mount('#app')
