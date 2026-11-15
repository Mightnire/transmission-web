<template>
  <div class="md-card torrent-card" :class="{ selected: isSelected }" @click="selectCard" v-ripple>
    <div class="md-card-content">
      <!-- 标题栏与状态图标 -->
      <div class="torrent-header">
        <span class="material-icons status-icon" :class="statusClass">{{ statusIcon }}</span>
        <div class="torrent-title" :title="torrent.name">{{ torrent.name }}</div>
      </div>

      <!-- 真实进度条 (绝对按 percentDone 计算！) -->
      <div class="md-progress-track" style="margin: 12px 0 8px;">
        <div
          class="md-progress-bar"
          :class="progressBarClass"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

        <!-- 统计指标网格 -->
        <div class="torrent-meta">
          <span class="meta-item bold-percent" :style="isChecking ? 'color: var(--md-warning);' : ''">
            {{ progressPercent.toFixed(1) }}%{{ isChecking ? ` (${t('status.checking')})` : '' }}
          </span>
          <span class="meta-item">
            {{ formatBytes(torrent.totalSize * torrent.percentDone) }} / {{ formatBytes(torrent.totalSize) }}
          </span>
        <span class="meta-item down" v-if="torrent.rateDownload > 0">
          ↓ {{ formatSpeed(torrent.rateDownload) }}
        </span>
        <span class="meta-item up" v-if="torrent.rateUpload > 0">
          ↑ {{ formatSpeed(torrent.rateUpload) }}
        </span>
        <span class="meta-item" v-if="torrent.eta > 0">
          {{ t('common.eta') }}: {{ formatETA(torrent.eta) }}
        </span>
        <span class="meta-item peers" :title="t('common.peers')">
          Peers: {{ torrent.peersConnected }}
        </span>
      </div>

      <!-- 坏块与网络浪费损耗专属徽标 (特色功能) -->
      <div class="badges-row" v-if="torrent.corruptEver > 0 || torrent.error !== 0">
        <span class="md-badge md-badge-error" v-if="torrent.corruptEver > 0" :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })">
          <span class="material-icons" style="font-size: 14px; margin-right: 2px;">warning</span>
          {{ t('common.corrupt') }}: {{ formatBytes(torrent.corruptEver) }}
        </span>
        <span class="md-badge md-badge-error" v-if="torrent.error !== 0">
          {{ torrent.errorString || t('sidebar.errors') }}
        </span>
      </div>

      <!-- 底部快捷操作栏 -->
      <div class="card-actions" @click.stop>
        <button
          class="md-btn md-btn-flat"
          @click="togglePlay"
          :title="isPaused ? t('common.start') : t('common.pause')"
        >
          <span class="material-icons">{{ isPaused ? 'play_arrow' : 'pause' }}</span>
          {{ isPaused ? t('common.start') : t('common.pause') }}
        </button>

        <button class="md-btn md-btn-flat" @click="verifyTorrent" :title="t('toolbar.verifyTitle')">
          <span class="material-icons">refresh</span>
          {{ t('common.verify') }}
        </button>

        <button class="md-btn md-btn-flat delete-btn" @click="removeTorrent" :title="t('toolbar.deleteTitle')">
          <span class="material-icons">delete</span>
          {{ t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Torrent, TorrentStatus } from '../api/types';
import { state, formatBytes, formatSpeed, formatETA } from '../stores/transmission';
import { t } from '../locales';
import { rpc } from '../api/rpc';

const props = defineProps<{ torrent: Torrent }>();

const isSelected = computed(() => state.selectedId === props.torrent.id);
const isPaused = computed(() => props.torrent.status === TorrentStatus.STOPPED);
const isChecking = computed(() => props.torrent.status === TorrentStatus.CHECK || props.torrent.status === TorrentStatus.CHECK_WAIT);
const progressPercent = computed(() => {
  if (isChecking.value) {
    return (props.torrent.recheckProgress || 0) * 100;
  }
  return props.torrent.percentDone * 100;
});

const statusIcon = computed(() => {
  if (props.torrent.error !== 0) return 'error_outline';
  switch (props.torrent.status) {
    case TorrentStatus.DOWNLOAD:
      return 'arrow_downward';
    case TorrentStatus.SEED:
      return 'arrow_upward';
    case TorrentStatus.CHECK:
      return 'hourglass_top';
    case TorrentStatus.STOPPED:
      return props.torrent.percentDone >= 1 ? 'check_circle_outline' : 'pause_circle_outline';
    default:
      return 'help_outline';
  }
});

const statusClass = computed(() => {
  if (props.torrent.error !== 0) return 'error';
  if (props.torrent.status === TorrentStatus.DOWNLOAD) return 'download';
  if (props.torrent.status === TorrentStatus.SEED) return 'seed';
  return 'default';
});

const progressBarClass = computed(() => {
  if (props.torrent.error !== 0) return 'error';
  if (isChecking.value) return 'warning';
  if (props.torrent.status === TorrentStatus.SEED || props.torrent.percentDone >= 1) return 'success';
  return '';
});

function selectCard() {
  if (state.selectedId === props.torrent.id) {
    state.selectedId = null;
    state.activeTorrentDetail = null;
  } else {
    state.selectedId = props.torrent.id;
  }
}

async function togglePlay() {
  if (isPaused.value) {
    await rpc.startTorrents([props.torrent.id]);
  } else {
    await rpc.stopTorrents([props.torrent.id]);
  }
}

async function verifyTorrent() {
  await rpc.verifyTorrents([props.torrent.id]);
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
.torrent-card {
  cursor: pointer;
}

.torrent-card.selected {
  border-left: 4px solid var(--md-primary);
  background-color: rgba(63, 81, 181, 0.04);
}

.torrent-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.status-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-icon.download {
  color: var(--md-info);
}

.status-icon.seed {
  color: var(--md-success);
}

.status-icon.error {
  color: var(--md-error);
}

.status-icon.default {
  color: var(--md-text-secondary);
}

.torrent-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-all;
}

.torrent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--md-text-secondary);
}

.meta-item.bold-percent {
  font-weight: 700;
  color: var(--md-text-primary);
}

.meta-item.down {
  color: #00897b;
  font-weight: 500;
}

.meta-item.up {
  color: #f57c00;
  font-weight: 500;
}

.badges-row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-actions {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--md-divider);
  display: flex;
  gap: 8px;
}

.card-actions .md-btn {
  font-size: 12px;
  height: 32px;
  padding: 0 10px;
  gap: 4px;
}

.card-actions .delete-btn {
  color: var(--md-error);
  margin-left: auto;
}
</style>
