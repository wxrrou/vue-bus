import axios from 'axios';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import leaflet from 'leaflet';
import { createApp } from 'vue';
import VueAxios from 'vue-axios';
import App from './App.vue';
import router from "./router/index"; // 引入router
import store from './store'; // 引入store
import './style.css';

axios.defaults.baseURL = import.meta.env.VITE_APP_BASEURL

createApp(App)
    .use(store) // 使用 store
    .use(router) // 使用 router
    .use(VueAxios, axios, leaflet)
    .use(ElementPlus)
    .mount('#app')