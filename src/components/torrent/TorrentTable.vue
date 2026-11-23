<template>
  <div class="fluent-table-workspace" @contextmenu.prevent>
    <table class="fluent-desktop-table" ref="tableRef">
      <thead @contextmenu.prevent.stop="openHeaderContextMenu($event)">
        <tr>
          <th class="col-check" @click.stop="toggleSelectAll">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate.prop="isSomeSelected"
              @click.stop="toggleSelectAll"
            />
          </th>

          <th
            class="col-queue"
            v-if="shouldShowDynamicQueueCol"
            @click="handleSort('queuePosition')"
            :title="t('common.queue')"
          >
            <span>#</span>
            <FluentIcon
              v-if="state.filter.sortBy === 'queuePosition'"
              :name="state.filter.sortAsc ? 'arrow_upward' : 'arrow_downward'"
              class="sort-indicator-icon"
            />
          </th>

          <th
            v-for="(col, index) in visibleColumns"
            :key="col.id"
            :class="['resizable-col', columnClass(col.id), {
              'col-dragging': draggingColumnId === col.id,
              'col-drop-before': dropBeforeId === col.id,
              'col-drop-after': dropAfterLast && index === visibleColumns.length - 1,
            }]"
            :style="{ width: `${col.width}px` }"
            :data-col-id="col.id"
            draggable="true"
            @dragstart="onColumnDragStart($event, col.id)"
            @drag="onColumnDragMove"
            @dragover.prevent="onColumnDragOver($event, col.id)"
            @drop.prevent="onColumnDrop($event, col.id)"
            @dragend="onColumnDragEnd"
            @click="columnSort(col.id)"
          >
            <div class="th-content">
              <FluentIcon
                v-if="col.id === 'status'"
                name="swap_vert"
                class="sort-icon status-header-icon"
                :title="t('common.status')"
              />
              <span v-else>{{ headerLabel(col) }}</span>
              <FluentIcon
                v-if="sortKey(col.id) && state.filter.sortBy === sortKey(col.id)"
                :name="state.filter.sortAsc ? 'arrow_upward' : 'arrow_downward'"
                class="sort-indicator-icon"
              />
            </div>
            <div
              class="col-resizer"
              draggable="false"
              @mousedown.stop.prevent="startResize(col.id, $event)"
              @dragstart.stop.prevent
            ></div>
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
          <td class="col-check" @click.stop="toggleRowSelection(torrent.id)">
            <input
              type="checkbox"
              :checked="isSelected(torrent.id)"
              @click.stop="toggleRowSelection(torrent.id)"
            />
          </td>

          <td class="col-queue" v-if="shouldShowDynamicQueueCol">
            <span
              class="queue-cell-badge"
              :class="{ 'queue-waiting': isQueueWaiting(torrent) }"
              :title="`${t('common.queue')}: ${torrent.queuePosition}`"
            >
              {{ torrent.queuePosition !== undefined && torrent.queuePosition >= 0 ? torrent.queuePosition + 1 : '—' }}
            </span>
          </td>

          <td
            v-for="col in visibleColumns"
            :key="col.id"
            :class="[columnClass(col.id), {
              'down-val': col.id === 'downSpeed',
              'up-val': col.id === 'upSpeed',
              'monospace': col.id === 'hash',
            }]"
          >
            <template v-if="col.id === 'status'">
              <FluentIcon :name="getStatusIcon(torrent)" class="status-ico" :class="getStatusIconClass(torrent)" />
            </template>

            <template v-else-if="col.id === 'queuePosition'">
              <span
                class="queue-cell-badge"
                :class="{ 'queue-waiting': isQueueWaiting(torrent) }"
                :title="`${t('common.queue')}: ${torrent.queuePosition}`"
              >
                {{ torrent.queuePosition !== undefined && torrent.queuePosition >= 0 ? torrent.queuePosition + 1 : '—' }}
              </span>
            </template>

            <template v-else-if="col.id === 'name'">
              <div class="name-cell-wrapper">
                <span
                  class="name-text"
                  :title="torrent.errorString ? `${torrent.name}\n\n[${t('status.error')}] ${torrent.errorString}` : torrent.name"
                >{{ torrent.name }}</span>
                <button
                  type="button"
                  class="custom-rule-tag"
                  v-if="hasCustomSettings(torrent)"
                  :title="getCustomSettingsSummary(torrent)"
                  @click.stop="openTorrentProps(torrent.id)"
                  :aria-label="t('common.customRules')"
                >
                  <FluentIcon name="tune" class="custom-rule-icon" />
                </button>
              </div>
              <div class="fluent-error-pill" v-if="torrent.error !== 0 || torrent.errorString" :title="torrent.errorString">
                <FluentIcon name="error_outline" class="pill-icon" />
                <span class="pill-text">{{ torrent.errorString || t('status.error') }}</span>
              </div>
            </template>

            <template v-else-if="col.id === 'size'">{{ formatBytes(torrent.totalSize) }}</template>

            <template v-else-if="col.id === 'progress'">
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
            </template>

            <template v-else-if="col.id === 'statustext'">
              <span class="fluent-status-badge" :class="getStatusBadgeClass(torrent)" :title="torrent.errorString || ''">
                {{ getStatusDisplayText(torrent) }}
              </span>
            </template>

            <template v-else-if="col.id === 'downSpeed'">
              {{ torrent.rateDownload > 0 ? formatSpeed(torrent.rateDownload) : '—' }}
            </template>

            <template v-else-if="col.id === 'upSpeed'">
              {{ torrent.rateUpload > 0 ? formatSpeed(torrent.rateUpload) : '—' }}
            </template>

            <template v-else-if="col.id === 'eta'">{{ formatETA(torrent.eta) }}</template>

            <template v-else-if="col.id === 'ratio'">
              {{ torrent.uploadRatio >= 0 ? torrent.uploadRatio.toFixed(2) : '0.00' }}
            </template>

            <template v-else-if="col.id === 'peers'">
              {{ torrent.peersSendingToUs > 0 ? `${torrent.peersSendingToUs}/` : '' }}{{ torrent.peersConnected }}
            </template>

            <template v-else-if="col.id === 'corrupt'">
              <span class="corrupt-tag" v-if="torrent.corruptEver > 0" :title="t('table.corruptTitle', { size: formatBytes(torrent.corruptEver) })">
                {{ formatBytes(torrent.corruptEver) }}
              </span>
              <span v-else class="text-muted">—</span>
            </template>

            <template v-else-if="col.id === 'downloaded'">{{ formatBytes(torrent.downloadedEver) }}</template>
            <template v-else-if="col.id === 'uploaded'">{{ formatBytes(torrent.uploadedEver) }}</template>
            <template v-else-if="col.id === 'remaining'">{{ formatBytes(torrent.leftUntilDone) }}</template>
            <template v-else-if="col.id === 'haveValid'">{{ formatBytes(torrent.haveValid) }}</template>
            <template v-else-if="col.id === 'sizeDone'">{{ formatBytes(torrent.sizeWhenDone) }}</template>
            <template v-else-if="col.id === 'addedDate'">{{ formatDate(torrent.addedDate) }}</template>
            <template v-else-if="col.id === 'doneDate'">{{ formatDate(torrent.doneDate) }}</template>
            <template v-else-if="col.id === 'activityDate'">{{ formatDate(torrent.activityDate) }}</template>
            <template v-else-if="col.id === 'seedingTime'">{{ formatDuration(torrent.secondsSeeding) }}</template>
            <template v-else-if="col.id === 'downloadingTime'">{{ formatDuration(torrent.secondsDownloading) }}</template>

            <template v-else-if="col.id === 'peersDetail'">
              <span class="text-success">↓{{ torrent.peersSendingToUs || 0 }}</span>
              <span class="peers-sep">/</span>
              <span class="text-warning">↑{{ torrent.peersGettingFromUs || 0 }}</span>
            </template>

            <template v-else-if="col.id === 'webSeeds'">{{ torrent.webseedsSendingToUs ?? 0 }}</template>

            <template v-else-if="col.id === 'priority'">
              <span class="priority-tag" :class="getPriorityClass(torrent.bandwidthPriority)">
                {{ formatPriority(torrent.bandwidthPriority) }}
              </span>
            </template>

            <template v-else-if="col.id === 'metadata'">
              {{ (torrent.metadataPercentComplete ?? 1) < 1 ? `${((torrent.metadataPercentComplete || 0) * 100).toFixed(0)}%` : '—' }}
            </template>

            <template v-else-if="col.id === 'stalled'">
              <span v-if="torrent.isStalled" class="stalled-tag">{{ t('tableCols.stalled') }}</span>
              <span v-else class="text-muted">—</span>
            </template>

            <template v-else-if="col.id === 'savePath'">
              <span :title="torrent.downloadDir">{{ formatDisplayPath(torrent.downloadDir) || '—' }}</span>
            </template>

            <template v-else-if="col.id === 'labels'">
              <span :title="torrent.labels?.join(', ')">{{ torrent.labels && torrent.labels.length > 0 ? torrent.labels.join(', ') : '—' }}</span>
            </template>

            <template v-else-if="col.id === 'hash'">
              <span :title="torrent.hashString">{{ torrent.hashString || '—' }}</span>
            </template>

            <template v-else-if="col.id === 'private'">{{ torrent.isPrivate ? '✓' : '—' }}</template>
            <template v-else-if="col.id === 'recheck'">{{ isChecking(torrent) ? `${((torrent.recheckProgress || 0) * 100).toFixed(1)}%` : '—' }}</template>
            <template v-else-if="col.id === 'downloadLimit'">{{ formatLimit(torrent.downloadLimited, torrent.downloadLimit) }}</template>
            <template v-else-if="col.id === 'uploadLimit'">{{ formatLimit(torrent.uploadLimited, torrent.uploadLimit) }}</template>

            <template v-else-if="col.id === 'error'">
              <span :class="torrent.errorString ? 'text-danger' : 'text-muted'">{{ torrent.errorString || '—' }}</span>
            </template>

            <template v-else-if="col.id === 'comment'">
              <span :title="torrent.comment">{{ torrent.comment || '—' }}</span>
            </template>

            <template v-else-if="col.id === 'creator'">
              <span :title="torrent.creator">{{ torrent.creator || '—' }}</span>
            </template>
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

    <Teleport to="body">
      <div
        class="column-drag-ghost"
        v-if="dragGhost"
        :style="{ left: `${dragGhost.x}px`, top: `${dragGhost.y}px` }"
      >
        <FluentIcon name="arrow_upward" />
        <span>{{ dragGhost.label }}</span>
      </div>
    </Teleport>

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
      <!-- 队列调度快捷 (仅在服务端开启队列功能时显示) -->
      <template v-if="isQueueEnabled">
        <div class="menu-divider"></div>
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
      </template>
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

      <!-- 单选专有功能 (多选时隐藏不可用项) -->
      <template v-if="!isContextMenuMulti">
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
      </template>

      <!-- 多选专属批量操作快捷：批量标签 -->
      <div class="menu-item" v-if="isContextMenuMulti" @click="handleAction('batch-tags')">
        <FluentIcon name="local_offer" class="text-accent" />
        <span>{{ t('ribbon.batchTags') }}</span>
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
          <div class="cols-menu-item" v-for="(col, index) in state.columns" :key="col.id">
            <label class="cols-menu-label">
              <input type="checkbox" v-model="col.visible" @change="saveColumns" />
              <span>{{ t(col.labelKey) }}</span>
            </label>
            <div class="cols-order-buttons">
              <button class="cols-order-btn" :disabled="index === 0" @click.stop="moveColumn(index, -1)" :title="t('ribbon.moveColumnUp')"><FluentIcon name="arrow_upward" /></button>
              <button class="cols-order-btn" :disabled="index === state.columns.length - 1" @click.stop="moveColumn(index, 1)" :title="t('ribbon.moveColumnDown')"><FluentIcon name="arrow_downward" /></button>
            </div>
          </div>
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
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
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
  openLocationDialog,
  openRenameDialog,
  openConfirmRemove,
  openConfirm,
  showToast,
  copyTorrentMagnet,
  copyTorrentMagnets,
  startTorrentsAction,
  stopTorrentsAction,
  startNowTorrentsAction,
  confirmVerifySelected,
  reannounceSelected,
  isTorrentForced,
  hasCustomSettings,
  getCustomSettingsSummary,
  formatDisplayPath,
} from '../../stores/transmission';
import { Torrent, TorrentStatus, Priority } from '../../api/types';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';

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
  headerMenu.open = false;
  openConfirm({
    title: t('ribbon.resetColsConfirmTitle'),
    message: t('ribbon.resetColsConfirm'),
    confirmText: t('ribbon.resetCols'),
    danger: true,
    onConfirm: () => {
      resetColumns();
      showToast(t('toast.columnsReset'), 'success');
    },
  });
}

const isQueueEnabled = computed(() => {
  if (!state.session) return true;
  return !!(state.session['download-queue-enabled'] || state.session['seed-queue-enabled']);
});

const isQueueColConfigured = computed(() => {
  return state.columns.some((col) => col.id === 'queuePosition' && col.visible);
});

const shouldShowDynamicQueueCol = computed(() => {
  return isQueueEnabled.value && state.ribbonTab === 'transfer' && !isQueueColConfigured.value;
});

const visibleColumnCount = computed(() => {
  let count = 1;
  if (shouldShowDynamicQueueCol.value) count++;
  count += state.columns.filter((c) => c.visible).length;
  return count;
});

const COLUMN_CLASS_MAP: Record<string, string> = {
  status: 'col-status', queuePosition: 'col-queue', name: 'col-name', size: 'col-size', progress: 'col-progress',
  statustext: 'col-statustext', downSpeed: 'col-downspeed', upSpeed: 'col-upspeed',
  eta: 'col-eta', ratio: 'col-ratio', peers: 'col-peers', corrupt: 'col-corrupt',
  downloaded: 'col-downloaded', uploaded: 'col-uploaded', remaining: 'col-remaining',
  haveValid: 'col-havevalid', sizeDone: 'col-sizedone', addedDate: 'col-addeddate',
  doneDate: 'col-donedate', activityDate: 'col-activitydate', seedingTime: 'col-seedingtime',
  downloadingTime: 'col-downloadingtime', peersDetail: 'col-peersdetail', webSeeds: 'col-webseeds',
  priority: 'col-priority', metadata: 'col-metadata', stalled: 'col-stalled',
  savePath: 'col-savepath', labels: 'col-labels', hash: 'col-hash', private: 'col-private',
  recheck: 'col-recheck', downloadLimit: 'col-dlimit', uploadLimit: 'col-ulimit',
  error: 'col-error', comment: 'col-comment', creator: 'col-creator',
};

const visibleColumns = computed(() => state.columns.filter((column) => column.visible));

const COLUMN_SORT_KEYS: Record<string, string> = {
  status: 'status', statustext: 'status', queuePosition: 'queuePosition',
  name: 'name', size: 'totalSize', progress: 'percentDone',
  downSpeed: 'rateDownload', upSpeed: 'rateUpload', ratio: 'uploadRatio',
  peers: 'peersConnected', downloaded: 'downloadedEver', uploaded: 'uploadedEver',
  remaining: 'leftUntilDone', haveValid: 'haveValid', sizeDone: 'sizeWhenDone',
  addedDate: 'addedDate', doneDate: 'doneDate', activityDate: 'activityDate',
  seedingTime: 'secondsSeeding', downloadingTime: 'secondsDownloading',
  peersDetail: 'peersConnected', webSeeds: 'webseedsSendingToUs',
  priority: 'bandwidthPriority', metadata: 'metadataPercentComplete',
  stalled: 'isStalled', recheck: 'recheckProgress',
};

function columnClass(id: string): string {
  return COLUMN_CLASS_MAP[id] || `col-${id}`;
}

function headerLabel(column: { id: string; labelKey: string }): string {
  if (column.id === 'status') return '';
  if (column.id === 'queuePosition') return '#';
  if (column.id === 'statustext') return t('common.status');
  return t(column.labelKey);
}

function sortKey(id: string): string | undefined {
  return COLUMN_SORT_KEYS[id];
}

const tableRef = ref<HTMLTableElement | null>(null);
let suppressHeaderClick = false;

function reorderColumn(fromId: string, targetId: string) {
  if (!fromId || !targetId || fromId === targetId) return;
  const next = [...state.columns];
  const fromIndex = next.findIndex((column) => column.id === fromId);
  if (fromIndex < 0) return;
  const [moved] = next.splice(fromIndex, 1);
  const targetIndex = next.findIndex((column) => column.id === targetId);
  next.splice(targetIndex < 0 ? next.length : targetIndex, 0, moved);
  state.columns = next;
  saveColumns();
}

function columnSort(id: string) {
  if (suppressHeaderClick) return;
  const key = COLUMN_SORT_KEYS[id];
  if (key) handleSort(key as any);
}

const draggingColumnId = ref<string | null>(null);
const dropBeforeId = ref<string | null>(null);
const dropAfterLast = ref(false);
const dragGhost = ref<{ label: string; x: number; y: number } | null>(null);

function columnLabel(id: string): string {
  const column = state.columns.find((item) => item.id === id);
  if (!column) return '';
  return column.id === 'status' ? t('common.status') : t(column.labelKey);
}

function onColumnDragStart(event: DragEvent, id: string) {
  if (resizingColId || (event.target as HTMLElement)?.closest('.col-resizer')) {
    event.preventDefault();
    return;
  }
  draggingColumnId.value = id;
  dropBeforeId.value = null;
  dropAfterLast.value = false;
  dragGhost.value = { label: columnLabel(id), x: event.clientX + 12, y: event.clientY + 12 };
  event.dataTransfer?.setData('text/plain', id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onColumnDragMove(event: DragEvent) {
  if (dragGhost.value) {
    dragGhost.value = { ...dragGhost.value, x: event.clientX + 12, y: event.clientY + 12 };
  }
}

function onColumnDragOver(event: DragEvent, id: string) {
  const index = visibleColumns.value.findIndex((column) => column.id === id);
  if (index < 0) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const after = event.clientX > rect.left + rect.width / 2;
  const nextColumn = visibleColumns.value[index + 1];

  dropAfterLast.value = false;
  if (after && nextColumn) {
    dropBeforeId.value = nextColumn.id;
  } else if (after) {
    dropBeforeId.value = null;
    dropAfterLast.value = true;
  } else {
    dropBeforeId.value = id;
  }

  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function onColumnDrop(event: DragEvent, _targetId: string) {
  const fromId = draggingColumnId.value || event.dataTransfer?.getData('text/plain');
  if (!fromId) {
    onColumnDragEnd();
    return;
  }

  if (fromId === dropBeforeId.value) {
    onColumnDragEnd();
    return;
  }

  const next = [...state.columns];
  const fromIndex = next.findIndex((column) => column.id === fromId);
  if (fromIndex < 0) {
    onColumnDragEnd();
    return;
  }

  const [moved] = next.splice(fromIndex, 1);
  if (dropBeforeId.value) {
    const targetIndex = next.findIndex((column) => column.id === dropBeforeId.value);
    next.splice(targetIndex < 0 ? next.length : targetIndex, 0, moved);
  } else {
    next.push(moved);
  }

  state.columns = next;
  saveColumns();
  onColumnDragEnd();
}

function onColumnDragEnd() {
  draggingColumnId.value = null;
  dropBeforeId.value = null;
  dropAfterLast.value = false;
  dragGhost.value = null;
}

function moveColumn(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= state.columns.length) return;
  const next = [...state.columns];
  [next[index], next[target]] = [next[target], next[index]];
  state.columns = next;
  saveColumns();
}

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
  e.preventDefault();
  e.stopPropagation();
  suppressHeaderClick = true;
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
  setTimeout(() => {
    suppressHeaderClick = false;
  }, 100);
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

function formatDate(timestamp?: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}${t('common.day')} ${hours}${t('common.hour')}`;
  if (hours > 0) return `${hours}${t('common.hour')} ${minutes}${t('common.min')}`;
  return `${minutes}${t('common.min')}`;
}

function formatPriority(priority?: Priority): string {
  if (priority === Priority.HIGH) return t('props.high');
  if (priority === Priority.LOW) return t('props.low');
  return t('props.normal');
}

function getPriorityClass(priority?: Priority): string {
  if (priority === Priority.HIGH) return 'prio-high';
  if (priority === Priority.LOW) return 'prio-low';
  return 'prio-normal';
}

function formatLimit(limited?: boolean, limit?: number): string {
  return limited ? `${limit ?? 0} KB/s` : '—';
}

const isContextMenuMulti = computed(() => {
  return state.selectedIds.length > 1;
});

function openContextMenu(e: MouseEvent, id: number) {
  if (!isSelected(id)) {
    selectTorrent(id, false);
  }
  contextMenu.visible = true;
  contextMenu.targetId = id;
  // 初步基于估计值定位
  contextMenu.x = Math.max(8, Math.min(e.clientX, window.innerWidth - 220));
  contextMenu.y = Math.max(8, Math.min(e.clientY, window.innerHeight - 520));

  nextTick(() => {
    const el = document.querySelector('.fluent-context-menu') as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (e.clientY + rect.height > window.innerHeight - 8) {
        contextMenu.y = Math.max(8, window.innerHeight - rect.height - 8);
      } else {
        contextMenu.y = Math.max(8, e.clientY);
      }
      if (e.clientX + rect.width > window.innerWidth - 8) {
        contextMenu.x = Math.max(8, window.innerWidth - rect.width - 8);
      } else {
        contextMenu.x = Math.max(8, e.clientX);
      }
    }
  });
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
      await startTorrentsAction(ids);
      break;
    case 'start-now':
      await startNowTorrentsAction(ids);
      break;
    case 'stop':
      await stopTorrentsAction(ids);
      break;
    case 'verify':
      confirmVerifySelected(ids);
      break;
    case 'reannounce':
      await reannounceSelected();
      break;
    case 'move-top':
      await rpc.queueMoveTop(ids);
      await fetchTorrents();
      break;
    case 'move-up':
      await rpc.queueMoveUp(ids);
      await fetchTorrents();
      break;
    case 'move-down':
      await rpc.queueMoveDown(ids);
      await fetchTorrents();
      break;
    case 'move-bottom':
      await rpc.queueMoveBottom(ids);
      await fetchTorrents();
      break;
    case 'detail':
      toggleDetail(ids[0]);
      break;
    case 'props':
      openTorrentProps(ids[0], ids);
      break;
    case 'copy-magnet':
      if (ids.length > 0) {
        copyTorrentMagnets(ids);
      }
      break;
    case 'rename':
      if (ids.length > 0) {
        state.selectedId = ids[0];
        openRenameDialog();
      }
      break;
    case 'set-location':
      if (ids.length > 0) {
        state.selectedIds = ids;
        state.selectedId = ids[0];
        openLocationDialog();
      }
      break;
    case 'batch-tags':
      if (ids.length > 0) {
        state.selectedIds = ids;
        state.batchTagsDialogOpen = true;
      }
      break;
    case 'remove':
      if (ids.length > 0) {
        state.selectedIds = ids;
        state.selectedId = ids[0];
        openConfirmRemove(false);
      }
      break;
    case 'remove-data':
      if (ids.length > 0) {
        state.selectedIds = ids;
        state.selectedId = ids[0];
        openConfirmRemove(true);
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
  const base = getStatusText(item.status);
  return isTorrentForced(item.id) ? `${base} [${t('status.forcedTag')}]` : base;
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
  if (isTorrentForced(item.id)) return 'badge-forced';
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
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border-divider) transparent;
}

.fluent-table-workspace::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.fluent-table-workspace::-webkit-scrollbar-thumb {
  background: var(--fluent-border-divider);
  border-radius: 5px;
}

.fluent-table-workspace::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-accent);
}

.fluent-desktop-table {
  width: 100%;
  min-width: 900px;
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
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  font-size: 11px;
  border-radius: var(--fluent-radius);
  transition: background-color 0.12s;
}

.cols-menu-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: pointer;
  padding: 2px 0;
}

.cols-order-buttons {
  display: inline-flex;
  gap: 1px;
  opacity: 0.45;
}

.cols-menu-item:hover .cols-order-buttons { opacity: 1; }

.cols-order-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-secondary);
  font-size: 9px;
  line-height: 1;
  cursor: pointer;
}

.cols-order-btn .fluent-icon { font-size: 14px; }

.cols-order-btn:hover:not(:disabled) { border-color: var(--fluent-accent); color: var(--fluent-accent); }
.cols-order-btn:disabled { opacity: 0.25; cursor: default; }

.cols-menu-item:hover { background-color: var(--fluent-bg-hover); }
.cols-menu-item input[type="checkbox"] { cursor: pointer; }

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
  cursor: pointer;
  vertical-align: middle;
}

.col-queue { width: 44px; text-align: center; font-family: var(--font-mono); }
.col-ratio { font-family: var(--font-mono); }

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

.name-cell-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.name-cell-wrapper .name-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-rule-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background-color: rgba(3, 169, 244, 0.12);
  color: #0288d1;
  cursor: pointer;
  transition: all 0.12s ease;
}

.custom-rule-tag:hover {
  background-color: rgba(3, 169, 244, 0.24);
  color: #01579b;
}

[data-theme="dark"] .custom-rule-tag {
  background-color: rgba(3, 169, 244, 0.18);
  color: #29b6f6;
}

[data-theme="dark"] .custom-rule-tag:hover {
  background-color: rgba(3, 169, 244, 0.32);
  color: #4fc3f7;
}

.custom-rule-tag .custom-rule-icon {
  font-size: 13px !important;
  line-height: 1;
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
  font-family: var(--font-mono);
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
.badge-forced { background-color: rgba(255, 152, 0, 0.18); color: #e65100; font-weight: 600; }

.down-val { color: #2e7d32; }
.up-val { color: #ef6c00; }
.text-muted { color: var(--md-text-secondary); }

.corrupt-tag {
  color: var(--md-error);
  font-weight: 500;
  font-family: var(--font-mono);
}

.monospace {
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.peers-sep {
  color: var(--md-text-disabled);
  margin: 0 2px;
}

.priority-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 1.4;
}

.priority-tag.prio-high {
  color: #c62828;
  background: rgba(198, 40, 40, 0.1);
}

.priority-tag.prio-normal {
  color: var(--md-text-secondary);
  background: var(--fluent-bg-hover);
}

.priority-tag.prio-low {
  color: #0078d4;
  background: rgba(0, 120, 212, 0.1);
}

.stalled-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  color: #b26a00;
  background: rgba(255, 152, 0, 0.16);
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
  max-height: calc(100vh - 16px);
  overflow-y: auto;
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

.menu-item .fluent-icon {
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

/* 列拖拽反馈 */
.fluent-desktop-table thead th.col-dragging {
  opacity: 0.45;
  cursor: grabbing;
}

.fluent-desktop-table thead th.col-drop-before {
  box-shadow: inset 3px 0 0 var(--fluent-accent);
}

.fluent-desktop-table thead th.col-drop-after {
  box-shadow: inset -3px 0 0 var(--fluent-accent);
}

.column-drag-ghost {
  position: fixed;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 11px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  pointer-events: none;
}

.column-drag-ghost .fluent-icon {
  font-size: 14px;
  color: var(--fluent-accent);
}
</style>
