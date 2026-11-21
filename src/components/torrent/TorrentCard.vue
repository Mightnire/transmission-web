<template>
  <div
    class="fluent-torrent-card"
    :class="{ selected: isSelected }"
    @click="handleCardClick"
  >
    <!-- 卡片主体内容 -->
    <div class="card-inner">
      <!-- 1. 顶部：选择框 + 种子名称 (居左占满) + 状态小气泡 (统一度量置于最右侧) -->
      <div class="card-header">
        <label class="checkbox-wrapper" @click.stop>
          <input
            type="checkbox"
            class="fluent-checkbox"
            :checked="isSelected"
            @change="toggleSelect"
          />
        </label>

        <div class="torrent-name" :title="torrent.name">
          {{ torrent.name }}
        </div>

        <div class="header-pills">
          <!-- 优先级标签 (仅在非普通优先级时展示) -->
          <span
            class="prio-pill prio-high"
            v-if="torrent.bandwidthPriority === Priority.HIGH"
            :title="t('props.high')"
          >
            {{ t('props.high') }}
          </span>
          <span
            class="prio-pill prio-low"
            v-if="torrent.bandwidthPriority === Priority.LOW"
            :title="t('props.low')"
          >
            {{ t('props.low') }}
          </span>

          <!-- 坏块损耗胶囊 -->
          <span
            class="corrupt-pill"
            v-if="torrent.corruptEver > 0"
            :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })"
          >
            <FluentIcon name="warning" class="pill-icon" />
            <span>{{ t('common.corrupt') }}: {{ formatBytes(torrent.corruptEver) }}</span>
          </span>

          <!-- 核心状态 (始终靠在最右侧) -->
          <span class="status-pill" :class="statusClass">
            <FluentIcon :name="statusIcon" class="pill-icon" />
            <span class="pill-text">{{ statusText }}</span>
          </span>
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

      <!-- 3. 统计指标 (严格单行不换行紧凑排版，小屏超出截断或隐藏次要节点) -->
      <div class="metrics-block">
        <div class="metric-row single-metric-line">
          <div class="metric-group-left">
            <span class="metric-pct" :class="{ 'text-warning': isChecking }">
              {{ progressPercent.toFixed(1) }}%
            </span>
            <span class="metric-divider">·</span>
            <span class="metric-size" v-if="torrent.totalSize > 0">
              {{ formatBytes(torrent.totalSize * torrent.percentDone) }} / {{ formatBytes(torrent.totalSize) }}
            </span>
            <div class="metric-speeds">
              <span class="speed-item speed-down" :class="{ inactive: torrent.rateDownload === 0 }">
                <span class="speed-arrow">↓</span> {{ formatSpeed(torrent.rateDownload) }}
              </span>
              <span class="speed-item speed-up" :class="{ inactive: torrent.rateUpload === 0 }">
                <span class="speed-arrow">↑</span> {{ formatSpeed(torrent.rateUpload) }}
              </span>
            </div>
          </div>

          <div class="metric-group-right">
            <span class="metric-eta" v-if="torrent.eta > 0 && !isPaused && torrent.percentDone < 1">
              <FluentIcon name="schedule" class="mini-icon" />
              {{ formatETA(torrent.eta) }}
            </span>
            <span class="metric-ratio" v-if="torrent.uploadRatio >= 0">
              {{ t('common.ratio') }}: {{ torrent.uploadRatio.toFixed(2) }}
            </span>
            <span class="metric-peers" :title="`${torrent.peersGettingFromUs} ↑ / ${torrent.peersSendingToUs} ↓`">
              {{ t('common.peers') }}: {{ torrent.peersConnected }}
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
import { Torrent, TorrentStatus, Priority } from '../../api/types';
import {
  state,
  selectTorrent,
  formatBytes,
  formatSpeed,
  formatETA,
  openConfirmRemove,
  startTorrentsAction,
  stopTorrentsAction,
} from '../../stores/transmission';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';

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
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding-top: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.fluent-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--fluent-accent);
  border-radius: 3px;
}

.header-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

.status-pill,
.corrupt-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  white-space: nowrap;
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
  background-color: rgba(255, 185, 0, 0.18);
  color: #b26b00;
  border: 1px solid rgba(255, 185, 0, 0.3);
}

.torrent-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* 进度条 */
.progress-container {
  margin: 6px 0;
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
  gap: 2px;
  font-size: 11.5px;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.single-metric-line {
  white-space: nowrap;
  overflow: hidden;
}

.metric-group-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-pct {
  font-size: 12.5px;
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
  gap: 8px;
  font-size: 11px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
  margin-left: auto;
  white-space: nowrap;
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
  display: inline-flex;
  align-items: center;
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

.prio-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  white-space: nowrap;
}

.prio-pill.prio-high {
  color: #c62828;
  background: rgba(198, 40, 40, 0.12);
  border: 1px solid rgba(198, 40, 40, 0.25);
}

.prio-pill.prio-low {
  color: #0288d1;
  background: rgba(3, 169, 244, 0.12);
  border: 1px solid rgba(3, 169, 244, 0.25);
}

@media (max-width: 480px) {
  .metric-peers {
    display: none;
  }
}
</style>
