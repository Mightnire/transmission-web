# 架构与 RPC 可行性（transmission-web-md1）

本文档记录两件事：

1. 剩余 Transmission RPC 能力的**可行性、版本限制与优先级**；
2. 项目从“单文件巨型组件 + 单 store”拆分为领域模块的**目标结构与迁移顺序**。

当前视觉基线仍是 Fluent / Office 2016 Ribbon（见 `AGENTS.md`）。BiglyBT 只作为**信息密度与交互模式**的参考，不在未确认的情况下直接替换整套外壳。

---

## 1. RPC 能力可行性矩阵

图例：

- ✅ 已接入
- 🟢 3.07 可用，建议接入
- 🟡 可用，但有性能 / 版本 / 交互成本
- 🔴 3.07 不支持或会返回误导性默认值
- ⛔ 破坏性操作，默认不做

| 能力 | RPC 字段 / 方法 | 3.07 | 成本 | 建议 |
|---|---|---|---|---|
| 区块完成位图 | `pieces` | ✅ | 低 | 已有「区块映射」，3.07 可用 |
| 区块可用副本 | `availability` | 🟡 | 低 | 4.x 可用；3.07 返回空数组，界面显示“未提供”而不是 0 |
| 逐文件优先级 | `priorities` / `fileStats.priority` | ✅ | 低 | 已用于文件树 |
| 逐文件下载选择 | `wanted` / `fileStats.wanted` | ✅ | 低 | 已用于文件树勾选 |
| Peer 字节数 | `peers[].bytesToClient` / `bytesToPeer` | ✅ | 低 | 已加列 |
| Peer 加密 / 入站 / uTP | `isEncrypted` / `isIncoming` / `isUTP` | ✅ | 低 | 加密/方向已加列，uTP 已有协议列 |
| Peer ID / Holepunch | `peerId` / `supportsHolepunch` | 🟡 | 低 | 3.07 不保证返回；先探测再显示 |
| Tracker 高级状态 | `trackerStats[].sitename`、`lastAnnounceTime`、`nextAnnounceTime`、`downloaderCount`、`lastScrapeResult` | 🟢 | 中 | 建议做成可选列/详情，不占默认宽度 |
| Web Seed 明细 | `webseeds[]`（旧）/ `webseedsEx[]`（新） | 🟡 | 中 | 3.07 用旧字段；新字段先探测 |
| 诊断元数据 | `desiredAvailable`、`haveUnchecked`、`etaIdle`、`dateCreated`、`editDate`、`torrentFile`、`trackerList` | 🟢 | 低 | 放「扩展信息」，不占主表 |
| 剩余可用空间 | `free-space` | ✅ | 低 | 已接入；3.07 无 `total_size`，4.x 才有总容量/进度条 |
| 会话统计 | `session-stats` 的 `filesAdded` / `sessionCount` | ✅ | 低 | 已接入 |
| 端口连通测试 | `port-test` | 🟢 | 中 | 按需点击，不能轮询；失败时给可操作诊断 |
| 黑名单更新 / 数量 | `blocklist-update` | 🟢 | 中 | 按需执行，避免每次打开页面触发下载 |
| 会话诊断 | `session-get` 的 DHT/PEX/LPD/uTP/加密/peer-port/rpc-version | 🟢 | 低 | 适合做成「网络诊断」卡片 |
| 带宽分组 | `group-get` / `group-set` | 🟡 | 中 | 版本相关；3.07 先探测，缺失则隐藏 |
| 远程关闭 | `session-close` | ⛔ | 低 | 破坏性，除非明确要求，不放入 UI |
| 表格格式 | `torrent-get format: "table"` | 🟡 | 低 | 4.x 优先；3.07 先探测，兼容对象格式 |
| 增量更新 | `ids: "recently-active"` + `removed` | 🟡 | 中 | 任务多时收益大，但要处理删除/排序/详情缓存 |
| 逐块状态 | 无（RPC 只到 piece 级） | 🔴 | — | 不能伪造 BiglyBT 的 block 请求状态 |
| 分组 / MIME / 文件数 | `group` / `primary-mime-type` / `fileCount` | 🔴 | — | 3.07 返回 0；不要展示成 0 |
| 顺序下载 | `sequentialDownload` | 🔴 | — | 3.07 返回 0；4.x 再接入 |

### 推荐落地顺序

1. **Tracker 高级信息**：先只读，按需展开，避免表格继续变宽。
2. **网络诊断卡片**：端口测试、DHT/PEX/LPD/uTP、加密、黑名单，失败时给操作入口。
3. **Web Seed 明细**：详情页独立列表，显示 URL、速率、状态。
4. **增量轮询**：先做 feature detect，再按任务规模切换；保留全量轮询兜底。
5. **端口/黑名单操作**：必须用户点击触发，并显示进度与结果。

---

## 2. 当前模块结构（Phase 1 已完成）

```text
src/
├─ api/
│  ├─ rpc.ts                 # JSON-RPC 传输 + 字段清单
│  └─ types.ts               # RPC 类型
├─ core/
│  ├─ columns.ts             # 表格列定义 / 持久化 / 迁移
│  └─ format.ts              # 容量、速度、ETA、状态文本
├─ components/
│  ├─ common/                # FluentIcon、Logo
│  ├─ layout/                # AppBar、Drawer、TorrentList
│  ├─ torrent/               # TorrentTable、TorrentDetail、FileTree、PieceMap、TorrentCard
│  ├─ backstage/             # FileBackstage、SpeedChart
│  └─ dialogs/               # Add / Session / Props / BatchTags / FluentActionDialogs
├─ stores/
│  └─ transmission.ts        # 兼容门面，继续导出既有 API
├─ locales/                  # zh-CN / en-US / ru-RU
└─ styles/
```

`stores/transmission.ts` 仍是较大的兼容门面，目的是保证现有组件不需一次性改 import；后续逐步把领域逻辑搬到 `src/modules/`。

---

## 3. 目标模块结构（Phase 2–4）

```text
src/
├─ modules/
│  ├─ torrents/
│  │  ├─ state.ts            # 列表、选择、过滤、排序
│  │  ├─ polling.ts          # 轮询、增量更新、详情刷新
│  │  ├─ actions.ts          # 开始/暂停/删除/校验/位置
│  │  ├─ selectors.ts        # filteredTorrents、统计
│  │  └─ columns.ts          # 复用 core/columns
│  ├─ session/
│  │  ├─ state.ts            # session/stats/偏好
│  │  ├─ diagnostics.ts      # 端口、DHT、黑名单
│  │  └─ actions.ts
│  ├─ files/
│  │  ├─ tree.ts             # 树构建、折叠、聚合
│  │  ├─ selection.ts        # 独立多选
│  │  └─ actions.ts          # wanted / priority / rename
│  ├─ peers/
│  ├─ trackers/
│  └─ pieces/
├─ components/               # 只做展示与交互，不放 RPC 细节
└─ core/                     # 纯工具、格式化、存储、常量
```

### 迁移顺序

| 阶段 | 内容 | 风险 |
|---|---|---|
| Phase 1 ✅ | 组件按领域分目录；抽出 `core/format`、`core/columns` | 低 |
| Phase 2 | 拆 `stores/transmission.ts`：state / polling / actions / selectors | 中 |
| Phase 3 | 拆 `AppBar.vue`：Ribbon 各标签页、菜单、移动工具条 | 中高 |
| Phase 4 | 拆 `TorrentDetail.vue`：General / Peers / Trackers / 文件 / 区块 | 中 |
| Phase 5 | 拆 `FileBackstage.vue`：Info / Stats / About | 中 |

每一步都保留 `stores/transmission.ts` 门面导出，避免大面积改组件 import；拆完后再逐步让组件直接引用领域模块。

---

## 4. UI 方向：效率优先，但不盲目换壳

BiglyBT 值得借鉴的是**信息密度和操作路径**，不是它的 SWT 外观：

- 顶部命令区更矮；常用动作（添加、开始、暂停、删除、搜索）始终可见。
- 表格行更紧凑，列可配置，详情用标签页而不是层层弹窗。
- 文件树：勾选（下载）与行选择（批量操作）分离；右键菜单集中操作。
- 区块图：piece 级热力图 + 图例 + 悬停详情。

界面已先做 **OneNote 风格单行 Ribbon**：命令区从 94px 压到 46px，宽屏保留文字，窄屏按断点折叠为纯图标。下一步可以在其之上做 **Compact Density**：

1. 保留 Office Ribbon，但压缩分组标题、按钮高度和表格行高（约 10–15% 垂直空间）。
2. 增加一个持久化的「紧凑密度」开关，默认关闭，避免破坏已验收布局。
3. 如果确认要完全改成 BiglyBT 式“菜单 + 工具栏 + 左侧库 + 底部详情”，需要同步修改 `AGENTS.md` 的视觉规范，并作为独立里程碑实施，不能与 RPC 功能混在一起。

当前不建议直接替换 Ribbon：大量批量操作、列设置、会话设置都挂在 Ribbon 上，直接换壳会造成功能入口缺失。

---

## 5. 验收基线

- `npm run build` 通过（`vue-tsc` 严格类型检查）。
- 三语 key 数量一致。
- 不新增常驻“已连接/在线/正常”状态牌。
- 新增 RPC 字段必须先在本机 3.07 上探测；不支持的字段隐藏，而不是显示 0。
- 大数组（`availability`、`pieces`、`peers`）只在详情打开/对应标签页激活时请求或绘制。
