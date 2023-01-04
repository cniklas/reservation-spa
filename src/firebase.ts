import { initializeApp } from 'firebase/app'

export const firebaseApp = initializeApp({
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: import.meta.env.VITE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_PROJECT_ID,
	appId: import.meta.env.VITE_APP_ID,
})
