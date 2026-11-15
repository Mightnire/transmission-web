<template>
  <aside class="fluent-navigation-pane" :class="{ 'mobile-open': state.sidebarOpen }">
    <!-- 移动端遮罩 -->
    <div class="mobile-backdrop" v-if="state.sidebarOpen" @click="state.sidebarOpen = false"></div>

    <div class="nav-pane-inner">
      <!-- 状态筛选组 (Fluent Navigation Items) -->
      <div class="nav-section">
        <div class="section-label">{{ t('sidebar.filters') }}</div>

        <!-- 全部任务 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'all' }"
          @click="setStatusFilter('all')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon">all_inclusive</span>
          <span class="nav-label">{{ t('sidebar.all') }}</span>
          <span class="nav-badge">{{ state.torrents.length }}</span>
        </div>

        <!-- 活跃传输 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'active' }"
          @click="setStatusFilter('active')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-info">sync_alt</span>
          <span class="nav-label">{{ t('sidebar.active') }}</span>
          <span class="nav-badge badge-active" v-if="counts.active > 0">{{ counts.active }}</span>
        </div>

        <!-- 正在下载 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'downloading' }"
          @click="setStatusFilter('downloading')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-info">arrow_downward</span>
          <span class="nav-label">{{ t('sidebar.downloading') }}</span>
          <span class="nav-badge" v-if="counts.downloading > 0">{{ counts.downloading }}</span>
        </div>

        <!-- 正在做种 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'seeding' }"
          @click="setStatusFilter('seeding')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-success">arrow_upward</span>
          <span class="nav-label">{{ t('sidebar.seeding') }}</span>
          <span class="nav-badge" v-if="counts.seeding > 0">{{ counts.seeding }}</span>
        </div>

        <!-- 排队等待 (核心新增：彻底看清队列！) -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'queued' }"
          @click="setStatusFilter('queued')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-warning">low_priority</span>
          <span class="nav-label">{{ t('sidebar.queued') }}</span>
          <span class="nav-badge badge-queued" v-if="counts.queued > 0">{{ counts.queued }}</span>
        </div>

        <!-- 已完成 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'finished' }"
          @click="setStatusFilter('finished')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-muted">check_circle_outline</span>
          <span class="nav-label">{{ t('sidebar.finished') }}</span>
          <span class="nav-badge" v-if="counts.finished > 0">{{ counts.finished }}</span>
        </div>

        <!-- 已暂停 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'paused' }"
          @click="setStatusFilter('paused')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-muted">pause</span>
          <span class="nav-label">{{ t('sidebar.paused') }}</span>
          <span class="nav-badge" v-if="counts.paused > 0">{{ counts.paused }}</span>
        </div>

        <!-- 异常与警告 -->
        <div
          class="fluent-nav-item"
          :class="{ active: state.filter.status === 'error' }"
          @click="setStatusFilter('error')"
        >
          <div class="active-indicator"></div>
          <span class="material-icons nav-icon text-danger">error_outline</span>
          <span class="nav-label">{{ t('sidebar.errors') }}</span>
          <span class="nav-badge badge-error" v-if="counts.error > 0">{{ counts.error }}</span>
        </div>
      </div>

      <div class="fluent-divider"></div>

      <!-- 排序管理 (Fluent 单选选项) -->
      <div class="nav-section">
        <div class="section-header-flex">
          <span class="section-label">{{ t('sidebar.sortBy') }}</span>
          <button
            class="sort-toggle-btn"
            @click="state.filter.sortAsc = !state.filter.sortAsc"
            :title="state.filter.sortAsc ? t('sidebar.sortAsc') : t('sidebar.sortDesc')"
          >
            <span class="material-icons">{{ state.filter.sortAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
          </button>
        </div>

        <div class="sort-list">
          <label class="fluent-radio-row" v-for="opt in sortOptions" :key="opt.value">
            <input
              type="radio"
              name="sidebarSortBy"
              :value="opt.value"
              v-model="state.filter.sortBy"
            />
            <span class="radio-label">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- 底部系统会话磁贴卡片 (Fluent Tile Card) -->
      <div class="nav-footer" v-if="state.stats">
        <div class="footer-card">
          <div class="footer-card-header">
            <span class="material-icons card-icon">insights</span>
            <span>{{ t('sidebar.stats') }}</span>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-k">{{ t('sidebar.downloaded') }}</span>
              <span class="stat-v">{{ formatBytes(state.stats['current-stats'].downloadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('sidebar.uploaded') }}</span>
              <span class="stat-v">{{ formatBytes(state.stats['current-stats'].uploadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('sidebar.ratio') }}</span>
              <span class="stat-v stat-accent">{{ getRatio() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { state, formatBytes } from '../stores/transmission';
import { TorrentStatus } from '../api/types';
import { t } from '../locales';

const counts = computed(() => {
  const c = {
    active: 0,
    downloading: 0,
    seeding: 0,
    queued: 0,
    finished: 0,
    paused: 0,
    error: 0,
  };
  for (const item of state.torrents) {
    if (item.error !== 0 || item.corruptEver > 0) c.error++;
    if (item.rateDownload > 0 || item.rateUpload > 0) c.active++;
    if (item.status === TorrentStatus.DOWNLOAD || item.status === TorrentStatus.DOWNLOAD_WAIT) c.downloading++;
    if (item.status === TorrentStatus.SEED || item.status === TorrentStatus.SEED_WAIT) c.seeding++;
    if (item.status === TorrentStatus.DOWNLOAD_WAIT || item.status === TorrentStatus.SEED_WAIT) c.queued++;
    if (item.status === TorrentStatus.STOPPED) c.paused++;
    if (item.isFinished || item.percentDone >= 1.0) c.finished++;
  }
  return c;
});

const sortOptions = computed(() => [
  { value: 'queuePosition', label: `# ${t('common.queue')}` },
  { value: 'name', label: t('common.name') },
  { value: 'percentDone', label: t('common.progress') },
  { value: 'rateDownload', label: t('common.downSpeed') },
  { value: 'totalSize', label: t('common.size') },
  { value: 'uploadRatio', label: t('common.ratio') },
  { value: 'addedDate', label: t('common.addedDate') },
]);

function setStatusFilter(status: any) {
  state.filter.status = status;
  if (window.innerWidth < 768) {
    state.sidebarOpen = false;
  }
}

function getRatio(): string {
  if (!state.stats) return '0.00';
  const down = state.stats['current-stats'].downloadedBytes;
  const up = state.stats['current-stats'].uploadedBytes;
  if (!down || down === 0) return up > 0 ? '∞' : '0.00';
  return (up / down).toFixed(2);
}
</script>

<style scoped>
/* Fluent 2 Navigation View 侧边栏 */
.fluent-navigation-pane {
  width: 220px;
  background-color: var(--fluent-bg-subtle);
  border-right: 1px solid var(--fluent-border-subtle);
  display: flex;
  flex-direction: column;
  user-select: none;
  flex-shrink: 0;
  height: 100%;
  transition: all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
  position: relative;
  z-index: 80;
}

.nav-pane-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 6px;
  overflow-y: auto;
  gap: 12px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--md-text-secondary);
  padding: 4px 10px;
  letter-spacing: 0.02em;
}

.section-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 6px;
}

.sort-toggle-btn {
  background: transparent;
  border: none;
  color: var(--md-text-secondary);
  cursor: pointer;
  border-radius: var(--fluent-radius);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.sort-toggle-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.sort-toggle-btn .material-icons {
  font-size: 15px;
}

/* Fluent 导航项 */
.fluent-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  color: var(--md-text-primary);
  font-size: 12px;
  font-weight: 400;
  transition: all 0.12s ease;
  gap: 10px;
}

.fluent-nav-item:hover {
  background-color: var(--fluent-bg-hover);
}

.fluent-nav-item:active {
  background-color: var(--fluent-bg-active);
  transform: scale(0.99);
}

.fluent-nav-item.active {
  background-color: var(--fluent-bg-canvas);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Windows 11 经典左侧指示条 */
.active-indicator {
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 3px;
  border-radius: 2px;
  background-color: transparent;
  transition: background-color 0.15s;
}

.fluent-nav-item.active .active-indicator {
  background-color: var(--fluent-accent);
}

.nav-icon {
  font-size: 17px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
}

.fluent-nav-item.active .nav-icon {
  color: var(--fluent-accent);
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Fluent 徽章 (Badge) */
.nav-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--md-text-secondary);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1px 6px;
  border-radius: 10px;
}

.badge-active {
  background-color: rgba(3, 169, 244, 0.12);
  color: var(--md-info);
  font-weight: 600;
}

.badge-queued {
  background-color: rgba(255, 152, 0, 0.15);
  color: #ef6c00;
  font-weight: 600;
}

.badge-error {
  background-color: rgba(244, 67, 54, 0.15);
  color: var(--md-error);
  font-weight: 600;
}

.fluent-divider {
  height: 1px;
  background-color: var(--fluent-border-subtle);
  margin: 4px 6px;
}

/* 排序单选组 */
.sort-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 6px;
}

.fluent-radio-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  font-size: 12px;
  color: var(--md-text-secondary);
  transition: background-color 0.12s;
}

.fluent-radio-row:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.fluent-radio-row input[type="radio"] {
  accent-color: var(--fluent-accent);
  cursor: pointer;
}

.radio-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部系统会话磁贴卡片 */
.nav-footer {
  margin-top: auto;
  padding: 4px;
}

.footer-card {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.footer-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
  margin-bottom: 6px;
}

.card-icon {
  font-size: 15px;
}

.stat-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.stat-k {
  color: var(--md-text-secondary);
}

.stat-v {
  font-weight: 500;
  font-family: monospace;
}

.stat-accent {
  color: var(--fluent-accent);
  font-weight: 700;
}

/* 颜色助手 */
.text-info { color: var(--md-info) !important; }
.text-success { color: var(--md-success) !important; }
.text-warning { color: var(--md-warning) !important; }
.text-danger { color: var(--md-error) !important; }
.text-muted { color: var(--md-text-secondary) !important; }

/* 移动端抽屉遮罩 */
@media (max-width: 768px) {
  .fluent-navigation-pane {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 200;
    transform: translateX(-100%);
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.25);
  }

  .fluent-navigation-pane.mobile-open {
    transform: translateX(0);
  }

  .mobile-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: -1;
  }
}
</style>
