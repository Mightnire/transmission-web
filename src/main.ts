import { createApp } from 'vue';
import App from './App.vue';
import FluentIcon from './components/FluentIcon.vue';
import './styles/md1.css';
import { vRipple } from './styles/ripple';

const app = createApp(App);

// 全局注册 Fluent UI 矢量图标组件
app.component('FluentIcon', FluentIcon);

// 注册 Material Design Ripple 涟漪指令
app.directive('ripple', vRipple);

app.mount('#app');

