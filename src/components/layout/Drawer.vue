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
    :class="{ 'mobile-open': state.sidebarOpen, 'is-collapsed': state.sidebarCollapsed, 'is-resizing': isResizing }"
    :style="sidebarStyle"
  >
    <!-- 移动端专属侧边栏头部 (带品牌与关闭按钮) -->
    <div class="mobile-drawer-header mobile-only">
      <div class="drawer-brand">
        <FluentIcon name="cloud_download" class="brand-icon" />
        <span class="brand-title">Transmission</span>
      </div>
      <button class="drawer-close-btn" @click="state.sidebarOpen = false" :title="t('common.close')">
        <FluentIcon name="close" />
      </button>
    </div>

    <div class="nav-pane-inner">
      <!-- 状态筛选组 (Fluent Navigation Items) -->
      <div class="nav-section">
        <div class="section-header-flex clickable" @click="filterCollapsed = !filterCollapsed">
          <span class="section-label">{{ t('sidebar.filters') }}</span>
          <button class="section-collapse-btn" @click.stop="filterCollapsed = !filterCollapsed">
            <FluentIcon :name="filterCollapsed ? 'chevron_right' : 'expand_more'" />
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
            <FluentIcon name="all_inclusive" class="nav-icon" />
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
            <FluentIcon name="sync_alt" class="nav-icon text-info" />
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
            <FluentIcon name="arrow_downward" class="nav-icon text-info" />
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
            <FluentIcon name="arrow_upward" class="nav-icon text-success" />
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
            <FluentIcon name="low_priority" class="nav-icon text-warning" />
            <span class="nav-label">{{ t('sidebar.queued') }}</span>
            <span class="nav-badge badge-queued" v-if="counts.queued > 0">{{ counts.queued }}</span>
          </div>

          <!-- 强制开始 (跳过队列限制) -->
          <div
            class="fluent-nav-item"
            :class="{ active: state.filter.status === 'forced' }"
            @click="setStatusFilter('forced')"
            :title="t('sidebar.forced')"
          >
            <div class="active-indicator"></div>
            <FluentIcon name="bolt" class="nav-icon text-warning" />
            <span class="nav-label">{{ t('sidebar.forced') }}</span>
            <span class="nav-badge badge-warning" v-if="counts.forced > 0">{{ counts.forced }}</span>
          </div>

          <!-- 已完成 -->
          <div
            class="fluent-nav-item"
            :class="{ active: state.filter.status === 'finished' }"
            @click="setStatusFilter('finished')"
            :title="t('sidebar.finished')"
          >
            <div class="active-indicator"></div>
            <FluentIcon name="check_circle_outline" class="nav-icon text-muted" />
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
            <FluentIcon name="pause" class="nav-icon text-muted" />
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
            <FluentIcon name="error_outline" class="nav-icon text-danger" />
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
                <FluentIcon name="close" />
              </button>
              <button class="section-collapse-btn" @click.stop="tagCollapsed = !tagCollapsed">
                <FluentIcon :name="tagCollapsed ? 'chevron_right' : 'expand_more'" />
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
              :title="tg.label"
            >
              <div class="active-indicator"></div>
              <FluentIcon :name="tg.isUntagged ? 'label_off' : 'local_offer'" class="nav-icon" :class="tg.isUntagged ? 'text-muted' : 'text-accent'" />
              <span class="nav-label">{{ tg.label }}</span>
              <span class="nav-badge">{{ tg.count }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 保存路径分组 (按存储目录) -->
      <template v-if="state.uiPreferences.showFolderGroup && folderGroups.length > 0">
        <div class="fluent-divider"></div>
        <div class="nav-section">
          <div class="section-header-flex clickable" @click="folderCollapsed = !folderCollapsed">
            <span class="section-label">{{ t('sidebar.folders') }}</span>
            <div class="header-actions">
              <button
                class="clear-filter-btn"
                v-if="state.selectedFolder"
                @click.stop="clearGroupFilter"
                title="Clear"
              >
                <FluentIcon name="close" />
              </button>
              <button class="section-collapse-btn" @click.stop="folderCollapsed = !folderCollapsed">
                <FluentIcon :name="folderCollapsed ? 'chevron_right' : 'expand_more'" />
              </button>
            </div>
          </div>

          <div class="nav-items-group" v-show="!folderCollapsed">
            <div
              class="fluent-nav-item"
              v-for="fg in folderGroups"
              :key="fg.path"
              :class="{ active: state.selectedFolder === fg.path }"
              @click="toggleFolder(fg.path)"
              @contextmenu.prevent="onFolderContextMenu(fg.path)"
              :title="fg.display !== fg.path ? `${fg.display}\n(${fg.path})` : fg.path"
            >
              <div class="active-indicator"></div>
              <FluentIcon name="folder" class="nav-icon text-muted" />
              <span class="nav-label" :title="fg.path">{{ fg.display }}</span>
              <span class="nav-badge">{{ fg.count }}</span>
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
                <FluentIcon name="close" />
              </button>
              <button class="section-collapse-btn" @click.stop="trackerCollapsed = !trackerCollapsed">
                <FluentIcon :name="trackerCollapsed ? 'chevron_right' : 'expand_more'" />
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
              <FluentIcon name="dns" class="nav-icon text-muted" />
              <span class="nav-label">{{ tr.host }}</span>
              <span class="nav-badge">{{ tr.count }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 侧边栏拖拽调宽手柄 (桌面端可用) -->
    <div
      class="sidebar-resize-handle desktop-only"
      v-if="!state.sidebarCollapsed"
      @mousedown="startResize"
      :title="t('sidebar.resizeTip')"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { state, formatDisplayPath, setPathAlias, openPrompt, showToast } from '../../stores/transmission';
import { useEscapeKey } from '../../composables/useEscapeKey';
import { TorrentStatus } from '../../api/types';
import { t } from '../../locales';

const DEFAULT_SIDEBAR_WIDTH = 220;
const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 480;

function loadSavedSidebarWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
  const saved = Number(localStorage.getItem('sidebar_width'));
  if (Number.isFinite(saved) && saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH) {
    return saved;
  }
  return DEFAULT_SIDEBAR_WIDTH;
}

const sidebarWidth = ref(loadSavedSidebarWidth());
const isResizing = ref(false);

const sidebarStyle = computed(() => {
  if (state.sidebarCollapsed) return {};
  return { width: `${sidebarWidth.value}px` };
});

function startResize(e: MouseEvent) {
  if (state.sidebarCollapsed) return;
  e.preventDefault();
  isResizing.value = true;
  const startX = e.clientX;
  const startWidth = sidebarWidth.value;

  function onMouseMove(moveEvent: MouseEvent) {
    const delta = moveEvent.clientX - startX;
    const nextWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta));
    sidebarWidth.value = nextWidth;
  }

  function onMouseUp() {
    isResizing.value = false;
    localStorage.setItem('sidebar_width', String(Math.round(sidebarWidth.value)));
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

const filterCollapsed = ref(localStorage.getItem('filter_collapsed') === 'true');

useEscapeKey(() => {
  if (state.sidebarOpen) state.sidebarOpen = false;
});
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

const folderCollapsed = ref(localStorage.getItem('folder_collapsed') === 'true');
watch(folderCollapsed, (val) => {
  localStorage.setItem('folder_collapsed', String(val));
});

const counts = computed(() => {
  const c = {
    active: 0,
    downloading: 0,
    seeding: 0,
    queued: 0,
    forced: 0,
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
    if (state.forcedTorrentIds.has(item.id) && (item.status === TorrentStatus.DOWNLOAD || item.status === TorrentStatus.SEED)) c.forced++;
    if (item.status === TorrentStatus.STOPPED) c.paused++;
    if (item.isFinished || item.percentDone >= 1.0) c.finished++;
  }
  return c;
});

const untaggedCount = computed(() => {
  return state.torrents.filter((t) => !t.labels || t.labels.length === 0).length;
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
  const list = Object.entries(map).map(([name, count]) => ({
    name,
    label: name,
    count,
    isUntagged: false
  }));

  // 用户要求：无标签筛选放在最顶部
  if (untaggedCount.value > 0) {
    list.unshift({
      name: '__untagged__',
      label: t('sidebar.noTags') || '无标签任务',
      count: untaggedCount.value,
      isUntagged: true
    });
  }

  return list;
});

const folderGroups = computed(() => {
  const map: Record<string, number> = {};
  for (const item of state.torrents) {
    const dir = item.downloadDir?.trim() || '';
    if (dir) {
      map[dir] = (map[dir] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([path, count]) => ({
      path,
      display: formatDisplayPath(path),
      count,
    }))
    .sort((a, b) => a.display.localeCompare(b.display));
});

function onFolderContextMenu(path: string) {
  const currentAlias = formatDisplayPath(path);
  openPrompt({
    title: t('pathAlias.setAliasTitle'),
    label: `${t('pathAlias.originalPath')}: ${path}`,
    value: currentAlias !== path ? currentAlias : '',
    placeholder: t('pathAlias.aliasPlaceholder'),
    confirmText: t('common.save'),
    onConfirm: (val) => {
      setPathAlias(path, val ? val.trim() : '');
      showToast(t('toast.saved'), 'success');
    },
  });
}

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
  state.selectedFolder = null;
  if (window.innerWidth <= 1024) {
    state.sidebarOpen = false;
  }
}

function toggleTag(tag: string) {
  state.selectedTag = state.selectedTag === tag ? null : tag;
  state.selectedTracker = null;
  state.selectedFolder = null;
  if (window.innerWidth <= 1024) {
    state.sidebarOpen = false;
  }
}

function toggleTracker(host: string) {
  state.selectedTracker = state.selectedTracker === host ? null : host;
  state.selectedTag = null;
  state.selectedFolder = null;
  if (window.innerWidth <= 1024) {
    state.sidebarOpen = false;
  }
}

function toggleFolder(path: string) {
  state.selectedFolder = state.selectedFolder === path ? null : path;
  state.selectedTag = null;
  state.selectedTracker = null;
  if (window.innerWidth <= 1024) {
    state.sidebarOpen = false;
  }
}

function clearGroupFilter() {
  state.selectedTag = null;
  state.selectedTracker = null;
  state.selectedFolder = null;
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
.fluent-navigation-pane.is-collapsed .section-header-flex {
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

.section-collapse-btn .fluent-icon {
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

.clear-filter-btn .fluent-icon {
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

.sort-toggle-btn .fluent-icon {
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
  cursor: pointer;
}

.radio-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 侧边栏拖拽调宽手柄 */
.sidebar-resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 99;
  user-select: none;
}

.sidebar-resize-handle:hover,
.fluent-navigation-pane.is-resizing .sidebar-resize-handle {
  background-color: var(--fluent-accent);
  opacity: 0.6;
}

.fluent-navigation-pane.is-resizing {
  transition: none !important;
  user-select: none;
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
@media (max-width: 1024px) {
  .fluent-navigation-pane {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(300px, 84vw);
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), box-shadow 0.25s ease, visibility 0.25s ease;
    box-shadow: none;
    visibility: hidden;
    pointer-events: none;
  }

  .fluent-navigation-pane.mobile-open {
    transform: translateX(0);
    box-shadow: 0 4px 28px rgba(0, 0, 0, 0.35);
    visibility: visible;
    pointer-events: auto;
  }

  /* 手机上不显示 48px 纯图标栏：抽屉始终展开显示文字与徽章 */
  .fluent-navigation-pane.is-collapsed {
    width: min(300px, 84vw);
  }

  .fluent-navigation-pane.is-collapsed .section-label,
  .fluent-navigation-pane.is-collapsed .nav-label {
    display: inline !important;
  }

  .fluent-navigation-pane.is-collapsed .nav-badge {
    display: inline-flex !important;
  }

  .fluent-navigation-pane.is-collapsed .section-header-flex {
    display: flex !important;
  }

  .fluent-navigation-pane.is-collapsed .nav-pane-inner {
    padding: 8px 6px;
  }

  .fluent-navigation-pane.is-collapsed .fluent-nav-item {
    padding: 0 12px;
    justify-content: flex-start;
  }

  .fluent-navigation-pane.is-collapsed .fluent-divider {
    margin: 4px 6px;
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
