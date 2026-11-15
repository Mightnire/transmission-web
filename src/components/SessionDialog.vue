<template>
  <div class="md-dialog-overlay" v-if="state.sessionDialogOpen" @click.self="state.sessionDialogOpen = false">
    <div class="md-dialog session-dialog">
      <div class="dialog-header">
        <div class="header-title-row">
          <span class="material-icons header-icon">settings</span>
          <h2 class="md-dialog-title">Transmission 首选项</h2>
        </div>
        <button class="md-icon-button" @click="state.sessionDialogOpen = false" title="关闭">
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
            速度与计划
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'queue' }"
            @click="activeTab = 'queue'"
          >
            队列与调度
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'network' }"
            @click="activeTab = 'network'"
          >
            网络与协议
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'storage' }"
            @click="activeTab = 'storage'"
          >
            存储与缓存
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'automation' }"
            @click="activeTab = 'automation'"
          >
            安全与自动化
          </button>
        </div>

        <!-- 1. 速度与计划 (包含定时计划限速) -->
        <div v-if="activeTab === 'speed'" class="tab-body">
          <h4 class="sub-title">常规速度限制</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.speedLimitDownEnabled" />
              <span>全局下载速度上限:</span>
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
              <span>全局上传速度上限:</span>
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

          <h4 class="sub-title">乌龟临时限速模式 (Turtle Mode)</h4>
          <div class="form-row">
            <span>乌龟模式下载速度:</span>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.altSpeedDown" />
              <span class="unit-label">KB/s</span>
            </div>
          </div>
          <div class="form-row">
            <span>乌龟模式上传速度:</span>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.altSpeedUp" />
              <span class="unit-label">KB/s</span>
            </div>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.altSpeedTimeEnabled" />
              <span class="font-bold">启用定时计划限速</span>
            </label>
          </div>

          <div class="sub-box" v-if="form.altSpeedTimeEnabled">
            <div class="form-row">
              <span>每天限速时段:</span>
              <div class="time-range-group">
                <input type="time" class="time-input" v-model="timeBeginStr" />
                <span>至</span>
                <input type="time" class="time-input" v-model="timeEndStr" />
              </div>
            </div>

            <div class="form-row">
              <span>生效日期:</span>
              <select class="select-input" v-model.number="form.altSpeedTimeDay">
                <option :value="127">每天 (周一至周日)</option>
                <option :value="62">工作日 (周一至周五)</option>
                <option :value="65">周末 (周六与周日)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. 队列与调度 (并发限制与停滞时间) -->
        <div v-else-if="activeTab === 'queue'" class="tab-body">
          <h4 class="sub-title">并发任务限制</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.downloadQueueEnabled" />
              <span>最大活动下载任务数:</span>
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
              <span>最大活动做种任务数:</span>
            </label>
            <input
              type="number"
              class="num-input"
              v-model.number="form.seedQueueSize"
              :disabled="!form.seedQueueEnabled"
            />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">停滞任务忽略策略 (Stalled Tasks)</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.queueStalledEnabled" />
              <span>当任务空闲无传输超过指定时间，不计入并发上限:</span>
            </label>
          </div>
          <div class="form-row">
            <span style="padding-left: 24px;">停滞超时判定时间:</span>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.queueStalledMinutes"
                :disabled="!form.queueStalledEnabled"
              />
              <span class="unit-label">分钟</span>
            </div>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">默认做种与停止规则</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.seedRatioLimited" />
              <span>默认做种达到指定分享率后停止:</span>
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
              <span>默认做种空闲超过指定时间后停止:</span>
            </label>
            <div class="unit-group">
              <input
                type="number"
                class="num-input"
                v-model.number="form.idleSeedingLimit"
                :disabled="!form.idleSeedingLimitEnabled"
              />
              <span class="unit-label">分钟</span>
            </div>
          </div>
        </div>

        <!-- 3. 网络与协议 (P2P协议、端口与加密) -->
        <div v-else-if="activeTab === 'network'" class="tab-body">
          <h4 class="sub-title">入站对等连接端口</h4>
          <div class="form-row">
            <span>监听对等端口:</span>
            <div class="port-input-group">
              <input type="number" class="num-input" v-model.number="form.peerPort" />
              <button class="md-btn md-btn-flat btn-sm" @click="testPort" :disabled="testingPort">
                <span class="material-icons" style="font-size: 16px;">{{ testingPort ? 'sync' : 'network_check' }}</span>
                {{ testingPort ? '测试中...' : '测试端口' }}
              </button>
            </div>
          </div>

          <div class="port-status-box" v-if="portStatus !== null">
            <span class="material-icons" :style="{ color: portStatus ? 'var(--md-success)' : 'var(--md-error)' }">
              {{ portStatus ? 'check_circle' : 'cancel' }}
            </span>
            <span>{{ portStatus ? '公网入站对等端口正常开放 (Port is OPEN)' : '入站端口被阻断或关闭 (Port is CLOSED)' }}</span>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.peerPortRandomOnStart" />
              <span>启动 Transmission 时随机选择端口</span>
            </label>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.portForwardingEnabled" />
              <span>使用 UPnP / NAT-PMP 自动映射路由端口</span>
            </label>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">P2P 协议与网络特性 (PT/BT 选项)</h4>
          <div class="form-grid">
            <label class="form-check">
              <input type="checkbox" v-model="form.dhtEnabled" />
              <span>启用分布式哈希表 (DHT)</span>
            </label>
            <label class="form-check">
              <input type="checkbox" v-model="form.pexEnabled" />
              <span>启用用户对等交换 (PEX)</span>
            </label>
            <label class="form-check">
              <input type="checkbox" v-model="form.lpdEnabled" />
              <span>启用本地用户发现 (LPD)</span>
            </label>
            <label class="form-check">
              <input type="checkbox" v-model="form.utpEnabled" />
              <span>启用微传输协议 (µTP)</span>
            </label>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">数据传输加密模式</h4>
          <div class="form-row">
            <span>加密协议策略:</span>
            <select class="select-input" v-model="form.encryption">
              <option value="tolerated">兼容模式 (Tolerated - 允许未加密)</option>
              <option value="preferred">优先加密 (Preferred - 推荐)</option>
              <option value="required">强制加密 (Required - 拒绝未加密连接)</option>
            </select>
          </div>

          <div class="form-row">
            <span>全局最大连接对等数:</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitGlobal" />
          </div>
          <div class="form-row">
            <span>每个种子最大连接数:</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitPerTorrent" />
          </div>
        </div>

        <!-- 4. 存储与缓存 (目录、可用空间、写缓存调节) -->
        <div v-else-if="activeTab === 'storage'" class="tab-body">
          <h4 class="sub-title">存储目录与空间探测</h4>
          <div class="form-group">
            <label class="form-label">默认下载保存目录:</label>
            <input type="text" class="text-input" v-model="form.downloadDir" @blur="checkFreeSpace" />
          </div>

          <div class="free-space-badge" v-if="freeSpaceBytes !== null">
            <span class="material-icons">storage</span>
            <span>该存储挂载点剩余可用容量: <b>{{ formatBytes(freeSpaceBytes) }}</b></span>
          </div>

          <div class="form-group mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.incompleteDirEnabled" />
              <span>将未完成的任务文件保存在临时目录:</span>
            </label>
            <input
              type="text"
              class="text-input mt-1"
              v-model="form.incompleteDir"
              :disabled="!form.incompleteDirEnabled"
            />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">路由器嵌入式内存缓存调优 (Cache Size)</h4>
          <div class="form-row">
            <div>
              <span>磁盘写入缓存大小:</span>
              <div class="form-hint">路由器 RAM 较紧凑时建议 2~4MB，机械硬盘下载可调大至 8~16MB</div>
            </div>
            <div class="unit-group">
              <input type="number" class="num-input" v-model.number="form.cacheSizeMb" min="1" max="64" />
              <span class="unit-label">MB</span>
            </div>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.renamePartialFiles" />
              <span>下载中未完成的文件自动追加 .part 扩展名</span>
            </label>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.trashOriginalTorrentFiles" />
              <span>添加任务后自动删除原始 .torrent 文件</span>
            </label>
          </div>
        </div>

        <!-- 5. 安全与自动化 (黑名单、默认Tracker、完成脚本) -->
        <div v-else-if="activeTab === 'automation'" class="tab-body">
          <h4 class="sub-title">IP 黑名单防护 (Blocklist)</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.blocklistEnabled" />
              <span>启用外部 IP 黑名单防护</span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">黑名单更新 URL 规则源:</label>
            <input type="text" class="text-input" v-model="form.blocklistUrl" :disabled="!form.blocklistEnabled" />
          </div>
          <div class="blocklist-action-row">
            <button class="md-btn md-btn-flat" @click="updateBlocklist" :disabled="updatingBlocklist || !form.blocklistEnabled">
              <span class="material-icons">security</span>
              {{ updatingBlocklist ? '正在拉取...' : '立即更新黑名单' }}
            </button>
            <span class="blocklist-size" v-if="state.session?.['blocklist-size']">
              已载入规则条数: <b>{{ state.session['blocklist-size'] }}</b> 条
            </span>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">全局公共默认 Tracker (Default Trackers)</h4>
          <div class="form-group">
            <label class="form-label">添加公共种子时自动注入的默认 Tracker 列表 (每行一个):</label>
            <textarea
              class="textarea-input"
              rows="3"
              v-model="form.defaultTrackers"
              placeholder="udp://tracker.opentrackr.org:1337/announce&#10;http://tracker.openbittorrent.com:80/announce"
            ></textarea>
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">任务下载完成自动化脚本 (Done Script)</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.scriptTorrentDoneEnabled" />
              <span>任务下载完成时自动执行后台脚本</span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">Shell 脚本绝对路径:</label>
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
          取消
        </button>
        <button class="md-btn md-btn-raised" @click="saveSettings">
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { state, fetchSession, formatBytes } from '../stores/transmission';
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

watch(
  () => state.session,
  (s) => {
    if (!s) return;
    form.speedLimitDown = s['speed-limit-down'] || 0;
    form.speedLimitDownEnabled = s['speed-limit-down-enabled'] || false;
    form.speedLimitUp = s['speed-limit-up'] || 0;
    form.speedLimitUpEnabled = s['speed-limit-up-enabled'] || false;
    form.altSpeedDown = s['alt-speed-down'] || 50;
    form.altSpeedUp = s['alt-speed-up'] || 50;
    form.altSpeedTimeEnabled = s['alt-speed-time-enabled'] || false;
    form.altSpeedTimeBegin = s['alt-speed-time-begin'] || 540;
    form.altSpeedTimeEnd = s['alt-speed-time-end'] || 1020;
    form.altSpeedTimeDay = s['alt-speed-time-day'] || 127;

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
    alert(`IP 黑名单更新完成！已成功载入 ${res['blocklist-size']} 条防护屏蔽规则。`);
    await fetchSession();
  } catch (e) {
    alert('黑名单更新失败，请检查网络或 URL 规则源是否有效。');
  } finally {
    updatingBlocklist.value = false;
  }
}

async function saveSettings() {
  await rpc.sessionSet({
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

    'download-dir': form.downloadDir,
    'incomplete-dir-enabled': form.incompleteDirEnabled,
    'incomplete-dir': form.incompleteDir,
    'cache-size-mb': form.cacheSizeMb,
    'rename-partial-files': form.renamePartialFiles,
    'trash-original-torrent-files': form.trashOriginalTorrentFiles,

    'blocklist-enabled': form.blocklistEnabled,
    'blocklist-url': form.blocklistUrl,
    'default-trackers': form.defaultTrackers,
    'script-torrent-done-enabled': form.scriptTorrentDoneEnabled,
    'script-torrent-done-filename': form.scriptTorrentDoneFilename,
  } as any);

  state.sessionDialogOpen = false;
  await fetchSession();
}
</script>

<style scoped>
.session-dialog {
  width: 660px;
  max-width: 95vw;
}

.dialog-header {
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--md-divider);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 22px;
  color: var(--md-primary);
}

.session-dialog .md-dialog-title {
  padding: 0;
  font-size: 18px;
  font-weight: 600;
}

.session-tabs {
  display: flex;
  border-bottom: 1px solid var(--md-divider);
  margin-bottom: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.tab-btn {
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: var(--md-primary);
}

.tab-btn.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
  font-weight: 600;
}

.sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--md-primary);
  margin: 14px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  margin-bottom: 4px;
}

.form-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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
  font-size: 12px;
  color: var(--md-text-secondary);
}

.num-input {
  width: 90px;
  padding: 4px 8px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  text-align: right;
  font-family: monospace;
}

.text-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-size: 13px;
}

.textarea-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

.select-input {
  padding: 4px 8px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-size: 12px;
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
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.04);
  margin-top: 6px;
}

.free-space-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(63, 81, 181, 0.08);
  border-radius: 3px;
  color: var(--md-primary);
}

.free-space-badge .material-icons {
  font-size: 16px;
}

.sub-box {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 10px 14px;
  margin-top: 6px;
}

.time-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 3px 6px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-family: monospace;
}

.divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 14px 0;
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
