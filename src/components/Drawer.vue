<template>
  <!-- 移动端全屏半透明毛玻璃遮罩 (Teleport 到 body，彻底解绑 transform 限制) -->
  <Teleport to="body">
    <div
      class="mobile-drawer-backdrop"
      v-if="state.sidebarOpen"
      @click="state.sidebarOpen = false"
    ></div>
  </Teleport>

  <aside
    class="fluent-navigation-pane"
    :class="{ 'mobile-open': state.sidebarOpen, 'is-collapsed': state.sidebarCollapsed }"
  >
    <!-- 移动端专属侧边栏头部 (带品牌与关闭按钮) -->
    <div class="mobile-drawer-header mobile-only">
      <div class="drawer-brand">
        <span class="material-icons brand-icon">cloud_download</span>
        <span class="brand-title">Transmission</span>
      </div>
      <button class="drawer-close-btn" @click="state.sidebarOpen = false" :title="t('common.close')">
        <span class="material-icons">close</span>
      </button>
    </div>

    <div class="nav-pane-inner">
      <!-- 状态筛选组 (Fluent Navigation Items) -->
      <div class="nav-section">
        <div class="section-header-flex clickable" @click="filterCollapsed = !filterCollapsed">
          <span class="section-label">{{ t('sidebar.filters') }}</span>
          <button class="section-collapse-btn" @click.stop="filterCollapsed = !filterCollapsed">
            <span class="material-icons">{{ filterCollapsed ? 'chevron_right' : 'expand_more' }}</span>
          </button>
        </div>

        <div class="nav-items-group" v-show="!filterCollapsed">
          <!-- 全部任务 -->
          <div
            class="fluent-nav-item"
            :class="{ active: state.filter.status === 'all' && !state.selectedTag && !state.selectedTracker }"
            @click="setStatusFilter('all')"
            :title="t('sidebar.all')"
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
            :title="t('sidebar.active')"
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
            :title="t('sidebar.downloading')"
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
            :title="t('sidebar.seeding')"
          >
            <div class="active-indicator"></div>
            <span class="material-icons nav-icon text-success">arrow_upward</span>
            <span class="nav-label">{{ t('sidebar.seeding') }}</span>
            <span class="nav-badge" v-if="counts.seeding > 0">{{ counts.seeding }}</span>
          </div>

          <!-- 排队等待 -->
          <div
            class="fluent-nav-item"
            :class="{ active: state.filter.status === 'queued' }"
            @click="setStatusFilter('queued')"
            :title="t('sidebar.queued')"
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
            :title="t('sidebar.finished')"
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
            :title="t('sidebar.paused')"
          >
            <div class="active-indicator"></div>
            <span class="material-icons nav-icon text-muted">pause</span>
            <span class="nav-label">{{ t('sidebar.paused') }}</span>
            <span class="nav-badge" v-if="counts.paused > 0">{{ counts.paused }}</span>
          </div>

          <!-- 异常任务 -->
          <div
            class="fluent-nav-item"
            :class="{ active: state.filter.status === 'error' }"
            @click="setStatusFilter('error')"
            :title="t('sidebar.errors')"
          >
            <div class="active-indicator"></div>
            <span class="material-icons nav-icon text-danger">error_outline</span>
            <span class="nav-label">{{ t('sidebar.errors') }}</span>
            <span class="nav-badge badge-error" v-if="counts.error > 0">{{ counts.error }}</span>
          </div>
        </div>
      </div>

      <!-- 标签分组 (按标签多级层级树) -->
      <template v-if="state.uiPreferences.showTagGroup && tagGroups.length > 0">
        <div class="fluent-divider"></div>
        <div class="nav-section">
          <div class="section-header-flex clickable" @click="tagCollapsed = !tagCollapsed">
            <span class="section-label">{{ t('sidebar.tags') }}</span>
            <div class="header-actions">
              <button
                class="clear-filter-btn"
                v-if="state.selectedTag"
                @click.stop="clearGroupFilter"
                title="Clear"
              >
                <span class="material-icons">close</span>
              </button>
              <button class="section-collapse-btn" @click.stop="tagCollapsed = !tagCollapsed">
                <span class="material-icons">{{ tagCollapsed ? 'chevron_right' : 'expand_more' }}</span>
              </button>
            </div>
          </div>

          <div class="nav-items-group" v-show="!tagCollapsed">
            <div
              class="fluent-nav-item"
              v-for="tg in tagGroups"
              :key="tg.name"
              :class="{ active: state.selectedTag === tg.name }"
              @click="toggleTag(tg.name)"
              :title="tg.name"
            >
              <div class="active-indicator"></div>
              <span class="material-icons nav-icon text-accent">local_offer</span>
              <span class="nav-label">{{ tg.name }}</span>
              <span class="nav-badge">{{ tg.count }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Tracker 分组 (按域名层级树) -->
      <template v-if="state.uiPreferences.showTrackerGroup && trackerGroups.length > 0">
        <div class="fluent-divider"></div>
        <div class="nav-section">
          <div class="section-header-flex clickable" @click="trackerCollapsed = !trackerCollapsed">
            <span class="section-label">{{ t('sidebar.trackers') }}</span>
            <div class="header-actions">
              <button
                class="clear-filter-btn"
                v-if="state.selectedTracker"
                @click.stop="clearGroupFilter"
                title="Clear"
              >
                <span class="material-icons">close</span>
              </button>
              <button class="section-collapse-btn" @click.stop="trackerCollapsed = !trackerCollapsed">
                <span class="material-icons">{{ trackerCollapsed ? 'chevron_right' : 'expand_more' }}</span>
              </button>
            </div>
          </div>

          <div class="nav-items-group" v-show="!trackerCollapsed">
            <div
              class="fluent-nav-item"
              v-for="tr in trackerGroups"
              :key="tr.host"
              :class="{ active: state.selectedTracker === tr.host }"
              @click="toggleTracker(tr.host)"
              :title="tr.host"
            >
              <div class="active-indicator"></div>
              <span class="material-icons nav-icon text-muted">dns</span>
              <span class="nav-label">{{ tr.host }}</span>
              <span class="nav-badge">{{ tr.count }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部固定悬浮会话磁贴卡片 (默认悬浮在底部显示，不随列表滚动) -->
    <div class="nav-footer" v-if="state.stats">
      <div class="footer-card" :class="{ collapsed: statsCollapsed }">
        <div class="footer-card-header">
          <div class="header-left">
            <span class="material-icons card-icon">insights</span>
            <span class="card-title">{{ t('sidebar.stats') }}</span>
          </div>
          <button
            class="collapse-card-btn"
            @click.stop="statsCollapsed = !statsCollapsed"
            :title="statsCollapsed ? t('ribbon.expand') : t('ribbon.collapse')"
          >
            <span class="material-icons">{{ statsCollapsed ? 'expand_less' : 'expand_more' }}</span>
          </button>
        </div>

        <!-- 实时双向速度行 (固定宽度，防跳动；点击弹出快捷限速) -->
        <div class="stat-speeds-row">
          <div
            class="speed-box down"
            @click.stop="toggleSpeedFlyout('down')"
            :title="t('sidebar.speedLimitFlyout')"
          >
            <span class="material-icons speed-icon">arrow_downward</span>
            <span class="speed-fixed-val">{{ formatSpeed(state.stats?.downloadSpeed) }}</span>
          </div>
          <div
            class="speed-box up"
            @click.stop="toggleSpeedFlyout('up')"
            :title="t('sidebar.speedLimitFlyout')"
          >
            <span class="material-icons speed-icon">arrow_upward</span>
            <span class="speed-fixed-val">{{ formatSpeed(state.stats?.uploadSpeed) }}</span>
          </div>
        </div>

        <!-- 展开时显示的累计统计项 -->
        <div class="stat-grid" v-show="!statsCollapsed">
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

        <!-- 快捷限速微型 Flyout 气泡 (朝上弹出，严格限定在侧边栏内部) -->
        <div class="speed-flyout" v-if="speedFlyout.open" @click.stop>
          <div class="flyout-header">
            <span>{{ speedFlyout.type === 'down' ? t('sidebar.downLimit') : t('sidebar.upLimit') }}</span>
            <button class="flyout-close-btn" @click="speedFlyout.open = false">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="flyout-body">
            <label class="fluent-check-label">
              <input type="checkbox" v-model="speedFlyout.enabled" />
              <span>{{ t('common.enabled') }}</span>
            </label>
            <div class="flyout-input-row">
              <input
                type="number"
                class="num-input flyout-num"
                v-model.number="speedFlyout.limit"
                :disabled="!speedFlyout.enabled"
                min="0"
                step="50"
              />
              <span class="unit-txt">KB/s</span>
            </div>
          </div>
          <div class="flyout-footer">
            <button class="md-btn md-btn-flat mini" @click="speedFlyout.open = false">
              {{ t('common.cancel') }}
            </button>
            <button class="md-btn md-btn-raised mini" @click="saveSpeedLimit">
              {{ t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { state, formatBytes, formatSpeed } from '../stores/transmission';
import { rpc } from '../api/rpc';
import { TorrentStatus } from '../api/types';
import { t } from '../locales';

const filterCollapsed = ref(localStorage.getItem('filter_collapsed') === 'true');
watch(filterCollapsed, (val) => {
  localStorage.setItem('filter_collapsed', String(val));
});

const tagCollapsed = ref(localStorage.getItem('tag_collapsed') === 'true');
watch(tagCollapsed, (val) => {
  localStorage.setItem('tag_collapsed', String(val));
});

const trackerCollapsed = ref(localStorage.getItem('tracker_collapsed') === 'true');
watch(trackerCollapsed, (val) => {
  localStorage.setItem('tracker_collapsed', String(val));
});

const statsCollapsed = ref(localStorage.getItem('stats_collapsed') === 'true');
watch(statsCollapsed, (val) => {
  localStorage.setItem('stats_collapsed', String(val));
});

const speedFlyout = reactive({
  open: false,
  type: 'down' as 'down' | 'up',
  enabled: false,
  limit: 0,
});

function toggleSpeedFlyout(type: 'down' | 'up') {
  if (speedFlyout.open && speedFlyout.type === type) {
    speedFlyout.open = false;
    return;
  }
  speedFlyout.type = type;
  if (type === 'down') {
    speedFlyout.enabled = !!state.session?.['speed-limit-down-enabled'];
    speedFlyout.limit = state.session?.['speed-limit-down'] ?? 100;
  } else {
    speedFlyout.enabled = !!state.session?.['speed-limit-up-enabled'];
    speedFlyout.limit = state.session?.['speed-limit-up'] ?? 100;
  }
  speedFlyout.open = true;
}

async function saveSpeedLimit() {
  const args: any = {};
  if (speedFlyout.type === 'down') {
    args['speed-limit-down-enabled'] = speedFlyout.enabled;
    args['speed-limit-down'] = speedFlyout.limit;
  } else {
    args['speed-limit-up-enabled'] = speedFlyout.enabled;
    args['speed-limit-up'] = speedFlyout.limit;
  }
  if (state.session) {
    Object.assign(state.session, args);
  }
  await rpc.setSession(args);
  speedFlyout.open = false;
}

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
    if (item.error !== 0) c.error++;
    if (item.rateDownload > 0 || item.rateUpload > 0) c.active++;
    if (item.status === TorrentStatus.DOWNLOAD || item.status === TorrentStatus.DOWNLOAD_WAIT) c.downloading++;
    if (item.status === TorrentStatus.SEED || item.status === TorrentStatus.SEED_WAIT) c.seeding++;
    if (item.status === TorrentStatus.DOWNLOAD_WAIT || item.status === TorrentStatus.SEED_WAIT) c.queued++;
    if (item.status === TorrentStatus.STOPPED) c.paused++;
    if (item.isFinished || item.percentDone >= 1.0) c.finished++;
  }
  return c;
});

const tagGroups = computed(() => {
  const map: Record<string, number> = {};
  for (const item of state.torrents) {
    if (item.labels && item.labels.length > 0) {
      for (const l of item.labels) {
        const trimmed = l.trim();
        if (trimmed) map[trimmed] = (map[trimmed] || 0) + 1;
      }
    }
  }
  return Object.entries(map).map(([name, count]) => ({ name, count }));
});

const trackerGroups = computed(() => {
  const map: Record<string, number> = {};
  for (const item of state.torrents) {
    if (item.trackers && item.trackers.length > 0) {
      const seen = new Set<string>();
      for (const tr of item.trackers) {
        try {
          const u = new URL(tr.announce);
          if (u.hostname) seen.add(u.hostname);
        } catch {
          // ignore
        }
      }
      for (const host of seen) {
        map[host] = (map[host] || 0) + 1;
      }
    }
  }
  return Object.entries(map).map(([host, count]) => ({ host, count }));
});

function setStatusFilter(status: any) {
  state.filter.status = status;
  state.selectedTag = null;
  state.selectedTracker = null;
  if (window.innerWidth < 768) {
    state.sidebarOpen = false;
  }
}

function toggleTag(tag: string) {
  state.selectedTag = state.selectedTag === tag ? null : tag;
  state.selectedTracker = null;
  if (window.innerWidth < 768) {
    state.sidebarOpen = false;
  }
}

function toggleTracker(host: string) {
  state.selectedTracker = state.selectedTracker === host ? null : host;
  state.selectedTag = null;
  if (window.innerWidth < 768) {
    state.sidebarOpen = false;
  }
}

function clearGroupFilter() {
  state.selectedTag = null;
  state.selectedTracker = null;
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
  transition: width 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
  position: relative;
  z-index: 80;
}

/* 48px 紧凑图标轨模式 */
.fluent-navigation-pane.is-collapsed {
  width: 48px;
}

.fluent-navigation-pane.is-collapsed .section-label,
.fluent-navigation-pane.is-collapsed .nav-label,
.fluent-navigation-pane.is-collapsed .nav-badge,
.fluent-navigation-pane.is-collapsed .section-header-flex,
.fluent-navigation-pane.is-collapsed .footer-card {
  display: none !important;
}

.fluent-navigation-pane.is-collapsed .nav-pane-inner {
  padding: 6px 4px;
}

.fluent-navigation-pane.is-collapsed .fluent-nav-item {
  padding: 0;
  justify-content: center;
}

.fluent-navigation-pane.is-collapsed .fluent-divider {
  margin: 6px 4px;
}

.nav-pane-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 8px 6px;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 12px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-items-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--md-text-secondary);
  padding: 4px 6px;
  letter-spacing: 0.02em;
}

.section-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
}

.section-header-flex.clickable {
  cursor: pointer;
  border-radius: var(--fluent-radius);
  transition: background-color 0.12s;
  padding: 2px 4px;
}

.section-header-flex.clickable:hover {
  background-color: var(--fluent-bg-hover);
}

.section-collapse-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 3px;
}

.section-collapse-btn .material-icons {
  font-size: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-filter-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.clear-filter-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.clear-filter-btn .material-icons {
  font-size: 13px;
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

/* 底部系统会话磁贴卡片 (常驻悬浮于侧栏底部) */
.nav-footer {
  margin-top: auto;
  flex-shrink: 0;
  padding: 6px;
  position: relative;
  background-color: var(--fluent-bg-subtle);
  border-top: 1px solid var(--fluent-border-subtle);
}

.footer-card {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.footer-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
}

.card-icon {
  font-size: 15px;
  color: var(--fluent-accent);
}

.collapse-card-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  color: var(--md-text-secondary);
}

.collapse-card-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.collapse-card-btn .material-icons {
  font-size: 14px;
}

/* 实时双向速度行 (固定宽度防跳动) */
.stat-speeds-row {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.speed-box {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  padding: 3px 2px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.speed-box:hover {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-accent);
}

.speed-box.down { color: var(--md-info); }
.speed-box.up { color: var(--md-success); }

.speed-icon {
  font-size: 13px;
}

.speed-fixed-val {
  font-family: monospace;
  font-size: 10px;
  width: 62px;
  text-align: right;
  display: inline-block;
  white-space: nowrap;
}

/* 快捷限速 Flyout 气泡 (朝上悬浮在卡片上方，永远在侧栏内，零溢出零裁剪) */
.speed-flyout {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 6px;
  right: 6px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 8px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.18);
  padding: 10px;
  z-index: 500;
}

.flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--fluent-accent);
}

.flyout-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
}

.flyout-close-btn .material-icons {
  font-size: 14px;
}

.flyout-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.flyout-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flyout-num {
  width: 80px;
  padding: 3px 6px;
  font-size: 11px;
}

.unit-txt {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.fluent-check-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
}

.fluent-check-label input[type="checkbox"] {
  accent-color: var(--fluent-accent);
}

.flyout-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.md-btn.mini {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
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

.text-accent {
  color: var(--fluent-accent) !important;
}

/* 颜色助手 */
.text-info { color: var(--md-info) !important; }
.text-success { color: var(--md-success) !important; }
.text-warning { color: var(--md-warning) !important; }
.text-danger { color: var(--md-error) !important; }
.text-muted { color: var(--md-text-secondary) !important; }

/* 移动端全屏半透明遮罩 */
.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 998;
  animation: backdropFadeIn 0.2s ease-out;
}

@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-drawer-header {
  display: none;
  height: 48px;
  padding: 0 14px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background-color: var(--fluent-bg-canvas);
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-brand .brand-icon {
  font-size: 20px;
  color: var(--fluent-accent);
}

.drawer-brand .brand-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.drawer-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--md-text-secondary);
  border-radius: var(--fluent-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.drawer-close-btn:active {
  background-color: var(--fluent-bg-hover);
}

/* 移动端抽屉遮罩与侧边栏 */
@media (max-width: 768px) {
  .fluent-navigation-pane {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(300px, 84vw);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
    box-shadow: 0 4px 28px rgba(0, 0, 0, 0.35);
  }

  .fluent-navigation-pane.mobile-open {
    transform: translateX(0);
  }

  .mobile-drawer-header {
    display: flex;
  }

  .fluent-nav-item {
    height: 38px;
    padding: 0 12px;
  }
}
</style>
