<template>
  <!-- 移动端底面板半透明遮罩 (Teleport 到 body) -->
  <Teleport to="body">
    <div
      class="mobile-detail-backdrop"
      v-if="state.detailOpen && activeTorrent"
      @click="closeDetail"
    ></div>
  </Teleport>

  <div
    class="desktop-detail-dock"
    :class="{ 'detail-expanded': isDetailExpanded }"
    :style="{ '--detail-height': `${state.detailHeight}px` }"
    v-if="state.detailOpen && activeTorrent"
  >
    <!-- 桌面端拖拽调整高度手柄 -->
    <div class="dock-resize-handle" @mousedown.prevent="startResize" :title="t('detail.resizeHint')"></div>

    <!-- 移动端顶部滑动手柄条 -->
    <div class="sheet-drag-handle-bar mobile-only">
      <div class="sheet-drag-handle"></div>
    </div>

    <!-- 面板顶部控制与标题 -->
    <div class="dock-header">
      <div class="dock-title-block">
        <FluentIcon :name="activeTorrent.error !== 0 ? 'error' : 'info'" class="info-icon" :class="{ 'error-icon-red': activeTorrent.error !== 0 }" />
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
        <!-- 展开 / 收起高度 -->
        <button
          class="dock-btn"
          @click="toggleDetailHeight"
          :title="isDetailExpanded ? t('detail.collapsePanel') : t('detail.expandPanel')"
        >
          <FluentIcon :name="isDetailExpanded ? 'expand_more' : 'expand_less'" />
        </button>
        <button class="dock-btn" @click="closeDetail" :title="t('detail.close')">
          <FluentIcon name="close" />
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
        <FluentIcon name="dashboard" class="tab-icon" />
        <span>{{ t('detail.tabs.general') }}</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'files' }"
        @click="currentTab = 'files'"
      >
        <FluentIcon name="folder" class="tab-icon" />
        <span>{{ t('detail.tabs.files') }}</span>
        <span class="tab-badge" v-if="activeTorrent.files">({{ activeTorrent.files.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'pieces' }"
        @click="currentTab = 'pieces'"
      >
        <FluentIcon name="table_chart" class="tab-icon" />
        <span>{{ t('detail.tabs.pieces') }}</span>
        <span class="tab-badge" v-if="activeTorrent.pieceCount">({{ activeTorrent.pieceCount }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'peers' }"
        @click="currentTab = 'peers'"
      >
        <FluentIcon name="people" class="tab-icon" />
        <span>{{ t('detail.tabs.peers') }}</span>
        <span class="tab-badge" v-if="activeTorrent.peers">({{ activeTorrent.peers.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'trackers' }"
        @click="currentTab = 'trackers'"
      >
        <FluentIcon name="alt_route" class="tab-icon" />
        <span>{{ t('detail.tabs.trackers') }}</span>
        <span class="tab-badge" v-if="activeTorrent.trackerStats">({{ activeTorrent.trackerStats.length }})</span>
      </button>
    </div>

    <!-- 任务异常与错误报警横幅 (若任务报错) -->
    <div class="torrent-error-banner" v-if="activeTorrent.error !== 0 || activeTorrent.errorString">
      <div class="banner-main">
        <FluentIcon name="error" class="banner-icon" />
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
          <FluentIcon name="refresh" />
          <span>{{ t('detail.errorAlert.verifyBtn') }}</span>
        </button>
        <button class="banner-action-btn" @click="handleSetLocation" :title="t('detail.errorAlert.setLocationBtn')">
          <FluentIcon name="folder_open" />
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
                <FluentIcon name="link" style="font-size: 14px;" />
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

          <!-- 扩展信息卡片 -->
          <div class="info-card">
            <div class="card-title">{{ t('detail.general.extended') }}</div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.metadataProgress') }}</span>
              <span class="value">{{ ((activeTorrent.metadataPercentComplete ?? 1) * 100).toFixed(1) }}%</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.privateTorrent') }}</span>
              <span class="value">{{ activeTorrent.isPrivate ? t('detail.general.yes') : t('detail.general.no') }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.stalled') }}</span>
              <span class="value" :class="{ 'text-warning': activeTorrent.isStalled }">
                {{ activeTorrent.isStalled ? t('detail.general.yes') : t('detail.general.no') }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.fileCount') }}</span>
              <span class="value">{{ activeTorrent.files?.length ?? '—' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ t('detail.general.peerLimit') }}</span>
              <span class="value">{{ activeTorrent.maxConnectedPeers ?? activeTorrent.peerLimit ?? '—' }}</span>
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
          <FluentIcon name="hourglass_empty" />
          <p>{{ t('detail.files.loading') }}</p>
        </div>
      </div>

      <!-- 3. 区块映射 (Piece Map，类似 BiglyBT) -->
      <div v-else-if="currentTab === 'pieces'" class="tab-pane pieces-pane">
        <PieceMap
          :pieces="activeTorrent.pieces"
          :availability="activeTorrent.availability"
          :pieceCount="activeTorrent.pieceCount"
          :pieceSize="activeTorrent.pieceSize"
          :files="activeTorrent.files"
        />
      </div>

      <!-- 4. 节点列表 (Peers) -->
      <div v-else-if="currentTab === 'peers'" class="tab-pane peers-pane">
        <div class="peer-source-bar" v-if="activeTorrent.peersFrom && (peerSources.length > 0 || activeTorrent.webseeds?.length)">
          <span class="peer-source-label">{{ t('detail.peers.sources') }}</span>
          <span class="peer-source-chip" v-for="source in peerSources" :key="source.label">
            <i :style="{ backgroundColor: source.color }"></i>{{ source.label }}
            <b>{{ source.value }}</b>
          </span>
          <span class="peer-source-chip webseed-chip" v-if="activeTorrent.webseeds?.length">
            <FluentIcon name="cloud_download" />
            {{ t('detail.peers.webSeeds') }}
            <b>{{ activeTorrent.webseeds.length }}</b>
          </span>
        </div>
        <table class="detail-table" v-if="activeTorrent.peers && activeTorrent.peers.length > 0">
          <thead>
            <tr>
              <th>{{ t('detail.peers.colIp') }}</th>
              <th>{{ t('detail.peers.colClient') }}</th>
              <th>{{ t('detail.peers.colDownSpeed') }}</th>
              <th>{{ t('detail.peers.colUpSpeed') }}</th>
              <th v-if="peerHasByteStats">{{ t('detail.peers.colDownloaded') }}</th>
              <th v-if="peerHasByteStats">{{ t('detail.peers.colUploaded') }}</th>
              <th>{{ t('detail.peers.colEncrypted') }}</th>
              <th>{{ t('detail.peers.colDirection') }}</th>
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
              <td v-if="peerHasByteStats">{{ peer.bytesToClient !== undefined ? formatBytes(peer.bytesToClient) : '—' }}</td>
              <td v-if="peerHasByteStats">{{ peer.bytesToPeer !== undefined ? formatBytes(peer.bytesToPeer) : '—' }}</td>
              <td>{{ peer.isEncrypted ? t('detail.peers.encrypted') : '—' }}</td>
              <td>{{ peer.isIncoming ? t('detail.peers.incoming') : t('detail.peers.outgoing') }}</td>
              <td>{{ (peer.progress * 100).toFixed(1) }}%</td>
              <td class="monospace font-sm">{{ peer.flagStr || '—' }}</td>
              <td>{{ peer.isUTP ? 'uTP' : 'TCP' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <FluentIcon name="cloud_off" />
          <p>{{ t('detail.peers.empty') }}</p>
        </div>
      </div>

      <!-- 4. 服务器列表 (Trackers) -->
      <div v-else-if="currentTab === 'trackers'" class="tab-pane trackers-pane">
        <div class="tracker-actions-bar">
          <button class="md-btn md-btn-flat" @click="askMorePeers">
            <FluentIcon name="sync" />
            {{ t('detail.trackers.announceNow') }}
          </button>
          <button class="md-btn md-btn-flat" @click="addTrackersPrompt">
            <FluentIcon name="add" />
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
                <span
                  class="tracker-res-badge"
                  :class="trackerStatusClass(tr.lastAnnounceResult, tr.hasAnnounced)"
                  :title="tr.lastAnnounceResult || ''"
                >
                  <i class="tracker-status-dot"></i>
                  {{ trackerStatusLabel(tr.lastAnnounceResult) }}
                </span>
              </td>
              <td>{{ tr.seederCount >= 0 ? tr.seederCount : '—' }}</td>
              <td>{{ tr.leecherCount >= 0 ? tr.leecherCount : '—' }}</td>
              <td>{{ tr.lastAnnouncePeerCount }}</td>
              <td>
                <button class="remove-tr-btn" @click="removeTracker(tr.id)" :title="t('detail.trackers.removeTitle')">
                  <FluentIcon name="delete_outline" style="font-size: 14px;" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <FluentIcon name="alt_route" />
          <p>{{ t('detail.trackers.empty') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import {
  state,
  formatBytes,
  formatSpeed,
  openLocationDialog,
  openPrompt,
  openConfirm,
  showToast,
  describeError,
  copyTorrentMagnet,
  toggleDetailHeight,
  saveDetailHeight,
} from '../../stores/transmission';
import { Priority } from '../../api/types';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';
import FileTree from './FileTree.vue';
import PieceMap from './PieceMap.vue';

const currentTab = ref<'general' | 'files' | 'pieces' | 'peers' | 'trackers'>('general');

const activeTorrent = computed(() => {
  if (state.activeTorrentDetail && state.activeTorrentDetail.id === state.selectedId) {
    return state.activeTorrentDetail;
  }
  return state.torrents.find((t) => t.id === state.selectedId) || null;
});

const peerHasByteStats = computed(() => {
  return (activeTorrent.value?.peers || []).some(
    (peer) => peer.bytesToClient !== undefined || peer.bytesToPeer !== undefined
  );
});

const peerSources = computed(() => {
  const from = activeTorrent.value?.peersFrom;
  if (!from) return [];
  return [
    { label: t('detail.peers.sourceTracker'), value: from.fromTracker, color: '#0078d4' },
    { label: 'DHT', value: from.fromDht, color: '#8e44ad' },
    { label: 'PEX', value: from.fromPex, color: '#2e7d32' },
    { label: 'LPD', value: from.fromLpd, color: '#ef6c00' },
    { label: 'LTEP', value: from.fromLtep, color: '#00838f' },
    { label: t('detail.peers.sourceIncoming'), value: from.fromIncoming, color: '#6d4c41' },
    { label: t('detail.peers.sourceCache'), value: from.fromCache, color: '#757575' },
    { label: t('detail.peers.sourceHolepunch'), value: from.fromHolepunch || 0, color: '#c62828' },
  ].filter((source) => source.value > 0);
});

const isDetailExpanded = computed(() => state.detailHeight > 420);

let resizeStartY = 0;
let resizeStartHeight = 0;
let resizing = false;

function applyDetailHeight(height: number) {
  const max = Math.max(360, Math.round(window.innerHeight * 0.75));
  state.detailHeight = Math.min(max, Math.max(180, Math.round(height)));
}

function onResizeMove(event: MouseEvent) {
  if (!resizing) return;
  applyDetailHeight(resizeStartHeight + (resizeStartY - event.clientY));
}

function stopResize() {
  if (!resizing) return;
  resizing = false;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  saveDetailHeight();
}

function startResize(event: MouseEvent) {
  resizing = true;
  resizeStartY = event.clientY;
  resizeStartHeight = state.detailHeight;
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'ns-resize';
}

onUnmounted(stopResize);

function closeDetail() {
  state.detailOpen = false;
  state.selectedId = null;
  state.activeTorrentDetail = null;
}

function copyMagnet() {
  if (activeTorrent.value) {
    copyTorrentMagnet(activeTorrent.value.id);
  }
}

function addTrackersPrompt() {
  if (!activeTorrent.value) return;
  const torrentId = activeTorrent.value.id;
  openPrompt({
    title: t('detail.trackers.addTrackers'),
    label: t('detail.trackers.promptAdd'),
    multiline: true,
    rows: 4,
    placeholder: 'udp://tracker.example.org:6969/announce',
    onConfirm: async (input) => {
      const urls = input
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http') || s.startsWith('udp'));
      if (urls.length === 0) {
        throw new Error(t('detail.trackers.noValidUrls'));
      }
      await rpc.torrentSet({ ids: [torrentId], trackerAdd: urls });
      showToast(t('detail.trackers.addSuccess', { count: urls.length }), 'success');
      const refreshed = await rpc.getTorrentDetail(torrentId);
      if (refreshed) {
        state.activeTorrentDetail = { ...(activeTorrent.value || {}), ...refreshed };
      }
    },
  });
}

function removeTracker(trackerId: number) {
  if (!activeTorrent.value) return;
  const torrentId = activeTorrent.value.id;
  openConfirm({
    title: t('detail.trackers.removeTitle'),
    message: t('detail.trackers.confirmRemove'),
    confirmText: t('common.delete'),
    danger: true,
    onConfirm: async () => {
      await rpc.torrentSet({ ids: [torrentId], trackerRemove: [trackerId] });
      showToast(t('toast.trackerRemoved'), 'success');
      const refreshed = await rpc.getTorrentDetail(torrentId);
      if (refreshed) {
        state.activeTorrentDetail = { ...(activeTorrent.value || {}), ...refreshed };
      }
    },
  });
}

async function askMorePeers() {
  if (state.selectedId === null) return;
  try {
    await rpc.torrentReannounce([state.selectedId]);
    showToast(t('toast.reannounced'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}

function trackerStatusClass(result?: string, announced = false): string {
  const text = (result || '').toLowerCase();
  if (!text) return announced ? 'wait' : 'wait';
  if (text.includes('success')) return 'ok';

  const httpMatch = text.match(/http response code (\d+)/i);
  if (httpMatch) {
    const code = Number(httpMatch[1]);
    if (!code) return 'error';
    if (code === 429) return 'warn';
    return code >= 500 ? 'error' : 'warn';
  }

  if (text.includes('429') || text.includes('too many requests') || text.includes('temporarily')) return 'warn';
  if (text.includes('access denied') || text.includes('unauthorized') || text.includes('forbidden') || /\b(401|403)\b/.test(text)) return 'error';
  if (
    text.includes('could not connect') ||
    text.includes('connection failed') ||
    text.includes('timeout') ||
    text.includes('timed out') ||
    text.includes('dns') ||
    /\b(4\d\d|5\d\d)\b/.test(text)
  ) {
    return 'error';
  }
  return 'warn';
}

function trackerStatusLabel(result?: string): string {
  const text = (result || '').trim();
  if (!text) return t('detail.trackers.waiting');
  const lower = text.toLowerCase();
  if (lower === 'success') return t('trackerStatus.success');
  const httpCode = text.match(/HTTP response code (\d+)/i);
  if (httpCode) {
    const code = Number(httpCode[1]);
    if (!code) return t('trackerStatus.connectionFailed');
    return t('trackerStatus.httpError', { code });
  }
  if (lower.includes('access denied') || lower.includes('forbidden')) return t('trackerStatus.accessDenied');
  if (lower.includes('could not connect')) return t('trackerStatus.couldNotConnect');
  if (lower.includes('connection failed')) return t('trackerStatus.connectionFailed');
  if (lower.includes('timeout') || lower.includes('timed out')) return t('trackerStatus.timeout');
  return text;
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

function handleVerifyTorrent() {
  if (!activeTorrent.value) return;
  const torrentId = activeTorrent.value.id;
  openConfirm({
    title: t('dialog.verifyTitle'),
    message: t('dialog.verifyPrompt', { count: 1 }),
    confirmText: t('dialog.verifyConfirm'),
    onConfirm: async () => {
      await rpc.torrentVerify([torrentId]);
      showToast(t('toast.verifyStarted'), 'success');
      const refreshed = await rpc.getTorrentDetail(torrentId);
      if (refreshed) {
        state.activeTorrentDetail = { ...(activeTorrent.value || {}), ...refreshed };
      }
    },
  });
}

function handleSetLocation() {
  if (!activeTorrent.value) return;
  state.selectedId = activeTorrent.value.id;
  state.selectedIds = [activeTorrent.value.id];
  openLocationDialog();
}
</script>

<style scoped>
.desktop-detail-dock {
  height: var(--detail-height, 340px);
  max-height: calc(100vh - 120px);
  background-color: var(--fluent-bg-canvas);
  border-top: 1px solid var(--fluent-border-divider);
  display: flex;
  flex-direction: column;
  user-select: none;
  flex-shrink: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 50;
  position: relative;
}

.dock-resize-handle {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  z-index: 3;
  background: transparent;
}

.dock-resize-handle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 38px;
  height: 2px;
  border-radius: 1px;
  background-color: var(--fluent-border-divider);
  transition: background-color 0.15s ease, width 0.15s ease;
}

.dock-resize-handle:hover::after {
  width: 54px;
  background-color: var(--fluent-accent);
}

.dock-header {
  height: 34px;
  background-color: var(--fluent-bg-subtle);
  border-bottom: 1px solid var(--fluent-border-subtle);
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
  color: var(--fluent-accent);
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
  color: var(--md-text-primary);
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
  border-radius: var(--fluent-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
  transition: all 0.15s;
}

.dock-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.dock-btn .material-icons {
  font-size: 16px;
}

/* 标签栏 */
.dock-tabs {
  height: 32px;
  display: flex;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background-color: var(--fluent-bg-subtle);
  padding: 0 8px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  height: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.12s ease;
  border-radius: 4px 4px 0 0;
}

.tab-item:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.tab-item.active {
  color: var(--fluent-accent);
  border-bottom-color: var(--fluent-accent);
  background-color: var(--fluent-bg-canvas);
  font-weight: 600;
}

.tab-icon {
  font-size: 15px;
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
  background-color: var(--fluent-bg-canvas);
}

.tab-pane {
  padding: 10px 14px;
  height: 100%;
  box-sizing: border-box;
}

/* 文件树与 Tracker 表格铺满详情面板两端 */
.files-pane,
.pieces-pane,
.peers-pane,
.trackers-pane {
  padding: 0;
}

.peer-source-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-subtle);
  font-size: 11px;
  color: var(--md-text-secondary);
}

.peer-source-label {
  font-weight: 600;
  color: var(--md-text-primary);
}

.peer-source-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
}

.peer-source-chip i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.peer-source-chip b {
  font-weight: 600;
  color: var(--md-text-primary);
}

.webseed-chip {
  color: var(--fluent-accent);
}

.trackers-pane .tracker-actions-bar {
  padding: 10px 14px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-canvas);
}

/* 常规面板网格 */
.general-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.info-card {
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
}

.card-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 3px;
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
  border-radius: var(--fluent-radius);
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
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--fluent-accent);
  border-radius: var(--fluent-radius);
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-magnet-btn:hover {
  background: var(--fluent-bg-hover);
}

.selectable {
  user-select: text !important;
}

.monospace {
  font-family: var(--font-mono);
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
  font-size: 11px;
  text-align: left;
}

.detail-table th {
  border-bottom: 1px solid var(--fluent-border-divider);
  padding: 5px 8px;
  color: var(--md-text-secondary);
  font-weight: 600;
  position: sticky;
  top: 0;
  background-color: var(--fluent-bg-subtle);
}

.detail-table td {
  border-bottom: 1px solid var(--fluent-border-subtle);
  padding: 5px 8px;
}

.detail-table tbody tr:hover {
  background-color: var(--fluent-bg-hover);
}

.down-val { color: #2e7d32; font-family: var(--font-mono); }
.up-val { color: #ef6c00; font-family: var(--font-mono); }

.tracker-res-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.tracker-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.tracker-res-badge.ok {
  background-color: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.tracker-res-badge.error {
  background-color: rgba(211, 47, 47, 0.12);
  color: #c62828;
}

.tracker-res-badge.warn {
  background-color: rgba(255, 152, 0, 0.16);
  color: #b26a00;
}

.tracker-res-badge.wait {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-secondary);
}

.tracker-actions-bar {
  margin-bottom: 8px;
  display: flex;
  gap: 6px;
}

.tracker-actions-bar .md-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  font-size: 11px;
  gap: 5px;
}

.tracker-actions-bar .md-btn:hover {
  border-color: var(--fluent-accent);
  color: var(--fluent-accent);
}

.detail-table th {
  font-size: 10.5px;
  padding: 7px 10px;
  letter-spacing: 0.01em;
}

.detail-table td {
  height: 32px;
  padding: 5px 10px;
  font-size: 11.5px;
}

.trackers-pane .detail-table tbody tr:hover {
  background-color: rgba(0, 120, 212, 0.06);
}

.remove-tr-btn {
  opacity: 0.55;
}

.trackers-pane .detail-table tbody tr:hover .remove-tr-btn {
  opacity: 1;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  color: var(--md-text-secondary);
  font-size: 12px;
}

.empty-hint .material-icons {
  font-size: 32px;
  margin-bottom: 6px;
  opacity: 0.4;
}

/* 移动端底面板遮罩与 Bottom Sheet 样式 (桌面端严格隐藏，防止模糊遮挡) */
.mobile-detail-backdrop {
  display: none;
}

@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sheet-drag-handle-bar {
  display: none;
  width: 100%;
  height: 14px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding-top: 4px;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--fluent-border-divider);
}

@media (max-width: 768px) {
  .mobile-detail-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 998;
    animation: backdropFadeIn 0.2s ease-out;
  }

  .desktop-detail-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 75vh;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
    z-index: 999;
    box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.35);
    animation: sheetSlideUp 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
    transition: height 0.2s ease;
  }

  .desktop-detail-dock.detail-expanded {
    height: 92vh;
    max-height: 92vh;
  }

  .dock-resize-handle {
    display: none;
  }

  @keyframes sheetSlideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .sheet-drag-handle-bar {
    display: flex;
  }

  .dock-header {
    height: 38px;
    padding: 0 14px;
  }

  .dock-tabs {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    flex-shrink: 0;
    padding: 0 8px;
  }

  .dock-tabs::-webkit-scrollbar {
    display: none;
  }

  .tab-item {
    flex-shrink: 0;
    padding: 0 12px;
    height: 34px;
    font-size: 12px;
  }

  .general-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
