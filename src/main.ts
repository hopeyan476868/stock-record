import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import MobileStockApp from './MobileStockApp.vue';

const app = createApp(MobileStockApp);
app.use(createPinia());
app.mount('#app');

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
