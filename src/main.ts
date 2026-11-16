import { createApp } from 'vue';
import App from './App.vue';
import FluentIcon from './components/FluentIcon.vue';
import TransmissionLogo from './components/TransmissionLogo.vue';
import './styles/md1.css';
import { vRipple } from './styles/ripple';

const app = createApp(App);

// 全局注册 Fluent UI 矢量图标与 Transmission 官方 Logo
app.component('FluentIcon', FluentIcon);
app.component('TransmissionLogo', TransmissionLogo);

// 注册 Material Design Ripple 涟漪指令
app.directive('ripple', vRipple);

app.mount('#app');

