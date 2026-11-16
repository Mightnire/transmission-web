<template>
  <div class="fluent-table-workspace" @contextmenu.prevent>
    <table class="fluent-desktop-table">
      <thead @contextmenu.prevent.stop="openHeaderContextMenu($event)">
        <tr>
          <!-- 全选/全不选 复选框列 (首列) -->
          <th class="col-check" @click.stop="toggleSelectAll">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate.prop="isSomeSelected"
              @click.stop="toggleSelectAll"
            />
          </th>

          <!-- 队列序号 (#) 排序列：仅在顶部处于“队列与调度”Tab 时显示 -->
          <th
            class="col-queue"
            v-if="state.ribbonTab === 'queue'"
            @click="handleSort('queuePosition')"
            :title="t('common.queue')"
          >
            <span>#</span>
            <span class="sort-indicator" v-if="state.filter.sortBy === 'queuePosition'">
              {{ state.filter.sortAsc ? '▲' : '▼' }}
            </span>
          </th>

          <!-- 状态图标 -->
          <th
            class="col-status resizable-col"
            v-if="isColVisible('status')"
            :style="{ width: `${getColWidth('status')}px` }"
            @click="handleSort('status')"
          >
            <div class="th-content">
              <FluentIcon name="swap_vert" class="sort-icon" />
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('status', $event)"></div>
          </th>

          <!-- 种子名称 -->
          <th
            class="col-name resizable-col"
            v-if="isColVisible('name')"
            :style="{ width: `${getColWidth('name')}px` }"
            @click="handleSort('name')"
          >
            <div class="th-content">
              <span>{{ t('common.name') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'name'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('name', $event)"></div>
          </th>

          <!-- 大小 -->
          <th
            class="col-size resizable-col"
            v-if="isColVisible('size')"
            :style="{ width: `${getColWidth('size')}px` }"
            @click="handleSort('totalSize')"
          >
            <div class="th-content">
              <span>{{ t('common.size') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'totalSize'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('size', $event)"></div>
          </th>

          <!-- 进度条 -->
          <th
            class="col-progress resizable-col"
            v-if="isColVisible('progress')"
            :style="{ width: `${getColWidth('progress')}px` }"
            @click="handleSort('percentDone')"
          >
            <div class="th-content">
              <span>{{ t('common.progress') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'percentDone'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('progress', $event)"></div>
          </th>

          <!-- 状态文本 -->
          <th
            class="col-statustext resizable-col"
            v-if="isColVisible('statustext')"
            :style="{ width: `${getColWidth('statustext')}px` }"
          >
            <div class="th-content">
              <span>{{ t('common.status') }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('statustext', $event)"></div>
          </th>

          <!-- 下载速度 -->
          <th
            class="col-speed resizable-col"
            v-if="isColVisible('downSpeed')"
            :style="{ width: `${getColWidth('downSpeed')}px` }"
            @click="handleSort('rateDownload')"
          >
            <div class="th-content">
              <span>{{ t('common.downSpeed') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'rateDownload'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('downSpeed', $event)"></div>
          </th>

          <!-- 上传速度 -->
          <th
            class="col-speed resizable-col"
            v-if="isColVisible('upSpeed')"
            :style="{ width: `${getColWidth('upSpeed')}px` }"
            @click="handleSort('rateUpload')"
          >
            <div class="th-content">
              <span>{{ t('common.upSpeed') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'rateUpload'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('upSpeed', $event)"></div>
          </th>

          <!-- 剩余时间 -->
          <th
            class="col-eta resizable-col"
            v-if="isColVisible('eta')"
            :style="{ width: `${getColWidth('eta')}px` }"
          >
            <div class="th-content">
              <span>{{ t('common.eta') }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('eta', $event)"></div>
          </th>

          <!-- 分享率 -->
          <th
            class="col-ratio resizable-col"
            v-if="isColVisible('ratio')"
            :style="{ width: `${getColWidth('ratio')}px` }"
            @click="handleSort('uploadRatio')"
          >
            <div class="th-content">
              <span>{{ t('common.ratio') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'uploadRatio'">
                {{ state.filter.sortAsc ? '▲' : '▼' }}
              </span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('ratio', $event)"></div>
          </th>

          <!-- 节点数 -->
          <th
            class="col-peers resizable-col"
            v-if="isColVisible('peers')"
            :style="{ width: `${getColWidth('peers')}px` }"
          >
            <div class="th-content">
              <span>{{ t('common.peers') }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('peers', $event)"></div>
          </th>

          <!-- 坏块损耗 -->
          <th
            class="col-corrupt resizable-col"
            v-if="isColVisible('corrupt')"
            :style="{ width: `${getColWidth('corrupt')}px` }"
          >
            <div class="th-content">
              <span>{{ t('common.corrupt') }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('corrupt', $event)"></div>
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
            queued: isQueueWaiting(torrent),
          }"
          @click="onRowClick($event, torrent.id)"
          @dblclick="onRowDblClick(torrent.id)"
          @contextmenu.prevent="openContextMenu($event, torrent.id)"
        >
          <!-- 首列复选框：点整个单元格即触发选择 -->
          <td class="col-check" @click.stop="toggleRowSelection(torrent.id)">
            <input
              type="checkbox"
              :checked="isSelected(torrent.id)"
              @click.stop="toggleRowSelection(torrent.id)"
            />
          </td>

          <!-- 队列顺序号 (#)：仅在处于“队列与调度”Tab 时显示 -->
          <td class="col-queue" v-if="state.ribbonTab === 'queue'">
            <span
              class="queue-cell-badge"
              :class="{ 'queue-waiting': isQueueWaiting(torrent) }"
              :title="`Queue Position: ${torrent.queuePosition}`"
            >
              {{ torrent.queuePosition !== undefined && torrent.queuePosition >= 0 ? torrent.queuePosition + 1 : '—' }}
            </span>
          </td>

          <!-- 状态图标 -->
          <td class="col-status" v-if="isColVisible('status')">
            <FluentIcon :name="getStatusIcon(torrent)" class="status-ico" :class="getStatusIconClass(torrent)" />
          </td>

          <!-- 种子名称 -->
          <td class="col-name" v-if="isColVisible('name')" :title="torrent.errorString ? `${torrent.name}\n\n[${t('status.error')}] ${torrent.errorString}` : torrent.name">
            <div class="name-text">{{ torrent.name }}</div>
            <div class="fluent-error-pill" v-if="torrent.error !== 0 || torrent.errorString" :title="torrent.errorString">
              <FluentIcon name="error_outline" class="pill-icon" />
              <span class="pill-text">{{ torrent.errorString || t('status.error') }}</span>
            </div>
          </td>

          <!-- 大小 -->
          <td class="col-size" v-if="isColVisible('size')">{{ formatBytes(torrent.totalSize) }}</td>

          <!-- 进度条 + 百分比 (Fluent 胶囊进度条) -->
          <td class="col-progress" v-if="isColVisible('progress')">
            <div class="fluent-progress-cell">
              <div class="fluent-progress-track">
                <div
                  class="fluent-progress-fill"
                  :class="getProgressFillClass(torrent)"
                  :style="{ width: `${Math.min(100, Math.max(0, getDisplayPercent(torrent)))}%` }"
                ></div>
              </div>
              <span class="progress-val-text" :class="{ 'text-checking': isChecking(torrent) }">
                {{ getDisplayPercent(torrent).toFixed(1) }}%
              </span>
            </div>
          </td>

          <!-- 状态徽章 -->
          <td class="col-statustext" v-if="isColVisible('statustext')">
            <span class="fluent-status-badge" :class="getStatusBadgeClass(torrent)" :title="torrent.errorString || ''">
              {{ getStatusDisplayText(torrent) }}
            </span>
          </td>

          <!-- 下载速度 -->
          <td class="col-speed down-val" v-if="isColVisible('downSpeed')">
            {{ torrent.rateDownload > 0 ? formatSpeed(torrent.rateDownload) : '—' }}
          </td>

          <!-- 上传速度 -->
          <td class="col-speed up-val" v-if="isColVisible('upSpeed')">
            {{ torrent.rateUpload > 0 ? formatSpeed(torrent.rateUpload) : '—' }}
          </td>

          <!-- 剩余时间 -->
          <td class="col-eta" v-if="isColVisible('eta')">{{ formatETA(torrent.eta) }}</td>

          <!-- 分享率 -->
          <td class="col-ratio" v-if="isColVisible('ratio')">{{ torrent.uploadRatio >= 0 ? torrent.uploadRatio.toFixed(2) : '0.00' }}</td>

          <!-- 节点数 -->
          <td class="col-peers" v-if="isColVisible('peers')">
            {{ torrent.peersSendingToUs > 0 ? `${torrent.peersSendingToUs}/` : '' }}{{ torrent.peersConnected }}
          </td>

          <!-- 坏块损耗 -->
          <td class="col-corrupt" v-if="isColVisible('corrupt')">
            <span class="corrupt-tag" v-if="torrent.corruptEver > 0" :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })">
              {{ formatBytes(torrent.corruptEver) }}
            </span>
            <span v-else class="text-muted">—</span>
          </td>
        </tr>

        <!-- 空数据提示 -->
        <tr v-if="filteredTorrents.length === 0">
          <td :colspan="visibleColumnCount" class="empty-table-cell">
            <FluentIcon name="inbox" class="empty-icon" />
            <p>{{ t('table.empty') }}</p>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 右键上下文菜单 (Fluent Acrylic 风格) -->
    <div
      class="fluent-context-menu"
      v-if="contextMenu.visible"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
    >
      <div class="menu-item" @click="handleAction('start')">
        <FluentIcon name="play_arrow" />
        <span>{{ t('menu.start') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('start-now')">
        <FluentIcon name="bolt" class="text-warning" />
        <span>{{ t('menu.startNow') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('stop')">
        <FluentIcon name="pause" />
        <span>{{ t('menu.pause') }}</span>
      </div>
      <div class="menu-divider"></div>

      <!-- 队列调度快捷 -->
      <div class="menu-item" @click="handleAction('move-top')">
        <FluentIcon name="vertical_align_top" />
        <span>{{ t('menu.moveTop') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('move-up')">
        <FluentIcon name="arrow_upward" />
        <span>{{ t('menu.moveUp') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('move-down')">
        <FluentIcon name="arrow_downward" />
        <span>{{ t('menu.moveDown') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('move-bottom')">
        <FluentIcon name="vertical_align_bottom" />
        <span>{{ t('menu.moveBottom') }}</span>
      </div>
      <div class="menu-divider"></div>

      <div class="menu-item" @click="handleAction('verify')">
        <FluentIcon name="check_circle_outline" />
        <span>{{ t('menu.verify') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('reannounce')">
        <FluentIcon name="sync" />
        <span>{{ t('menu.reannounce') }}</span>
      </div>
      <div class="menu-divider"></div>

      <div class="menu-item" @click="handleAction('copy-magnet')">
        <FluentIcon name="link" />
        <span>{{ t('menu.copyMagnet') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('set-location')">
        <FluentIcon name="folder_open" />
        <span>{{ t('menu.setLocation') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('rename')">
        <FluentIcon name="edit" />
        <span>{{ t('menu.rename') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('props')">
        <FluentIcon name="tune" />
        <span>{{ t('menu.props') }}</span>
      </div>
      <div class="menu-item" @click="handleAction('detail')">
        <FluentIcon name="vertical_split" />
        <span>{{ t('menu.detail') }}</span>
      </div>
      <div class="menu-divider"></div>

      <div class="menu-item text-danger" @click="handleAction('remove')">
        <FluentIcon name="delete_outline" />
        <span>{{ t('menu.remove') }}</span>
      </div>
      <div class="menu-item text-danger" @click="handleAction('remove-data')">
        <FluentIcon name="delete_forever" />
        <span>{{ t('menu.removeData') }}</span>
      </div>
    </div>

    <!-- 表头右键自定义列菜单 -->
    <Teleport to="body">
      <div
        class="fluent-dropdown-menu header-col-menu"
        v-if="headerMenu.open"
        :style="{ position: 'fixed', top: `${headerMenu.y}px`, left: `${headerMenu.x}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="cols-menu-header">{{ t('ribbon.colsMenuTitle') }}</div>
        <div class="cols-menu-list">
          <label class="cols-menu-item" v-for="col in state.columns" :key="col.id">
            <input type="checkbox" v-model="col.visible" @change="saveColumns" />
            <span>{{ t(col.labelKey) }}</span>
          </label>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleResetColumns">
          <FluentIcon name="restart_alt" />
          <span>{{ t('ribbon.resetCols') }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import {
  state,
  filteredTorrents,
  selectTorrent,
  toggleDetail,
  formatBytes,
  formatSpeed,
  formatETA,
  getStatusText,
  openTorrentProps,
  fetchTorrents,
  saveColumns,
  resetColumns,
} from '../stores/transmission';
import { Torrent, TorrentStatus } from '../api/types';
import { t } from '../locales';
import { rpc } from '../api/rpc';

const headerMenu = reactive({
  open: false,
  x: 0,
  y: 0,
});

function openHeaderContextMenu(e: MouseEvent) {
  headerMenu.x = Math.min(e.clientX, window.innerWidth - 200);
  headerMenu.y = Math.min(e.clientY, window.innerHeight - 300);
  headerMenu.open = true;
}

function handleResetColumns() {
  resetColumns();
  headerMenu.open = false;
}

const visibleColumnCount = computed(() => {
  let count = 1;
  if (state.ribbonTab === 'queue') count++;
  count += state.columns.filter((c) => c.visible).length;
  return count;
});

function isColVisible(id: string): boolean {
  const col = state.columns.find((c) => c.id === id);
  return col ? col.visible : true;
}

function getColWidth(id: string): number {
  const col = state.columns.find((c) => c.id === id);
  return col ? col.width : 100;
}

let resizingColId: string | null = null;
let startX = 0;
let startWidth = 0;

function startResize(colId: string, e: MouseEvent) {
  resizingColId = colId;
  startX = e.clientX;
  const col = state.columns.find((c) => c.id === colId);
  startWidth = col ? col.width : 100;

  window.addEventListener('mousemove', onResizing);
  window.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResizing(e: MouseEvent) {
  if (!resizingColId) return;
  const delta = e.clientX - startX;
  const col = state.columns.find((c) => c.id === resizingColId);
  if (col) {
    col.width = Math.max(col.minWidth || 35, startWidth + delta);
  }
}

function stopResize() {
  if (resizingColId) {
    saveColumns();
    resizingColId = null;
  }
  window.removeEventListener('mousemove', onResizing);
  window.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetId: null as number | null,
});

function isSelected(id: number) {
  return state.selectedIds.includes(id) || state.selectedId === id;
}

const isAllSelected = computed(() => {
  if (filteredTorrents.value.length === 0) return false;
  return filteredTorrents.value.every((t) => state.selectedIds.includes(t.id));
});

const isSomeSelected = computed(() => {
  if (isAllSelected.value) return false;
  return filteredTorrents.value.some((t) => state.selectedIds.includes(t.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    state.selectedIds = [];
    state.selectedId = null;
  } else {
    state.selectedIds = filteredTorrents.value.map((t) => t.id);
    state.selectedId = state.selectedIds[0] || null;
  }
}

function toggleRowSelection(id: number) {
  const idx = state.selectedIds.indexOf(id);
  if (idx >= 0) {
    state.selectedIds.splice(idx, 1);
    if (state.selectedId === id) {
      state.selectedId = state.selectedIds[0] || null;
    }
  } else {
    state.selectedIds.push(id);
    state.selectedId = id;
  }
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
    state.filter.sortAsc = key === 'queuePosition';
  }
}

function openContextMenu(e: MouseEvent, id: number) {
  if (!isSelected(id)) {
    selectTorrent(id, false);
  }
  contextMenu.visible = true;
  contextMenu.x = Math.min(e.clientX, window.innerWidth - 220);
  contextMenu.y = Math.min(e.clientY, window.innerHeight - 420);
  contextMenu.targetId = id;
}

function closeContextMenu() {
  contextMenu.visible = false;
  headerMenu.open = false;
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
    case 'props':
      openTorrentProps(ids[0]);
      break;
    case 'copy-magnet':
      const targetTorrent = state.torrents.find((t) => t.id === ids[0]);
      if (targetTorrent?.magnetLink) {
        navigator.clipboard.writeText(targetTorrent.magnetLink);
        alert(t('menu.magnetCopied'));
      } else {
        rpc.getTorrentDetail(ids[0]).then((d) => {
          if (d?.magnetLink) {
            navigator.clipboard.writeText(d.magnetLink);
            alert(t('menu.magnetCopied'));
          }
        });
      }
      break;
    case 'rename':
      const curT = state.torrents.find((t) => t.id === ids[0]);
      if (!curT) break;
      const newName = prompt(t('menu.promptRename'), curT.name);
      if (newName && newName !== curT.name) {
        try {
          await rpc.torrentRenamePath(ids[0], curT.name, newName);
          await fetchTorrents();
        } catch (e: any) {
          alert(t('menu.renameFailed', { error: e.message }));
        }
      }
      break;
    case 'set-location':
      const newLoc = prompt(t('menu.promptLocation'), state.torrents.find((t) => t.id === ids[0])?.downloadDir || '/mnt');
      if (newLoc) {
        const moveData = confirm(t('menu.confirmMoveData'));
        await rpc.torrentSetLocation(ids, newLoc, moveData);
        await fetchTorrents();
      }
      break;
    case 'remove':
      if (confirm(t('menu.confirmRemove', { count: ids.length }))) {
        await rpc.torrentRemove(ids, false);
        state.selectedIds = [];
        state.selectedId = null;
        await fetchTorrents();
      }
      break;
    case 'remove-data':
      if (confirm(t('menu.confirmRemoveData', { count: ids.length }))) {
        await rpc.torrentRemove(ids, true);
        state.selectedIds = [];
        state.selectedId = null;
        await fetchTorrents();
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

// 队列与排队判断
function isQueueWaiting(t: Torrent): boolean {
  return t.status === TorrentStatus.DOWNLOAD_WAIT || t.status === TorrentStatus.SEED_WAIT;
}

// 图标与徽标样式助手
function getStatusIcon(t: Torrent): string {
  if (t.error !== 0) return 'error';
  switch (t.status) {
    case TorrentStatus.DOWNLOAD: return 'arrow_downward';
    case TorrentStatus.SEED: return 'arrow_upward';
    case TorrentStatus.STOPPED: return 'pause';
    case TorrentStatus.CHECK:
    case TorrentStatus.CHECK_WAIT: return 'sync';
    case TorrentStatus.DOWNLOAD_WAIT:
    case TorrentStatus.SEED_WAIT: return 'hourglass_top';
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
    case TorrentStatus.DOWNLOAD_WAIT:
    case TorrentStatus.SEED_WAIT: return 'wait-color';
    default: return 'wait-color';
  }
}

// 校验与进度助手
function isChecking(t: Torrent): boolean {
  return t.status === TorrentStatus.CHECK || t.status === TorrentStatus.CHECK_WAIT;
}

function getDisplayPercent(item: Torrent): number {
  if (isChecking(item)) {
    return (item.recheckProgress || 0) * 100;
  }
  return (item.percentDone || 0) * 100;
}

function getStatusDisplayText(item: Torrent): string {
  if (item.error !== 0 || item.errorString) {
    if (item.error === 1) return t('status.errorTrackerWarning');
    if (item.error === 2) return t('status.errorTracker');
    if (item.error === 3) return t('status.errorLocal');
    return t('status.error');
  }
  if (item.status === TorrentStatus.CHECK) {
    const p = ((item.recheckProgress || 0) * 100).toFixed(0);
    return t('status.checkingWithPct', { pct: p });
  }
  if (item.status === TorrentStatus.CHECK_WAIT) {
    return t('status.checkWait');
  }
  return getStatusText(item.status);
}

function getProgressFillClass(item: Torrent): string {
  if (item.error !== 0) return 'fill-error';
  if (isChecking(item)) return 'fill-checking';
  if (item.percentDone >= 1.0) return 'fill-done';
  if (item.status === TorrentStatus.STOPPED) return 'fill-paused';
  return 'fill-active';
}

function getStatusBadgeClass(item: Torrent): string {
  if (item.error !== 0) return 'badge-error';
  if (isChecking(item)) return 'badge-check';
  if (item.status === TorrentStatus.DOWNLOAD) return 'badge-download';
  if (item.status === TorrentStatus.SEED) return 'badge-seed';
  if (isQueueWaiting(item)) return 'badge-queued';
  return 'badge-idle';
}
</script>

<style scoped>
/* Windows 11 Fluent 2 Data Grid 工作区 */
.fluent-table-workspace {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--fluent-bg-canvas);
  position: relative;
  user-select: none;
}

.fluent-desktop-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
  table-layout: fixed;
}

/* Fluent 2 表头 */
.fluent-desktop-table thead th {
  position: sticky;
  top: 0;
  background-color: var(--fluent-bg-subtle);
  border-bottom: 1px solid var(--fluent-border-divider);
  padding: 6px 8px;
  font-weight: 600;
  color: var(--md-text-secondary);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.12s ease;
  font-size: 11px;
  position: relative;
  overflow: hidden;
}

.fluent-desktop-table thead th:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  z-index: 20;
}

.col-resizer:hover,
.col-resizer:active {
  background-color: var(--fluent-accent);
}

.header-col-menu {
  min-width: 170px;
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.cols-menu-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
  padding: 3px 6px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  margin-bottom: 4px;
}

.cols-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cols-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 11px;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  transition: background-color 0.12s;
}

.cols-menu-item:hover {
  background-color: var(--fluent-bg-hover);
}

.cols-menu-item input[type="checkbox"] {
  accent-color: var(--fluent-accent);
}

.sort-indicator {
  font-size: 9px;
  margin-left: 2px;
  color: var(--fluent-accent);
}

/* 数据行 */
.fluent-desktop-table tbody tr {
  border-bottom: 1px solid var(--fluent-border-subtle);
  height: 34px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.fluent-desktop-table tbody tr:hover {
  background-color: var(--fluent-bg-hover);
}

/* Windows 11 Fluent 行选中状态 */
.fluent-desktop-table tbody tr.selected {
  background-color: rgba(0, 120, 212, 0.08) !important;
  color: var(--fluent-accent);
  font-weight: 500;
}

[data-theme="dark"] .fluent-desktop-table tbody tr.selected {
  background-color: rgba(40, 134, 222, 0.18) !important;
}

.fluent-desktop-table td {
  padding: 4px 8px;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 列宽分配与样式 */
.col-check {
  width: 32px;
  min-width: 32px;
  max-width: 32px;
  text-align: center;
  padding: 0 4px !important;
  cursor: pointer;
}

.col-check input[type="checkbox"] {
  accent-color: var(--fluent-accent);
  cursor: pointer;
  vertical-align: middle;
}

.col-queue { width: 44px; text-align: center; font-family: monospace; }
.col-ratio { font-family: monospace; }

/* 队列序号徽标 */
.queue-cell-badge {
  display: inline-block;
  min-width: 20px;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.queue-cell-badge.queue-waiting {
  background-color: rgba(255, 152, 0, 0.18);
  color: #e65100;
  font-weight: 700;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fluent-error-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  padding: 1px 6px;
  background-color: rgba(244, 67, 54, 0.12);
  border: 1px solid rgba(244, 67, 54, 0.25);
  border-radius: 3px;
  color: #c62828;
  font-size: 11px;
  line-height: 1.3;
  max-width: 100%;
}

.pill-icon {
  font-size: 13px !important;
  flex-shrink: 0;
}

.pill-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-ico {
  font-size: 17px;
  vertical-align: middle;
}

.down-color { color: var(--md-info); }
.up-color { color: var(--md-success); }
.pause-color { color: var(--md-text-secondary); }
.check-color { color: var(--md-warning); animation: spin 2s infinite linear; }
.wait-color { color: #ff9800; }
.error-color { color: var(--md-error); }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fluent 胶囊进度条 */
.fluent-progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fluent-progress-track {
  flex: 1;
  height: 6px;
  background-color: var(--fluent-bg-hover);
  border-radius: 3px;
  overflow: hidden;
}

.fluent-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.2s;
}

.fill-active { background-color: var(--fluent-accent); }
.fill-done { background-color: var(--md-success); }
.fill-paused { background-color: var(--md-text-disabled); }
.fill-error { background-color: var(--md-error); }
.fill-checking {
  background-color: var(--md-warning);
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.25) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.25) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
  animation: progressStripes 1s linear infinite;
}

@keyframes progressStripes {
  from { background-position: 0 0; }
  to { background-position: 16px 0; }
}

.progress-val-text {
  font-size: 11px;
  width: 42px;
  text-align: right;
  font-family: monospace;
}

.text-checking {
  color: #e65100;
  font-weight: 600;
}

/* Fluent 状态徽章 */
.fluent-status-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.badge-download { background-color: rgba(3, 169, 244, 0.12); color: #0288d1; }
.badge-seed { background-color: rgba(76, 175, 80, 0.12); color: #2e7d32; }
.badge-idle { background-color: var(--fluent-bg-hover); color: var(--md-text-secondary); }
.badge-error { background-color: rgba(244, 67, 54, 0.15); color: #c62828; }
.badge-check { background-color: rgba(255, 152, 0, 0.18); color: #e65100; font-weight: 600; }
.badge-queued { background-color: rgba(255, 152, 0, 0.15); color: #ef6c00; font-weight: 600; }

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
  font-size: 40px;
  opacity: 0.4;
  margin-bottom: 6px;
}

/* Fluent 亚克力右键上下文菜单 */
.fluent-context-menu {
  position: fixed;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  z-index: 300;
  min-width: 170px;
  padding: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: var(--fluent-radius);
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
  transition: background-color 0.12s;
}

.menu-item:hover {
  background-color: var(--fluent-bg-hover);
}

.menu-item .material-icons {
  font-size: 16px;
  color: var(--md-text-secondary);
}

.menu-divider {
  height: 1px;
  background-color: var(--fluent-border-subtle);
  margin: 4px 2px;
}

@media (max-width: 768px) {
  .fluent-desktop-table td {
    padding: 6px 8px;
    height: 36px;
  }
}
</style>
