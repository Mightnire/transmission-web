# Transmission Web MD1

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Material Design 1](https://img.shields.io/badge/Design-Material%20Design%201-indigo.svg)](https://material.io/)

A lightweight, robust, and zero-bloat Transmission Web UI designed with classic **Material Design 1 (MD1)** for routers (Padavan, OpenWrt) and low-spec embedded devices.

一款专为路由器（Padavan、OpenWrt）与弱性能嵌入式设备打造的极轻量、高鲁棒性 Transmission Web 客户端，采用纯粹经典的 **Material Design 1 (MD1)** 纸张美学。

---

## 🌟 设计愿景与解决的痛点 (Why Transmission Web MD1?)

传统的第三方 Transmission WebUI 往往盲目引入沉重的大型 UI 库（Naive UI、Element 等）及 PWA 运行时，不仅打包体积动辄达到 2MB~5MB，消耗宝贵的路由器只读闪存（ROMFS），而且充斥着各种违反 BT 协议常识的逻辑缺陷：

1. **彻底告别「假 100% 虚假进度」**：
   - *缺陷溯源*：市面上的 WebUI 错误使用 `Math.max(percentDone, downloadedEver / sizeWhenDone)` 算进度，将网络丢包重传与校验失败被抛弃的坏块数据（`corruptEver`）当成有效进度，导致种子明明还差几 GB 没下完，进度条却假满 100%；
   - *MD1 引擎*：严格基于 Transmission 内核校验通过的有效数据比率（`percentDone`），精确还原客观真实。
2. **真正的受控文件树 + LocalStorage 永久记忆**：
   - *缺陷溯源*：旧版树组件多为非受控实现，后台定时轮询刷新进度时，`data` 引用刷新触发默认全展开，导致用户刚收起的目录在几秒内无限次弹开；
   - *MD1 引擎*：完全受控状态机，配合每个种子的 Hash/ID 深度持久化记忆，无论后台如何轮询，收起的文件夹永远纹丝不动！
3. **极度轻巧（Zero Bloat, < 120 KB）**：
   - 零重型外部 UI 库，纯手写原汁原味的 Material Design 1 样式系统（Elevation 阴影、56dp AppBar、FAB 悬浮按钮、水波纹 Ripple 动效）；
   - Gzip 压缩后体积仅约 **100 KB**，秒开、秒加载，对 16MB 闪存路由器极其友好。
4. **多语言原生国际化**：
   - 内置轻量级响应式 i18n 系统，原生支持 **简体中文 (zh-CN)**、**English (en-US)** 与 **Русский (ru-RU)**。
5. **专属特色：坏块与传输损耗雷达**：
   - 自动检测并直观展示校验失败的坏块数据损耗量（`corruptEver`），快速识别网络传输异常。

---

## 🛠️ 本地开发与构建 (Getting Started)

### 环境依赖
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 本地联调（内置代理直连路由器）
修改 `vite.config.ts` 中的代理目标为你的路由器 IP（默认 `http://192.168.2.1:9091`），随后启动开发服务器：
```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000`，即可享受热重载即时联调。

### 生产环境打包
```bash
npm run build
```
打包产物将输出至 `dist/` 目录，单页资源可直接部署到任何静态服务器。

---

## 📦 部署到路由器 (Deployment to Padavan / OpenWrt)

直接将 `dist/` 目录下的所有文件上传至路由器的 Transmission 静态 Web 目录：
- **Padavan**: `/usr/share/transmission/web/`
- **OpenWrt**: `/usr/share/transmission/web/`

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
