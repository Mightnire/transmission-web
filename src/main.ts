import { createApp } from 'vue';
import App from './App.vue';
import FluentIcon from './components/common/FluentIcon.vue';
import TransmissionLogo from './components/common/TransmissionLogo.vue';
import './styles/md1.css';

const app = createApp(App);

// 全局注册 Fluent UI 矢量图标与 Transmission 官方 Logo
app.component('FluentIcon', FluentIcon);
app.component('TransmissionLogo', TransmissionLogo);

app.mount('#app');

