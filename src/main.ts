import { createApp } from 'vue';
import App from './App.vue';
import './styles/md1.css';
import { vRipple } from './styles/ripple';

const app = createApp(App);

// 注册 Material Design Ripple 涟漪指令
app.directive('ripple', vRipple);

app.mount('#app');
