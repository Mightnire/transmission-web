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

          <!-- 队列序号 (#) 排序列：在“传输与网络”Tab 下显示，便于观察调度顺序 -->
          <th
            class="col-queue"
            v-if="state.ribbonTab === 'transfer'"
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

          <!-- 已下载 -->
          <th class="col-downloaded resizable-col" v-if="isColVisible('downloaded')" :style="{ width: `${getColWidth('downloaded')}px` }" @click="handleSort('downloadedEver')">
            <div class="th-content">
              <span>{{ t('tableCols.downloaded') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'downloadedEver'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('downloaded', $event)"></div>
          </th>

          <!-- 已上传 -->
          <th class="col-uploaded resizable-col" v-if="isColVisible('uploaded')" :style="{ width: `${getColWidth('uploaded')}px` }" @click="handleSort('uploadedEver')">
            <div class="th-content">
              <span>{{ t('tableCols.uploaded') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'uploadedEver'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('uploaded', $event)"></div>
          </th>

          <!-- 剩余 -->
          <th class="col-remaining resizable-col" v-if="isColVisible('remaining')" :style="{ width: `${getColWidth('remaining')}px` }" @click="handleSort('leftUntilDone')">
            <div class="th-content">
              <span>{{ t('tableCols.remaining') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'leftUntilDone'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('remaining', $event)"></div>
          </th>

          <!-- 有效数据 -->
          <th class="col-havevalid resizable-col" v-if="isColVisible('haveValid')" :style="{ width: `${getColWidth('haveValid')}px` }" @click="handleSort('haveValid')">
            <div class="th-content">
              <span>{{ t('tableCols.haveValid') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'haveValid'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('haveValid', $event)"></div>
          </th>

          <!-- 完成大小 -->
          <th class="col-sizedone resizable-col" v-if="isColVisible('sizeDone')" :style="{ width: `${getColWidth('sizeDone')}px` }" @click="handleSort('sizeWhenDone')">
            <div class="th-content">
              <span>{{ t('tableCols.sizeDone') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'sizeWhenDone'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('sizeDone', $event)"></div>
          </th>

          <!-- 添加时间 -->
          <th class="col-addeddate resizable-col" v-if="isColVisible('addedDate')" :style="{ width: `${getColWidth('addedDate')}px` }" @click="handleSort('addedDate')">
            <div class="th-content">
              <span>{{ t('tableCols.addedDate') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'addedDate'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('addedDate', $event)"></div>
          </th>

          <!-- 完成时间 -->
          <th class="col-donedate resizable-col" v-if="isColVisible('doneDate')" :style="{ width: `${getColWidth('doneDate')}px` }" @click="handleSort('doneDate')">
            <div class="th-content">
              <span>{{ t('tableCols.doneDate') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'doneDate'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('doneDate', $event)"></div>
          </th>

          <!-- 最近活动 -->
          <th class="col-activitydate resizable-col" v-if="isColVisible('activityDate')" :style="{ width: `${getColWidth('activityDate')}px` }" @click="handleSort('activityDate')">
            <div class="th-content">
              <span>{{ t('tableCols.activityDate') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'activityDate'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('activityDate', $event)"></div>
          </th>

          <!-- 做种时长 -->
          <th class="col-seedingtime resizable-col" v-if="isColVisible('seedingTime')" :style="{ width: `${getColWidth('seedingTime')}px` }" @click="handleSort('secondsSeeding')">
            <div class="th-content">
              <span>{{ t('tableCols.seedingTime') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'secondsSeeding'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('seedingTime', $event)"></div>
          </th>

          <!-- 下载时长 -->
          <th class="col-downloadingtime resizable-col" v-if="isColVisible('downloadingTime')" :style="{ width: `${getColWidth('downloadingTime')}px` }" @click="handleSort('secondsDownloading')">
            <div class="th-content">
              <span>{{ t('tableCols.downloadingTime') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'secondsDownloading'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('downloadingTime', $event)"></div>
          </th>

          <!-- 节点明细 -->
          <th class="col-peersdetail resizable-col" v-if="isColVisible('peersDetail')" :style="{ width: `${getColWidth('peersDetail')}px` }" @click="handleSort('peersConnected')">
            <div class="th-content">
              <span>{{ t('tableCols.peersDetail') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'peersConnected'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('peersDetail', $event)"></div>
          </th>

          <!-- Web Seeds -->
          <th class="col-webseeds resizable-col" v-if="isColVisible('webSeeds')" :style="{ width: `${getColWidth('webSeeds')}px` }" @click="handleSort('webseedsSendingToUs')">
            <div class="th-content">
              <span>{{ t('tableCols.webSeeds') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'webseedsSendingToUs'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('webSeeds', $event)"></div>
          </th>

          <!-- 优先级 -->
          <th class="col-priority resizable-col" v-if="isColVisible('priority')" :style="{ width: `${getColWidth('priority')}px` }" @click="handleSort('bandwidthPriority')">
            <div class="th-content">
              <span>{{ t('tableCols.priority') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'bandwidthPriority'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('priority', $event)"></div>
          </th>

          <!-- 元数据完成度 -->
          <th class="col-metadata resizable-col" v-if="isColVisible('metadata')" :style="{ width: `${getColWidth('metadata')}px` }" @click="handleSort('metadataPercentComplete')">
            <div class="th-content">
              <span>{{ t('tableCols.metadata') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'metadataPercentComplete'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('metadata', $event)"></div>
          </th>

          <!-- 停滞 -->
          <th class="col-stalled resizable-col" v-if="isColVisible('stalled')" :style="{ width: `${getColWidth('stalled')}px` }" @click="handleSort('isStalled')">
            <div class="th-content">
              <span>{{ t('tableCols.stalled') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'isStalled'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('stalled', $event)"></div>
          </th>

          <!-- 保存路径 -->
          <th class="col-savepath resizable-col" v-if="isColVisible('savePath')" :style="{ width: `${getColWidth('savePath')}px` }">
            <div class="th-content"><span>{{ t('tableCols.savePath') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('savePath', $event)"></div>
          </th>

          <!-- 标签 -->
          <th class="col-labels resizable-col" v-if="isColVisible('labels')" :style="{ width: `${getColWidth('labels')}px` }">
            <div class="th-content"><span>{{ t('tableCols.labels') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('labels', $event)"></div>
          </th>

          <!-- 哈希 -->
          <th class="col-hash resizable-col" v-if="isColVisible('hash')" :style="{ width: `${getColWidth('hash')}px` }">
            <div class="th-content"><span>{{ t('tableCols.hash') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('hash', $event)"></div>
          </th>

          <!-- 私有种子 -->
          <th class="col-private resizable-col" v-if="isColVisible('private')" :style="{ width: `${getColWidth('private')}px` }">
            <div class="th-content"><span>{{ t('tableCols.private') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('private', $event)"></div>
          </th>

          <!-- 校验进度 -->
          <th class="col-recheck resizable-col" v-if="isColVisible('recheck')" :style="{ width: `${getColWidth('recheck')}px` }" @click="handleSort('recheckProgress')">
            <div class="th-content">
              <span>{{ t('tableCols.recheck') }}</span>
              <span class="sort-indicator" v-if="state.filter.sortBy === 'recheckProgress'">{{ state.filter.sortAsc ? '▲' : '▼' }}</span>
            </div>
            <div class="col-resizer" @mousedown.stop="startResize('recheck', $event)"></div>
          </th>

          <!-- 下载限速 -->
          <th class="col-dlimit resizable-col" v-if="isColVisible('downloadLimit')" :style="{ width: `${getColWidth('downloadLimit')}px` }">
            <div class="th-content"><span>{{ t('tableCols.downloadLimit') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('downloadLimit', $event)"></div>
          </th>

          <!-- 上传限速 -->
          <th class="col-ulimit resizable-col" v-if="isColVisible('uploadLimit')" :style="{ width: `${getColWidth('uploadLimit')}px` }">
            <div class="th-content"><span>{{ t('tableCols.uploadLimit') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('uploadLimit', $event)"></div>
          </th>

          <!-- 错误信息 -->
          <th class="col-error resizable-col" v-if="isColVisible('error')" :style="{ width: `${getColWidth('error')}px` }">
            <div class="th-content"><span>{{ t('tableCols.error') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('error', $event)"></div>
          </th>

          <!-- 注释 -->
          <th class="col-comment resizable-col" v-if="isColVisible('comment')" :style="{ width: `${getColWidth('comment')}px` }">
            <div class="th-content"><span>{{ t('tableCols.comment') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('comment', $event)"></div>
          </th>

          <!-- 创建者 -->
          <th class="col-creator resizable-col" v-if="isColVisible('creator')" :style="{ width: `${getColWidth('creator')}px` }">
            <div class="th-content"><span>{{ t('tableCols.creator') }}</span></div>
            <div class="col-resizer" @mousedown.stop="startResize('creator', $event)"></div>
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

          <!-- 队列顺序号 (#)：在“传输与网络”Tab 下显示 -->
          <td class="col-queue" v-if="state.ribbonTab === 'transfer'">
            <span
              class="queue-cell-badge"
              :class="{ 'queue-waiting': isQueueWaiting(torrent) }"
              :title="`${t('common.queue')}: ${torrent.queuePosition}`"
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

          <td class="col-downloaded" v-if="isColVisible('downloaded')">{{ formatBytes(torrent.downloadedEver) }}</td>
          <td class="col-uploaded" v-if="isColVisible('uploaded')">{{ formatBytes(torrent.uploadedEver) }}</td>
          <td class="col-remaining" v-if="isColVisible('remaining')">{{ formatBytes(torrent.leftUntilDone) }}</td>
          <td class="col-havevalid" v-if="isColVisible('haveValid')">{{ formatBytes(torrent.haveValid) }}</td>
          <td class="col-sizedone" v-if="isColVisible('sizeDone')">{{ formatBytes(torrent.sizeWhenDone) }}</td>
          <td class="col-addeddate" v-if="isColVisible('addedDate')">{{ formatDate(torrent.addedDate) }}</td>
          <td class="col-donedate" v-if="isColVisible('doneDate')">{{ formatDate(torrent.doneDate) }}</td>
          <td class="col-activitydate" v-if="isColVisible('activityDate')">{{ formatDate(torrent.activityDate) }}</td>
          <td class="col-seedingtime" v-if="isColVisible('seedingTime')">{{ formatDuration(torrent.secondsSeeding) }}</td>
          <td class="col-downloadingtime" v-if="isColVisible('downloadingTime')">{{ formatDuration(torrent.secondsDownloading) }}</td>
          <td class="col-peersdetail" v-if="isColVisible('peersDetail')">
            <span class="text-success">↓{{ torrent.peersSendingToUs || 0 }}</span>
            <span class="peers-sep">/</span>
            <span class="text-warning">↑{{ torrent.peersGettingFromUs || 0 }}</span>
          </td>
          <td class="col-webseeds" v-if="isColVisible('webSeeds')">{{ torrent.webseedsSendingToUs ?? 0 }}</td>
          <td class="col-priority" v-if="isColVisible('priority')">
            <span class="priority-tag" :class="getPriorityClass(torrent.bandwidthPriority)">
              {{ formatPriority(torrent.bandwidthPriority) }}
            </span>
          </td>
          <td class="col-metadata" v-if="isColVisible('metadata')">
            {{ (torrent.metadataPercentComplete ?? 1) < 1 ? `${((torrent.metadataPercentComplete || 0) * 100).toFixed(0)}%` : '—' }}
          </td>
          <td class="col-stalled" v-if="isColVisible('stalled')">
            <span v-if="torrent.isStalled" class="stalled-tag">{{ t('tableCols.stalled') }}</span>
            <span v-else class="text-muted">—</span>
          </td>
          <td class="col-savepath" v-if="isColVisible('savePath')" :title="torrent.downloadDir">{{ torrent.downloadDir || '—' }}</td>
          <td class="col-labels" v-if="isColVisible('labels')" :title="torrent.labels?.join(', ')">
            {{ torrent.labels && torrent.labels.length > 0 ? torrent.labels.join(', ') : '—' }}
          </td>
          <td class="col-hash monospace" v-if="isColVisible('hash')" :title="torrent.hashString">{{ torrent.hashString || '—' }}</td>
          <td class="col-private" v-if="isColVisible('private')">{{ torrent.isPrivate ? '✓' : '—' }}</td>
          <td class="col-recheck" v-if="isColVisible('recheck')">
            {{ isChecking(torrent) ? `${((torrent.recheckProgress || 0) * 100).toFixed(1)}%` : '—' }}
          </td>
          <td class="col-dlimit" v-if="isColVisible('downloadLimit')">{{ formatLimit(torrent.downloadLimited, torrent.downloadLimit) }}</td>
          <td class="col-ulimit" v-if="isColVisible('uploadLimit')">{{ formatLimit(torrent.uploadLimited, torrent.uploadLimit) }}</td>
          <td class="col-error" v-if="isColVisible('error')" :title="torrent.errorString">
            <span :class="torrent.errorString ? 'text-danger' : 'text-muted'">{{ torrent.errorString || '—' }}</span>
          </td>
          <td class="col-comment" v-if="isColVisible('comment')" :title="torrent.comment">{{ torrent.comment || '—' }}</td>
          <td class="col-creator" v-if="isColVisible('creator')" :title="torrent.creator">{{ torrent.creator || '—' }}</td>
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
  openLocationDialog,
  openRenameDialog,
  openConfirmRemove,
  copyTorrentMagnet,
  startTorrentsAction,
  stopTorrentsAction,
  startNowTorrentsAction,
  confirmVerifySelected,
  reannounceSelected,
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
  resetColumns();
  headerMenu.open = false;
}

const visibleColumnCount = computed(() => {
  let count = 1;
  if (state.ribbonTab === 'transfer') count++;
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
      openTorrentProps(ids[0]);
      break;
    case 'copy-magnet':
      if (ids.length > 0) {
        copyTorrentMagnet(ids[0]);
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
