import { initializeApp } from 'firebase/app'

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const appId = import.meta.env.VITE_FIREBASE_APP_ID

export const firebaseApp = initializeApp({
	apiKey,
	authDomain,
	projectId,
	appId,
})
