<template>
  <Teleport to="body">
    <Transition name="backstage-fade">
      <div
        class="file-backstage"
        v-if="state.fileMenuOpen"
        role="dialog"
        aria-modal="true"
        :aria-label="t('backstage.title')"
      >
        <!-- 左侧 Office 2016 深红导航栏 -->
        <aside class="backstage-nav">
          <div class="nav-brand">
            <TransmissionLogo :size="30" />
            <div class="brand-titles">
              <strong>Transmission</strong>
              <span>{{ state.session?.version || '—' }}</span>
            </div>
          </div>

          <button class="nav-back" @click="closeFileMenu">
            <FluentIcon name="chevron_left" />
            <span>{{ t('backstage.back') }}</span>
          </button>

          <nav class="nav-items">
            <button class="nav-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
              <FluentIcon name="info" />
              <span>{{ t('backstage.info') }}</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
              <FluentIcon name="insights" />
              <span>{{ t('backstage.stats') }}</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'add' }" @click="activeTab = 'add'">
              <FluentIcon name="add_circle" />
              <span>{{ t('backstage.add') }}</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
              <FluentIcon name="settings" />
              <span>{{ t('backstage.settings') }}</span>
            </button>
            <button class="nav-item" :class="{ active: activeTab === 'about' }" @click="activeTab = 'about'">
              <FluentIcon name="info" />
              <span>{{ t('backstage.about') }}</span>
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区 -->
        <section class="backstage-main">
          <header class="backstage-header">
            <div class="header-titles">
              <h1>{{ activeTabTitle }}</h1>
              <p>{{ activeTabSubtitle }}</p>
            </div>
            <button class="header-close" @click="closeFileMenu" :title="t('backstage.back')">
              <FluentIcon name="close" />
            </button>
          </header>

          <div class="backstage-body" :class="{ 'is-settings': activeTab === 'settings' }">
            <div class="backstage-page" :key="activeTab" :class="{ 'full-height': activeTab === 'settings' }">
            <!-- 信息 / 仪表盘 -->
            <template v-if="activeTab === 'info'">
              <div class="stat-cards">
                <div class="stat-card">
                  <FluentIcon name="cloud_download" class="stat-icon text-accent" />
                  <span class="stat-label">{{ t('backstage.downloadSpeed') }}</span>
                  <strong class="stat-value">{{ formatSpeed(state.stats?.downloadSpeed) }}</strong>
                </div>
                <div class="stat-card">
                  <FluentIcon name="cloud_upload" class="stat-icon text-success" />
                  <span class="stat-label">{{ t('backstage.uploadSpeed') }}</span>
                  <strong class="stat-value">{{ formatSpeed(state.stats?.uploadSpeed) }}</strong>
                </div>
                <div class="stat-card">
                  <FluentIcon name="bolt" class="stat-icon text-warning" />
                  <span class="stat-label">{{ t('backstage.activeTorrents') }}</span>
                  <strong class="stat-value">{{ state.stats?.activeTorrentCount ?? counts.downloading + counts.seeding }}</strong>
                </div>
                <div class="stat-card">
                  <FluentIcon name="schedule" class="stat-icon text-muted" />
                  <span class="stat-label">{{ t('dialog.activeTime') }}</span>
                  <strong class="stat-value">{{ formatDuration(state.stats?.['current-stats']?.secondsActive) }}</strong>
                </div>
              </div>

              <div class="quick-actions-panel">
                <div class="panel-head">
                  <h3>{{ t('backstage.quickActions') }}</h3>
                </div>
                <div class="quick-actions">
                  <button class="quick-action primary" @click="handleAdd">
                    <FluentIcon name="add" />
                    <span>{{ t('backstage.add') }}</span>
                  </button>
                  <button class="quick-action" @click="activeTab = 'settings'">
                    <FluentIcon name="settings" />
                    <span>{{ t('backstage.settings') }}</span>
                  </button>
                  <button class="quick-action" @click="refreshData">
                    <FluentIcon name="sync" />
                    <span>{{ t('backstage.refresh') }}</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- 统计 -->
            <template v-else-if="activeTab === 'stats'">
              <div class="panel chart-panel">
                <div class="panel-head">
                  <div>
                    <h3>{{ t('backstage.chartTitle') }}</h3>
                    <p>{{ activeTorrentCount > 0 ? t('backstage.activeTorrentsCount', { count: activeTorrentCount }) : t('backstage.noActiveTorrents') }}</p>
                  </div>
                  <FluentIcon name="insights" class="panel-icon text-accent" />
                </div>
                <SpeedChart :points="state.speedHistory" />
              </div>

              <div class="backstage-grid two">
                <div class="panel">
                  <h3>{{ t('backstage.session') }}</h3>
                  <div class="stat-rows">
                    <div class="stat-row">
                      <span>{{ t('dialog.downloaded') }}</span>
                      <strong>{{ formatBytes(state.stats?.['current-stats']?.downloadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.uploaded') }}</span>
                      <strong>{{ formatBytes(state.stats?.['current-stats']?.uploadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.ratio') }}</span>
                      <strong>{{ calcRatio(state.stats?.['current-stats']?.uploadedBytes, state.stats?.['current-stats']?.downloadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.activeTime') }}</span>
                      <strong>{{ formatDuration(state.stats?.['current-stats']?.secondsActive) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('backstage.filesAdded') }}</span>
                      <strong>{{ state.stats?.['current-stats']?.filesAdded ?? 0 }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('backstage.sessionCount') }}</span>
                      <strong>{{ state.stats?.['current-stats']?.sessionCount ?? 0 }}</strong>
                    </div>
                  </div>
                </div>

                <div class="panel">
                  <h3>{{ t('backstage.total') }}</h3>
                  <div class="stat-rows">
                    <div class="stat-row">
                      <span>{{ t('dialog.downloaded') }}</span>
                      <strong>{{ formatBytes(state.stats?.['cumulative-stats']?.downloadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.uploaded') }}</span>
                      <strong>{{ formatBytes(state.stats?.['cumulative-stats']?.uploadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.ratio') }}</span>
                      <strong>{{ calcRatio(state.stats?.['cumulative-stats']?.uploadedBytes, state.stats?.['cumulative-stats']?.downloadedBytes) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('dialog.activeTime') }}</span>
                      <strong>{{ formatDuration(state.stats?.['cumulative-stats']?.secondsActive) }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('backstage.filesAdded') }}</span>
                      <strong>{{ state.stats?.['cumulative-stats']?.filesAdded ?? 0 }}</strong>
                    </div>
                    <div class="stat-row">
                      <span>{{ t('backstage.sessionCount') }}</span>
                      <strong>{{ state.stats?.['cumulative-stats']?.sessionCount ?? 0 }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="panel storage-panel">
                <h3>{{ t('backstage.storage') }}</h3>
                <p class="storage-path" :title="downloadDir">{{ downloadDir }}</p>
                <div class="storage-usage" v-if="freeSpaceBytes !== null">
                  <div class="storage-usage-head">
                    <span>{{ freeSpaceLabel }}</span>
                    <span v-if="usedSpacePct !== null">{{ t('backstage.usedSpace', { pct: usedSpacePct.toFixed(0) }) }}</span>
                  </div>
                  <div class="storage-meter" v-if="freeSpaceTotal">
                    <div class="storage-meter-fill" :style="{ width: `${usedSpacePct ?? 0}%` }"></div>
                  </div>
                </div>
                <div class="mini-metrics">
                  <div class="mini-metric">
                    <span>{{ t('backstage.torrents') }}</span>
                    <strong>{{ state.torrents.length }}</strong>
                  </div>
                  <div class="mini-metric">
                    <span>{{ t('backstage.labels') }}</span>
                    <strong>{{ labelCount }}</strong>
                  </div>
                  <div class="mini-metric">
                    <span>{{ t('backstage.trackers') }}</span>
                    <strong>{{ trackerCount }}</strong>
                  </div>
                </div>
              </div>

              <!-- 网络诊断面板 (组件化抽取) -->
              <NetworkDiagnostics @openSettings="activeTab = 'settings'" />
            </template>

            <!-- 添加任务（嵌入 Backstage，不再弹出独立窗口） -->
            <template v-else-if="activeTab === 'add'">
              <AddDialog embedded @done="activeTab = 'info'" />
            </template>

            <!-- 首选项（嵌入 Backstage，不再弹出独立窗口） -->
            <template v-else-if="activeTab === 'settings'">
              <SessionDialog embedded @done="activeTab = 'info'" />
            </template>

            <!-- 关于 -->
            <template v-else>
              <div class="about-stage">
                <TransmissionLogo :size="76" />
                <h2>Transmission Web</h2>
                <p class="about-desc">{{ t('backstage.aboutDesc') }}</p>

                <div class="about-meta">
                  <div class="about-row">
                    <span>{{ t('backstage.version') }}</span>
                    <strong>v{{ appVersion }}</strong>
                  </div>
                  <div class="about-row">
                    <span>{{ t('backstage.core') }}</span>
                    <strong>{{ state.session?.version || '—' }}</strong>
                  </div>
                  <div class="about-row">
                    <span>{{ t('backstage.rpc') }}</span>
                    <strong>v{{ state.session?.['rpc-version'] || 16 }}</strong>
                  </div>
                  <div class="about-row">
                    <span>{{ t('backstage.license') }}</span>
                    <strong>MIT</strong>
                  </div>
                </div>

                <a class="repo-link" href="https://github.com/Mightnire/transmission-web" target="_blank" rel="noopener noreferrer">
                  <FluentIcon name="link" />
                  <span>{{ t('backstage.openRepo') }}</span>
                </a>
              </div>
            </template>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import {
  state,
  closeFileMenu,
  fetchSession,
  fetchTorrents,
  formatBytes,
  formatSpeed,
  showToast,
} from '../../stores/transmission';
import { TorrentStatus } from '../../api/types';
import { rpc } from '../../api/rpc';
import { t } from '../../locales';
import { useEscapeKey } from '../../composables/useEscapeKey';
import SpeedChart from './SpeedChart.vue';
import NetworkDiagnostics from './NetworkDiagnostics.vue';
import AddDialog from '../dialogs/AddDialog.vue';
import SessionDialog from '../dialogs/SessionDialog.vue';

const appVersion = __APP_VERSION__;
type BackstageTab = 'info' | 'stats' | 'add' | 'settings' | 'about';
const activeTab = computed<BackstageTab>({
  get: () => state.fileMenuTab || 'info',
  set: (val) => {
    state.fileMenuTab = val;
  },
});

const counts = computed(() => {
  const result = { downloading: 0, seeding: 0, paused: 0, queued: 0, checking: 0, errors: 0, finished: 0 };
  for (const torrent of state.torrents) {
    if (torrent.error) result.errors++;
    if (torrent.isFinished || torrent.percentDone >= 1) result.finished++;

    switch (torrent.status) {
      case TorrentStatus.DOWNLOAD:
        result.downloading++;
        break;
      case TorrentStatus.SEED:
        result.seeding++;
        break;
      case TorrentStatus.STOPPED:
        result.paused++;
        break;
      case TorrentStatus.DOWNLOAD_WAIT:
      case TorrentStatus.SEED_WAIT:
        result.queued++;
        break;
      case TorrentStatus.CHECK_WAIT:
      case TorrentStatus.CHECK:
        result.checking++;
        break;
    }
  }
  return result;
});

const labelCount = computed(() => {
  const set = new Set<string>();
  for (const torrent of state.torrents) {
    for (const label of torrent.labels || []) set.add(label);
  }
  return set.size;
});

const trackerCount = computed(() => {
  const set = new Set<string>();
  for (const torrent of state.torrents) {
    for (const tracker of torrent.trackers || []) set.add(tracker.announce);
  }
  return set.size;
});

const activeTorrentCount = computed(() => {
  return state.torrents.filter(
    (t) => t.rateDownload > 0 || t.rateUpload > 0 || t.status === TorrentStatus.DOWNLOAD || t.status === TorrentStatus.SEED
  ).length;
});

const downloadDir = computed(() => state.session?.['download-dir'] || state.torrents[0]?.downloadDir || '—');

const freeSpaceBytes = ref<number | null>(null);
const freeSpaceTotal = ref<number | null>(null);

const usedSpacePct = computed(() => {
  if (freeSpaceBytes.value === null || !freeSpaceTotal.value) return null;
  return Math.min(100, Math.max(0, ((freeSpaceTotal.value - freeSpaceBytes.value) / freeSpaceTotal.value) * 100));
});

const freeSpaceLabel = computed(() => {
  if (freeSpaceBytes.value === null) return '';
  if (freeSpaceTotal.value) {
    return t('backstage.freeSpaceOf', {
      free: formatBytes(freeSpaceBytes.value),
      total: formatBytes(freeSpaceTotal.value),
    });
  }
  return t('backstage.freeSpace', { free: formatBytes(freeSpaceBytes.value) });
});

async function loadStorage() {
  const path = downloadDir.value;
  if (!path || path === '—') return;
  try {
    const result = await rpc.freeSpace(path);
    freeSpaceBytes.value = result['size-bytes'] ?? null;
    freeSpaceTotal.value = result.total_size ?? null;
  } catch (err) {
    // 存储空间只是附加信息，失败时保持静默，不影响主面板
    freeSpaceBytes.value = null;
    freeSpaceTotal.value = null;
  }
}

const activeTabTitle = computed(() => {
  if (activeTab.value === 'stats') return t('backstage.stats');
  if (activeTab.value === 'add') return t('backstage.add');
  if (activeTab.value === 'settings') return t('backstage.settings');
  if (activeTab.value === 'about') return t('backstage.about');
  return t('backstage.info');
});

const activeTabSubtitle = computed(() => {
  if (activeTab.value === 'stats') return t('backstage.statsSubtitle');
  if (activeTab.value === 'add') return t('backstage.addSubtitle');
  if (activeTab.value === 'settings') return t('backstage.settingsSubtitle');
  if (activeTab.value === 'about') return t('backstage.aboutDesc');
  return t('backstage.infoSubtitle');
});

function handleAdd() {
  activeTab.value = 'add';
}

function handleSettings() {
  activeTab.value = 'settings';
}

async function refreshData() {
  await Promise.all([fetchSession(), fetchTorrents()]);
}

function formatDuration(seconds = 0): string {
  if (!seconds || seconds <= 0) return `0 ${t('common.min')}`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} ${t('common.day')} ${hours} ${t('common.hour')}`;
  if (hours > 0) return `${hours} ${t('common.hour')} ${minutes} ${t('common.min')}`;
  return `${minutes} ${t('common.min')}`;
}

function calcRatio(up = 0, down = 0): string {
  if (!down) return up > 0 ? '∞' : '0.00';
  return (up / down).toFixed(2);
}

watch(
  () => state.fileMenuOpen,
  (open) => {
    if (open) {
      if (!state.fileMenuTab) {
        state.fileMenuTab = 'info';
      }
      document.body.style.overflow = 'hidden';
      loadStorage();
    } else {
      document.body.style.overflow = '';
    }
  }
);

watch(activeTab, (tab) => {
  if (tab === 'stats') loadStorage();
});

useEscapeKey(() => {
  if (state.fileMenuOpen) closeFileMenu();
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped src="./file-backstage.css"></style>
