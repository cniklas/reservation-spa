import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseApp = initializeApp({
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: import.meta.env.VITE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_PROJECT_ID,
	appId: import.meta.env.VITE_APP_ID,
})
const auth = getAuth(firebaseApp)
const db = getFirestore()

export { auth, db }
