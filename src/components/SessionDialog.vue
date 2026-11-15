<template>
  <div class="md-dialog-overlay" v-if="state.sessionDialogOpen" @click.self="state.sessionDialogOpen = false">
    <div class="md-dialog session-dialog">
      <h2 class="md-dialog-title">Transmission 首选项</h2>

      <div class="md-dialog-content">
        <!-- 标签导航 -->
        <div class="session-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'speed' }"
            @click="activeTab = 'speed'"
          >
            速度
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'network' }"
            @click="activeTab = 'network'"
          >
            网络与端口
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'storage' }"
            @click="activeTab = 'storage'"
          >
            存储与目录
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'privacy' }"
            @click="activeTab = 'privacy'"
          >
            对等与黑名单
          </button>
        </div>

        <!-- 1. 速度限制 -->
        <div v-if="activeTab === 'speed'" class="tab-body">
          <h4 class="sub-title">常规速度限制</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.speedLimitDownEnabled" />
              <span>下载速度上限 (KB/s):</span>
            </label>
            <input
              type="number"
              class="num-input"
              v-model.number="form.speedLimitDown"
              :disabled="!form.speedLimitDownEnabled"
            />
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.speedLimitUpEnabled" />
              <span>上传速度上限 (KB/s):</span>
            </label>
            <input
              type="number"
              class="num-input"
              v-model.number="form.speedLimitUp"
              :disabled="!form.speedLimitUpEnabled"
            />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">乌龟临时限速模式 (Turtle Mode)</h4>
          <div class="form-row">
            <span>乌龟模式下载上限 (KB/s):</span>
            <input type="number" class="num-input" v-model.number="form.altSpeedDown" />
          </div>
          <div class="form-row">
            <span>乌龟模式上传上限 (KB/s):</span>
            <input type="number" class="num-input" v-model.number="form.altSpeedUp" />
          </div>
        </div>

        <!-- 2. 网络与端口 (包含 port-test 官方功能) -->
        <div v-else-if="activeTab === 'network'" class="tab-body">
          <h4 class="sub-title">入站对等连接端口</h4>
          <div class="form-row">
            <span>监听端口:</span>
            <div class="port-input-group">
              <input type="number" class="num-input" v-model.number="form.peerPort" />
              <button class="md-btn md-btn-flat btn-sm" @click="testPort" :disabled="testingPort">
                <span class="material-icons" style="font-size: 16px;">{{ testingPort ? 'sync' : 'network_check' }}</span>
                {{ testingPort ? '正在检测...' : '测试端口' }}
              </button>
            </div>
          </div>

          <div class="port-status-box" v-if="portStatus !== null">
            <span class="material-icons" :style="{ color: portStatus ? 'var(--md-success)' : 'var(--md-error)' }">
              {{ portStatus ? 'check_circle' : 'cancel' }}
            </span>
            <span>{{ portStatus ? '入站端口正常通畅 (Port is OPEN)' : '入站端口被阻断或关闭 (Port is CLOSED)' }}</span>
          </div>

          <div class="form-row mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.peerPortRandomOnStart" />
              <span>启动时使用随机端口</span>
            </label>
          </div>

          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.portForwardingEnabled" />
              <span>使用 UPnP / NAT-PMP 自动映射路由端口</span>
            </label>
          </div>
        </div>

        <!-- 3. 存储与目录 (包含 free-space 空间探测) -->
        <div v-else-if="activeTab === 'storage'" class="tab-body">
          <h4 class="sub-title">存储路径</h4>
          <div class="form-group">
            <label class="form-label">默认下载保存目录:</label>
            <input type="text" class="text-input" v-model="form.downloadDir" @blur="checkFreeSpace" />
          </div>

          <div class="free-space-badge" v-if="freeSpaceBytes !== null">
            <span class="material-icons">storage</span>
            <span>该分区剩余可用空间: <b>{{ formatBytes(freeSpaceBytes) }}</b></span>
          </div>

          <div class="form-group mt-2">
            <label class="form-check">
              <input type="checkbox" v-model="form.incompleteDirEnabled" />
              <span>未完成的任务保存在独立目录:</span>
            </label>
            <input
              type="text"
              class="text-input mt-1"
              v-model="form.incompleteDir"
              :disabled="!form.incompleteDirEnabled"
            />
          </div>
        </div>

        <!-- 4. 对等网络与黑名单 (包含 blocklist-update) -->
        <div v-else-if="activeTab === 'privacy'" class="tab-body">
          <h4 class="sub-title">连接数限制</h4>
          <div class="form-row">
            <span>全局最大连接数:</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitGlobal" />
          </div>
          <div class="form-row">
            <span>每个种子最大连接数:</span>
            <input type="number" class="num-input" v-model.number="form.peerLimitPerTorrent" />
          </div>

          <div class="divider"></div>

          <h4 class="sub-title">IP 黑名单防护</h4>
          <div class="form-row">
            <label class="form-check">
              <input type="checkbox" v-model="form.blocklistEnabled" />
              <span>启用 IP 黑名单 (Blocklist)</span>
            </label>
          </div>
          <div class="form-group">
            <label class="form-label">黑名单更新 URL:</label>
            <input type="text" class="text-input" v-model="form.blocklistUrl" :disabled="!form.blocklistEnabled" />
          </div>
          <div class="blocklist-action-row">
            <button class="md-btn md-btn-flat" @click="updateBlocklist" :disabled="updatingBlocklist || !form.blocklistEnabled">
              <span class="material-icons">security</span>
              {{ updatingBlocklist ? '正在拉取...' : '立即更新黑名单' }}
            </button>
            <span class="blocklist-size" v-if="state.session?.['blocklist-size']">
              当前已加载规则: {{ state.session['blocklist-size'] }} 条
            </span>
          </div>
        </div>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="state.sessionDialogOpen = false">
          取消
        </button>
        <button class="md-btn md-btn-raised" @click="saveSettings">
          保存首选项
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { state, fetchSession, formatBytes } from '../stores/transmission';
import { rpc } from '../api/rpc';

const activeTab = ref<'speed' | 'network' | 'storage' | 'privacy'>('speed');
const testingPort = ref(false);
const portStatus = ref<boolean | null>(null);
const freeSpaceBytes = ref<number | null>(null);
const updatingBlocklist = ref(false);

const form = reactive({
  speedLimitDown: 0,
  speedLimitDownEnabled: false,
  speedLimitUp: 0,
  speedLimitUpEnabled: false,
  altSpeedDown: 50,
  altSpeedUp: 50,
  peerPort: 51413,
  peerPortRandomOnStart: false,
  portForwardingEnabled: true,
  downloadDir: '',
  incompleteDirEnabled: false,
  incompleteDir: '',
  peerLimitGlobal: 240,
  peerLimitPerTorrent: 60,
  blocklistEnabled: false,
  blocklistUrl: '',
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
    form.peerPort = s['peer-port'] || 51413;
    form.peerPortRandomOnStart = s['peer-port-random-on-start'] || false;
    form.portForwardingEnabled = s['port-forwarding-enabled'] || false;
    form.downloadDir = s['download-dir'] || '';
    form.incompleteDirEnabled = s['incomplete-dir-enabled'] || false;
    form.incompleteDir = s['incomplete-dir'] || '';
    form.peerLimitGlobal = s['peer-limit-global'] || 240;
    form.peerLimitPerTorrent = s['peer-limit-per-torrent'] || 60;
    form.blocklistEnabled = s['blocklist-enabled'] || false;
    form.blocklistUrl = s['blocklist-url'] || '';

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
    alert(`IP 黑名单更新完成！已同步加载 ${res['blocklist-size']} 条屏蔽规则。`);
    await fetchSession();
  } catch (e) {
    alert('黑名单更新失败，请检查 URL 是否有效。');
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
    'peer-port': form.peerPort,
    'peer-port-random-on-start': form.peerPortRandomOnStart,
    'port-forwarding-enabled': form.portForwardingEnabled,
    'download-dir': form.downloadDir,
    'incomplete-dir-enabled': form.incompleteDirEnabled,
    'incomplete-dir': form.incompleteDir,
    'peer-limit-global': form.peerLimitGlobal,
    'peer-limit-per-torrent': form.peerLimitPerTorrent,
    'blocklist-enabled': form.blocklistEnabled,
    'blocklist-url': form.blocklistUrl,
  });

  state.sessionDialogOpen = false;
  await fetchSession();
}
</script>

<style scoped>
.session-dialog {
  width: 600px;
  max-width: 95vw;
}

.session-tabs {
  display: flex;
  border-bottom: 1px solid var(--md-divider);
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
}

.tab-btn.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
  font-weight: 600;
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-primary);
  margin: 12px 0 8px;
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

.num-input {
  width: 100px;
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

.divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 12px 0;
}

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }

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
