<template>
  <footer class="app-status-bar desktop-only" role="status" aria-label="Status Bar">
    <!-- 左侧：选中汇总与任务计数 -->
    <div class="status-section status-left">
      <FluentIcon name="list" class="status-icon" />
      <span class="status-text selectable">{{ selectionText }}</span>
    </div>

    <!-- 中间：留空 -->
    <div class="status-section status-center"></div>

    <!-- 右侧：磁盘剩余空间、实时双向速率与控制项 -->
    <div class="status-section status-right">
      <!-- 实时活跃状态提示 (紧邻可用空间左侧，仅在有真实传输时出现) -->
      <div class="status-item active-transfer-item" v-if="activeTransfer.hasActive">
        <span class="active-dot is-active"></span>
        <span class="status-text">{{ activeText }}</span>
      </div>

      <!-- 磁盘可用空间 -->
      <div class="status-item storage-item" v-if="freeSpaceBytes !== null" :title="downloadDirTooltip">
        <FluentIcon name="hard_drive" class="status-icon" />
        <span class="status-text">{{ t('statusbar.freeSpace', { free: formatBytes(freeSpaceBytes) }) }}</span>
      </div>

      <!-- 下行速率 (点击呼出限速弹层) -->
      <button
        class="status-btn speed-btn down"
        :class="{
          active: speedFlyout.open && speedFlyout.type === 'down',
          'is-limited': isDownLimited,
          'is-turtle': isTurtleActive,
          'is-regular-limit': isDownLimited && !isTurtleActive
        }"
        @click.stop="toggleSpeedFlyout('down')"
        :title="downLimitTooltip"
      >
        <FluentIcon name="arrow_downward" class="status-icon text-info" />
        <span class="speed-val">{{ formatSpeed(state.stats?.downloadSpeed) }}</span>
        <span
          class="limit-indicator"
          :class="{ 'turtle-limit': isTurtleActive, 'regular-limit': isDownLimited && !isTurtleActive }"
          v-if="isDownLimited"
        >
          [{{ formatBytes(downLimitBytes) }}/s]
        </span>
      </button>

      <!-- 上行速率 (点击呼出限速弹层) -->
      <button
        class="status-btn speed-btn up"
        :class="{
          active: speedFlyout.open && speedFlyout.type === 'up',
          'is-limited': isUpLimited,
          'is-turtle': isTurtleActive,
          'is-regular-limit': isUpLimited && !isTurtleActive
        }"
        @click.stop="toggleSpeedFlyout('up')"
        :title="upLimitTooltip"
      >
        <FluentIcon name="arrow_upward" class="status-icon text-success" />
        <span class="speed-val">{{ formatSpeed(state.stats?.uploadSpeed) }}</span>
        <span
          class="limit-indicator"
          :class="{ 'turtle-limit': isTurtleActive, 'regular-limit': isUpLimited && !isTurtleActive }"
          v-if="isUpLimited"
        >
          [{{ formatBytes(upLimitBytes) }}/s]
        </span>
      </button>

      <!-- 乌龟临时限速快捷切换 -->
      <button
        class="status-btn turtle-btn"
        :class="{ active: state.session?.['alt-speed-enabled'] }"
        @click="toggleTurtleMode"
        :title="t('toolbar.turtle')"
      >
        <FluentIcon name="speed" class="status-icon" />
      </button>

      <!-- 视图模式切换 (表格 / 卡片，Office 独立按钮组) -->
      <div class="view-switch-group" role="group" :aria-label="t('statusbar.tableView')">
        <button
          class="status-btn view-mode-btn"
          :class="{ active: state.viewMode === 'table' }"
          @click="setViewMode('table')"
          :title="t('statusbar.tableView')"
        >
          <FluentIcon name="table_chart" class="status-icon" />
        </button>
        <button
          class="status-btn view-mode-btn"
          :class="{ active: state.viewMode === 'cards' }"
          @click="setViewMode('cards')"
          :title="t('statusbar.cardsView')"
        >
          <FluentIcon name="grid_view" class="status-icon" />
        </button>
      </div>

      <!-- 紧凑密度切换 -->
      <button
        class="status-btn"
        :class="{ active: state.compactDensity }"
        @click="toggleCompactDensity"
        :title="t('statusbar.compactDensity')"
      >
        <FluentIcon name="format_line_spacing" class="status-icon" />
      </button>
    </div>

    <!-- 快捷限速上浮 Flyout 气泡 -->
    <div class="status-speed-flyout" :class="speedFlyout.type" v-if="speedFlyout.open" @click.stop>
      <div class="flyout-header">
        <span>{{ speedFlyout.type === 'down' ? t('statusbar.downLimit') : t('statusbar.upLimit') }}</span>
        <button class="flyout-close-btn" @click="speedFlyout.open = false" :title="t('common.close')">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="flyout-body">
        <label class="fluent-check-label">
          <input type="checkbox" v-model="speedFlyout.enabled" />
          <span>{{ t('common.enabled') }}</span>
        </label>
        <div class="flyout-input-row">
          <input
            type="number"
            class="num-input flyout-num"
            v-model.number="speedFlyout.limit"
            :disabled="!speedFlyout.enabled"
            min="0"
            step="50"
          />
          <span class="unit-txt">KB/s</span>
        </div>
      </div>
      <div class="flyout-footer">
        <button class="md-btn md-btn-flat mini" @click="speedFlyout.open = false">
          {{ t('common.cancel') }}
        </button>
        <button class="md-btn md-btn-raised mini" @click="saveSpeedLimit">
          {{ t('common.save') }}
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import {
  state,
  formatBytes,
  formatSpeed,
  toggleCompactDensity,
  setViewMode,
} from '../../stores/transmission';
import { TorrentStatus } from '../../api/types';
import { rpc } from '../../api/rpc';
import { t } from '../../locales';
import FluentIcon from '../common/FluentIcon.vue';

// 选中汇总计算
const totalCount = computed(() => state.torrents.length);

const selectedTorrents = computed(() => {
  if (state.selectedIds.length === 0) return [];
  const set = new Set(state.selectedIds);
  return state.torrents.filter((t) => set.has(t.id));
});

const selectedSize = computed(() => {
  return selectedTorrents.value.reduce((acc, cur) => acc + (cur.totalSize || cur.sizeWhenDone || 0), 0);
});

const selectionText = computed(() => {
  const count = state.selectedIds.length;
  if (count === 0) {
    return t('statusbar.totalItems', { count: totalCount.value });
  }
  return t('statusbar.selectedItems', {
    total: totalCount.value,
    count,
    size: formatBytes(selectedSize.value),
  });
});

// 活跃状态汇总 (统计真实有传输速率的任务，保持静默原则)
const activeTransfer = computed(() => {
  let down = 0;
  let up = 0;
  for (const item of state.torrents) {
    if (item.rateDownload > 0) down++;
    if (item.rateUpload > 0) up++;
  }
  const total = down + up;
  return { down, up, total, hasActive: total > 0 };
});

const activeText = computed(() => {
  if (activeTransfer.value.hasActive) {
    return t('statusbar.activeSummary', { down: activeTransfer.value.down, up: activeTransfer.value.up });
  }
  return '';
});

// 限速状态判定与标识
const isTurtleActive = computed(() => !!state.session?.['alt-speed-enabled']);

const isDownLimited = computed(() => {
  if (isTurtleActive.value) return true;
  return !!state.session?.['speed-limit-down-enabled'];
});

const isUpLimited = computed(() => {
  if (isTurtleActive.value) return true;
  return !!state.session?.['speed-limit-up-enabled'];
});

const downLimitBytes = computed(() => {
  if (isTurtleActive.value) {
    return (state.session?.['alt-speed-down'] ?? 0) * 1024;
  }
  return (state.session?.['speed-limit-down'] ?? 0) * 1024;
});

const upLimitBytes = computed(() => {
  if (isTurtleActive.value) {
    return (state.session?.['alt-speed-up'] ?? 0) * 1024;
  }
  return (state.session?.['speed-limit-up'] ?? 0) * 1024;
});

const downLimitTooltip = computed(() => {
  if (isDownLimited.value) {
    const reason = isTurtleActive.value ? t('toolbar.turtle') : t('statusbar.downLimit');
    return `${t('sidebar.downLimit')} · ${reason}: ${formatBytes(downLimitBytes.value)}/s`;
  }
  return t('sidebar.downLimit');
});

const upLimitTooltip = computed(() => {
  if (isUpLimited.value) {
    const reason = isTurtleActive.value ? t('toolbar.turtle') : t('statusbar.upLimit');
    return `${t('sidebar.upLimit')} · ${reason}: ${formatBytes(upLimitBytes.value)}/s`;
  }
  return t('sidebar.upLimit');
});

// 下载目录与存储剩余空间探测
const freeSpaceBytes = ref<number | null>(null);

const downloadDirTooltip = computed(() => {
  const dir = state.session?.['download-dir'] || '';
  return `${dir} · ${t('statusbar.freeSpace', { free: formatBytes(freeSpaceBytes.value ?? 0) })}`;
});

async function updateFreeSpace() {
  const dir = state.session?.['download-dir'];
  if (!dir) return;
  try {
    const res = await rpc.freeSpace(dir);
    freeSpaceBytes.value = res['size-bytes'] ?? null;
  } catch {
    freeSpaceBytes.value = null;
  }
}

watch(() => state.session?.['download-dir'], () => {
  updateFreeSpace();
});

// 限速 Flyout
const speedFlyout = reactive({
  open: false,
  type: 'down' as 'down' | 'up',
  enabled: false,
  limit: 0,
});

function toggleSpeedFlyout(type: 'down' | 'up') {
  if (speedFlyout.open && speedFlyout.type === type) {
    speedFlyout.open = false;
    return;
  }
  speedFlyout.type = type;
  if (type === 'down') {
    speedFlyout.enabled = !!state.session?.['speed-limit-down-enabled'];
    speedFlyout.limit = state.session?.['speed-limit-down'] ?? 100;
  } else {
    speedFlyout.enabled = !!state.session?.['speed-limit-up-enabled'];
    speedFlyout.limit = state.session?.['speed-limit-up'] ?? 100;
  }
  speedFlyout.open = true;
}

async function saveSpeedLimit() {
  const args: any = {};
  if (speedFlyout.type === 'down') {
    args['speed-limit-down-enabled'] = speedFlyout.enabled;
    args['speed-limit-down'] = speedFlyout.limit;
  } else {
    args['speed-limit-up-enabled'] = speedFlyout.enabled;
    args['speed-limit-up'] = speedFlyout.limit;
  }
  if (state.session) {
    Object.assign(state.session, args);
  }
  await rpc.setSession(args);
  speedFlyout.open = false;
}

function closeFlyoutOnOutsideClick(e: MouseEvent) {
  if (speedFlyout.open && !(e.target as HTMLElement)?.closest('.status-speed-flyout')) {
    speedFlyout.open = false;
  }
}

// 乌龟模式切换
async function toggleTurtleMode() {
  const next = !state.session?.['alt-speed-enabled'];
  if (state.session) {
    state.session['alt-speed-enabled'] = next;
  }
  await rpc.setSession({ 'alt-speed-enabled': next });
}

onMounted(() => {
  updateFreeSpace();
  window.addEventListener('click', closeFlyoutOnOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', closeFlyoutOnOutsideClick);
});
</script>

<style scoped>
/* Office 2016 纯平状态栏 */
.app-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  background-color: var(--fluent-bg-canvas);
  border-top: 1px solid var(--fluent-border-subtle);
  padding: 0 8px;
  font-size: 11px;
  color: var(--md-text-secondary);
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  white-space: nowrap;
  overflow: visible;
}

.status-section {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.status-section > * + * {
  margin-left: 6px;
}

.status-left {
  flex-shrink: 0;
  min-width: 0;
}

.status-center {
  flex: 1;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.status-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.status-right > * + * {
  margin-left: 4px;
}

.status-icon {
  font-size: 13px;
  display: inline-flex;
  align-items: center;
}

.status-text {
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.selectable {
  user-select: text;
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--fluent-border-subtle);
  display: inline-block;
  transition: background-color 0.2s ease;
}

.active-dot.is-active {
  background-color: #2e7d32;
  box-shadow: 0 0 4px rgba(46, 125, 50, 0.4);
}

.status-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 2px;
}

.status-item > * + * {
  margin-left: 4px;
}

.storage-item {
  color: var(--md-text-primary);
  font-family: var(--font-mono);
  font-size: 10.5px;
  min-width: 96px;
  font-variant-numeric: tabular-nums;
}

.active-transfer-item {
  font-variant-numeric: tabular-nums;
  margin-right: 2px;
}

.status-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 5px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--md-text-secondary);
  border-radius: 2px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.status-btn > * + * {
  margin-left: 3px;
}

.status-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
  border-color: var(--fluent-border-subtle);
}

.status-btn.active {
  background-color: var(--fluent-bg-subtle);
  color: var(--fluent-accent);
  border-color: var(--fluent-accent);
}

.speed-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  min-width: 84px;
}

.speed-btn.is-limited {
  min-width: 144px;
}

/* 普通全局限速：沉稳科技蓝 */
.speed-btn.is-regular-limit {
  border-color: rgba(0, 120, 212, 0.45);
  background-color: rgba(0, 120, 212, 0.08);
}

.limit-indicator.regular-limit {
  font-size: 9px;
  color: #005a9e;
  background: rgba(0, 120, 212, 0.16);
  padding: 1px 3px;
  border-radius: 2px;
  font-family: var(--font-mono);
  font-weight: 600;
  margin-left: 2px;
  line-height: 1;
}

[data-theme="dark"] .limit-indicator.regular-limit {
  color: #4cc2ff;
  background: rgba(0, 120, 212, 0.22);
}

/* 乌龟临时限速模式：警示温暖琥珀橙 */
.speed-btn.is-turtle {
  border-color: rgba(245, 124, 0, 0.45);
  background-color: rgba(245, 124, 0, 0.08);
}

.limit-indicator.turtle-limit {
  font-size: 9px;
  color: #b26a00;
  background: rgba(255, 152, 0, 0.18);
  padding: 1px 3px;
  border-radius: 2px;
  font-family: var(--font-mono);
  font-weight: 600;
  margin-left: 2px;
  line-height: 1;
}

[data-theme="dark"] .limit-indicator.turtle-limit {
  color: #ffb74d;
  background: rgba(255, 183, 77, 0.22);
}

.speed-val {
  min-width: 66px;
  text-align: right;
  display: inline-block;
  font-variant-numeric: tabular-nums;
}

.turtle-btn.active {
  color: var(--md-warning);
  border-color: var(--md-warning);
}

/* 独立视图按钮组（Office 风格并列视图切换） */
.view-switch-group {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 2px;
  padding: 1px;
  background: var(--fluent-bg-subtle);
}

.view-switch-group > * + * {
  margin-left: 1px;
}

.view-switch-group .view-mode-btn {
  height: 18px;
  padding: 0 4px;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: var(--md-text-secondary);
}

.view-switch-group .view-mode-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.view-switch-group .view-mode-btn.active {
  background-color: var(--fluent-bg-canvas);
  color: var(--fluent-accent);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* 快捷限速上浮 Flyout 气泡 */
.status-speed-flyout {
  position: absolute;
  bottom: 28px;
  right: 70px;
  width: 220px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
  padding: 10px;
  z-index: 500;
}

.status-speed-flyout.down {
  right: 120px;
}

.status-speed-flyout.up {
  right: 70px;
}

.flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--fluent-accent);
}

.flyout-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
}

.flyout-body {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.flyout-body > * + * {
  margin-top: 6px;
}

.flyout-input-row {
  display: flex;
  align-items: center;
}

.flyout-input-row > * + * {
  margin-left: 6px;
}

.flyout-num {
  width: 90px;
  padding: 3px 6px;
  font-size: 11px;
}

.unit-txt {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.fluent-check-label {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  cursor: pointer;
}

.fluent-check-label > * + * {
  margin-left: 6px;
}

.fluent-check-label input[type="checkbox"] {
  cursor: pointer;
}

.flyout-footer {
  display: flex;
  justify-content: flex-end;
}

.flyout-footer > * + * {
  margin-left: 6px;
}

.md-btn.mini {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
}

/* 颜色助手 */
.text-info { color: var(--md-info) !important; }
.text-success { color: var(--md-success) !important; }
.text-warning { color: var(--md-warning) !important; }


@media (max-width: 1024px) {
  .status-center {
    display: none !important;
  }
}

@media (max-width: 860px) {
  .storage-item {
    display: none !important;
  }
}

/* 移动端完全隐藏底部状态栏，避免与手势区冲突 */
@media (max-width: 768px) {
  .app-status-bar {
    display: none !important;
  }
}
</style>
