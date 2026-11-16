<template>
  <div
    class="fluent-torrent-card"
    :class="{ selected: isSelected }"
    @click="handleCardClick"
  >
    <!-- 卡片主体内容 -->
    <div class="card-inner">
      <!-- 1. 顶部：选择框 + 状态胶囊 + 种子名称 -->
      <div class="card-header">
        <label class="checkbox-wrapper" @click.stop>
          <input
            type="checkbox"
            class="fluent-checkbox"
            :checked="isSelected"
            @change="toggleSelect"
          />
        </label>

        <div class="header-main">
          <div class="pill-row">
            <span class="status-pill" :class="statusClass">
              <FluentIcon :name="statusIcon" class="pill-icon" />
              <span class="pill-text">{{ statusText }}</span>
            </span>
            <span
              class="corrupt-pill"
              v-if="torrent.corruptEver > 0"
              :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })"
            >
              <FluentIcon name="warning" class="pill-icon" />
              <span>{{ t('common.corrupt') }}: {{ formatBytes(torrent.corruptEver) }}</span>
            </span>
          </div>

          <div class="torrent-name" :title="torrent.name">
            {{ torrent.name }}
          </div>
        </div>
      </div>

      <!-- 2. Fluent 进度条 -->
      <div class="progress-container">
        <div class="fluent-progress-track">
          <div
            class="fluent-progress-fill"
            :class="progressBarClass"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- 3. 统计指标 (精炼排版，彻底消除冗余与重复) -->
      <div class="metrics-block">
        <!-- 第一行：进度百分比与文件体积 · 状态/剩余时间/分享率 -->
        <div class="metric-row">
          <div class="metric-group-left">
            <span class="metric-pct" :class="{ 'text-warning': isChecking }">
              {{ progressPercent.toFixed(1) }}%
            </span>
            <span class="metric-divider">·</span>
            <span class="metric-size" v-if="torrent.totalSize > 0">
              {{ formatBytes(torrent.totalSize * torrent.percentDone) }} / {{ formatBytes(torrent.totalSize) }}
            </span>
          </div>

          <div class="metric-group-right">
            <span class="metric-eta" v-if="torrent.eta > 0 && !isPaused && torrent.percentDone < 1">
              <FluentIcon name="schedule" class="mini-icon" />
              {{ formatETA(torrent.eta) }}
            </span>
            <span class="metric-ratio" v-else-if="torrent.percentDone >= 1">
              {{ t('common.ratio') }}: {{ torrent.uploadRatio < 0 ? '0.00' : torrent.uploadRatio.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- 第二行：即时上下行速度 · 节点总数与分享率 -->
        <div class="metric-row secondary-row">
          <div class="metric-speeds">
            <span class="speed-item speed-down" :class="{ inactive: torrent.rateDownload === 0 }">
              <span class="speed-arrow">↓</span> {{ formatSpeed(torrent.rateDownload) }}
            </span>
            <span class="speed-item speed-up" :class="{ inactive: torrent.rateUpload === 0 }">
              <span class="speed-arrow">↑</span> {{ formatSpeed(torrent.rateUpload) }}
            </span>
          </div>

          <div class="metric-peers">
            <span class="peers-badge" :title="`${torrent.peersGettingFromUs} ↑ / ${torrent.peersSendingToUs} ↓`">
              <FluentIcon name="group" class="mini-icon" />
              {{ t('common.peers') }}: {{ torrent.peersConnected }}
            </span>
            <span class="metric-ratio-downloading" v-if="torrent.percentDone < 1">
              {{ t('common.ratio') }}: {{ torrent.uploadRatio < 0 ? '0.00' : torrent.uploadRatio.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 异常报警条 (仅存在错误时显示) -->
      <div class="error-notice" v-if="torrent.error !== 0">
        <FluentIcon name="error_outline" class="mini-icon" />
        <span class="error-text">{{ torrent.errorString || t('sidebar.errors') }}</span>
      </div>

      <!-- 4. 底部快捷操作栏 (Fluent 2 现代微质感按钮) -->
      <div class="card-action-bar" @click.stop>
        <!-- 开始 / 暂停 -->
        <button
          class="fluent-pill-btn action-play"
          :class="{ 'btn-start': isPaused, 'btn-pause': !isPaused }"
          @click="togglePlay"
          :title="isPaused ? t('common.start') : t('common.pause')"
        >
          <FluentIcon :name="isPaused ? 'play_arrow' : 'pause'" class="btn-icon" />
          <span>{{ isPaused ? t('common.start') : t('common.pause') }}</span>
        </button>

        <!-- 查看详情 (打开底栏 Bottom Sheet) -->
        <button
          class="fluent-pill-btn"
          @click="openDetail"
          :title="t('common.details')"
        >
          <FluentIcon name="info" class="btn-icon" />
          <span>{{ t('common.details') }}</span>
        </button>

        <!-- 任务属性 -->
        <button
          class="fluent-pill-btn"
          @click="openProps"
          :title="t('ribbon.tabs.torrentProps')"
        >
          <FluentIcon name="tune" class="btn-icon" />
          <span>{{ t('common.properties') }}</span>
        </button>

        <!-- 删除按钮 -->
        <button
          class="fluent-pill-btn btn-danger"
          @click="removeTorrent"
          :title="t('common.delete')"
        >
          <FluentIcon name="delete_outline" class="btn-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Torrent, TorrentStatus } from '../api/types';
import {
  state,
  selectTorrent,
  formatBytes,
  formatSpeed,
  formatETA,
  openConfirmRemove,
  startTorrentsAction,
  stopTorrentsAction,
} from '../stores/transmission';
import { t } from '../locales';
import { rpc } from '../api/rpc';

const props = defineProps<{ torrent: Torrent }>();

const isSelected = computed(() => {
  return state.selectedIds.includes(props.torrent.id) || state.selectedId === props.torrent.id;
});

const isPaused = computed(() => props.torrent.status === TorrentStatus.STOPPED);
const isChecking = computed(() => props.torrent.status === TorrentStatus.CHECK || props.torrent.status === TorrentStatus.CHECK_WAIT);

const progressPercent = computed(() => {
  if (isChecking.value) {
    return (props.torrent.recheckProgress || 0) * 100;
  }
  return (props.torrent.percentDone || 0) * 100;
});

const statusText = computed(() => {
  if (props.torrent.error !== 0) return t('sidebar.errors');
  switch (props.torrent.status) {
    case TorrentStatus.DOWNLOAD:
      return t('sidebar.downloading');
    case TorrentStatus.SEED:
      return t('sidebar.seeding');
    case TorrentStatus.CHECK:
      return t('status.checking');
    case TorrentStatus.CHECK_WAIT:
      return t('status.queued');
    case TorrentStatus.DOWNLOAD_WAIT:
    case TorrentStatus.SEED_WAIT:
      return t('sidebar.waiting');
    case TorrentStatus.STOPPED:
      return props.torrent.percentDone >= 1 ? t('sidebar.completed') : t('sidebar.paused');
    default:
      return t('sidebar.all');
  }
});

const statusIcon = computed(() => {
  if (props.torrent.error !== 0) return 'error_outline';
  switch (props.torrent.status) {
    case TorrentStatus.DOWNLOAD:
      return 'arrow_downward';
    case TorrentStatus.SEED:
      return 'arrow_upward';
    case TorrentStatus.CHECK:
    case TorrentStatus.CHECK_WAIT:
      return 'hourglass_top';
    case TorrentStatus.DOWNLOAD_WAIT:
    case TorrentStatus.SEED_WAIT:
      return 'low_priority';
    case TorrentStatus.STOPPED:
      return props.torrent.percentDone >= 1 ? 'check_circle' : 'pause_circle';
    default:
      return 'help_outline';
  }
});

const statusClass = computed(() => {
  if (props.torrent.error !== 0) return 'pill-error';
  switch (props.torrent.status) {
    case TorrentStatus.DOWNLOAD:
      return 'pill-download';
    case TorrentStatus.SEED:
      return 'pill-seed';
    case TorrentStatus.CHECK:
    case TorrentStatus.CHECK_WAIT:
      return 'pill-checking';
    case TorrentStatus.DOWNLOAD_WAIT:
    case TorrentStatus.SEED_WAIT:
      return 'pill-waiting';
    case TorrentStatus.STOPPED:
      return props.torrent.percentDone >= 1 ? 'pill-completed' : 'pill-stopped';
    default:
      return 'pill-default';
  }
});

const progressBarClass = computed(() => {
  if (props.torrent.error !== 0) return 'fill-error';
  if (isChecking.value) return 'fill-warning';
  if (props.torrent.status === TorrentStatus.SEED || props.torrent.percentDone >= 1) return 'fill-success';
  return 'fill-primary';
});

function handleCardClick() {
  if (state.selectedIds.length > 0) {
    selectTorrent(props.torrent.id, true);
  } else {
    selectTorrent(props.torrent.id, false);
  }
}

function toggleSelect() {
  selectTorrent(props.torrent.id, true);
}

function openDetail() {
  state.selectedId = props.torrent.id;
  if (!state.selectedIds.includes(props.torrent.id)) {
    state.selectedIds = [props.torrent.id];
  }
  state.detailOpen = true;
  rpc.getTorrentDetail(props.torrent.id).then((detail) => {
    if (detail) {
      state.activeTorrentDetail = { ...props.torrent, ...detail };
    }
  });
}

function openProps() {
  state.propsTorrentId = props.torrent.id;
  state.propsDialogOpen = true;
}

async function togglePlay() {
  if (isPaused.value) {
    await startTorrentsAction([props.torrent.id]);
  } else {
    await stopTorrentsAction([props.torrent.id]);
  }
}

function removeTorrent() {
  state.selectedId = props.torrent.id;
  state.selectedIds = [props.torrent.id];
  openConfirmRemove(false);
}
</script>

<style scoped>
.fluent-torrent-card {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.15s cubic-bezier(0.1, 0.9, 0.2, 1);
  user-select: none;
  overflow: hidden;
}

.fluent-torrent-card:active {
  transform: scale(0.995);
}

.fluent-torrent-card.selected {
  border-color: var(--fluent-accent);
  background-color: rgba(0, 120, 212, 0.04);
  box-shadow: 0 0 0 1px var(--fluent-accent), 0 2px 10px rgba(0, 120, 212, 0.15);
}

.card-inner {
  padding: 10px 12px;
}

/* 头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding-top: 2px;
  cursor: pointer;
}

.fluent-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--fluent-accent);
  border-radius: 4px;
}

.header-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
}

.pill-icon {
  font-size: 13px;
}

.pill-download {
  background-color: rgba(16, 124, 65, 0.12);
  color: #107c41;
}

.pill-seed {
  background-color: rgba(0, 120, 212, 0.12);
  color: #0078d4;
}

.pill-waiting {
  background-color: rgba(216, 59, 1, 0.12);
  color: #d83b01;
}

.pill-checking {
  background-color: rgba(255, 185, 0, 0.18);
  color: #b26b00;
}

.pill-completed {
  background-color: rgba(100, 100, 100, 0.12);
  color: var(--md-text-secondary);
}

.pill-stopped {
  background-color: rgba(120, 120, 120, 0.1);
  color: var(--md-text-secondary);
}

.pill-error {
  background-color: rgba(209, 52, 56, 0.14);
  color: #d13438;
}

.pill-default {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-secondary);
}

.corrupt-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 10.5px;
  font-weight: 600;
  background-color: rgba(255, 185, 0, 0.18);
  color: #b26b00;
  border: 1px solid rgba(255, 185, 0, 0.3);
}

.torrent-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--md-text-primary);
  line-height: 1.35;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 进度条 */
.progress-container {
  margin: 8px 0 7px;
}

.fluent-progress-track {
  width: 100%;
  height: 4px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 2px;
  overflow: hidden;
}

.fluent-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.fill-primary {
  background-color: var(--fluent-accent);
}

.fill-success {
  background-color: #107c41;
}

.fill-warning {
  background-color: #ffb900;
}

.fill-error {
  background-color: #d13438;
}

/* 指标块 */
.metrics-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-group-left {
  display: flex;
  align-items: baseline;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-pct {
  font-size: 13px;
  font-weight: 700;
  color: var(--md-text-primary);
}

.metric-divider {
  color: var(--fluent-border-divider);
  font-weight: 600;
}

.metric-size {
  color: var(--md-text-secondary);
  font-size: 11.5px;
}

.metric-group-right {
  display: flex;
  align-items: center;
  font-size: 11.5px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
}

.metric-eta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--fluent-accent);
  font-weight: 600;
}

.metric-ratio {
  font-weight: 500;
}

.mini-icon {
  font-size: 13px;
  opacity: 0.85;
}

/* 第二行指标：速度与节点 */
.secondary-row {
  font-size: 11.5px;
}

.metric-speeds {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;
}

.speed-arrow {
  font-weight: 700;
}

.speed-down {
  color: #107c41;
}

.speed-up {
  color: #0078d4;
}

.speed-item.inactive {
  color: var(--md-text-secondary);
  font-weight: normal;
  opacity: 0.75;
}

.metric-peers {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.peers-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.metric-ratio-downloading {
  color: var(--md-text-secondary);
}

/* 错误通知条 */
.error-notice {
  margin-top: 6px;
  padding: 4px 8px;
  background-color: rgba(209, 52, 56, 0.1);
  border: 1px solid rgba(209, 52, 56, 0.25);
  border-radius: 4px;
  color: #d13438;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部操作栏 */
.card-action-bar {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--fluent-border-subtle);
  display: flex;
  align-items: center;
  gap: 6px;
}

.fluent-pill-btn {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-pill-btn:active {
  background-color: var(--fluent-bg-hover);
  transform: scale(0.96);
}

.fluent-pill-btn .btn-icon {
  font-size: 15px;
}

.action-play.btn-start {
  color: #107c41;
  border-color: rgba(16, 124, 65, 0.25);
  background-color: rgba(16, 124, 65, 0.08);
}

.action-play.btn-pause {
  color: #d83b01;
  border-color: rgba(216, 59, 1, 0.25);
  background-color: rgba(216, 59, 1, 0.08);
}

.fluent-pill-btn.btn-danger {
  margin-left: auto;
  color: #d13438;
  border-color: rgba(209, 52, 56, 0.2);
  background-color: rgba(209, 52, 56, 0.04);
  padding: 0 8px;
}

.fluent-pill-btn.btn-danger:active {
  background-color: rgba(209, 52, 56, 0.12);
}
</style>
