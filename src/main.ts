import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './firebase'

import './assets/main.css'

document.title = import.meta.env.VITE_APP_NAME

const app = createApp(App)
app.use(router)
app.use(VueFire, {
	firebaseApp,
	modules: [VueFireAuth()],
})
app.mount('#app')
