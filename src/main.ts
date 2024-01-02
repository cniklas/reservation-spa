import 'virtual:uno.css'
// https://unocss.dev/guide/style-reset
import '@unocss/reset/tailwind-compat.css'
import './main.css'

import { createApp } from 'vue'
import { collection, query, orderBy, doc, updateDoc, type DocumentData } from 'firebase/firestore'
import { useFirestore } from '@vueuse/firebase/useFirestore'
import { PROVIDE_TABLES, PROVIDE_UPDATE_DOCUMENT } from './keys'
import App from './App.vue'
import router from './router'
import { db } from './firebase'

const PATH = 'tables'
const tables = useFirestore(query(collection(db, PATH), orderBy('index')))

const updateDocument = async (id: string, data: DocumentData) => {
	const docRef = doc(db, PATH, id)
	await updateDoc(docRef, data)
}

const app = createApp(App)
app.provide(PROVIDE_TABLES, tables)
app.provide(PROVIDE_UPDATE_DOCUMENT, updateDocument)
app.use(router)
app.mount('#app')
