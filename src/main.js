import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './stores';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

const app = createApp(App);

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
});

app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount('#app');
