<template>
  <div class="md-dialog-overlay" v-if="state.sessionDialogOpen" @click.self="state.sessionDialogOpen = false">
    <div class="md-dialog session-dialog">
      <div class="dialog-header">
        <div class="header-title-row">
          <span class="material-icons header-icon">settings</span>
          <h2 class="md-dialog-title">{{ t('session.title') }}</h2>
        </div>
        <button class="md-icon-button" @click="state.sessionDialogOpen = false" :title="t('common.close')">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="md-dialog-content">
        <!-- 标签页导航 -->
        <div class="session-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'speed' }"
            @click="activeTab = 'speed'"
          >
            {{ t('session.tabs.speed') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'queue' }"
            @click="activeTab = 'queue'"
          >
            {{ t('session.tabs.queue') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'network' }"
            @click="activeTab = 'network'"
          >
            {{ t('session.tabs.network') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'storage' }"
            @click="activeTab = 'storage'"
          >
            {{ t('session.tabs.storage') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'automation' }"
            @click="activeTab = 'automation'"
          >
            {{ t('session.tabs.automation') }}
          </button>
        </div>

        <!-- 1. 速度与计划 (包含定时计划限速) -->
        <div v-if="activeTab === 'speed'" class="tab-body">
          <h4 class="sub-title">{{ t('session.speed.normal') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.speedLimitDownEnabled" />
              <span>{{ t('session.speed.downLimit') }}</span>
            </label>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.speedLimitDown"
                :disabled="!form.speedLimitDownEnabled"
              />
              <span class="unit-label">KB/s</span>
            </div>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.speedLimitUpEnabled" />
              <span>{{ t('session.speed.upLimit') }}</span>
            </label>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.speedLimitUp"
                :disabled="!form.speedLimitUpEnabled"
              />
              <span class="unit-label">KB/s</span>
            </div>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.speed.turtle') }}</h4>
          <div class="form-row">
            <span>{{ t('session.speed.turtleDown') }}</span>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.altSpeedDown" />
              <span class="unit-label">KB/s</span>
            </div>
          </div>
          <div class="form-row">
            <span>{{ t('session.speed.turtleUp') }}</span>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.altSpeedUp" />
              <span class="unit-label">KB/s</span>
            </div>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.altSpeedTimeEnabled" />
              <span class="font-bold">{{ t('session.speed.scheduleEnable') }}</span>
            </label>
          </div>

          <div class="sub-box" v-if="form.altSpeedTimeEnabled">
            <div class="form-row">
              <span>{{ t('session.speed.scheduleTime') }}</span>
              <div class="time-range-group">
                <input type="time" class="time-input" v-model="timeBeginStr" />
                <span>{{ t('session.speed.to') }}</span>
                <input type="time" class="time-input" v-model="timeEndStr" />
              </div>
            </div>

            <div class="form-row">
              <span>{{ t('session.speed.days') }}</span>
              <select class="select-input" v-model.number="form.altSpeedTimeDay">
                <option :value="127">{{ t('session.speed.daysAll') }}</option>
                <option :value="62">{{ t('session.speed.daysWork') }}</option>
                <option :value="65">{{ t('session.speed.daysWeekend') }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. 队列与调度 (并发限制与停滞时间) -->
        <div v-else-if="activeTab === 'queue'" class="tab-body">
          <h4 class="sub-title">{{ t('session.queue.concurrency') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.downloadQueueEnabled" />
              <span>{{ t('session.queue.downQueue') }}</span>
            </label>
            <input
              type="number"
              class="num-input"
              v-model.number="form.downloadQueueSize"
              :disabled="!form.downloadQueueEnabled"
            />
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.seedQueueEnabled" />
              <span>{{ t('session.queue.seedQueue') }}</span>
            </label>
            <input
              type="number"
              class="num-input"
              v-model.number="form.seedQueueSize"
              :disabled="!form.seedQueueEnabled"
            />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.queue.stalled') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.queueStalledEnabled" />
              <span>{{ t('session.queue.stalledEnable') }}</span>
            </label>
          </div>
          <div class="form-row">
            <span style="padding-left: 24px;">{{ t('session.queue.stalledTime') }}</span>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.queueStalledMinutes"
                :disabled="!form.queueStalledEnabled"
              />
              <span class="unit-label">{{ t('session.queue.minutes') }}</span>
            </div>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.queue.seedRules') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.seedRatioLimited" />
              <span>{{ t('session.queue.ratioLimit') }}</span>
            </label>
            <input
              type="number"
              step="0.1"
              class="num-input"
              v-model.number="form.seedRatioLimit"
              :disabled="!form.seedRatioLimited"
            />
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.idleSeedingLimitEnabled" />
              <span>{{ t('session.queue.idleLimit') }}</span>
            </label>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.idleSeedingLimit"
                :disabled="!form.idleSeedingLimitEnabled"
              />
              <span class="unit-label">{{ t('session.queue.minutes') }}</span>
            </div>
          </div>
        </div>

        <!-- 3. 网络与协议 (P2P协议、端口与加密) -->
        <div v-else-if="activeTab === 'network'" class="tab-body">
          <h4 class="sub-title">{{ t('session.network.peerPort') }}</h4>
          <div class="form-row">
            <span>{{ t('session.network.portLabel') }}</span>
            <div class="port-input-group">
              <input type="number" class="num-input" v-model.number="form.peerPort" />
              <button class="md-btn md-btn-flat btn-sm" @click="testPort" :disabled="testingPort">
                <span class="material-icons" style="font-size: 16px;">{{ testingPort ? 'sync' : 'network_check' }}</span>
                {{ testingPort ? t('session.network.portTesting') : t('session.network.testPort') }}
              </button>
            </div>
          </div>

          <div class="port-status-box" v-if="portStatus !== null">
            <span class="material-icons" :style="{ color: portStatus ? 'var(--md-success)' : 'var(--md-error)' }">
              {{ portStatus ? 'check_circle' : 'cancel' }}
            </span>
            <span>{{ portStatus ? t('session.network.portOpen') : t('session.network.portClosed') }}</span>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.peerPortRandomOnStart" />
              <span>{{ t('session.network.randomPort') }}</span>
            </label>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.portForwardingEnabled" />
              <span>{{ t('session.network.upnp') }}</span>
            </label>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.network.protocols') }}</h4>
          <div class="form-vertical-switches">
            <div class="form-row">
              <label class="form-check">
                <input type="checkbox" v-model="form.dhtEnabled" />
                <span>{{ t('session.network.dht') }}</span>
              </label>
            </div>
            <div class="form-row">
              <label class="form-check">
                <input type="checkbox" v-model="form.pexEnabled" />
                <span>{{ t('session.network.pex') }}</span>
              </label>
            </div>
            <div class="form-row">
              <label class="form-check">
                <input type="checkbox" v-model="form.lpdEnabled" />
                <span>{{ t('session.network.lpd') }}</span>
              </label>
            </div>
            <div class="form-row">
              <label class="form-check">
                <input type="checkbox" v-model="form.utpEnabled" />
                <span>{{ t('session.network.utp') }}</span>
              </label>
            </div>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.network.encryption') }}</h4>
          <div class="form-row">
            <span>{{ t('session.network.encPolicy') }}</span>
            <select class="select-input" v-model="form.encryption">
              <option value="tolerated">{{ t('session.network.encTolerated') }}</option>
              <option value="preferred">{{ t('session.network.encPreferred') }}</option>
              <option value="required">{{ t('session.network.encRequired') }}</option>
            </select>
          </div>

          <div class="form-row">
            <span>{{ t('session.network.peerGlobal') }}</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitGlobal" />
          </div>
          <div class="form-row">
            <span>{{ t('session.network.peerPerTorrent') }}</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitPerTorrent" />
          </div>
        </div>

        <!-- 4. 存储与缓存 (目录、可用空间、写缓存调节) -->
        <div v-else-if="activeTab === 'storage'" class="tab-body">
          <h4 class="sub-title">{{ t('session.storage.dirs') }}</h4>
          <div class="form-group">
            <label class="form-label">{{ t('session.storage.downloadDir') }}</label>
            <input type="text" class="text-input" v-model="form.downloadDir" @blur="checkFreeSpace" />
          </div>

          <div class="free-space-badge" v-if="freeSpaceBytes !== null">
            <span class="material-icons">storage</span>
            <span>{{ t('session.storage.freeSpace', { size: formatBytes(freeSpaceBytes) }) }}</span>
          </div>

          <div class="form-group mt-2">
            <div class="form-row">
              <label class="form-check">
                <input type="checkbox" v-model="form.incompleteDirEnabled" />
                <span>{{ t('session.storage.incompleteDir') }}</span>
              </label>
            </div>
            <input
              type="text"
              class="text-input mt-1"
              v-model="form.incompleteDir"
              :disabled="!form.incompleteDirEnabled"
            />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.storage.cacheTitle') }}</h4>
          <div class="form-row">
            <div>
              <span>{{ t('session.storage.cacheSize') }}</span>
              <div class="form-hint">{{ t('session.storage.cacheHint') }}</div>
            </div>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.cacheSizeMb" min="1" max="64" />
              <span class="unit-label">MB</span>
            </div>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.renamePartialFiles" />
              <span>{{ t('session.storage.renamePartial') }}</span>
            </label>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.trashOriginalTorrentFiles" />
              <span>{{ t('session.storage.trashTorrent') }}</span>
            </label>
          </div>
        </div>

        <!-- 5. 安全与自动化 (黑名单、默认Tracker、完成脚本) -->
        <div v-else-if="activeTab === 'automation'" class="tab-body">
          <h4 class="sub-title">{{ t('session.automation.blocklist') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.blocklistEnabled" />
              <span>{{ t('session.automation.blocklistEnable') }}</span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('session.automation.blocklistUrl') }}</label>
            <input type="text" class="text-input" v-model="form.blocklistUrl" :disabled="!form.blocklistEnabled" />
          </div>
          <div class="blocklist-action-row">
            <button class="md-btn md-btn-flat" @click="updateBlocklist" :disabled="updatingBlocklist || !form.blocklistEnabled">
              <span class="material-icons">security</span>
              {{ updatingBlocklist ? t('session.automation.blocklistUpdating') : t('session.automation.blocklistUpdate') }}
            </button>
            <span class="blocklist-size" v-if="state.session?.['blocklist-size']">
              {{ t('session.automation.blocklistRules', { count: state.session['blocklist-size'] }) }}
            </span>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.automation.defaultTrackers') }}</h4>
          <div class="form-group">
            <label class="form-label">{{ t('session.automation.defaultTrackersHint') }}</label>
            <textarea
              class="textarea-input"
              rows="3"
              v-model="form.defaultTrackers"
              placeholder="udp://tracker.opentrackr.org:1337/announce&#10;http://tracker.openbittorrent.com:80/announce"
            ></textarea>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">{{ t('session.automation.doneScript') }}</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.scriptTorrentDoneEnabled" />
              <span>{{ t('session.automation.doneScriptEnable') }}</span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('session.automation.doneScriptPath') }}</label>
            <input
              type="text"
              class="text-input"
              v-model="form.scriptTorrentDoneFilename"
              :disabled="!form.scriptTorrentDoneEnabled"
              placeholder="/etc/storage/torrent_done.sh"
            />
          </div>
        </div>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="state.sessionDialogOpen = false">
          {{ t('common.cancel') }}
        </button>
        <button class="md-btn md-btn-raised" @click="saveSettings">
          {{ t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { state, fetchSession, formatBytes } from '../stores/transmission';
import { t } from '../locales';
import { rpc } from '../api/rpc';

const activeTab = ref<'speed' | 'queue' | 'network' | 'storage' | 'automation'>('speed');
const testingPort = ref(false);
const portStatus = ref<boolean | null>(null);
const freeSpaceBytes = ref<number | null>(null);
const updatingBlocklist = ref(false);

const form = reactive({
  // 速度
  speedLimitDown: 0,
  speedLimitDownEnabled: false,
  speedLimitUp: 0,
  speedLimitUpEnabled: false,
  altSpeedDown: 50,
  altSpeedUp: 50,
  altSpeedTimeEnabled: false,
  altSpeedTimeBegin: 540,
  altSpeedTimeEnd: 1020,
  altSpeedTimeDay: 127,
  // 队列
  downloadQueueEnabled: true,
  downloadQueueSize: 3,
  seedQueueEnabled: true,
  seedQueueSize: 5,
  queueStalledEnabled: true,
  queueStalledMinutes: 30,
  seedRatioLimited: false,
  seedRatioLimit: 2.0,
  idleSeedingLimitEnabled: false,
  idleSeedingLimit: 30,
  // 网络
  peerPort: 51413,
  peerPortRandomOnStart: false,
  portForwardingEnabled: false,
  dhtEnabled: true,
  pexEnabled: true,
  lpdEnabled: false,
  utpEnabled: false,
  encryption: 'tolerated' as 'required' | 'preferred' | 'tolerated',
  peerLimitGlobal: 90,
  peerLimitPerTorrent: 30,
  // 存储与缓存
  downloadDir: '',
  incompleteDirEnabled: false,
  incompleteDir: '',
  cacheSizeMb: 2,
  renamePartialFiles: true,
  trashOriginalTorrentFiles: false,
  // 安全与脚本
  blocklistEnabled: false,
  blocklistUrl: '',
  defaultTrackers: '',
  scriptTorrentDoneEnabled: false,
  scriptTorrentDoneFilename: '',
});

// 时间分秒换算
const timeBeginStr = computed({
  get() {
    const h = Math.floor(form.altSpeedTimeBegin / 60).toString().padStart(2, '0');
    const m = (form.altSpeedTimeBegin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  },
  set(val: string) {
    if (!val) return;
    const [h, m] = val.split(':').map(Number);
    form.altSpeedTimeBegin = h * 60 + m;
  },
});

const timeEndStr = computed({
  get() {
    const h = Math.floor(form.altSpeedTimeEnd / 60).toString().padStart(2, '0');
    const m = (form.altSpeedTimeEnd % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  },
  set(val: string) {
    if (!val) return;
    const [h, m] = val.split(':').map(Number);
    form.altSpeedTimeEnd = h * 60 + m;
  },
});

function initForm(s: any) {
  if (!s) return;
  form.speedLimitDown = s['speed-limit-down'] || 0;
  form.speedLimitDownEnabled = s['speed-limit-down-enabled'] || false;
  form.speedLimitUp = s['speed-limit-up'] || 0;
  form.speedLimitUpEnabled = s['speed-limit-up-enabled'] || false;
  form.altSpeedDown = s['alt-speed-down'] || 50;
  form.altSpeedUp = s['alt-speed-up'] || 50;
  form.altSpeedTimeEnabled = s['alt-speed-time-enabled'] || false;
  form.altSpeedTimeBegin = s['alt-speed-time-begin'] !== undefined ? s['alt-speed-time-begin'] : 540;
  form.altSpeedTimeEnd = s['alt-speed-time-end'] !== undefined ? s['alt-speed-time-end'] : 1020;
  form.altSpeedTimeDay = s['alt-speed-time-day'] !== undefined ? s['alt-speed-time-day'] : 127;

  form.downloadQueueEnabled = s['download-queue-enabled'] !== undefined ? s['download-queue-enabled'] : true;
  form.downloadQueueSize = s['download-queue-size'] || 3;
  form.seedQueueEnabled = s['seed-queue-enabled'] !== undefined ? s['seed-queue-enabled'] : true;
  form.seedQueueSize = s['seed-queue-size'] || 5;
  form.queueStalledEnabled = s['queue-stalled-enabled'] !== undefined ? s['queue-stalled-enabled'] : true;
  form.queueStalledMinutes = s['queue-stalled-minutes'] || 30;
  form.seedRatioLimited = s['seedRatioLimited'] || false;
  form.seedRatioLimit = s['seedRatioLimit'] || 2.0;
  form.idleSeedingLimitEnabled = s['idle-seeding-limit-enabled'] || false;
  form.idleSeedingLimit = s['idle-seeding-limit'] || 30;

  form.peerPort = s['peer-port'] || 51413;
  form.peerPortRandomOnStart = s['peer-port-random-on-start'] || false;
  form.portForwardingEnabled = s['port-forwarding-enabled'] || false;
  form.dhtEnabled = s['dht-enabled'] !== undefined ? s['dht-enabled'] : true;
  form.pexEnabled = s['pex-enabled'] !== undefined ? s['pex-enabled'] : true;
  form.lpdEnabled = s['lpd-enabled'] || false;
  form.utpEnabled = s['utp-enabled'] || false;
  form.encryption = s['encryption'] || 'tolerated';
  form.peerLimitGlobal = s['peer-limit-global'] || 90;
  form.peerLimitPerTorrent = s['peer-limit-per-torrent'] || 30;

  form.downloadDir = s['download-dir'] || '';
  form.incompleteDirEnabled = s['incomplete-dir-enabled'] || false;
  form.incompleteDir = s['incomplete-dir'] || '';
  form.cacheSizeMb = (s as any)['cache-size-mb'] || 2;
  form.renamePartialFiles = s['rename-partial-files'] !== undefined ? s['rename-partial-files'] : true;
  form.trashOriginalTorrentFiles = s['trash-original-torrent-files'] || false;

  form.blocklistEnabled = s['blocklist-enabled'] || false;
  form.blocklistUrl = s['blocklist-url'] || '';
  form.defaultTrackers = s['default-trackers'] || '';
  form.scriptTorrentDoneEnabled = (s as any)['script-torrent-done-enabled'] || false;
  form.scriptTorrentDoneFilename = (s as any)['script-torrent-done-filename'] || '';

  if (form.downloadDir) {
    checkFreeSpace();
  }
}

// 核心修复：仅在用户打开弹窗的一瞬间根据当前 session 同步一次表单！
// 弹窗处于编辑状态期间，严禁后台 3s 轮询覆盖用户正在修改的表单内容！
watch(
  () => state.sessionDialogOpen,
  (open) => {
    if (open && state.session) {
      initForm(state.session);
    }
  },
  { immediate: true }
);

async function checkFreeSpace() {
  if (!form.downloadDir) return;
  try {
    const res = await rpc.freeSpace(form.downloadDir);
    if (res && res['size-bytes'] !== undefined) {
      freeSpaceBytes.value = res['size-bytes'];
    }
  } catch (e) {
    console.warn('Free space check failed:', e);
  }
}

async function testPort() {
  testingPort.value = true;
  portStatus.value = null;
  try {
    const res = await rpc.portTest();
    portStatus.value = res['port-is-open'];
  } catch (e) {
    portStatus.value = false;
  } finally {
    testingPort.value = false;
  }
}

async function updateBlocklist() {
  updatingBlocklist.value = true;
  try {
    const res = await rpc.blocklistUpdate();
    alert(t('session.automation.blocklistSuccess', { count: res['blocklist-size'] }));
    await fetchSession();
  } catch (e) {
    alert(t('session.automation.blocklistFailed'));
  } finally {
    updatingBlocklist.value = false;
  }
}

async function saveSettings() {
  const payload: Record<string, any> = {
    'speed-limit-down': form.speedLimitDown,
    'speed-limit-down-enabled': form.speedLimitDownEnabled,
    'speed-limit-up': form.speedLimitUp,
    'speed-limit-up-enabled': form.speedLimitUpEnabled,
    'alt-speed-down': form.altSpeedDown,
    'alt-speed-up': form.altSpeedUp,
    'alt-speed-time-enabled': form.altSpeedTimeEnabled,
    'alt-speed-time-begin': form.altSpeedTimeBegin,
    'alt-speed-time-end': form.altSpeedTimeEnd,
    'alt-speed-time-day': form.altSpeedTimeDay,

    'download-queue-enabled': form.downloadQueueEnabled,
    'download-queue-size': form.downloadQueueSize,
    'seed-queue-enabled': form.seedQueueEnabled,
    'seed-queue-size': form.seedQueueSize,
    'queue-stalled-enabled': form.queueStalledEnabled,
    'queue-stalled-minutes': form.queueStalledMinutes,
    'seedRatioLimited': form.seedRatioLimited,
    'seedRatioLimit': form.seedRatioLimit,
    'idle-seeding-limit-enabled': form.idleSeedingLimitEnabled,
    'idle-seeding-limit': form.idleSeedingLimit,

    'peer-port': form.peerPort,
    'peer-port-random-on-start': form.peerPortRandomOnStart,
    'port-forwarding-enabled': form.portForwardingEnabled,
    'dht-enabled': form.dhtEnabled,
    'pex-enabled': form.pexEnabled,
    'lpd-enabled': form.lpdEnabled,
    'utp-enabled': form.utpEnabled,
    encryption: form.encryption,
    'peer-limit-global': form.peerLimitGlobal,
    'peer-limit-per-torrent': form.peerLimitPerTorrent,

    'cache-size-mb': form.cacheSizeMb,
    'rename-partial-files': form.renamePartialFiles,
    'trash-original-torrent-files': form.trashOriginalTorrentFiles,
    'incomplete-dir-enabled': form.incompleteDirEnabled,
    'blocklist-enabled': form.blocklistEnabled,
    'script-torrent-done-enabled': form.scriptTorrentDoneEnabled,
  };

  // 严格安全校验与防错处理：防止发送非法/相对路径触发 Transmission RPC 错误！
  if (form.downloadDir && form.downloadDir.trim()) {
    payload['download-dir'] = form.downloadDir.trim();
  }
  if (form.incompleteDirEnabled && form.incompleteDir && form.incompleteDir.trim().startsWith('/')) {
    payload['incomplete-dir'] = form.incompleteDir.trim();
  }
  if (form.blocklistUrl && form.blocklistUrl.trim()) {
    payload['blocklist-url'] = form.blocklistUrl.trim();
  }
  if (form.defaultTrackers && form.defaultTrackers.trim()) {
    payload['default-trackers'] = form.defaultTrackers.trim();
  }
  if (form.scriptTorrentDoneFilename && form.scriptTorrentDoneFilename.trim()) {
    payload['script-torrent-done-filename'] = form.scriptTorrentDoneFilename.trim();
  }

  try {
    await rpc.sessionSet(payload as any);
    // 立即乐观同步本地 state.session，彻底杜绝异步回读延迟闪烁
    if (state.session) {
      Object.assign(state.session, payload);
    }
    state.sessionDialogOpen = false;
    await fetchSession();
  } catch (err: any) {
    alert('保存首选项失败: ' + (err.message || err));
  }
}
</script>

<style scoped>
.session-dialog {
  width: 660px;
  max-width: 95vw;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
}

.dialog-header {
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: var(--fluent-accent);
}

.session-dialog .md-dialog-title {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.session-tabs {
  display: flex;
  background-color: var(--fluent-bg-subtle);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
  margin: 12px 0 16px;
  border: 1px solid var(--fluent-border-subtle);
}

.tab-btn {
  flex: 1;
  padding: 6px 0;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.tab-btn:hover {
  color: var(--md-text-primary);
  background-color: var(--fluent-bg-hover);
}

.tab-btn.active {
  background-color: var(--fluent-bg-canvas);
  color: var(--fluent-accent);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
  margin: 14px 0 8px;
  letter-spacing: 0.02em;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.form-group {
  margin-bottom: 10px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-text-secondary);
  margin-bottom: 4px;
}

.form-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
}

.form-check input[type="checkbox"] {
  accent-color: var(--fluent-accent);
  cursor: pointer;
}

.form-vertical-switches {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.form-hint {
  font-size: 11px;
  color: var(--md-text-secondary);
  margin-top: 2px;
}

.unit-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.unit-label {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.num-input {
  width: 90px;
  padding: 4px 8px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  text-align: right;
  font-family: monospace;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.num-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.num-input:disabled {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.text-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.text-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.text-input:disabled {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.textarea-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.textarea-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.select-input {
  padding: 4px 8px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.select-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.port-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
}

.port-status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  margin-top: 6px;
}

.free-space-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 120, 212, 0.08);
  border: 1px solid rgba(0, 120, 212, 0.2);
  border-radius: 4px;
  color: var(--fluent-accent);
}

.free-space-badge .material-icons {
  font-size: 15px;
}

.sub-box {
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 6px;
}

.time-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 3px 6px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-family: monospace;
}

.divider {
  height: 1px;
  background-color: var(--fluent-border-subtle);
  margin: 12px 0;
}

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }

.font-bold { font-weight: 600; }

.blocklist-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.blocklist-size {
  font-size: 12px;
  color: var(--md-text-secondary);
}
</style>
