<template>
  <div class="table-workspace" @contextmenu.prevent>
    <table class="desktop-table">
      <thead>
        <tr>
          <th class="col-status" @click="handleSort('status')">
            <span class="material-icons sort-icon">swap_vert</span>
          </th>
          <th class="col-name" @click="handleSort('name')">
            {{ t('common.name') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'name'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-size" @click="handleSort('totalSize')">
            {{ t('common.size') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'totalSize'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-progress" @click="handleSort('percentDone')">
            {{ t('common.progress') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'percentDone'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-statustext">
            {{ t('common.status') }}
          </th>
          <th class="col-speed" @click="handleSort('rateDownload')">
            {{ t('common.downSpeed') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'rateDownload'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-speed" @click="handleSort('rateUpload')">
            {{ t('common.upSpeed') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'rateUpload'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-eta">
            {{ t('common.eta') }}
          </th>
          <th class="col-ratio" @click="handleSort('uploadRatio')">
            {{ t('common.ratio') }}
            <span class="sort-indicator" v-if="state.filter.sortBy === 'uploadRatio'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>
          <th class="col-peers">
            {{ t('common.peers') }}
          </th>
          <th class="col-corrupt">
            {{ t('common.corrupt') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="torrent in filteredTorrents"
          :key="torrent.id"
          :class="{
            selected: isSelected(torrent.id),
            paused: torrent.status === TorrentStatus.STOPPED,
            error: torrent.error !== 0,
          }"
          @click="onRowClick($event, torrent.id)"
          @dblclick="onRowDblClick(torrent.id)"
          @contextmenu.prevent="openContextMenu($event, torrent.id)"
        >
          <!-- 状态图标 -->
          <td class="col-status">
            <span class="material-icons status-ico" :class="getStatusIconClass(torrent)">
              {{ getStatusIcon(torrent) }}
            </span>
          </td>

          <!-- 种子名称 -->
          <td class="col-name" :title="torrent.name">
            <div class="name-text">{{ torrent.name }}</div>
          </td>

          <!-- 大小 -->
          <td class="col-size">{{ formatBytes(torrent.totalSize) }}</td>

          <!-- 进度条 + 百分比 (经典桌面紧凑 progress) -->
          <td class="col-progress">
            <div class="table-progress-cell">
              <div class="table-progress-bar">
                <div
                  class="table-progress-fill"
                  :class="getProgressFillClass(torrent)"
                  :style="{ width: `${Math.min(100, Math.max(0, torrent.percentDone * 100))}%` }"
                ></div>
              </div>
              <span class="table-progress-text">
                {{ (torrent.percentDone * 100).toFixed(1) }}%
              </span>
            </div>
          </td>

          <!-- 状态文本 -->
          <td class="col-statustext">
            <span class="status-badge" :class="getStatusBadgeClass(torrent)">
              {{ getStatusText(torrent.status) }}
            </span>
          </td>

          <!-- 下载速度 -->
          <td class="col-speed down-val">
            {{ torrent.rateDownload > 0 ? formatSpeed(torrent.rateDownload) : '—' }}
          </td>

          <!-- 上传速度 -->
          <td class="col-speed up-val">
            {{ torrent.rateUpload > 0 ? formatSpeed(torrent.rateUpload) : '—' }}
          </td>

          <!-- 剩余时间 -->
          <td class="col-eta">{{ formatETA(torrent.eta) }}</td>

          <!-- 分享率 -->
          <td class="col-ratio">{{ torrent.uploadRatio >= 0 ? torrent.uploadRatio.toFixed(2) : '0.00' }}</td>

          <!-- 节点数 -->
          <td class="col-peers">
            {{ torrent.peersSendingToUs > 0 ? `${torrent.peersSendingToUs}/` : '' }}{{ torrent.peersConnected }}
          </td>

          <!-- 坏块损耗 -->
          <td class="col-corrupt">
            <span class="corrupt-tag" v-if="torrent.corruptEver > 0" :title="`坏块损耗: ${formatBytes(torrent.corruptEver)}`">
              {{ formatBytes(torrent.corruptEver) }}
            </span>
            <span v-else class="text-muted">—</span>
          </td>
        </tr>

        <!-- 空数据提示 -->
        <tr v-if="filteredTorrents.length === 0">
          <td colspan="11" class="empty-table-cell">
            <span class="material-icons empty-icon">inbox</span>
            <p>没有找到符合条件的任务</p>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 右键上下文菜单 (BiglyBT 风格) -->
    <div
      class="context-menu"
      v-if="contextMenu.visible"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
    >
      <div class="menu-item" @click="handleAction('start')">
        <span class="material-icons">play_arrow</span>
        <span>开始</span>
      </div>
      <div class="menu-item" @click="handleAction('start-now')">
        <span class="material-icons">fast_forward</span>
        <span>立即开始 (跳过队列)</span>
      </div>
      <div class="menu-item" @click="handleAction('stop')">
        <span class="material-icons">pause</span>
        <span>暂停</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleAction('verify')">
        <span class="material-icons">check_circle_outline</span>
        <span>重新校验数据</span>
      </div>
      <div class="menu-item" @click="handleAction('reannounce')">
        <span class="material-icons">cell_tower</span>
        <span>向 Tracker 重新宣告</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleAction('move-top')">
        <span class="material-icons">vertical_align_top</span>
        <span>移至队首</span>
      </div>
      <div class="menu-item" @click="handleAction('move-up')">
        <span class="material-icons">keyboard_arrow_up</span>
        <span>队列上移</span>
      </div>
      <div class="menu-item" @click="handleAction('move-down')">
        <span class="material-icons">keyboard_arrow_down</span>
        <span>队列下移</span>
      </div>
      <div class="menu-item" @click="handleAction('move-bottom')">
        <span class="material-icons">vertical_align_bottom</span>
        <span>移至队尾</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleAction('set-location')">
        <span class="material-icons">drive_file_move</span>
        <span>设置存储路径...</span>
      </div>
      <div class="menu-item" @click="handleAction('detail')">
        <span class="material-icons">info</span>
        <span>查看属性与文件...</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item text-danger" @click="handleAction('remove')">
        <span class="material-icons">delete</span>
        <span>移除任务</span>
      </div>
      <div class="menu-item text-danger" @click="handleAction('remove-data')">
        <span class="material-icons">delete_forever</span>
        <span>移除任务并删除文件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import {
  state,
  filteredTorrents,
  selectTorrent,
  toggleDetail,
  formatBytes,
  formatSpeed,
  formatETA,
  getStatusText,
} from '../stores/transmission';
import { Torrent, TorrentStatus } from '../api/types';
import { rpc } from '../api/rpc';
import { t } from '../locales';

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetId: null as number | null,
});

function isSelected(id: number) {
  return state.selectedIds.includes(id) || state.selectedId === id;
}

function onRowClick(e: MouseEvent, id: number) {
  const multi = e.ctrlKey || e.metaKey;
  selectTorrent(id, multi);
}

function onRowDblClick(id: number) {
  toggleDetail(id);
}

function handleSort(key: any) {
  if (state.filter.sortBy === key) {
    state.filter.sortAsc = !state.filter.sortAsc;
  } else {
    state.filter.sortBy = key;
    state.filter.sortAsc = false;
  }
}

function openContextMenu(e: MouseEvent, id: number) {
  if (!isSelected(id)) {
    selectTorrent(id, false);
  }
  contextMenu.visible = true;
  contextMenu.x = Math.min(e.clientX, window.innerWidth - 220);
  contextMenu.y = Math.min(e.clientY, window.innerHeight - 380);
  contextMenu.targetId = id;
}

function closeContextMenu() {
  contextMenu.visible = false;
}

async function handleAction(action: string) {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  closeContextMenu();
  if (ids.length === 0) return;

  switch (action) {
    case 'start':
      await rpc.torrentStart(ids);
      break;
    case 'start-now':
      await rpc.torrentStartNow(ids);
      break;
    case 'stop':
      await rpc.torrentStop(ids);
      break;
    case 'verify':
      await rpc.torrentVerify(ids);
      break;
    case 'reannounce':
      await rpc.torrentReannounce(ids);
      break;
    case 'move-top':
      await rpc.queueMoveTop(ids);
      break;
    case 'move-up':
      await rpc.queueMoveUp(ids);
      break;
    case 'move-down':
      await rpc.queueMoveDown(ids);
      break;
    case 'move-bottom':
      await rpc.queueMoveBottom(ids);
      break;
    case 'detail':
      toggleDetail(ids[0]);
      break;
    case 'set-location':
      const newLoc = prompt('请输入新的保存目录路径:', state.torrents.find((t) => t.id === ids[0])?.downloadDir || '/mnt');
      if (newLoc) {
        const moveData = confirm('是否同时移动已下载的数据文件？\n点击【确定】移动物理文件，【取消】仅切换索引。');
        await rpc.torrentSetLocation(ids, newLoc, moveData);
      }
      break;
    case 'remove':
      if (confirm(`确定要移除选中的 ${ids.length} 个任务吗？`)) {
        await rpc.torrentRemove(ids, false);
        state.selectedIds = [];
        state.selectedId = null;
      }
      break;
    case 'remove-data':
      if (confirm(`⚠️ 警告：确定要彻底删除选中的 ${ids.length} 个任务并连同磁盘文件一起粉碎吗？此操作不可撤销！`)) {
        await rpc.torrentRemove(ids, true);
        state.selectedIds = [];
        state.selectedId = null;
      }
      break;
  }
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
});

// 图标与徽标样式助手
function getStatusIcon(t: Torrent): string {
  if (t.error !== 0) return 'error';
  switch (t.status) {
    case TorrentStatus.DOWNLOAD: return 'arrow_downward';
    case TorrentStatus.SEED: return 'arrow_upward';
    case TorrentStatus.STOPPED: return 'pause';
    case TorrentStatus.CHECK:
    case TorrentStatus.CHECK_WAIT: return 'sync';
    default: return 'hourglass_empty';
  }
}

function getStatusIconClass(t: Torrent): string {
  if (t.error !== 0) return 'error-color';
  switch (t.status) {
    case TorrentStatus.DOWNLOAD: return 'down-color';
    case TorrentStatus.SEED: return 'up-color';
    case TorrentStatus.STOPPED: return 'pause-color';
    case TorrentStatus.CHECK: return 'check-color';
    default: return 'wait-color';
  }
}

function getProgressFillClass(t: Torrent): string {
  if (t.error !== 0) return 'fill-error';
  if (t.percentDone >= 1.0) return 'fill-done';
  if (t.status === TorrentStatus.STOPPED) return 'fill-paused';
  return 'fill-active';
}

function getStatusBadgeClass(t: Torrent): string {
  if (t.error !== 0) return 'badge-error';
  if (t.status === TorrentStatus.DOWNLOAD) return 'badge-download';
  if (t.status === TorrentStatus.SEED) return 'badge-seed';
  return 'badge-idle';
}
</script>

<style scoped>
.table-workspace {
  flex: 1;
  overflow: auto;
  background-color: var(--md-surface);
  position: relative;
  user-select: none;
}

.desktop-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}

.desktop-table thead th {
  position: sticky;
  top: 0;
  background-color: var(--md-surface);
  border-bottom: 2px solid var(--md-divider);
  padding: 8px 10px;
  font-weight: 600;
  color: var(--md-text-secondary);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.15s;
}

.desktop-table thead th:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.desktop-table tbody tr {
  border-bottom: 1px solid var(--md-divider);
  transition: background-color 0.1s;
  height: 36px;
  cursor: pointer;
}

.desktop-table tbody tr:hover {
  background-color: rgba(63, 81, 181, 0.05);
}

.desktop-table tbody tr.selected {
  background-color: rgba(63, 81, 181, 0.14) !important;
  color: var(--md-primary);
  font-weight: 500;
}

.desktop-table tbody tr.paused {
  opacity: 0.75;
}

.desktop-table tbody td {
  padding: 4px 10px;
  vertical-align: middle;
}

/* 各列宽约束 */
.col-status { width: 32px; text-align: center; padding: 0 4px !important; }
.col-name { min-width: 220px; max-width: 480px; overflow: hidden; text-overflow: ellipsis; }
.col-size { width: 85px; }
.col-progress { width: 140px; }
.col-statustext { width: 85px; }
.col-speed { width: 85px; font-family: monospace; }
.col-eta { width: 90px; }
.col-ratio { width: 65px; font-family: monospace; }
.col-peers { width: 65px; }
.col-corrupt { width: 85px; }

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-ico {
  font-size: 18px;
  vertical-align: middle;
}

.down-color { color: var(--md-info); }
.up-color { color: var(--md-success); }
.pause-color { color: var(--md-text-secondary); }
.check-color { color: var(--md-warning); animation: spin 2s infinite linear; }
.error-color { color: var(--md-error); }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 进度条单元格 */
.table-progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-progress-bar {
  flex: 1;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.table-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s;
}

.fill-active { background-color: var(--md-primary); }
.fill-done { background-color: var(--md-success); }
.fill-paused { background-color: var(--md-text-secondary); }
.fill-error { background-color: var(--md-error); }

.table-progress-text {
  font-size: 11px;
  width: 42px;
  text-align: right;
  font-family: monospace;
}

.status-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.badge-download { background-color: rgba(3, 169, 244, 0.15); color: #0288d1; }
.badge-seed { background-color: rgba(76, 175, 80, 0.15); color: #2e7d32; }
.badge-idle { background-color: rgba(0, 0, 0, 0.06); color: var(--md-text-secondary); }
.badge-error { background-color: rgba(244, 67, 54, 0.15); color: #c62828; }

.down-val { color: #2e7d32; }
.up-val { color: #ef6c00; }
.text-muted { color: var(--md-text-secondary); }

.corrupt-tag {
  color: var(--md-error);
  font-weight: 500;
  font-family: monospace;
}

.empty-table-cell {
  text-align: center;
  padding: 60px 0 !important;
  color: var(--md-text-secondary);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
  margin-bottom: 8px;
}

.sort-indicator {
  font-size: 10px;
  margin-left: 2px;
  color: var(--md-primary);
}

/* 右键上下文菜单 */
.context-menu {
  position: fixed;
  background-color: var(--md-surface);
  border: 1px solid var(--md-divider);
  border-radius: 4px;
  box-shadow: var(--md-shadow-4dp);
  z-index: 1000;
  padding: 4px 0;
  min-width: 190px;
  font-size: 13px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.menu-item .material-icons {
  font-size: 18px;
  opacity: 0.8;
}

.menu-divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 4px 0;
}

.text-danger {
  color: var(--md-error);
}
</style>
