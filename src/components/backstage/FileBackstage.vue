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

          <div class="backstage-body">
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
                    <p>{{ t('backstage.chartWindow') }}</p>
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

              <div class="panel network-panel">
                <div class="network-head">
                  <h3>{{ t('backstage.network') }}</h3>
                  <button class="network-settings" @click="activeTab = 'settings'">
                    <FluentIcon name="settings" />
                    <span>{{ t('backstage.settings') }}</span>
                  </button>
                </div>
                <div class="network-grid">
                  <div class="network-item">
                    <span>DHT</span>
                    <strong :class="{ off: !state.session?.['dht-enabled'] }">{{ onOff(state.session?.['dht-enabled']) }}</strong>
                  </div>
                  <div class="network-item">
                    <span>PEX</span>
                    <strong :class="{ off: !state.session?.['pex-enabled'] }">{{ onOff(state.session?.['pex-enabled']) }}</strong>
                  </div>
                  <div class="network-item">
                    <span>LPD</span>
                    <strong :class="{ off: !state.session?.['lpd-enabled'] }">{{ onOff(state.session?.['lpd-enabled']) }}</strong>
                  </div>
                  <div class="network-item">
                    <span>uTP</span>
                    <strong :class="{ off: !state.session?.['utp-enabled'] }">{{ onOff(state.session?.['utp-enabled']) }}</strong>
                  </div>
                  <div class="network-item">
                    <span>{{ t('backstage.encryption') }}</span>
                    <strong>{{ encryptionLabel }}</strong>
                  </div>
                  <div class="network-item">
                    <span>{{ t('backstage.peerPort') }}</span>
                    <strong class="monospace">{{ state.session?.['peer-port'] || '—' }}</strong>
                  </div>
                  <div class="network-item">
                    <span>{{ t('backstage.blocklist') }}</span>
                    <strong>{{ state.session?.['blocklist-size'] ? t('backstage.blocklistRules', { count: state.session['blocklist-size'] }) : '—' }}</strong>
                  </div>
                </div>
                <div class="network-actions">
                  <button class="network-btn" @click="testPort" :disabled="testingPort">
                    <FluentIcon name="lan" />
                    <span>{{ testingPort ? t('backstage.portTesting') : t('backstage.testPort') }}</span>
                  </button>
                  <span
                    class="port-result"
                    v-if="portStatus !== null"
                    :class="portStatus ? 'ok' : 'bad'"
                  >
                    <i></i>
                    {{ portStatus ? t('backstage.portOpen') : t('backstage.portClosed') }}
                  </span>
                  <span class="port-result muted" v-else>{{ t('backstage.portUntested') }}</span>
                  <button class="network-btn" @click="updateBlocklist" :disabled="updatingBlocklist || !state.session?.['blocklist-enabled']">
                    <FluentIcon name="security" />
                    <span>{{ updatingBlocklist ? t('backstage.blocklistUpdating') : t('backstage.blocklistUpdate') }}</span>
                  </button>
                </div>
              </div>
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
import AddDialog from '../dialogs/AddDialog.vue';
import SessionDialog from '../dialogs/SessionDialog.vue';

const appVersion = __APP_VERSION__;
type BackstageTab = 'info' | 'stats' | 'add' | 'settings' | 'about';
const activeTab = ref<BackstageTab>('info');

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

const downloadDir = computed(() => state.session?.['download-dir'] || state.torrents[0]?.downloadDir || '—');

const freeSpaceBytes = ref<number | null>(null);
const freeSpaceTotal = ref<number | null>(null);
const testingPort = ref(false);
const portStatus = ref<boolean | null>(null);
const updatingBlocklist = ref(false);

const encryptionLabel = computed(() => {
  const mode = state.session?.encryption;
  if (mode === 'required') return t('backstage.encryptionRequired');
  if (mode === 'preferred') return t('backstage.encryptionPreferred');
  if (mode === 'tolerated') return t('backstage.encryptionTolerated');
  return '—';
});

function onOff(value?: boolean): string {
  return value ? t('backstage.on') : t('backstage.off');
}

async function testPort() {
  testingPort.value = true;
  try {
    const result = await rpc.portTest();
    portStatus.value = result['port-is-open'];
  } catch (err) {
    portStatus.value = null;
    showToast(t('backstage.portTestFailed'), 'error');
  } finally {
    testingPort.value = false;
  }
}

async function updateBlocklist() {
  updatingBlocklist.value = true;
  try {
    const result = await rpc.blocklistUpdate();
    showToast(t('backstage.blocklistUpdated', { count: result['blocklist-size'] }), 'success');
    await refreshData();
  } catch (err) {
    showToast(t('backstage.blocklistUpdateFailed'), 'error');
  } finally {
    updatingBlocklist.value = false;
  }
}

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
      activeTab.value = 'info';
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

<style scoped>
.file-backstage {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  background-color: var(--fluent-bg-canvas);
}

.backstage-nav {
  width: 224px;
  flex-shrink: 0;
  background-color: var(--ribbon-header-bg);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 18px 0 12px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px 18px;
}

.brand-titles {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-titles strong {
  font-size: 14px;
  font-weight: 700;
}

.brand-titles span {
  font-size: 11px;
  opacity: 0.75;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 10px 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}

.nav-back:hover {
  background: rgba(255, 255, 255, 0.16);
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.nav-item.active {
  background: var(--fluent-bg-canvas);
  color: var(--ribbon-header-tab-active-text);
  font-weight: 600;
}

.backstage-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.backstage-header {
  height: 82px;
  flex-shrink: 0;
  padding: 0 32px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-titles h1 {
  font-size: 26px;
  font-weight: 300;
  color: var(--md-text-primary);
  line-height: 1.2;
}

.header-titles p {
  font-size: 12px;
  color: var(--md-text-secondary);
  margin-top: 2px;
}

.header-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--md-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-close:hover {
  background: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.backstage-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 32px 32px;
}

.backstage-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border: 1px solid var(--fluent-border-subtle);
  border-left: 4px solid var(--ribbon-header-bg);
  border-radius: 4px;
  background-color: var(--fluent-bg-subtle);
  margin-bottom: 16px;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-brand h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: grid;
  grid-template-columns: 24px 1fr;
  grid-template-rows: auto auto;
  column-gap: 8px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
}

.stat-icon {
  grid-row: span 2;
  font-size: 22px;
}

.stat-label {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.stat-value {
  font-size: 19px;
  font-weight: 600;
  color: var(--md-text-primary);
  line-height: 1.2;
}

.backstage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.backstage-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel {
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  padding: 14px 16px;
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panel h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.panel-head p {
  font-size: 11px;
  color: var(--md-text-secondary);
  margin-top: 2px;
}

.panel-icon {
  font-size: 18px;
}

.quick-actions-panel {
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  padding: 12px 16px 14px;
  background: var(--fluent-bg-canvas);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 12px;
  cursor: pointer;
}

.quick-action:hover {
  background: var(--fluent-bg-hover);
}

.quick-action.primary {
  background: var(--fluent-accent);
  border-color: transparent;
  color: #ffffff;
}

.quick-action.primary:hover {
  background: var(--fluent-accent-hover);
}

.stat-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.stat-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-row span {
  color: var(--md-text-secondary);
}

.stat-row strong {
  color: var(--md-text-primary);
  font-weight: 600;
}

.network-panel {
  margin-top: 12px;
}

.network-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.network-settings {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--fluent-accent);
  font-size: 11px;
  cursor: pointer;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  margin: 10px 0 12px;
  border: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-border-subtle);
}

.network-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: var(--fluent-bg-canvas);
  font-size: 11px;
  color: var(--md-text-secondary);
}

.network-item strong {
  font-weight: 600;
  color: var(--md-text-primary);
}

.network-item strong.off {
  color: var(--md-text-secondary);
  font-weight: 400;
}

.network-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.network-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  background: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
}

.network-btn:hover:not(:disabled) {
  border-color: var(--fluent-accent);
  color: var(--fluent-accent);
}

.network-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.port-result {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.port-result i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.port-result.ok { color: #2e7d32; }
.port-result.bad { color: #c62828; }
.port-result.muted { color: var(--md-text-secondary); }

.storage-path {
  font-size: 12px;
  color: var(--md-text-primary);
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  padding: 8px 10px;
  margin: 8px 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storage-usage {
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.storage-usage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.storage-meter {
  height: 6px;
  border-radius: 3px;
  background: var(--fluent-bg-subtle);
  overflow: hidden;
}

.storage-meter-fill {
  height: 100%;
  background: var(--fluent-accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.mini-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mini-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
}

.mini-metric span {
  font-size: 10px;
  color: var(--md-text-secondary);
}

.mini-metric strong {
  font-size: 16px;
  color: var(--md-text-primary);
}

.about-stage {
  max-width: 560px;
  margin: 24px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.about-stage h2 {
  margin-top: 14px;
  font-size: 24px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.about-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--md-text-secondary);
  line-height: 1.5;
}

.about-meta {
  width: 100%;
  margin-top: 22px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
  padding: 10px 16px;
}

.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid var(--fluent-border-subtle);
  font-size: 12px;
}

.about-row:last-child {
  border-bottom: none;
}

.about-row span {
  color: var(--md-text-secondary);
}

.about-row strong {
  color: var(--md-text-primary);
}

.repo-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 18px;
  color: var(--fluent-accent);
  font-size: 12px;
  text-decoration: none;
}

.repo-link:hover {
  text-decoration: underline;
}

.backstage-fade-enter-active,
.backstage-fade-leave-active {
  transition: opacity 0.16s ease;
}

.backstage-fade-enter-from,
.backstage-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .stat-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .backstage-grid,
  .backstage-grid.two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .file-backstage {
    flex-direction: column;
  }

  .backstage-nav {
    width: 100%;
    padding: 8px 8px 6px;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
  }

  .nav-brand,
  .nav-back span,
  .nav-footer {
    display: none;
  }

  .nav-back {
    margin: 0;
    padding: 6px;
    flex-shrink: 0;
  }

  .nav-items {
    flex-direction: row;
    padding: 0;
    overflow-x: auto;
    flex: 1;
  }

  .nav-item {
    height: 32px;
    padding: 0 8px;
    font-size: 12px;
    gap: 6px;
    flex-shrink: 0;
  }

  .backstage-header {
    height: 62px;
    padding: 0 16px;
  }

  .header-titles h1 {
    font-size: 20px;
  }

  .backstage-body {
    padding: 14px 16px 24px;
  }

  .backstage-hero {
    padding: 12px 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .hero-brand h2 {
    font-size: 17px;
  }

  .stat-cards {
    gap: 8px;
  }

  .stat-card {
    padding: 10px;
  }

  .stat-value {
    font-size: 16px;
  }
}
</style>
