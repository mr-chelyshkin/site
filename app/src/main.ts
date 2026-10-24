import '@/styles/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

const beacon = import.meta.env.VITE_CF_BEACON_TOKEN
if (beacon) {
  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token: beacon })
  document.body.append(script)
}
