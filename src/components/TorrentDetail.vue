<template>
  <div class="desktop-detail-dock" v-if="state.detailOpen && activeTorrent">
    <!-- 面板顶部控制与标题 -->
    <div class="dock-header">
      <div class="dock-title-block">
        <span class="material-icons info-icon">info</span>
        <span class="dock-name" :title="activeTorrent.name">{{ activeTorrent.name }}</span>
        <span class="dock-meta">
          进度: {{ ((activeTorrent.percentDone || 0) * 100).toFixed(1) }}% · 
          {{ formatBytes((activeTorrent.totalSize || 0) * (activeTorrent.percentDone || 0)) }} / 
          {{ formatBytes(activeTorrent.totalSize || 0) }}
        </span>
      </div>

      <div class="dock-actions">
        <!-- 最小化 / 关闭 -->
        <button class="dock-btn" @click="state.detailOpen = false" title="收起详情面板">
          <span class="material-icons">expand_more</span>
        </button>
        <button class="dock-btn" @click="closeDetail" title="关闭">
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
        <span>常规</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'files' }"
        @click="currentTab = 'files'"
      >
        <span class="material-icons tab-icon">folder</span>
        <span>文件</span>
        <span class="tab-badge" v-if="activeTorrent.files">({{ activeTorrent.files.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'peers' }"
        @click="currentTab = 'peers'"
      >
        <span class="material-icons tab-icon">people</span>
        <span>节点</span>
        <span class="tab-badge" v-if="activeTorrent.peers">({{ activeTorrent.peers.length }})</span>
      </button>

      <button
        class="tab-item"
        :class="{ active: currentTab === 'trackers' }"
        @click="currentTab = 'trackers'"
      >
        <span class="material-icons tab-icon">alt_route</span>
        <span>服务器</span>
        <span class="tab-badge" v-if="activeTorrent.trackerStats">({{ activeTorrent.trackerStats.length }})</span>
      </button>
    </div>

    <!-- 标签页主体内容 -->
    <div class="dock-content">
      <!-- 1. 常规属性 (General) -->
      <div v-if="currentTab === 'general'" class="tab-pane general-pane">
        <div class="general-grid">
          <!-- 传输统计卡片 -->
          <div class="info-card">
            <div class="card-title">传输统计</div>
            <div class="info-row">
              <span class="label">完成进度:</span>
              <span class="value font-bold">{{ ((activeTorrent.percentDone || 0) * 100).toFixed(1) }}%</span>
            </div>
            <div class="info-row">
              <span class="label">有效数据:</span>
              <span class="value">{{ formatBytes(activeTorrent.haveValid) }}</span>
            </div>
            <div class="info-row">
              <span class="label">累计下载:</span>
              <span class="value">{{ formatBytes(activeTorrent.downloadedEver) }}</span>
            </div>
            <div class="info-row">
              <span class="label">累计上传:</span>
              <span class="value">{{ formatBytes(activeTorrent.uploadedEver) }}</span>
            </div>
            <div class="info-row">
              <span class="label">分享比率:</span>
              <span class="value font-bold" style="color: var(--md-primary);">
                {{ activeTorrent.uploadRatio >= 0 ? activeTorrent.uploadRatio.toFixed(2) : '0.00' }}
              </span>
            </div>
            <div class="info-row" v-if="activeTorrent.corruptEver > 0">
              <span class="label text-danger">校验坏块损耗:</span>
              <span class="value text-danger font-bold">{{ formatBytes(activeTorrent.corruptEver) }}</span>
            </div>
          </div>

          <!-- 种子元数据卡片 -->
          <div class="info-card">
            <div class="card-title">信息与位置</div>
            <div class="info-row">
              <span class="label">保存路径:</span>
              <span class="value selectable" :title="activeTorrent.downloadDir">{{ activeTorrent.downloadDir }}</span>
            </div>
            <div class="info-row">
              <span class="label">散列值 (Hash):</span>
              <span class="value selectable monospace font-sm">{{ activeTorrent.hashString }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.pieceCount">
              <span class="label">区块分片:</span>
              <span class="value">{{ activeTorrent.pieceCount }} 片 × {{ formatBytes(activeTorrent.pieceSize) }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.creator">
              <span class="label">制作程序:</span>
              <span class="value">{{ activeTorrent.creator }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.comment">
              <span class="label">任务注释:</span>
              <span class="value">{{ activeTorrent.comment }}</span>
            </div>
          </div>

          <!-- 时间统计卡片 -->
          <div class="info-card">
            <div class="card-title">时间与限速</div>
            <div class="info-row">
              <span class="label">添加时间:</span>
              <span class="value">{{ formatDate(activeTorrent.addedDate) }}</span>
            </div>
            <div class="info-row" v-if="activeTorrent.doneDate > 0">
              <span class="label">完成时间:</span>
              <span class="value">{{ formatDate(activeTorrent.doneDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">下载限速:</span>
              <span class="value">{{ activeTorrent.downloadLimited ? `${activeTorrent.downloadLimit} KB/s` : '不限速' }}</span>
            </div>
            <div class="info-row">
              <span class="label">上传限速:</span>
              <span class="value">{{ activeTorrent.uploadLimited ? `${activeTorrent.uploadLimit} KB/s` : '不限速' }}</span>
            </div>
            <div class="info-row">
              <span class="label">带宽优先级:</span>
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
          <p>正在拉取文件列表...</p>
        </div>
      </div>

      <!-- 3. 节点列表 (Peers) -->
      <div v-else-if="currentTab === 'peers'" class="tab-pane peers-pane">
        <table class="detail-table" v-if="activeTorrent.peers && activeTorrent.peers.length > 0">
          <thead>
            <tr>
              <th>IP 地址</th>
              <th>客户端</th>
              <th>下载速度</th>
              <th>上传速度</th>
              <th>对方进度</th>
              <th>标志 (Flags)</th>
              <th>协议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="peer in activeTorrent.peers" :key="peer.address">
              <td class="monospace">{{ peer.address }}:{{ peer.port }}</td>
              <td>{{ peer.clientName || '未知客户端' }}</td>
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
          <p>当前暂无活跃的连接节点</p>
        </div>
      </div>

      <!-- 4. 服务器列表 (Trackers) -->
      <div v-else-if="currentTab === 'trackers'" class="tab-pane trackers-pane">
        <div class="tracker-actions-bar">
          <button class="md-btn md-btn-flat" @click="askMorePeers">
            <span class="material-icons">sync</span>
            立即向服务器宣告
          </button>
        </div>

        <table class="detail-table" v-if="activeTorrent.trackerStats && activeTorrent.trackerStats.length > 0">
          <thead>
            <tr>
              <th>层级</th>
              <th>Announce URL</th>
              <th>状态与结果</th>
              <th>做种者</th>
              <th>下载者</th>
              <th>上次宣告同伴</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tr in activeTorrent.trackerStats" :key="tr.id">
              <td>Tier {{ tr.tier }}</td>
              <td class="selectable font-sm">{{ tr.announce }}</td>
              <td>
                <span class="tracker-res-badge" :class="tr.hasAnnounced ? 'ok' : 'wait'">
                  {{ tr.lastAnnounceResult || '等待宣告...' }}
                </span>
              </td>
              <td>{{ tr.seederCount >= 0 ? tr.seederCount : '—' }}</td>
              <td>{{ tr.leecherCount >= 0 ? tr.leecherCount : '—' }}</td>
              <td>{{ tr.lastAnnouncePeerCount }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <span class="material-icons">alt_route</span>
          <p>该种子暂无 Tracker 记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { state, formatBytes, formatSpeed } from '../stores/transmission';
import { Priority } from '../api/types';
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
  if (p === Priority.HIGH) return '高优先级';
  if (p === Priority.LOW) return '低优先级';
  return '普通优先级';
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
