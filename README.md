# Transmission Web · Office 2016 Fluent Ribbon

[![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Transmission RPC](https://img.shields.io/badge/Transmission-RPC%2016%20(3.x%20%2F%204.x)-1b5e20.svg)](https://github.com/transmission/transmission/blob/main/docs/rpc-spec.md)
[![Offline](https://img.shields.io/badge/offline-100%25-0078d4.svg)](#-功能亮点)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight, dependency-free **Transmission Web UI** for routers and low-spec embedded devices.
The interface follows **Microsoft Office 2016 Ribbon** conventions (flat solid colors, tabbed command groups, contextual tab) while keeping the final bundle small enough for router flash storage.

一款为路由器（Padavan / OpenWrt）与低配设备打造的轻量 **Transmission Web 客户端**。
界面采用 **Microsoft Office 2016 Ribbon** 设计语言：纯平色块、选项卡式功能分组、选中任务时出现上下文选项卡，同时保持极小的构建体积与完全离线自治。

---

## ✨ 功能亮点

- **Office 2016 Fluent Ribbon**
  - 顶层 `文件` 菜单 + `任务` / `传输与网络` / `维护工具` / `视图与首选项` 四个选项卡。
  - 选中种子后动态出现 `种子设置` 上下文选项卡（琥珀色顶栏标识），集中放置优先级、独立限速、做种停止规则、重命名/移动目录等属性。
  - 所有下拉菜单通过 `Teleport` 挂载到 `body`，不被 Ribbon 的 `overflow` 裁剪；支持点击空白处、按 `Esc` 关闭。
- **Office 2016 全屏「文件」菜单（Backstage）**
  - 点击 `文件` 不再是窄下拉菜单，而是打开 Office 2016 风格的全屏 Backstage：左侧深红导航，右侧信息面板。
  - `信息`：实时上下行速度、活动/完成任务数、实时速度曲线与快捷操作。
  - `统计`：类似 BiglyBT 的实时下载/上传速度面积图（最近 6 分钟），以及本次会话 / 历史累计统计和任务构成。
  - `关于`：Web UI / Transmission 核心 / RPC 版本、离线状态、MIT 协议与仓库入口。
- **批量标签（Batch Labels）**
  - 多选种子后一次性追加 / 覆盖 / 清空标签；相同标签集合自动合并为单次 `torrent-set`，结束后只刷新一次列表。
- **真正的即时反馈（Optimistic Update + Confirm）**
  - 暂停 / 开始 / 立即开始 / 校验 / 删除会在本地立即改变状态。
  - 新增「服务端确认保护层」：RPC 返回后若快照仍是旧状态，不会把刚点下的暂停冲回「正在做种」，消除数秒抖动。
- **可调节的详情面板**
  - 详情面板默认高度更宽裕，可拖拽顶部手柄自由调整；标题栏左侧箭头在「紧凑 / 展开」之间切换，右侧 X 才真正关闭。
  - 文件树目录行的大小与进度由子文件聚合得出，不再显示无意义的 `0 B / 0%`。
  - 文件树与种子列表同样铺满两端，勾选行使用统一的 Fluent 选中色；高/低优先级文件在左侧和下拉框中有独立颜色。
  - 支持对已勾选（要下载）的文件**批量设置优先级**。
  - 详情页「扩展信息」展示元数据完成度、私有种子、传输停滞、文件数量与连接上限。
- **更多 RPC 信息**
  - 统计页通过 `free-space` 显示下载目录可用空间（Transmission 4.x 还会显示总容量与使用进度条）。
  - 节点页按 Tracker / DHT / PEX / LPD / LTEP / 入站 / 缓存 / 打洞 展示 Peer 来源。
  - 会话统计补充 `filesAdded` 与 `sessionCount`；种子表新增「元数据」「停滞」可选列。
- **Tracker 状态与校验**
  - Tracker 结果在本地解析并着色：成功绿色、连接失败/访问拒绝红色、HTTP 429 等限流黄色、等待宣告灰色。
  - 支持 `Could not connect to tracker`、`Connection failed`、`access denied`、`HTTP 401/403/429/5xx` 等常见结果。
  - 校验本地数据前增加 Fluent 确认框，避免误触暂停传输。
- **完整 Fluent 对话框，零原生弹窗**
  - 添加、属性、首选项、重命名、移动目录、删除确认、统计、关于、批量标签、Tracker 增删全部为应用内对话框。
  - 支持 `Esc` 关闭、自动聚焦输入框、危险操作二次确认、成功/失败 Toast（不同图标与颜色）。
- **全量离线图标**
  - 80+ 个 Microsoft Fluent System Icons 24 Regular 矢量路径内联在 `FluentIcon.vue` 中，**0 外部字体、0 外部图标、0 CDN 请求**。
- **三语国际化**
  - 简体中文 / English / Русский，所有新增文案、Toast、单位与时间格式均同步维护；缺失键自动回退英文。
- **桌面与移动端**
  - 桌面端为可排序、可拖拽列宽、可自定义显示列的表格，内置 30+ 个来自 Transmission RPC 的字段（已下载/上传、剩余、有效数据、添加/完成/活动时间、做种/下载时长、优先级、保存路径、标签、哈希、限速、错误信息等）。
  - 移动端自动切换为卡片视图 + 抽屉侧栏 + 紧凑工具栏。
  - 支持浅色 / 深色主题、轮询频率调节、会话统计、Tracker / 标签侧栏分组。
- **轻量且无重型依赖**
  - 运行时仅依赖 Vue 3；无 UI 组件库、无图标库、无状态管理库。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与本地联调

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。开发服务器会把 `/transmission` 反向代理到路由器，并自动注入 HTTP Basic Auth，避免浏览器 401 弹窗。

`.env.local` 可用变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `TRANSMISSION_HOST` | `192.168.2.1` | 路由器 Transmission RPC 主机 |
| `TRANSMISSION_PORT` | `9091` | RPC 端口 |
| `TRANSMISSION_USER` | `admin` | Basic Auth 用户名（留空则不注入） |
| `TRANSMISSION_PASS` | `admin` | Basic Auth 密码 |

> 也兼容 `VITE_ROUTER_HOST` / `VITE_ROUTER_PORT` / `VITE_ROUTER_USER` / `VITE_ROUTER_PASS` 旧变量名。

### 生产构建

```bash
npm run build
```

构建由 `vue-tsc && vite build` 驱动，产物输出到 `dist/`。当前约：

| 文件 | 原始 | gzip |
| --- | --- | --- |
| `index.html` | 1.1 kB | 0.6 kB |
| `assets/index-*.css` | 100 kB | 15.2 kB |
| `assets/index-*.js` | 363 kB | 109 kB |

`base: './'` 使产物可以部署在任意子路径（如 `/transmission/web/`）下。

---

## 📦 部署到路由器

将 `dist/` 内所有文件上传并替换 Transmission 的 Web 目录：

- **Padavan**：`/usr/share/transmission/web/`
- **OpenWrt**：`/usr/share/transmission/web/`

也可以把 `dist/` 同步到 `/tmp` 后 `mount --bind` 做无损热更新，无需重启 Transmission。

---

## 🧱 项目结构

```text
transmission-web-md1/
├── index.html                     # 入口，内联 favicon，无外部字体
├── vite.config.ts                 # 开发代理 / Basic Auth / 版本号注入
├── .env.example                   # 本地联调环境变量样例
├── src/
│   ├── main.ts                    # 应用入口，全局注册 FluentIcon / TransmissionLogo / Ripple
│   ├── api/
│   │   ├── rpc.ts                 # Transmission JSON-RPC（含 409 session-id 握手）
│   │   └── types.ts               # 全量 RPC 类型契约
│   ├── stores/
│   │   └── transmission.ts        # 全局状态、轮询、过滤排序、乐观更新、对话框/Toast 控制
│   ├── components/
│   │   ├── AppBar.vue             # Office 2016 Ribbon、上下文选项卡、文件菜单入口、移动端工具条
│   │   ├── FileBackstage.vue      # Office 2016 全屏「文件」菜单：信息 / 统计 / 关于 / 快捷操作
│   │   ├── SpeedChart.vue         # BiglyBT 风格实时上下行速度面积图（SVG）
│   │   ├── Drawer.vue             # 状态过滤、标签/Tracker 分组、会话统计
│   │   ├── TorrentTable.vue       # 桌面端表格：排序、列宽拖拽、列显隐、右键菜单
│   │   ├── TorrentCard.vue        # 移动端卡片视图
│   │   ├── TorrentDetail.vue      # 可调高度的详情抽屉：概览、文件树、Peers、Trackers
│   │   ├── FileTree.vue           # 可折叠文件树，目录大小/进度由子文件聚合
│   │   ├── BatchTagsDialog.vue    # 批量标签对话框
│   │   ├── FluentActionDialogs.vue# 重命名/移动目录/删除确认/通用 Prompt+Confirm/Toast
│   │   ├── AddDialog.vue          # 添加种子
│   │   ├── SessionDialog.vue      # Transmission 全局首选项
│   │   ├── TorrentPropsDialog.vue # 单任务属性
│   │   ├── FluentIcon.vue         # Fluent System Icons 24 Regular 矢量字典
│   │   └── TransmissionLogo.vue   # Transmission 官方变速杆 Logo（纯 SVG）
│   ├── composables/
│   │   └── useEscapeKey.ts        # 统一 Esc 关闭行为
│   ├── locales/                   # zh-CN / en-US / ru-RU
│   └── styles/
│       ├── md1.css                # 设计令牌（Fluent + Office 2016 色板）
│       └── ripple.ts              # Material Ripple 指令
```

> 目录名与 `md1.css` 保留了项目早期的 Material Design 1 历史命名；当前视觉规范已统一为 Fluent / Office 2016。

---

## 🎨 设计令牌

| Token | Light | Dark | 用途 |
| --- | --- | --- | --- |
| `--ribbon-header-bg` | `#b71c1c` | `#222222` | Office 标题栏 / 选项卡背景 |
| `--ribbon-header-tab-active-bg` | `#ffffff` | `#2c2c2c` | 激活选项卡 |
| `--ribbon-contextual-border` | `#ffb300` | `#ffa000` | 上下文选项卡顶部指示条 |
| `--fluent-accent` | `#0078d4` | `#2886de` | 选中、链接、主按钮 |
| `--fluent-bg-canvas` | `#ffffff` | `#2c2c2c` | 内容画布 |
| `--fluent-bg-subtle` | `#f3f3f3` | `#202020` | 表头 / 分组背景 |

所有颜色均通过 CSS 变量切换，主题跟随 `data-theme="dark"`。

---

## 🌐 国际化约定

- 新增任何界面文案时，必须同步更新 `src/locales/zh-CN.ts`、`en-US.ts`、`ru-RU.ts`。
- 动态占位符使用 `{name}` 形式，`t(key, params)` 会统一替换。
- 时间、速率、容量单位使用 `common.day` / `common.hour` / `common.min` / `common.sec` 等现有键，禁止硬编码英文。
- Toast 统一使用 `toast.*` 命名空间，并按 `success` / `error` / `info` 传入类型。

---

## 🔌 Transmission RPC 兼容性

- 支持 Transmission 3.x / 4.x 的 JSON-RPC（RPC 版本 16）。
- 首次请求会收到 `409 Conflict`，客户端自动读取 `X-Transmission-Session-Id` 并重试。
- 长任务（校验、移动目录）通过轮询同步；短任务使用乐观更新 + 服务端确认保护。

---

## 📄 License

[MIT](LICENSE) © 2026 Mightnire
