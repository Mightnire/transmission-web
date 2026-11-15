<template>
  <aside class="desktop-sidebar" :class="{ 'mobile-open': state.sidebarOpen }">
    <!-- 移动端遮罩 -->
    <div class="mobile-backdrop" v-if="state.sidebarOpen" @click="state.sidebarOpen = false"></div>

    <div class="sidebar-inner">
      <!-- 状态筛选区 -->
      <div class="sidebar-section">
        <div class="section-header">{{ t('filter.title') }}</div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'all' }"
          @click="setStatusFilter('all')"
        >
          <span class="material-icons item-icon">all_inclusive</span>
          <span class="item-label">{{ t('filter.all') }}</span>
          <span class="item-badge">{{ state.torrents.length }}</span>
        </div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'downloading' }"
          @click="setStatusFilter('downloading')"
        >
          <span class="material-icons item-icon down-color">arrow_downward</span>
          <span class="item-label">{{ t('filter.downloading') }}</span>
          <span class="item-badge" v-if="counts.downloading > 0">{{ counts.downloading }}</span>
        </div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'seeding' }"
          @click="setStatusFilter('seeding')"
        >
          <span class="material-icons item-icon up-color">arrow_upward</span>
          <span class="item-label">{{ t('filter.seeding') }}</span>
          <span class="item-badge" v-if="counts.seeding > 0">{{ counts.seeding }}</span>
        </div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'finished' }"
          @click="setStatusFilter('finished')"
        >
          <span class="material-icons item-icon finish-color">check_circle</span>
          <span class="item-label">{{ t('filter.finished') }}</span>
          <span class="item-badge" v-if="counts.finished > 0">{{ counts.finished }}</span>
        </div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'paused' }"
          @click="setStatusFilter('paused')"
        >
          <span class="material-icons item-icon pause-color">pause</span>
          <span class="item-label">{{ t('filter.paused') }}</span>
          <span class="item-badge" v-if="counts.paused > 0">{{ counts.paused }}</span>
        </div>

        <div
          class="sidebar-nav-item"
          :class="{ active: state.filter.status === 'error' }"
          @click="setStatusFilter('error')"
        >
          <span class="material-icons item-icon error-color">error</span>
          <span class="item-label">{{ t('filter.error') }}</span>
          <span class="item-badge error-badge" v-if="counts.error > 0">{{ counts.error }}</span>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <!-- 排序管理 -->
      <div class="sidebar-section">
        <div class="section-header-flex">
          <span>{{ t('filter.sortBy') }}</span>
          <button class="sort-order-btn" @click="state.filter.sortAsc = !state.filter.sortAsc" :title="state.filter.sortAsc ? '升序' : '降序'">
            <span class="material-icons">{{ state.filter.sortAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
          </button>
        </div>

        <div class="sort-options">
          <label class="sort-radio" v-for="opt in sortOptions" :key="opt.value">
            <input
              type="radio"
              name="sortBy"
              :value="opt.value"
              v-model="state.filter.sortBy"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- 底部统计面板 (BiglyBT 风格) -->
      <div class="sidebar-footer" v-if="state.stats">
        <div class="footer-title">会话统计</div>
        <div class="footer-stat-line">
          <span>已下载:</span>
          <b>{{ formatBytes(state.stats['current-stats'].downloadedBytes) }}</b>
        </div>
        <div class="footer-stat-line">
          <span>已上传:</span>
          <b>{{ formatBytes(state.stats['current-stats'].uploadedBytes) }}</b>
        </div>
        <div class="footer-stat-line">
          <span>分享率:</span>
          <b>{{ getRatio() }}</b>
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
    downloading: 0,
    seeding: 0,
    finished: 0,
    paused: 0,
    error: 0,
  };
  for (const item of state.torrents) {
    if (item.error !== 0 || item.corruptEver > 0) c.error++;
    if (item.status === TorrentStatus.DOWNLOAD || item.status === TorrentStatus.DOWNLOAD_WAIT) c.downloading++;
    if (item.status === TorrentStatus.SEED || item.status === TorrentStatus.SEED_WAIT) c.seeding++;
    if (item.status === TorrentStatus.STOPPED) c.paused++;
    if (item.isFinished || item.percentDone >= 1.0) c.finished++;
  }
  return c;
});

const sortOptions = computed(() => [
  { value: 'addedDate', label: t('common.addedDate') },
  { value: 'name', label: t('common.name') },
  { value: 'percentDone', label: t('common.progress') },
  { value: 'rateDownload', label: t('common.downSpeed') },
  { value: 'totalSize', label: t('common.size') },
  { value: 'uploadRatio', label: t('common.ratio') },
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
.desktop-sidebar {
  width: 210px;
  background-color: var(--md-surface);
  border-right: 1px solid var(--md-divider);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
  height: 100%;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.sidebar-section {
  padding: 8px 0;
}

.section-header {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--md-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-header-flex {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--md-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-order-btn {
  background: transparent;
  border: none;
  color: var(--md-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.sort-order-btn .material-icons {
  font-size: 16px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  cursor: pointer;
  color: var(--md-text-primary);
  font-size: 13px;
  transition: background-color 0.15s;
  gap: 10px;
}

.sidebar-nav-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.sidebar-nav-item.active {
  background-color: rgba(63, 81, 181, 0.12);
  color: var(--md-primary);
  font-weight: 600;
  border-left: 3px solid var(--md-primary);
}

.item-icon {
  font-size: 18px;
  opacity: 0.8;
}

.down-color { color: var(--md-info); }
.up-color { color: var(--md-success); }
.finish-color { color: #8bc34a; }
.pause-color { color: var(--md-text-secondary); }
.error-color { color: var(--md-error); }

.item-label {
  flex: 1;
}

.item-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background-color: var(--md-divider);
  color: var(--md-text-secondary);
  font-weight: 500;
}

.error-badge {
  background-color: var(--md-error);
  color: #ffffff;
}

.sidebar-divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 6px 12px;
}

.sort-options {
  padding: 4px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sort-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  color: var(--md-text-secondary);
}

.sort-radio input {
  cursor: pointer;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px 16px;
  border-top: 1px solid var(--md-divider);
  background-color: rgba(0, 0, 0, 0.02);
  font-size: 11px;
  color: var(--md-text-secondary);
}

.footer-title {
  font-weight: 700;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.footer-stat-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.footer-stat-line b {
  color: var(--md-text-primary);
}

/* 移动端媒体查询：只有在小屏幕时才作为悬浮抽屉 */
@media (max-width: 768px) {
  .desktop-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 260px;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    visibility: hidden;
    pointer-events: none;
    box-shadow: none; /* 彻底根除未激活时的左侧阴影泄漏！ */
  }

  .desktop-sidebar.mobile-open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    box-shadow: var(--md-shadow-8dp);
  }

  .mobile-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 199;
  }
}
</style>
