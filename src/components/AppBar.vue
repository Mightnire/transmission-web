<template>
  <header class="md-app-bar">
    <!-- 移动端汉堡菜单 / 桌面端侧边栏切换 -->
    <button class="md-icon-button menu-btn" @click="state.sidebarOpen = !state.sidebarOpen" title="切换分类侧栏" v-ripple>
      <span class="material-icons">menu</span>
    </button>

    <!-- 应用品牌标题 -->
    <div class="brand-zone">
      <span class="material-icons brand-icon">cloud_download</span>
      <h1 class="brand-title">Transmission</h1>
    </div>

    <!-- 桌面端核心操作工具栏 (BiglyBT 风格) -->
    <div class="toolbar-group">
      <!-- 添加种子 -->
      <button class="toolbar-btn primary" @click="state.addDialogOpen = true" title="添加新任务" v-ripple>
        <span class="material-icons">add</span>
        <span class="btn-text">{{ t('common.start') ? '添加' : 'Add' }}</span>
      </button>

      <div class="toolbar-divider"></div>

      <!-- 开始 / 全部开始 -->
      <button
        class="toolbar-btn"
        :disabled="state.torrents.length === 0"
        @click="handleStart"
        :title="hasSelection ? '开始选中的任务' : '全部开始'"
        v-ripple
      >
        <span class="material-icons" style="color: var(--md-success);">play_arrow</span>
        <span class="btn-text">{{ hasSelection ? '开始' : '全部开始' }}</span>
      </button>

      <!-- 暂停 / 全部暂停 -->
      <button
        class="toolbar-btn"
        :disabled="state.torrents.length === 0"
        @click="handleStop"
        :title="hasSelection ? '暂停选中的任务' : '全部暂停'"
        v-ripple
      >
        <span class="material-icons" style="color: var(--md-warning);">pause</span>
        <span class="btn-text">{{ hasSelection ? '暂停' : '全部暂停' }}</span>
      </button>

      <!-- 校验选中的任务 -->
      <button
        class="toolbar-btn"
        :disabled="!hasSelection"
        @click="verifySelected"
        title="重新校验选中任务"
        v-ripple
      >
        <span class="material-icons">check_circle_outline</span>
        <span class="btn-text">校验</span>
      </button>

      <!-- 删除选中的任务 -->
      <button
        class="toolbar-btn danger"
        :disabled="!hasSelection"
        @click="confirmDelete"
        title="删除选中任务"
        v-ripple
      >
        <span class="material-icons" style="color: var(--md-error);">delete</span>
        <span class="btn-text">删除</span>
      </button>

      <div class="toolbar-divider"></div>

      <!-- 底部详情面板折叠开关 -->
      <button
        class="toolbar-btn"
        :class="{ active: state.detailOpen }"
        @click="state.detailOpen = !state.detailOpen"
        title="显示/隐藏下方详细信息"
        v-ripple
      >
        <span class="material-icons">vertical_split</span>
        <span class="btn-text">详情</span>
      </button>
    </div>

    <!-- 紧凑搜索栏 -->
    <div class="search-box">
      <span class="material-icons search-ico">search</span>
      <input
        type="text"
        class="search-ipt"
        :placeholder="t('app.searchPlaceholder')"
        v-model="state.filter.search"
      />
      <span
        class="material-icons clear-ico"
        v-if="state.filter.search"
        @click="state.filter.search = ''"
      >close</span>
    </div>

    <!-- 右侧系统状态与工具组 -->
    <div class="system-actions">
      <!-- 实时全局上下行速度 -->
      <div class="speed-indicator" :title="`下载: ${formatSpeed(state.stats?.downloadSpeed)} | 上传: ${formatSpeed(state.stats?.uploadSpeed)}`">
        <span class="speed-item down">
          <span class="material-icons">arrow_downward</span>
          {{ formatSpeed(state.stats?.downloadSpeed) }}
        </span>
        <span class="speed-item up">
          <span class="material-icons">arrow_upward</span>
          {{ formatSpeed(state.stats?.uploadSpeed) }}
        </span>
      </div>

      <!-- 乌龟限速模式 -->
      <button
        class="md-icon-button"
        :class="{ 'turtle-active': state.session?.['alt-speed-enabled'] }"
        @click="toggleTurtleMode"
        :title="t('app.turtleMode')"
        v-ripple
      >
        <span class="material-icons">speed</span>
      </button>

      <!-- 全局首选项 -->
      <button class="md-icon-button" @click="state.sessionDialogOpen = true" :title="t('app.settings')" v-ripple>
        <span class="material-icons">settings</span>
      </button>

      <!-- 切换主题 -->
      <button class="md-icon-button" @click="toggleTheme" :title="t('app.toggleTheme')" v-ripple>
        <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <!-- 语言切换 -->
      <div class="lang-selector">
        <select :value="currentLocale" @change="onLocaleChange">
          <option value="zh-CN">简中</option>
          <option value="en-US">EN</option>
          <option value="ru-RU">RU</option>
        </select>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  state,
  formatSpeed,
  toggleTurtleMode,
  startSelected,
  stopSelected,
  verifySelected,
  removeSelected,
} from '../stores/transmission';
import { rpc } from '../api/rpc';
import { t, currentLocale, setLocale, LocaleKey } from '../locales';

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');

const hasSelection = computed(() => {
  return state.selectedIds.length > 0 || state.selectedId !== null;
});

function handleStart() {
  if (hasSelection.value) {
    startSelected();
  } else {
    const allIds = state.torrents.map((t) => t.id);
    if (allIds.length > 0) rpc.startTorrents(allIds);
  }
}

function handleStop() {
  if (hasSelection.value) {
    stopSelected();
  } else {
    const allIds = state.torrents.map((t) => t.id);
    if (allIds.length > 0) rpc.stopTorrents(allIds);
  }
}

function confirmDelete() {
  const count = state.selectedIds.length > 0 ? state.selectedIds.length : (state.selectedId ? 1 : 0);
  if (count === 0) return;
  const delFiles = confirm(`确定要移除选中的 ${count} 个任务吗？\n点击【确定】移除任务并保留文件，或按【取消】放弃。`);
  if (delFiles) {
    removeSelected(false);
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
.md-app-bar {
  height: 52px;
  background-color: var(--md-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-shadow: var(--md-shadow-2dp);
  position: relative;
  z-index: 120;
  user-select: none;
  gap: 12px;
}

.brand-zone {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-icon {
  font-size: 22px;
}

.brand-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin: 0;
  white-space: nowrap;
}

/* BiglyBT 桌面工具栏 */
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
}

.toolbar-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar-btn.primary {
  background: var(--md-accent);
  border-color: transparent;
  color: #ffffff;
}

.toolbar-btn.primary:hover:not(:disabled) {
  background: var(--md-accent-dark);
}

.toolbar-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: #ffffff;
}

.toolbar-btn .material-icons {
  font-size: 18px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.25);
  margin: 0 4px;
}

/* 紧凑搜索栏 */
.search-box {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 3px;
  padding: 0 8px;
  height: 32px;
  width: 180px;
  transition: width 0.2s;
}

.search-box:focus-within {
  width: 220px;
  background: rgba(0, 0, 0, 0.28);
}

.search-ico {
  font-size: 16px;
  opacity: 0.7;
  margin-right: 4px;
}

.search-ipt {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 12px;
}

.search-ipt::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.clear-ico {
  font-size: 14px;
  cursor: pointer;
  opacity: 0.7;
}

/* 系统状态组 */
.system-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 8px;
}

.speed-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.18);
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-family: monospace;
}

.speed-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.speed-item.down {
  color: #81c784;
}

.speed-item.up {
  color: #ffb74d;
}

.speed-item .material-icons {
  font-size: 14px;
}

.turtle-active {
  background-color: var(--md-accent) !important;
  color: #ffffff !important;
}

.lang-selector select {
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.lang-selector select option {
  background: var(--md-surface);
  color: var(--md-text-primary);
}

@media (max-width: 900px) {
  .btn-text {
    display: none;
  }
  .search-box {
    width: 130px;
  }
}

@media (max-width: 600px) {
  .toolbar-group {
    display: none;
  }
  .search-box {
    display: none;
  }
}
</style>
