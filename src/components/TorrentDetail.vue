<template>
  <div class="md-detail-panel" v-if="state.selectedId !== null">
    <!-- 头部关闭与标题 -->
    <div class="detail-header">
      <div class="detail-title-block">
        <h3 class="detail-title">{{ activeTorrent?.name || '任务详情' }}</h3>
        <span class="detail-subtitle">
          真实进度: {{ ((activeTorrent?.percentDone || 0) * 100).toFixed(1) }}% · 
          {{ formatBytes((activeTorrent?.totalSize || 0) * (activeTorrent?.percentDone || 0)) }} / 
          {{ formatBytes(activeTorrent?.totalSize || 0) }}
        </span>
      </div>
      <button class="md-icon-button" @click="closeDetail" title="关闭详情" v-ripple>
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- 标签页栏 (MD1 Tabs) -->
    <div class="detail-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'files' }"
        @click="currentTab = 'files'"
        v-ripple
      >
        <span class="material-icons tab-icon">folder</span>
        {{ t('common.files') }}
        <span class="tab-badge" v-if="activeTorrent?.files">({{ activeTorrent.files.length }})</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: currentTab === 'peers' }"
        @click="currentTab = 'peers'"
        v-ripple
      >
        <span class="material-icons tab-icon">people</span>
        {{ t('common.peersList') }}
        <span class="tab-badge" v-if="activeTorrent?.peers">({{ activeTorrent.peers.length }})</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: currentTab === 'trackers' }"
        @click="currentTab = 'trackers'"
        v-ripple
      >
        <span class="material-icons tab-icon">alt_route</span>
        {{ t('common.trackers') }}
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="detail-content">
      <!-- 文件树标签页 (受控且持久化记忆) -->
      <FileTree
        v-if="currentTab === 'files' && activeTorrent?.files && activeTorrent?.fileStats"
        :torrentId="activeTorrent.id"
        :files="activeTorrent.files"
        :fileStats="activeTorrent.fileStats"
      />

      <!-- Peers 标签页 -->
      <div v-else-if="currentTab === 'peers'" class="peers-list-view">
        <table class="md-table" v-if="activeTorrent?.peers && activeTorrent.peers.length > 0">
          <thead>
            <tr>
              <th>IP 地址</th>
              <th>客户端</th>
              <th>下载速度</th>
              <th>上传速度</th>
              <th>完成进度</th>
              <th>协议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="peer in activeTorrent.peers" :key="peer.address">
              <td>{{ peer.address }}</td>
              <td class="client-name">{{ peer.clientName || '未知' }}</td>
              <td style="color: var(--md-success);">{{ peer.rateToClient > 0 ? formatSpeed(peer.rateToClient) : '-' }}</td>
              <td style="color: var(--md-warning);">{{ peer.rateToPeer > 0 ? formatSpeed(peer.rateToPeer) : '-' }}</td>
              <td>{{ (peer.progress * 100).toFixed(0) }}%</td>
              <td>{{ peer.isUTP ? 'uTP' : 'TCP' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="empty-hint" v-else>
          <span class="material-icons">cloud_off</span>
          <p>当前暂无连接的节点</p>
        </div>
      </div>

      <!-- Trackers 标签页 -->
      <div v-else-if="currentTab === 'trackers'" class="trackers-list-view">
        <div
          class="tracker-item"
          v-for="tracker in activeTorrent?.trackerStats"
          :key="tracker.id"
        >
          <div class="tracker-url">{{ tracker.announce }}</div>
          <div class="tracker-status-line">
            <span class="tracker-badge" :class="tracker.hasAnnounced ? 'ok' : 'wait'">
              {{ tracker.lastAnnounceResult || '等待连接' }}
            </span>
            <span class="tracker-stats">
              做种: {{ tracker.seederCount >= 0 ? tracker.seederCount : '-' }} · 
              下载: {{ tracker.leecherCount >= 0 ? tracker.leecherCount : '-' }} · 
              同伴: {{ tracker.lastAnnouncePeerCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { state, formatBytes, formatSpeed } from '../stores/transmission';
import { t } from '../locales';
import FileTree from './FileTree.vue';

const currentTab = ref<'files' | 'peers' | 'trackers'>('files');

const activeTorrent = computed(() => {
  return state.activeTorrentDetail || state.torrents.find((t) => t.id === state.selectedId) || null;
});

function closeDetail() {
  state.selectedId = null;
  state.activeTorrentDetail = null;
}
</script>

<style scoped>
.md-detail-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48vh;
  min-height: 280px;
  max-height: 80vh;
  background-color: var(--md-surface);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 150;
  border-top: 2px solid var(--md-primary);
  animation: mdSlideUp 0.25s var(--md-transition-decel);
}

.detail-header {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--md-divider);
}

.detail-title {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 75vw;
}

.detail-subtitle {
  font-size: 12px;
  color: var(--md-text-secondary);
  margin-top: 2px;
}

.detail-tabs {
  display: flex;
  background-color: var(--md-surface);
  border-bottom: 1px solid var(--md-divider);
  padding: 0 16px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--md-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--md-primary);
}

.tab-btn.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
}

.tab-icon {
  font-size: 18px;
}

.tab-badge {
  font-size: 11px;
  opacity: 0.8;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.md-table th {
  text-align: left;
  padding: 8px 16px;
  color: var(--md-text-secondary);
  border-bottom: 1px solid var(--md-divider);
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.02);
}

.md-table td {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.client-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--md-text-disabled);
  padding: 32px 0;
}

.empty-hint .material-icons {
  font-size: 40px;
  margin-bottom: 8px;
}

.trackers-list-view {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tracker-item {
  padding: 10px 14px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--md-divider);
}

.tracker-url {
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
}

.tracker-status-line {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--md-text-secondary);
}

.tracker-badge {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
}

.tracker-badge.ok {
  background-color: rgba(76, 175, 80, 0.12);
  color: var(--md-success);
}

.tracker-badge.wait {
  background-color: rgba(255, 152, 0, 0.12);
  color: var(--md-warning);
}

@keyframes mdSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
