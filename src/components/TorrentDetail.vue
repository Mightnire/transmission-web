<template>
  <div class="desktop-detail-dock" v-if="state.detailOpen && activeTorrent">
    <!-- 面板顶部控制与标题 -->
    <div class="dock-header">
      <div class="dock-title-block">
        <span class="material-icons info-icon" :class="{ 'error-icon-red': activeTorrent.error !== 0 }">
          {{ activeTorrent.error !== 0 ? 'error' : 'info' }}
        </span>
        <span class="dock-name" :title="activeTorrent.name">{{ activeTorrent.name }}</span>
        <span class="dock-error-badge" v-if="activeTorrent.error !== 0">
          {{ getErrorCategoryTitle(activeTorrent.error) }}
        </span>
        <span class="dock-meta" v-if="activeTorrent.status === 2 || activeTorrent.status === 1">
          <span style="color: #e65100; font-weight: 600;">{{ t('detail.checking', { pct: ((activeTorrent.recheckProgress || 0) * 100).toFixed(1) }) }}</span> · 
          {{ t('detail.doneSize', {
            done: formatBytes((activeTorrent.totalSize || 0) * (activeTorrent.percentDone || 0)),
            total: formatBytes(activeTorrent.totalSize || 0)
          }) }}
        </span>
        <span class="dock-meta" v-else>
          {{ t('detail.progress', {
            pct: ((activeTorrent.percentDone || 0) * 100).toFixed(1),
            done: formatBytes((activeTorrent.totalSize || 0) * (activeTorrent.percentDone || 0)),
            total: formatBytes(activeTorrent.totalSize || 0)
          }) }}
        </span>
      </div>

      <div class="dock-actions">
        <!-- 最小化 / 关闭 -->
        <button class="dock-btn" @click="state.detailOpen = false" :title="t('detail.minimize')">
          <span class="material-icons">expand_more</span>
        </button>
        <button class="dock-btn" @click="closeDetail" :title="t('detail.close')">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>

    <!-- 标签页栏 (BiglyBT 风格多标签) -->
    <div class="dock-tabs">
      <button
        class="tab-item"
        :class="{ active: currentTab === 'general' }"
        @click="currentTab = 'general'"
      >
        <span class="material-icons tab-icon">dashboard</span>
        <span>{{ t('detail.tabs.general') }}</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'files' }"
        @click="currentTab = 'files'"
      >
        <span class="material-icons tab-icon">folder</span>
        <span>{{ t('detail.tabs.files') }}</span>
        <span class="tab-badge" v-if="activeTorrent.files">({{ activeTorrent.files.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'peers' }"
        @click="currentTab = 'peers'"
      >
        <span class="material-icons tab-icon">people</span>
        <span>{{ t('detail.tabs.peers') }}</span>
        <span class="tab-badge" v-if="activeTorrent.peers">({{ activeTorrent.peers.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'trackers' }"
        @click="currentTab = 'trackers'"
      >
        <span class="material-icons tab-icon">alt_route</span>
        <span>{{ t('detail.tabs.trackers') }}</span>
        <span class="tab-badge" v-if="activeTorrent.trackerStats">({{ activeTorrent.trackerStats.length }})</span>
      </button>
    </div>

    <!-- 任务异常与错误报警横幅 (若任务报错) -->
    <div class="torrent-error-banner" v-if="activeTorrent.error !== 0 || activeTorrent.errorString">
      <div class="banner-main">
        <span class="material-icons banner-icon">error</span>
        <div class="banner-text">
          <div class="banner-title-line">
            <span class="banner-title">{{ getErrorCategoryTitle(activeTorrent.error) }}</span>
            <span class="banner-code" v-if="activeTorrent.error">(Code {{ activeTorrent.error }})</span>
          </div>
          <div class="banner-msg">{{ activeTorrent.errorString }}</div>
          <div class="banner-help" v-if="activeTorrent.error === 3">
            {{ t('detail.errorAlert.localHelp') }}
          </div>
          <div class="banner-help" v-else-if="activeTorrent.error === 1 || activeTorrent.error === 2">
            {{ t('detail.errorAlert.trackerHelp') }}
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <button class="banner-action-btn" @click="handleVerifyTorrent" :title="t('detail.errorAlert.verifyBtn')">
          <span class="material-icons">refresh</span>
          <span>{{ t('detail.errorAlert.verifyBtn') }}</span>
        </button>
        <button class="banner-action-btn" @click="handleSetLocation" :title="t('detail.errorAlert.setLocationBtn')">
          <span class="material-icons">folder_open</span>
          <span>{{ t('detail.errorAlert.setLocationBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- 标签页主体内容 -->
    <div class="dock-content">
      <!-- 1. 常规属性 (General) -->
      <div v-if="currentTab === 'general'" class="tab-pane general-pane">
        <div class="general-grid">
          <!-- 传输统计卡片 -->
          <div class="info-card">
            <div class="card-title">{{ t('detail.general.transfer') }}</div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.progress') }}</span>
              <span class="value font-bold">{{ ((activeTorrent.percentDone || 0) * 100).toFixed(1) }}%</span>
            </div>
            <div class="info-row" v-if="activeTorrent.status === 2">
              <span class="label" style="color: #e65100; font-weight: 600;">{{ t('detail.general.checkProgress') }}</span>
              <span class="value font-bold" style="color: #e65100;">{{ ((activeTorrent.recheckProgress || 0) * 100).toFixed(1) }}%</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.haveValid') }}</span>
              <span class="value">{{ formatBytes(activeTorrent.haveValid) }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.downloadedEver') }}</span>
              <span class="value">{{ formatBytes(activeTorrent.downloadedEver) }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.uploadedEver') }}</span>
              <span class="value">{{ formatBytes(activeTorrent.uploadedEver) }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.ratio') }}</span>
              <span class="value font-bold" style="color: var(--md-primary);">
                {{ activeTorrent.uploadRatio >= 0 ? activeTorrent.uploadRatio.toFixed(2) : '0.00' }}
              </span>
            </div>
            <div class="info-row" v-if="activeTorrent.corruptEver > 0">
              <span class="label text-danger">{{ t('detail.general.corrupt') }}</span>
              <span class="value text-danger font-bold">{{ formatBytes(activeTorrent.corruptEver) }}</span>
            </div>
          </div>

          <!-- 种子元数据卡片 -->
          <div class="info-card">
            <div class="card-title">{{ t('detail.general.info') }}</div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.savePath') }}</span>
              <span class="value selectable" :title="activeTorrent.downloadDir">{{ activeTorrent.downloadDir }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.hash') }}</span>
              <span class="value selectable monospace font-sm">{{ activeTorrent.hashString }}</span>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <span class="label">{{ t('detail.general.magnet') }}</span>
              <button class="copy-magnet-btn" @click="copyMagnet">
                <span class="material-icons" style="font-size: 14px;">link</span>
                {{ t('detail.general.copyMagnet') }}
              </button>
            </div>
            <div class="info-row" v-if="activeTorrent.pieceCount">
              <span class="label">{{ t('detail.general.pieces') }}</span>
              <span class="value">{{ t('detail.general.piecesUnit', { count: activeTorrent.pieceCount, size: formatBytes(activeTorrent.pieceSize) }) }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.creator">
              <span class="label">{{ t('detail.general.creator') }}</span>
              <span class="value">{{ activeTorrent.creator }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.comment">
              <span class="label">{{ t('detail.general.comment') }}</span>
              <span class="value">{{ activeTorrent.comment }}</span>
            </div>
          </div>

          <!-- 时间统计卡片 -->
          <div class="info-card">
            <div class="card-title">{{ t('detail.general.timing') }}</div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.addedDate') }}</span>
              <span class="value">{{ formatDate(activeTorrent.addedDate) }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.doneDate > 0">
              <span class="label">{{ t('detail.general.doneDate') }}</span>
              <span class="value">{{ formatDate(activeTorrent.doneDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.downLimit') }}</span>
              <span class="value">{{ activeTorrent.downloadLimited ? `${activeTorrent.downloadLimit} KB/s` : t('detail.general.unlimited') }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.upLimit') }}</span>
              <span class="value">{{ activeTorrent.uploadLimited ? `${activeTorrent.uploadLimit} KB/s` : t('detail.general.unlimited') }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.priority') }}</span>
              <span class="value">{{ getPriorityText(activeTorrent.bandwidthPriority) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 文件列表 (Files) -->
      <div v-else-if="currentTab === 'files'" class="tab-pane files-pane">
        <FileTree
          v-if="activeTorrent.files && activeTorrent.fileStats"
          :torrentId="activeTorrent.id"
          :files="activeTorrent.files"
          :fileStats="activeTorrent.fileStats"
        />
        <div class="empty-hint" v-else>
          <span class="material-icons">hourglass_empty</span>
          <p>{{ t('detail.files.loading') }}</p>
        </div>
      </div>

      <!-- 3. 节点列表 (Peers) -->
      <div v-else-if="currentTab === 'peers'" class="tab-pane peers-pane">
        <table class="detail-table" v-if="activeTorrent.peers && activeTorrent.peers.length > 0">
          <thead>
            <tr>
              <th>{{ t('detail.peers.colIp') }}</th>
              <th>{{ t('detail.peers.colClient') }}</th>
              <th>{{ t('detail.peers.colDownSpeed') }}</th>
              <th>{{ t('detail.peers.colUpSpeed') }}</th>
              <th>{{ t('detail.peers.colProgress') }}</th>
              <th>{{ t('detail.peers.colFlags') }}</th>
              <th>{{ t('detail.peers.colProtocol') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="peer in activeTorrent.peers" :key="peer.address">
              <td class="monospace">{{ peer.address }}:{{ peer.port }}</td>
              <td>{{ peer.clientName || t('detail.peers.unknownClient') }}</td>
              <td class="down-val">{{ peer.rateToClient > 0 ? formatSpeed(peer.rateToClient) : '—' }}</td>
              <td class="up-val">{{ peer.rateToPeer > 0 ? formatSpeed(peer.rateToPeer) : '—' }}</td>
              <td>{{ (peer.progress * 100).toFixed(1) }}%</td>
              <td class="monospace font-sm">{{ peer.flagStr || '—' }}</td>
              <td>{{ peer.isUTP ? 'uTP' : 'TCP' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <span class="material-icons">cloud_off</span>
          <p>{{ t('detail.peers.empty') }}</p>
        </div>
      </div>

      <!-- 4. 服务器列表 (Trackers) -->
      <div v-else-if="currentTab === 'trackers'" class="tab-pane trackers-pane">
        <div class="tracker-actions-bar">
          <button class="md-btn md-btn-flat" @click="askMorePeers">
            <span class="material-icons">sync</span>
            {{ t('detail.trackers.announceNow') }}
          </button>
          <button class="md-btn md-btn-flat" @click="addTrackersPrompt">
            <span class="material-icons">add</span>
            {{ t('detail.trackers.addTrackers') }}
          </button>
        </div>

        <table class="detail-table" v-if="activeTorrent.trackerStats && activeTorrent.trackerStats.length > 0">
          <thead>
            <tr>
              <th>{{ t('detail.trackers.colTier') }}</th>
              <th>{{ t('detail.trackers.colUrl') }}</th>
              <th>{{ t('detail.trackers.colStatus') }}</th>
              <th>{{ t('detail.trackers.colSeeders') }}</th>
              <th>{{ t('detail.trackers.colLeechers') }}</th>
              <th>{{ t('detail.trackers.colLastPeers') }}</th>
              <th>{{ t('detail.trackers.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tr in activeTorrent.trackerStats" :key="tr.id">
              <td>{{ t('detail.trackers.tier', { tier: tr.tier }) }}</td>
              <td class="selectable font-sm">{{ tr.announce }}</td>
              <td>
                <span class="tracker-res-badge" :class="tr.hasAnnounced ? 'ok' : 'wait'">
                  {{ tr.lastAnnounceResult || t('detail.trackers.waiting') }}
                </span>
              </td>
              <td>{{ tr.seederCount >= 0 ? tr.seederCount : '—' }}</td>
              <td>{{ tr.leecherCount >= 0 ? tr.leecherCount : '—' }}</td>
              <td>{{ tr.lastAnnouncePeerCount }}</td>
              <td>
                <button class="remove-tr-btn" @click="removeTracker(tr.id)" :title="t('detail.trackers.removeTitle')">
                  <span class="material-icons" style="font-size: 14px;">delete_outline</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <span class="material-icons">alt_route</span>
          <p>{{ t('detail.trackers.empty') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { state, formatBytes, formatSpeed } from '../stores/transmission';
import { Priority } from '../api/types';
import { t } from '../locales';
import { rpc } from '../api/rpc';
import FileTree from './FileTree.vue';

const currentTab = ref<'general' | 'files' | 'peers' | 'trackers'>('general');

const activeTorrent = computed(() => {
  if (state.activeTorrentDetail && state.activeTorrentDetail.id === state.selectedId) {
    return state.activeTorrentDetail;
  }
  return state.torrents.find((t) => t.id === state.selectedId) || null;
});

function closeDetail() {
  state.detailOpen = false;
  state.selectedId = null;
  state.activeTorrentDetail = null;
}

function copyMagnet() {
  if (activeTorrent.value?.magnetLink) {
    navigator.clipboard.writeText(activeTorrent.value.magnetLink);
    alert(t('menu.magnetCopied'));
  }
}

async function addTrackersPrompt() {
  if (!activeTorrent.value) return;
  const input = prompt(t('detail.trackers.promptAdd'));
  if (!input) return;
  const urls = input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http') || s.startsWith('udp'));
  if (urls.length === 0) {
    alert(t('detail.trackers.noValidUrls'));
    return;
  }
  await rpc.torrentSet({
    ids: [activeTorrent.value.id],
    trackerAdd: urls,
  });
  alert(t('detail.trackers.addSuccess', { count: urls.length }));
  // 刷新详情
  const refreshed = await rpc.getTorrentDetail(activeTorrent.value.id);
  if (refreshed) {
    state.activeTorrentDetail = { ...activeTorrent.value, ...refreshed };
  }
}

async function removeTracker(trackerId: number) {
  if (!activeTorrent.value) return;
  if (!confirm(t('detail.trackers.confirmRemove'))) return;
  await rpc.torrentSet({
    ids: [activeTorrent.value.id],
    trackerRemove: [trackerId],
  });
  const refreshed = await rpc.getTorrentDetail(activeTorrent.value.id);
  if (refreshed) {
    state.activeTorrentDetail = { ...activeTorrent.value, ...refreshed };
  }
}

function askMorePeers() {
  if (state.selectedId !== null) {
    rpc.torrentReannounce([state.selectedId]);
  }
}

function formatDate(ts?: number): string {
  if (!ts || ts === 0) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function getPriorityText(p?: Priority): string {
  if (p === Priority.HIGH) return t('props.high');
  if (p === Priority.LOW) return t('props.low');
  return t('props.normal');
}

function getErrorCategoryTitle(error?: number): string {
  if (error === 1) return t('detail.errorAlert.categoryWarning');
  if (error === 2) return t('detail.errorAlert.categoryTracker');
  if (error === 3) return t('detail.errorAlert.categoryLocal');
  return t('detail.errorAlert.categoryUnknown');
}

async function handleVerifyTorrent() {
  if (!activeTorrent.value) return;
  await rpc.torrentVerify([activeTorrent.value.id]);
  const refreshed = await rpc.getTorrentDetail(activeTorrent.value.id);
  if (refreshed) {
    state.activeTorrentDetail = { ...activeTorrent.value, ...refreshed };
  }
}

async function handleSetLocation() {
  if (!activeTorrent.value) return;
  const currentDir = activeTorrent.value.downloadDir || '/mnt';
  const newLoc = prompt(t('menu.promptLocation'), currentDir);
  if (newLoc && newLoc !== currentDir) {
    const moveData = confirm(t('menu.confirmMoveData'));
    await rpc.torrentSetLocation([activeTorrent.value.id], newLoc, moveData);
    const refreshed = await rpc.getTorrentDetail(activeTorrent.value.id);
    if (refreshed) {
      state.activeTorrentDetail = { ...activeTorrent.value, ...refreshed };
    }
  }
}
</script>

<style scoped>
.desktop-detail-dock {
  height: 280px;
  background-color: var(--md-surface);
  border-top: 2px solid var(--md-primary);
  display: flex;
  flex-direction: column;
  user-select: none;
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.dock-header {
  height: 36px;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--md-divider);
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dock-title-block {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
}

.info-icon {
  font-size: 16px;
  color: var(--md-primary);
}

.error-icon-red {
  color: var(--md-error) !important;
}

.dock-error-badge {
  background-color: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #c62828;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}

/* 错误报警横幅 */
.torrent-error-banner {
  background-color: #ffebee;
  border-bottom: 1px solid #ffcdd2;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.banner-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.banner-icon {
  color: #d32f2f;
  font-size: 22px;
  margin-top: 1px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
}

.banner-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #b71c1c;
  font-size: 12px;
}

.banner-code {
  font-weight: normal;
  font-size: 11px;
  opacity: 0.8;
}

.banner-msg {
  color: #c62828;
  font-weight: 500;
  margin-top: 2px;
  word-break: break-all;
}

.banner-help {
  color: #424242;
  font-size: 11px;
  margin-top: 3px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.banner-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #fff;
  border: 1px solid #ef9a9a;
  color: #c62828;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.banner-action-btn:hover {
  background-color: #fbe9e7;
  border-color: #e57373;
}

.banner-action-btn .material-icons {
  font-size: 14px;
}

.dock-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 450px;
}

.dock-meta {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.dock-actions {
  display: flex;
  gap: 4px;
}

.dock-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
}

.dock-btn:hover {
  background-color: rgba(0, 0, 0, 0.08);
  color: var(--md-text-primary);
}

.dock-btn .material-icons {
  font-size: 16px;
}

/* 标签栏 */
.dock-tabs {
  height: 34px;
  display: flex;
  border-bottom: 1px solid var(--md-divider);
  background-color: var(--md-surface);
  padding: 0 8px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.tab-item:hover {
  color: var(--md-primary);
}

.tab-item.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
}

.tab-badge {
  font-size: 10px;
  opacity: 0.8;
}

/* 标签内容容器 */
.dock-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.tab-pane {
  padding: 12px;
  height: 100%;
  box-sizing: border-box;
}

/* 常规面板网格 */
.general-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.info-card {
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--md-divider);
  border-radius: 4px;
  padding: 10px 14px;
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--md-primary);
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.info-row .label {
  color: var(--md-text-secondary);
}

.info-row .value {
  color: var(--md-text-primary);
}

.remove-tr-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.15s;
}

.remove-tr-btn:hover {
  color: var(--md-error);
  background: rgba(244, 67, 54, 0.1);
}

.copy-magnet-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(63, 81, 181, 0.08);
  border: 1px solid rgba(63, 81, 181, 0.2);
  color: var(--md-primary);
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-magnet-btn:hover {
  background: rgba(63, 81, 181, 0.16);
}

.selectable {
  user-select: text !important;
}

.monospace {
  font-family: monospace;
}

.font-sm {
  font-size: 11px;
}

.font-bold {
  font-weight: 600;
}

.text-danger {
  color: var(--md-error) !important;
}

/* 详情表格 */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.detail-table th {
  border-bottom: 1px solid var(--md-divider);
  padding: 6px 10px;
  color: var(--md-text-secondary);
  font-weight: 600;
  position: sticky;
  top: 0;
  background-color: var(--md-surface);
}

.detail-table td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 6px 10px;
}

.down-val { color: #2e7d32; font-family: monospace; }
.up-val { color: #ef6c00; font-family: monospace; }

.tracker-res-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.tracker-res-badge.wait {
  background-color: rgba(0, 0, 0, 0.06);
  color: var(--md-text-secondary);
}

.tracker-actions-bar {
  margin-bottom: 8px;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  color: var(--md-text-secondary);
  font-size: 13px;
}

.empty-hint .material-icons {
  font-size: 36px;
  margin-bottom: 6px;
  opacity: 0.5;
}
</style>
