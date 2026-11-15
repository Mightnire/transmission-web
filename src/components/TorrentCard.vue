<template>
  <div
    class="fluent-torrent-card"
    :class="{ selected: isSelected }"
    @click="handleCardClick"
  >
    <!-- 卡片主体内容 -->
    <div class="card-inner">
      <!-- 1. 顶部：选择框、状态徽标与种子名称 -->
      <div class="card-header">
        <label class="checkbox-wrapper" @click.stop>
          <input
            type="checkbox"
            class="fluent-checkbox"
            :checked="isSelected"
            @change="toggleSelect"
          />
        </label>

        <div class="title-block">
          <div class="title-row">
            <span class="status-pill" :class="statusClass">
              <span class="material-icons pill-icon">{{ statusIcon }}</span>
              <span class="pill-text">{{ statusText }}</span>
            </span>
            <div class="torrent-name" :title="torrent.name">
              {{ torrent.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 进度条 (Fluent 2 细腻进度条) -->
      <div class="progress-container">
        <div class="fluent-progress-track">
          <div
            class="fluent-progress-fill"
            :class="progressBarClass"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- 3. 统计指标网格 (移动端优化的紧凑双列布局) -->
      <div class="meta-grid">
        <!-- 进度与已下载 -->
        <div class="meta-cell">
          <span class="meta-label">{{ t('table.percent') }}:</span>
          <span class="meta-value font-bold" :class="{ 'text-warning': isChecking }">
            {{ progressPercent.toFixed(1) }}%
            <span class="meta-sub" v-if="torrent.totalSize > 0">
              ({{ formatBytes(torrent.totalSize * torrent.percentDone) }} / {{ formatBytes(torrent.totalSize) }})
            </span>
          </span>
        </div>

        <!-- 剩余时间 / 节点数 -->
        <div class="meta-cell text-right">
          <span class="meta-label" v-if="torrent.eta > 0">{{ t('common.eta') }}:</span>
          <span class="meta-value" v-if="torrent.eta > 0">{{ formatETA(torrent.eta) }}</span>
          <span class="meta-sub" v-else>{{ t('table.peers') }}: {{ torrent.peersConnected }}</span>
        </div>

        <!-- 即时下载速度 -->
        <div class="meta-cell">
          <span class="meta-label">↓ {{ t('table.downSpeed') }}:</span>
          <span class="meta-value speed-down font-bold">
            {{ formatSpeed(torrent.rateDownload) }}
          </span>
        </div>

        <!-- 即时上传速度 -->
        <div class="meta-cell text-right">
          <span class="meta-label">↑ {{ t('table.upSpeed') }}:</span>
          <span class="meta-value speed-up font-bold">
            {{ formatSpeed(torrent.rateUpload) }}
          </span>
        </div>

        <!-- 分享率 -->
        <div class="meta-cell">
          <span class="meta-label">{{ t('table.ratio') }}:</span>
          <span class="meta-value">{{ torrent.uploadRatio < 0 ? '0.00' : torrent.uploadRatio.toFixed(2) }}</span>
        </div>

        <!-- 节点总览 -->
        <div class="meta-cell text-right">
          <span class="meta-label">Peers:</span>
          <span class="meta-value">{{ torrent.peersConnected }} ({{ torrent.peersGettingFromUs }} ↑ / {{ torrent.peersSendingToUs }} ↓)</span>
        </div>
      </div>

      <!-- 坏块与网络浪费损耗专属徽标 (特色功能) -->
      <div class="badges-row" v-if="torrent.corruptEver > 0 || torrent.error !== 0">
        <span class="fluent-badge badge-warning" v-if="torrent.corruptEver > 0" :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })">
          <span class="material-icons badge-icon">warning</span>
          {{ t('common.corrupt') }}: {{ formatBytes(torrent.corruptEver) }}
        </span>
        <span class="fluent-badge badge-danger" v-if="torrent.error !== 0">
          <span class="material-icons badge-icon">error_outline</span>
          {{ torrent.errorString || t('sidebar.errors') }}
        </span>
      </div>

      <!-- 4. 底部快捷操作栏 (适合手指触摸的热区) -->
      <div class="card-action-bar" @click.stop>
        <!-- 开始 / 暂停 -->
        <button
          class="fluent-card-btn action-play"
          :class="{ 'btn-start': isPaused, 'btn-pause': !isPaused }"
          @click="togglePlay"
          :title="isPaused ? t('common.start') : t('common.pause')"
        >
          <span class="material-icons btn-icon">{{ isPaused ? 'play_arrow' : 'pause' }}</span>
          <span class="btn-text">{{ isPaused ? t('common.start') : t('common.pause') }}</span>
        </button>

        <!-- 查看详情 (打开底栏 Bottom Sheet) -->
        <button
          class="fluent-card-btn"
          @click="openDetail"
          :title="t('common.details')"
        >
          <span class="material-icons btn-icon">info</span>
          <span class="btn-text">{{ t('common.details') }}</span>
        </button>

        <!-- 任务属性 -->
        <button
          class="fluent-card-btn"
          @click="openProps"
          :title="t('ribbon.tabs.torrentProps')"
        >
          <span class="material-icons btn-icon">tune</span>
          <span class="btn-text">{{ t('ribbon.tabs.torrentProps') }}</span>
        </button>

        <!-- 删除 -->
        <button
          class="fluent-card-btn btn-danger"
          @click="removeTorrent"
          :title="t('common.delete')"
        >
          <span class="material-icons btn-icon">delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Torrent, TorrentStatus } from '../api/types';
import { state, selectTorrent, formatBytes, formatSpeed, formatETA } from '../stores/transmission';
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
  // 如果有多选状态，点击卡片直接作为切换多选
  if (state.selectedIds.length > 0) {
    selectTorrent(props.torrent.id, true);
  } else {
    // 否则单选激活该卡片
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
    await rpc.startTorrents([props.torrent.id]);
  } else {
    await rpc.stopTorrents([props.torrent.id]);
  }
}

async function removeTorrent() {
  if (confirm(t('menu.confirmRemove', { count: 1 }))) {
    const deleteData = confirm(t('menu.confirmRemoveData', { count: 1 }));
    await rpc.removeTorrents([props.torrent.id], deleteData);
    if (state.selectedId === props.torrent.id) {
      state.selectedId = null;
    }
  }
}
</script>

<style scoped>
.fluent-torrent-card {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  box-shadow: 0 0 0 1px var(--fluent-accent), 0 2px 8px rgba(0, 120, 212, 0.12);
}

.card-inner {
  padding: 10px 12px;
}

/* 头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
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
}

.title-block {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  padding: 2px 7px;
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
  color: #555;
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

.torrent-name {
  font-size: 13px;
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
  margin: 8px 0 6px;
}

.fluent-progress-track {
  width: 100%;
  height: 5px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
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

/* 指标网格 */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 8px;
  font-size: 11.5px;
  line-height: 1.3;
}

.meta-cell {
  display: flex;
  align-items: baseline;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-cell.text-right {
  justify-content: flex-end;
}

.meta-label {
  color: var(--md-text-secondary);
  font-size: 11px;
}

.meta-value {
  color: var(--md-text-primary);
  font-size: 11.5px;
}

.meta-sub {
  color: var(--md-text-secondary);
  font-size: 10.5px;
  font-weight: normal;
}

.font-bold {
  font-weight: 600;
}

.speed-down {
  color: #107c41;
}

.speed-up {
  color: #0078d4;
}

.text-warning {
  color: #b26b00;
}

/* 警告徽标 */
.badges-row {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fluent-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-icon {
  font-size: 13px;
}

.badge-warning {
  background-color: rgba(255, 185, 0, 0.15);
  color: #b26b00;
  border: 1px solid rgba(255, 185, 0, 0.3);
}

.badge-danger {
  background-color: rgba(209, 52, 56, 0.12);
  color: #d13438;
  border: 1px solid rgba(209, 52, 56, 0.25);
}

/* 底部操作条 */
.card-action-bar {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--fluent-border-subtle);
  display: flex;
  align-items: center;
  gap: 6px;
}

.fluent-card-btn {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-card-btn:active {
  background-color: var(--fluent-bg-hover);
  transform: scale(0.97);
}

.fluent-card-btn .btn-icon {
  font-size: 16px;
}

.action-play.btn-start {
  color: #107c41;
  border-color: rgba(16, 124, 65, 0.3);
  background-color: rgba(16, 124, 65, 0.05);
}

.action-play.btn-pause {
  color: #d83b01;
  border-color: rgba(216, 59, 1, 0.3);
  background-color: rgba(216, 59, 1, 0.05);
}

.fluent-card-btn.btn-danger {
  margin-left: auto;
  color: #d13438;
  border-color: rgba(209, 52, 56, 0.3);
  background-color: rgba(209, 52, 56, 0.05);
  padding: 0 8px;
}
</style>
