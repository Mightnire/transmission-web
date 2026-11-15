<template>
  <header class="fluent-ribbon-root" :class="{ 'ribbon-collapsed': isRibbonCollapsed }" @click="closeAllMenus">
    <!-- 1. 顶层：窗口标题与 Fluent Ribbon 选项卡栏 (高度 36px) -->
    <div class="ribbon-header-row">
      <!-- 侧边栏切换按钮 (汉堡菜单) -->
      <button
        class="fluent-tool-btn hamburger-btn"
        @click.stop="state.sidebarOpen = !state.sidebarOpen"
        :title="t('app.toggleSidebar')"
      >
        <span class="material-icons">menu</span>
      </button>

      <!-- 应用标题 / 品牌标识 -->
      <div class="fluent-brand">
        <span class="material-icons brand-icon">cloud_download</span>
        <span class="brand-text">Transmission</span>
      </div>

      <!-- Ribbon 选项卡列表 (桌面端展示) -->
      <nav class="ribbon-tabs desktop-only">
        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tasks' && !isRibbonCollapsed }"
          @click.stop="selectTab('tasks')"
        >
          <span class="material-icons tab-icon">home</span>
          <span>{{ t('ribbon.tabs.tasks') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'queue' && !isRibbonCollapsed }"
          @click.stop="selectTab('queue')"
        >
          <span class="material-icons tab-icon">low_priority</span>
          <span>{{ t('ribbon.tabs.queue') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'bandwidth' && !isRibbonCollapsed }"
          @click.stop="selectTab('bandwidth')"
        >
          <span class="material-icons tab-icon">speed</span>
          <span>{{ t('ribbon.tabs.bandwidth') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tools' && !isRibbonCollapsed }"
          @click.stop="selectTab('tools')"
        >
          <span class="material-icons tab-icon">build</span>
          <span>{{ t('ribbon.tabs.tools') }}</span>
        </button>
      </nav>

      <!-- 右侧：系统状态与快捷工具 -->
      <div class="ribbon-sys-tools">
        <!-- 实时全局速率胶囊 -->
        <div class="speed-capsule" :title="`${t('toolbar.downloadSpeed', { speed: formatSpeed(state.stats?.downloadSpeed) })} | ${t('toolbar.uploadSpeed', { speed: formatSpeed(state.stats?.uploadSpeed) })}`">
          <span class="speed-part down">
            <span class="material-icons">arrow_downward</span>
            {{ formatSpeed(state.stats?.downloadSpeed) }}
          </span>
          <span class="speed-part up">
            <span class="material-icons">arrow_upward</span>
            {{ formatSpeed(state.stats?.uploadSpeed) }}
          </span>
        </div>

        <!-- 乌龟临时限速开关 -->
        <button
          class="fluent-tool-btn"
          :class="{ 'btn-active-turtle': state.session?.['alt-speed-enabled'] }"
          @click="toggleTurtleMode"
          :title="t('toolbar.turtle')"
        >
          <span class="material-icons">speed</span>
        </button>

        <!-- 全局首选项 -->
        <button class="fluent-tool-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
          <span class="material-icons">settings</span>
        </button>

        <!-- 主题切换 -->
        <button class="fluent-tool-btn" @click="toggleTheme" :title="t('app.toggleTheme')">
          <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <!-- 语言选择 -->
        <div class="fluent-lang-select">
          <select :value="currentLocale" @change="onLocaleChange">
            <option value="zh-CN">简中</option>
            <option value="en-US">EN</option>
            <option value="ru-RU">RU</option>
          </select>
        </div>

        <!-- Ribbon 展开/折叠图钉按钮 (支持 Ctrl+F1) -->
        <button
          class="fluent-tool-btn toggle-ribbon-btn desktop-only"
          @click="toggleRibbonCollapse"
          :title="isRibbonCollapsed ? t('ribbon.expand') : t('ribbon.collapse')"
        >
          <span class="material-icons">{{ isRibbonCollapsed ? 'expand_more' : 'expand_less' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. 第二层：Fluent 功能区画板 (Ribbon Command Canvas) -->
    <div class="ribbon-body desktop-only" v-show="!isRibbonCollapsed">
      <!-- 2.1 任务标签页 (Tasks) -->
      <div class="ribbon-tab-pane" v-if="currentTab === 'tasks'">
        <!-- 基础操作组 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 添加任务 (大按钮) -->
            <button class="fluent-btn-large primary-btn" @click="state.addDialogOpen = true" :title="t('toolbar.addTitle')">
              <span class="material-icons large-icon">add_circle</span>
              <span class="btn-caption">{{ t('toolbar.add') }}</span>
            </button>

            <!-- 开始 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn"
                :disabled="state.torrents.length === 0"
                @click="handleStart"
                :title="hasSelection ? t('toolbar.start') : t('toolbar.startAll')"
              >
                <span class="material-icons text-success">play_arrow</span>
                <span>{{ hasSelection ? t('toolbar.start') : t('toolbar.startAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('start')"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
              <!-- 下拉浮动菜单 -->
              <div class="fluent-dropdown-menu" v-if="menus.start">
                <div class="menu-opt" @click="handleStartAll">
                  <span class="material-icons">fast_forward</span>
                  <span>{{ t('toolbar.startAll') }}</span>
                </div>
                <div class="menu-opt" :class="{ disabled: !hasSelection }" @click="handleStartNow">
                  <span class="material-icons">bolt</span>
                  <span>{{ t('ribbon.startNow') }}</span>
                </div>
              </div>
            </div>

            <!-- 暂停 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn"
                :disabled="state.torrents.length === 0"
                @click="handleStop"
                :title="hasSelection ? t('toolbar.pause') : t('toolbar.pauseAll')"
              >
                <span class="material-icons text-warning">pause</span>
                <span>{{ hasSelection ? t('toolbar.pause') : t('toolbar.pauseAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('stop')"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
              <div class="fluent-dropdown-menu" v-if="menus.stop">
                <div class="menu-opt" @click="handleStopAll">
                  <span class="material-icons">pause_circle_outline</span>
                  <span>{{ t('toolbar.pauseAll') }}</span>
                </div>
              </div>
            </div>

            <!-- 删除 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn btn-danger"
                :disabled="!hasSelection"
                @click="handleRemove(false)"
                :title="t('toolbar.deleteTitle')"
              >
                <span class="material-icons text-danger">delete</span>
                <span>{{ t('toolbar.delete') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="!hasSelection"
                @click.stop="toggleMenu('delete')"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
              <div class="fluent-dropdown-menu" v-if="menus.delete">
                <div class="menu-opt text-danger" @click="handleRemove(true)">
                  <span class="material-icons">delete_forever</span>
                  <span>{{ t('ribbon.deleteWithData') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.basic') }}</div>
        </div>

        <!-- 校验与链接组 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 重新校验 -->
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="verifySelected"
              :title="t('toolbar.verifyTitle')"
            >
              <span class="material-icons">check_circle_outline</span>
              <span>{{ t('toolbar.verify') }}</span>
            </button>

            <!-- 复制磁链 -->
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="copyMagnet"
              :title="t('menu.copyMagnet')"
            >
              <span class="material-icons">link</span>
              <span>{{ t('menu.copyMagnet') }}</span>
            </button>

            <!-- 任务属性 -->
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="openProps"
              :title="t('ribbon.props')"
            >
              <span class="material-icons">tune</span>
              <span>{{ t('ribbon.props') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.data') }}</div>
        </div>

        <!-- 视图与快速搜索组 -->
        <div class="ribbon-group search-group">
          <div class="ribbon-controls">
            <!-- 详情面板切换 -->
            <button
              class="fluent-btn-small"
              :class="{ 'btn-selected': state.detailOpen }"
              @click="state.detailOpen = !state.detailOpen"
              :title="t('toolbar.detailTitle')"
            >
              <span class="material-icons">vertical_split</span>
              <span>{{ t('toolbar.detail') }}</span>
            </button>

            <!-- Fluent 极简搜索框 -->
            <div class="fluent-search-box">
              <span class="material-icons search-ico">search</span>
              <input
                type="text"
                class="fluent-search-input"
                :placeholder="t('app.searchPlaceholder')"
                v-model="state.filter.search"
              />
              <span
                class="material-icons clear-ico"
                v-if="state.filter.search"
                @click="state.filter.search = ''"
              >close</span>
            </div>
          </div>
          <div class="group-title">{{ t('sidebar.filters') }}</div>
        </div>
      </div>

      <!-- 2.2 队列与调度标签页 (Queue) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'queue'">
        <!-- 队列排序 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('top')"
              title="Move to Top"
            >
              <span class="material-icons">vertical_align_top</span>
              <span>{{ t('menu.moveTop') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('up')"
              title="Move Up"
            >
              <span class="material-icons">arrow_upward</span>
              <span>{{ t('menu.moveUp') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('down')"
              title="Move Down"
            >
              <span class="material-icons">arrow_downward</span>
              <span>{{ t('menu.moveDown') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('bottom')"
              title="Move to Bottom"
            >
              <span class="material-icons">vertical_align_bottom</span>
              <span>{{ t('menu.moveBottom') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.queueOrder') }}</div>
        </div>

        <!-- 调度执行 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="handleStartNow"
              :title="t('ribbon.startNow')"
            >
              <span class="material-icons text-warning">bolt</span>
              <span>{{ t('ribbon.startNow') }}</span>
            </button>

            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="handleReannounce"
              :title="t('ribbon.reannounce')"
            >
              <span class="material-icons">sync</span>
              <span>{{ t('ribbon.reannounce') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.exec') }}</div>
        </div>
      </div>

      <!-- 2.3 限速与做种规则标签页 (Bandwidth) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'bandwidth'">
        <!-- 乌龟临时限速模式 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-large"
              :class="{ 'btn-active-turtle': state.session?.['alt-speed-enabled'] }"
              @click="toggleTurtleMode"
              :title="t('toolbar.turtle')"
            >
              <span class="material-icons large-icon">speed</span>
              <span class="btn-caption">{{ t('toolbar.turtle') }}</span>
            </button>

            <div class="turtle-info-card" v-if="state.session">
              <div class="turtle-rate">⬇ {{ state.session['alt-speed-down'] }} KB/s</div>
              <div class="turtle-rate">⬆ {{ state.session['alt-speed-up'] }} KB/s</div>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.turtle') }}</div>
        </div>

        <!-- 优先级快速分配 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="setPriority(1)"
              :title="t('ribbon.highPriority')"
            >
              <span class="material-icons text-danger">priority_high</span>
              <span>{{ t('ribbon.highPriority') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="setPriority(0)"
              :title="t('ribbon.normalPriority')"
            >
              <span class="material-icons">remove</span>
              <span>{{ t('ribbon.normalPriority') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="setPriority(-1)"
              :title="t('ribbon.lowPriority')"
            >
              <span class="material-icons text-secondary">arrow_downward</span>
              <span>{{ t('ribbon.lowPriority') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.rules') }}</div>
        </div>
      </div>

      <!-- 2.4 维护与工具标签页 (Tools) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'tools'">
        <!-- 存储与重命名 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="handleSetLocation"
              :title="t('ribbon.setLocation')"
            >
              <span class="material-icons">folder_open</span>
              <span>{{ t('ribbon.setLocation') }}</span>
            </button>

            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="handleRename"
              :title="t('ribbon.rename')"
            >
              <span class="material-icons">edit</span>
              <span>{{ t('ribbon.rename') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.location') }}</div>
        </div>

        <!-- 系统与首选项 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="fluent-btn-small" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <span class="material-icons">settings</span>
              <span>{{ t('toolbar.settings') }}</span>
            </button>

            <button class="fluent-btn-small" @click="fetchTorrents" title="Refresh">
              <span class="material-icons">refresh</span>
              <span>{{ t('common.verify') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.system') }}</div>
        </div>
      </div>
    </div>

    <!-- 3. 移动端紧凑工具条 (仅屏幕 < 768px 显示) -->
    <div class="mobile-compact-bar mobile-only">
      <button class="fluent-btn-mobile" @click="state.addDialogOpen = true">
        <span class="material-icons">add</span>
      </button>
      <button class="fluent-btn-mobile" @click="handleStart">
        <span class="material-icons text-success">play_arrow</span>
      </button>
      <button class="fluent-btn-mobile" @click="handleStop">
        <span class="material-icons text-warning">pause</span>
      </button>
      <button class="fluent-btn-mobile" :disabled="!hasSelection" @click="handleRemove(false)">
        <span class="material-icons text-danger">delete</span>
      </button>
      <div class="mobile-search-wrap">
        <input
          type="text"
          class="mobile-search-input"
          :placeholder="t('app.searchPlaceholder')"
          v-model="state.filter.search"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import {
  state,
  formatSpeed,
  toggleTurtleMode,
  startSelected,
  stopSelected,
  verifySelected,
  removeSelected,
  openTorrentProps,
  fetchTorrents,
} from '../stores/transmission';
import { rpc } from '../api/rpc';
import { t, currentLocale, setLocale, LocaleKey } from '../locales';

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');
const currentTab = ref<'tasks' | 'queue' | 'bandwidth' | 'tools'>('tasks');
const isRibbonCollapsed = ref(localStorage.getItem('ribbon_collapsed') === 'true');

// 下拉菜单浮层状态
const menus = reactive({
  start: false,
  stop: false,
  delete: false,
});

function closeAllMenus() {
  menus.start = false;
  menus.stop = false;
  menus.delete = false;
}

function toggleMenu(type: 'start' | 'stop' | 'delete') {
  const current = menus[type];
  closeAllMenus();
  menus[type] = !current;
}

const hasSelection = computed(() => {
  return state.selectedIds.length > 0 || state.selectedId !== null;
});

const selectedTorrentId = computed(() => {
  if (state.selectedId !== null) return state.selectedId;
  if (state.selectedIds.length > 0) return state.selectedIds[0];
  return null;
});

function selectTab(tab: 'tasks' | 'queue' | 'bandwidth' | 'tools') {
  if (currentTab.value === tab && !isRibbonCollapsed.value) {
    // 已经选中同一个 Tab 时不处理
    return;
  }
  currentTab.value = tab;
  if (isRibbonCollapsed.value) {
    isRibbonCollapsed.value = false;
    localStorage.setItem('ribbon_collapsed', 'false');
  }
}

function toggleRibbonCollapse() {
  isRibbonCollapsed.value = !isRibbonCollapsed.value;
  localStorage.setItem('ribbon_collapsed', String(isRibbonCollapsed.value));
}

// 快捷键 Ctrl+F1 折叠/展开
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'F1') {
    e.preventDefault();
    toggleRibbonCollapse();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 操作函数
function handleStart() {
  closeAllMenus();
  if (hasSelection.value) {
    startSelected();
  } else {
    handleStartAll();
  }
}

function handleStartAll() {
  closeAllMenus();
  const allIds = state.torrents.map((t) => t.id);
  if (allIds.length > 0) rpc.startTorrents(allIds);
}

async function handleStartNow() {
  closeAllMenus();
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.torrentStartNow(ids);
  await fetchTorrents();
}

function handleStop() {
  closeAllMenus();
  if (hasSelection.value) {
    stopSelected();
  } else {
    handleStopAll();
  }
}

function handleStopAll() {
  closeAllMenus();
  const allIds = state.torrents.map((t) => t.id);
  if (allIds.length > 0) rpc.stopTorrents(allIds);
}

function handleRemove(trashData = false) {
  closeAllMenus();
  const count = state.selectedIds.length > 0 ? state.selectedIds.length : (state.selectedId ? 1 : 0);
  if (count === 0) return;
  const msg = trashData
    ? t('menu.confirmRemoveData', { count })
    : t('toolbar.confirmDelete', { count });
  if (confirm(msg)) {
    removeSelected(trashData);
  }
}

function copyMagnet() {
  if (!selectedTorrentId.value) return;
  const tId = selectedTorrentId.value;
  const target = state.torrents.find((t) => t.id === tId);
  if (target?.magnetLink) {
    navigator.clipboard.writeText(target.magnetLink);
    alert(t('menu.magnetCopied'));
  } else {
    rpc.getTorrentDetail(tId).then((d) => {
      if (d?.magnetLink) {
        navigator.clipboard.writeText(d.magnetLink);
        alert(t('menu.magnetCopied'));
      }
    });
  }
}

function openProps() {
  if (selectedTorrentId.value) {
    openTorrentProps(selectedTorrentId.value);
  }
}

async function moveQueue(action: 'top' | 'up' | 'down' | 'bottom') {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  if (action === 'top') await rpc.queueMoveTop(ids);
  if (action === 'up') await rpc.queueMoveUp(ids);
  if (action === 'down') await rpc.queueMoveDown(ids);
  if (action === 'bottom') await rpc.queueMoveBottom(ids);
  await fetchTorrents();
}

async function handleReannounce() {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.torrentReannounce(ids);
  alert(t('ribbon.reannounce') + ': OK');
}

async function setPriority(pri: number) {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  for (const id of ids) {
    await rpc.torrentSet({ ids: [id], bandwidthPriority: pri });
  }
  await fetchTorrents();
}

async function handleSetLocation() {
  if (!selectedTorrentId.value) return;
  const id = selectedTorrentId.value;
  const curT = state.torrents.find((t) => t.id === id);
  const newLoc = prompt(t('menu.promptLocation'), curT?.downloadDir || '/mnt');
  if (newLoc && newLoc !== curT?.downloadDir) {
    const moveData = confirm(t('menu.confirmMoveData'));
    await rpc.torrentSetLocation([id], newLoc, moveData);
    await fetchTorrents();
  }
}

async function handleRename() {
  if (!selectedTorrentId.value) return;
  const id = selectedTorrentId.value;
  const curT = state.torrents.find((t) => t.id === id);
  if (!curT) return;
  const newName = prompt(t('menu.promptRename'), curT.name);
  if (newName && newName !== curT.name) {
    try {
      await rpc.torrentRenamePath(id, curT.name, newName);
      await fetchTorrents();
    } catch (e: any) {
      alert(t('menu.renameFailed', { error: e.message }));
    }
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  const val = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', val);
  localStorage.setItem('theme', val);
}

function onLocaleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  setLocale(target.value as LocaleKey);
}
</script>

<style scoped>
/* Fluent Ribbon Root 架构 */
.fluent-ribbon-root {
  background-color: var(--fluent-bg-subtle);
  border-bottom: 1px solid var(--fluent-border-subtle);
  display: flex;
  flex-direction: column;
  user-select: none;
  position: relative;
  z-index: 100;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 1. 标题与 Tab 行 (高度 36px) */
.ribbon-header-row {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.fluent-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}

.brand-icon {
  font-size: 20px;
  color: var(--fluent-accent);
}

.brand-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary);
  letter-spacing: 0.01em;
}

/* Fluent 选项卡导航 */
.ribbon-tabs {
  display: flex;
  height: 100%;
  gap: 2px;
  flex: 1;
}

.ribbon-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  height: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  transition: all 0.15s ease;
}

.ribbon-tab-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.ribbon-tab-btn.active {
  color: var(--fluent-accent);
  border-bottom-color: var(--fluent-accent);
  background-color: var(--fluent-bg-canvas);
  font-weight: 600;
}

.tab-icon {
  font-size: 15px;
}

/* 右侧系统工具 */
.ribbon-sys-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.speed-capsule {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--fluent-bg-hover);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: monospace;
}

.speed-part {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.speed-part.down { color: var(--md-info); }
.speed-part.up { color: var(--md-success); }
.speed-part .material-icons { font-size: 13px; }

.fluent-tool-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--fluent-radius);
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-tool-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.fluent-tool-btn .material-icons {
  font-size: 18px;
}

.btn-active-turtle {
  background-color: rgba(255, 152, 0, 0.15) !important;
  color: #ef6c00 !important;
}

.fluent-lang-select select {
  background: transparent;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  color: var(--md-text-primary);
  font-size: 11px;
  padding: 2px 4px;
  outline: none;
  cursor: pointer;
}

/* 2. 第二层：Ribbon 命令画板 (高度 72px) */
.ribbon-body {
  height: 72px;
  background-color: var(--fluent-bg-canvas);
  display: flex;
  padding: 4px 10px;
  overflow-x: auto;
  overflow-y: hidden;
}

.ribbon-tab-pane {
  display: flex;
  align-items: stretch;
  gap: 8px;
  height: 100%;
}

/* 磁贴功能组 (Command Group) */
.ribbon-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--fluent-border-divider);
  padding-right: 8px;
  position: relative;
}

.ribbon-group:last-child {
  border-right: none;
}

.ribbon-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.group-title {
  text-align: center;
  font-size: 10px;
  color: var(--md-text-disabled);
  letter-spacing: 0.02em;
  margin-top: 2px;
  white-space: nowrap;
}

/* Fluent 大按钮 (Large Button) */
.fluent-btn-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 52px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 2px;
}

.fluent-btn-large:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-large:active:not(:disabled) {
  transform: scale(0.97);
  background-color: var(--fluent-bg-active);
}

.fluent-btn-large.primary-btn {
  background-color: var(--fluent-accent);
  color: #ffffff;
}

.fluent-btn-large.primary-btn:hover {
  background-color: var(--fluent-accent-hover);
}

.fluent-btn-large .large-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.fluent-btn-large .btn-caption {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* Fluent 分裂按钮 (Split Button) */
.fluent-split-btn {
  display: inline-flex;
  align-items: center;
  height: 52px;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  position: relative;
}

.fluent-split-btn:hover {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.split-main-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-text-primary);
  cursor: pointer;
}

.split-main-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.split-main-btn .material-icons {
  font-size: 20px;
  margin-bottom: 2px;
}

.split-arrow-btn {
  width: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-left: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-secondary);
  cursor: pointer;
}

.split-arrow-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.split-arrow-btn:hover:not(:disabled) {
  background-color: var(--fluent-bg-active);
}

.split-arrow-btn .material-icons {
  font-size: 14px;
}

/* Fluent 下拉浮动菜单 */
.fluent-dropdown-menu {
  position: absolute;
  top: 54px;
  left: 0;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  z-index: 200;
  padding: 4px 0;
}

.menu-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu-opt:hover:not(.disabled) {
  background-color: var(--fluent-bg-hover);
}

.menu-opt.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-opt .material-icons {
  font-size: 16px;
}

/* Fluent 小按钮 (Small Button) */
.fluent-btn-small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.fluent-btn-small:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-small:active:not(:disabled) {
  transform: scale(0.98);
}

.fluent-btn-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fluent-btn-small .material-icons {
  font-size: 16px;
}

.btn-selected {
  background-color: var(--fluent-bg-active) !important;
  border-color: var(--fluent-accent) !important;
  color: var(--fluent-accent) !important;
}

/* Fluent 搜索框 */
.fluent-search-box {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  transition: border-color 0.15s;
}

.fluent-search-box:focus-within {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.fluent-search-input {
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--md-text-primary);
  outline: none;
  width: 140px;
}

.fluent-search-box .search-ico {
  font-size: 16px;
  color: var(--md-text-secondary);
}

.fluent-search-box .clear-ico {
  font-size: 14px;
  cursor: pointer;
  color: var(--md-text-secondary);
}

/* 乌龟卡片微显 */
.turtle-info-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 11px;
  font-family: monospace;
  color: var(--md-text-secondary);
  padding: 0 6px;
  line-height: 1.3;
}

/* 颜色状态类 */
.text-success { color: var(--md-success) !important; }
.text-warning { color: var(--md-warning) !important; }
.text-danger { color: var(--md-error) !important; }
.text-secondary { color: var(--md-text-secondary) !important; }

/* 3. 移动端紧凑模式 */
.mobile-compact-bar {
  display: none;
  height: 48px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background-color: var(--fluent-bg-canvas);
}

.fluent-btn-mobile {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-subtle);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fluent-btn-mobile .material-icons {
  font-size: 20px;
}

.mobile-search-wrap {
  flex: 1;
}

.mobile-search-input {
  width: 100%;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-subtle);
  padding: 0 8px;
  background: transparent;
  color: var(--md-text-primary);
  font-size: 12px;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
}
</style>
