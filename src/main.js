import { createApp } from 'vue';
import App from './App.vue';
import router from "./router/index"; // 引入router
import store from './store'; // 引入store
import './style.css';

createApp(App)
    .use(store) // 使用 store
    .use(router) // 使用 router
    .mount('#app')
