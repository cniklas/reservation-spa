import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/main.css'

document.title = import.meta.env.VITE_APP_NAME

const app = createApp(App)
app.use(router)
app.mount('#app')
