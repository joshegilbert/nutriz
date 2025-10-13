import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import { useAuthStore } from '@/stores/useAuthStore'
import { installInterceptors } from '@/services/httpClient'

const app = createApp(App)
const pinia = createPinia()

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

app.use(pinia)

const authStore = useAuthStore(pinia)
installInterceptors(authStore, router)
if (authStore.token) {
  authStore.fetchProfile().catch(() => {})
}

app.use(router)
app.use(vuetify)

app.mount('#app')
