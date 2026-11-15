<template>
  <div class="md-dialog-overlay" v-if="isOpen && torrent" @click.self="close">
    <div class="md-dialog props-dialog">
      <div class="dialog-header">
        <div class="header-title-row">
          <span class="material-icons header-icon">tune</span>
          <h2 class="md-dialog-title">任务属性: {{ torrent.name }}</h2>
        </div>
        <button class="md-icon-button" @click="close" title="关闭">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="md-dialog-content">
        <!-- 1. 速度与带宽优先级 -->
        <h4 class="sub-title">独立带宽与优先级</h4>
        <div class="form-row">
          <span>带宽优先级:</span>
          <select class="select-input" v-model.number="form.bandwidthPriority">
            <option :value="1">高优先级 (High)</option>
            <option :value="0">普通优先级 (Normal)</option>
            <option :value="-1">低优先级 (Low)</option>
          </select>
        </div>

        <div class="form-row">
          <span>最大连接节点数:</span>
          <input type="number" class="num-input" v-model.number="form.peerLimit" min="1" max="500" />
        </div>

        <div class="divider"></div>

        <h4 class="sub-title">独立速度限制</h4>
        <div class="form-row">
          <label class="form-check">
            <input type="checkbox" v-model="form.downloadLimited" />
            <span>启用独立下载限速:</span>
          </label>
          <div class="unit-group">
            <input
              type="number"
              class="num-input"
              v-model.number="form.downloadLimit"
              :disabled="!form.downloadLimited"
            />
            <span class="unit-label">KB/s</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-check">
            <input type="checkbox" v-model="form.uploadLimited" />
            <span>启用独立上传限速:</span>
          </label>
          <div class="unit-group">
            <input
              type="number"
              class="num-input"
              v-model.number="form.uploadLimit"
              :disabled="!form.uploadLimited"
            />
            <span class="unit-label">KB/s</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 2. 分享率与做种停止规则 -->
        <h4 class="sub-title">独立做种停止规则</h4>
        <div class="form-row">
          <span>分享率停止模式:</span>
          <select class="select-input" v-model.number="form.seedRatioMode">
            <option :value="0">遵循全局设置 (0)</option>
            <option :value="1">单独指定分享率 (1)</option>
            <option :value="2">无限做种 (2)</option>
          </select>
        </div>

        <div class="form-row" v-if="form.seedRatioMode === 1">
          <span>目标分享比率:</span>
          <input type="number" step="0.1" class="num-input" v-model.number="form.seedRatioLimit" />
        </div>

        <div class="form-row mt-2">
          <span>空闲停止模式:</span>
          <select class="select-input" v-model.number="form.seedIdleMode">
            <option :value="0">遵循全局设置 (0)</option>
            <option :value="1">单独指定超时 (1)</option>
            <option :value="2">无限期做种 (2)</option>
          </select>
        </div>

        <div class="form-row" v-if="form.seedIdleMode === 1">
          <span>空闲超时分钟数:</span>
          <div class="unit-group">
            <input type="number" class="num-input" v-model.number="form.seedIdleLimit" />
            <span class="unit-label">分钟</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 3. 标签分类 -->
        <h4 class="sub-title">任务标签 (逗号分隔)</h4>
        <div class="form-group">
          <input
            type="text"
            class="text-input"
            v-model="labelsStr"
            placeholder="例如: 动漫, PT, 电影"
          />
        </div>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="close">
          取消
        </button>
        <button class="md-btn md-btn-raised" @click="saveProps">
          保存属性
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { state, fetchTorrents } from '../stores/transmission';
import { Torrent, Priority, SeedRatioMode, SeedIdleMode } from '../api/types';
import { rpc } from '../api/rpc';

const props = defineProps<{
  torrentId: number | null;
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const torrent = computed(() => {
  if (!props.torrentId) return null;
  return state.torrents.find((t) => t.id === props.torrentId) || null;
});

const form = reactive({
  bandwidthPriority: Priority.NORMAL,
  peerLimit: 50,
  downloadLimit: 0,
  downloadLimited: false,
  uploadLimit: 0,
  uploadLimited: false,
  seedRatioMode: SeedRatioMode.GLOBAL,
  seedRatioLimit: 2.0,
  seedIdleMode: SeedIdleMode.GLOBAL,
  seedIdleLimit: 30,
});

const labelsStr = ref('');

watch(
  () => props.torrentId,
  async (id) => {
    if (!id) return;
    const detail = await rpc.getTorrentDetail(id);
    if (!detail) return;
    form.bandwidthPriority = detail.bandwidthPriority !== undefined ? detail.bandwidthPriority : Priority.NORMAL;
    form.peerLimit = (detail as any)['peer-limit'] || 50;
    form.downloadLimit = detail.downloadLimit || 0;
    form.downloadLimited = detail.downloadLimited || false;
    form.uploadLimit = detail.uploadLimit || 0;
    form.uploadLimited = detail.uploadLimited || false;
    form.seedRatioMode = detail.seedRatioMode !== undefined ? detail.seedRatioMode : SeedRatioMode.GLOBAL;
    form.seedRatioLimit = detail.seedRatioLimit || 2.0;
    form.seedIdleMode = detail.seedIdleMode !== undefined ? detail.seedIdleMode : SeedIdleMode.GLOBAL;
    form.seedIdleLimit = detail.seedIdleLimit || 30;
    labelsStr.value = (detail.labels || []).join(', ');
  },
  { immediate: true }
);

function close() {
  isOpen.value = false;
}

async function saveProps() {
  if (!props.torrentId) return;

  const labels = labelsStr.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  await rpc.torrentSet({
    ids: [props.torrentId],
    bandwidthPriority: form.bandwidthPriority,
    'peer-limit': form.peerLimit,
    downloadLimit: form.downloadLimit,
    downloadLimited: form.downloadLimited,
    uploadLimit: form.uploadLimit,
    uploadLimited: form.uploadLimited,
    seedRatioMode: form.seedRatioMode,
    seedRatioLimit: form.seedRatioLimit,
    seedIdleMode: form.seedIdleMode,
    seedIdleLimit: form.seedIdleLimit,
    labels,
  });

  close();
  await fetchTorrents();
}
</script>

<style scoped>
.props-dialog {
  width: 540px;
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
  overflow: hidden;
  white-space: nowrap;
}

.header-icon {
  font-size: 20px;
  color: var(--md-primary);
}

.props-dialog .md-dialog-title {
  padding: 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
}

.sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--md-primary);
  margin: 12px 0 8px;
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

.form-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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

.select-input {
  padding: 4px 8px;
  border: 1px solid var(--md-divider);
  border-radius: 3px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-size: 12px;
}

.divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 12px 0;
}

.mt-2 { margin-top: 8px; }
</style>
