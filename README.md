# Transmission Web MD1

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Material Design 1](https://img.shields.io/badge/Design-Material%20Design%201-indigo.svg)](https://material.io/)

A lightweight, robust, and responsive Transmission Web UI designed with classic **Material Design 1 (MD1)** for routers and low-spec embedded devices.

一款专为路由器（Padavan、OpenWrt）与资源受限设备设计的轻量级 Transmission Web 客户端，采用经典的 **Material Design 1 (MD1)** 设计规范。

---

## 🌟 设计初衷与核心特性 (Design Philosophy)

在嵌入式路由器（如 16MB SPI Flash 闪存）场景下，我们希望为 Transmission 提供一个既具备现代响应式交互、又兼顾极简体积与高鲁棒性的 Web 前端：

1. **精准的真实进度展示**：
   - 严格基于 Transmission 内核校验通过的有效数据百分比（`percentDone`）进行渲染；
   - 独立统计网络传输中的重传与校验损耗（`corruptEver`），提供客观透明的数据指标。
2. **完全受控与状态持久化的文件树**：
   - 树状结构采用完全受控设计，并结合 `localStorage` 记录各任务独特的折叠与展开偏好；
   - 在高频数据轮询刷新期间，目录折叠状态保持稳定，不会产生意外重置。
3. **极简轻量化体积 (Zero Bloat, Gzip ~45 KB)**：
   - 采用纯原生 CSS 实现经典的 Material Design 1 样式规范（纸张阴影 Elevation、56dp 经典 AppBar、FAB 悬浮按钮、水波纹 Ripple 动效）；
   - 零重型第三方组件库依赖，构建产物 Gzip 压缩后仅约 **45 KB**，秒开、秒加载，对路由器闪存零压力。
4. **原生多语言国际化支持 (i18n)**：
   - 内置轻量级响应式国际化系统，开箱支持 **简体中文 (zh-CN)**、**English (en-US)** 与 **Русский (ru-RU)**。
5. **现代响应式布局**：
   - 适配 PC 桌面端、平板与移动端屏幕，提供平滑自然的流式卡片与详情抽屉。

---

## 🛠️ 本地开发与构建 (Getting Started)

### 环境依赖
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 本地联调
修改 `vite.config.ts` 中的代理目标为你的路由器 IP（默认 `http://192.168.2.1:9091`），随后启动开发服务器：
```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可实时热重载联调。

### 生产环境打包
```bash
npm run build
```
打包产物将输出至 `dist/` 目录。

---

## 📦 部署到路由器 (Deployment to Padavan / OpenWrt)

直接将 `dist/` 目录下的所有文件上传并替换路由器的 Transmission 静态 Web 目录：
- **Padavan**: `/usr/share/transmission/web/`
- **OpenWrt**: `/usr/share/transmission/web/`

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
