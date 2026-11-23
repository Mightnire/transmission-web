<template>
  <div class="md-dialog-overlay" v-if="isOpen && (torrent || isBatch)" @click.self="close">
    <div class="md-dialog props-dialog">
      <div class="dialog-header">
        <div class="header-title-row">
          <FluentIcon name="tune" class="header-icon" />
          <h2 class="md-dialog-title" v-if="isBatch">{{ t('props.batchTitle', { count: targetIds.length }) }}</h2>
          <h2 class="md-dialog-title" v-else-if="torrent">{{ t('props.title', { name: torrent.name }) }}</h2>
        </div>
        <button class="md-icon-button" @click="close" :title="t('common.close')">
          <FluentIcon name="close" />
        </button>
      </div>

      <div class="md-dialog-content">
        <!-- 1. 速度与带宽优先级 -->
        <h4 class="sub-title">{{ t('props.bandwidth') }}</h4>
        <div class="form-row">
          <span>{{ t('props.priority') }}</span>
          <select class="select-input" v-model.number="form.bandwidthPriority">
            <option :value="1">{{ t('props.high') }}</option>
            <option :value="0">{{ t('props.normal') }}</option>
            <option :value="-1">{{ t('props.low') }}</option>
          </select>
        </div>

        <div class="form-row">
          <span>{{ t('props.peerLimit') }}</span>
          <input type="number" class="num-input" v-model.number="form.peerLimit" min="1" max="500" />
        </div>

        <div class="divider"></div>

        <h4 class="sub-title">{{ t('props.speedLimits') }}</h4>
        <div class="form-row">
          <label class="form-check">
            <input type="checkbox" v-model="form.downloadLimited" />
            <span>{{ t('props.downLimit') }}</span>
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
            <span>{{ t('props.upLimit') }}</span>
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

        <div class="form-row">
          <label class="form-check">
            <input type="checkbox" v-model="form.honorsSessionLimits" />
            <span>{{ t('props.honorsSession') }}</span>
          </label>
        </div>

        <div class="divider"></div>

        <!-- 2. 分享率与做种停止规则 -->
        <h4 class="sub-title">{{ t('props.seedRules') }}</h4>
        <div class="form-row">
          <span>{{ t('props.ratioMode') }}</span>
          <select class="select-input" v-model.number="form.seedRatioMode">
            <option :value="0">{{ t('props.ratioGlobal') }}</option>
            <option :value="1">{{ t('props.ratioSingle') }}</option>
            <option :value="2">{{ t('props.ratioUnlimited') }}</option>
          </select>
        </div>

        <div class="form-row" v-if="form.seedRatioMode === 1">
          <span>{{ t('props.ratioTarget') }}</span>
          <input type="number" step="0.1" class="num-input" v-model.number="form.seedRatioLimit" />
        </div>

        <div class="form-row mt-2">
          <span>{{ t('props.idleMode') }}</span>
          <select class="select-input" v-model.number="form.seedIdleMode">
            <option :value="0">{{ t('props.idleGlobal') }}</option>
            <option :value="1">{{ t('props.idleSingle') }}</option>
            <option :value="2">{{ t('props.idleUnlimited') }}</option>
          </select>
        </div>

        <div class="form-row" v-if="form.seedIdleMode === 1">
          <span>{{ t('props.idleTarget') }}</span>
          <div class="unit-group">
            <input type="number" class="num-input" v-model.number="form.seedIdleLimit" />
            <span class="unit-label">{{ t('session.queue.minutes') }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 3. 标签分类 -->
        <h4 class="sub-title">{{ t('props.labels') }}</h4>
        <div class="form-group">
          <input
            type="text"
            class="text-input"
            v-model="labelsStr"
            :placeholder="t('props.labelsPlaceholder')"
          />
        </div>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="close">
          {{ t('common.cancel') }}
        </button>
        <button class="md-btn md-btn-raised" @click="saveProps">
          {{ t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import {
  state,
  showToast,
  describeError,
  updateTorrentPropsOptimistically,
} from '../../stores/transmission';
import { useEscapeKey } from '../../composables/useEscapeKey';
import { Priority, SeedRatioMode, SeedIdleMode } from '../../api/types';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';

const props = withDefaults(
  defineProps<{
    torrentId?: number | null;
    torrentIds?: number[];
    modelValue: boolean;
  }>(),
  {
    torrentId: null,
    torrentIds: () => [],
    modelValue: false,
  }
);

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const targetIds = computed(() => {
  if (props.torrentIds && props.torrentIds.length > 0) return props.torrentIds;
  if (props.torrentId) return [props.torrentId];
  return [];
});

const isBatch = computed(() => targetIds.value.length > 1);

const primaryId = computed(() => targetIds.value[0] || props.torrentId || null);

const torrent = computed(() => {
  if (!primaryId.value) return null;
  return state.torrents.find((t) => t.id === primaryId.value) || null;
});

const form = reactive({
  bandwidthPriority: Priority.NORMAL,
  peerLimit: 50,
  downloadLimit: 0,
  downloadLimited: false,
  uploadLimit: 0,
  uploadLimited: false,
  honorsSessionLimits: true,
  seedRatioMode: SeedRatioMode.GLOBAL,
  seedRatioLimit: 2.0,
  seedIdleMode: SeedIdleMode.GLOBAL,
  seedIdleLimit: 30,
});

const labelsStr = ref('');
let initialSnapshot: any = {};
let initialLabelsStr = '';

function syncFormFromData(data: any) {
  if (!data) return;
  form.bandwidthPriority = data.bandwidthPriority !== undefined ? data.bandwidthPriority : Priority.NORMAL;
  form.peerLimit = data['peer-limit'] || data.peerLimit || 50;
  form.downloadLimit = data.downloadLimit || 0;
  form.downloadLimited = !!data.downloadLimited;
  form.uploadLimit = data.uploadLimit || 0;
  form.uploadLimited = !!data.uploadLimited;
  form.honorsSessionLimits = data.honorsSessionLimits !== undefined ? data.honorsSessionLimits : true;
  form.seedRatioMode = data.seedRatioMode !== undefined ? data.seedRatioMode : SeedRatioMode.GLOBAL;
  form.seedRatioLimit = data.seedRatioLimit ?? 2.0;
  form.seedIdleMode = data.seedIdleMode !== undefined ? data.seedIdleMode : SeedIdleMode.GLOBAL;
  form.seedIdleLimit = data.seedIdleLimit ?? 30;
  if (Array.isArray(data.labels)) {
    labelsStr.value = data.labels.join(', ');
  } else {
    labelsStr.value = '';
  }

  // 记录初始快照，用于多选批量修改时仅提交实际修改过的脏字段
  initialSnapshot = { ...form };
  initialLabelsStr = labelsStr.value;
}

watch(
  [() => primaryId.value, () => props.modelValue],
  async ([id, open]) => {
    if (!id || !open) return;
    const local =
      state.activeTorrentDetail && state.activeTorrentDetail.id === id
        ? state.activeTorrentDetail
        : state.torrents.find((t) => t.id === id);
    if (local) {
      syncFormFromData(local);
    }
    try {
      const detail = await rpc.getTorrentDetail(id);
      if (detail && isOpen.value && primaryId.value === id) {
        const isDirty =
          Object.keys(initialSnapshot).some((k) => (form as any)[k] !== initialSnapshot[k]) ||
          labelsStr.value !== initialLabelsStr;
        if (!isDirty) {
          syncFormFromData(detail);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch torrent detail for dialog:', e);
    }
  },
  { immediate: true }
);

function close() {
  isOpen.value = false;
}

useEscapeKey(() => {
  if (isOpen.value) close();
});

async function saveProps() {
  if (targetIds.value.length === 0) return;

  const patch: any = {};

  if (isBatch.value) {
    // 批量模式：仅提交用户在本次弹窗中实际修改过的脏字段
    if (form.bandwidthPriority !== initialSnapshot.bandwidthPriority) {
      patch.bandwidthPriority = form.bandwidthPriority;
    }
    if (form.peerLimit !== initialSnapshot.peerLimit) {
      patch['peer-limit'] = form.peerLimit;
      patch.peerLimit = form.peerLimit;
    }
    if (form.downloadLimit !== initialSnapshot.downloadLimit) {
      patch.downloadLimit = form.downloadLimit;
    }
    if (form.downloadLimited !== initialSnapshot.downloadLimited) {
      patch.downloadLimited = form.downloadLimited;
    }
    if (form.uploadLimit !== initialSnapshot.uploadLimit) {
      patch.uploadLimit = form.uploadLimit;
    }
    if (form.uploadLimited !== initialSnapshot.uploadLimited) {
      patch.uploadLimited = form.uploadLimited;
    }
    if (form.honorsSessionLimits !== initialSnapshot.honorsSessionLimits) {
      patch.honorsSessionLimits = form.honorsSessionLimits;
    }
    if (form.seedRatioMode !== initialSnapshot.seedRatioMode) {
      patch.seedRatioMode = form.seedRatioMode;
    }
    if (form.seedRatioLimit !== initialSnapshot.seedRatioLimit) {
      patch.seedRatioLimit = form.seedRatioLimit;
    }
    if (form.seedIdleMode !== initialSnapshot.seedIdleMode) {
      patch.seedIdleMode = form.seedIdleMode;
    }
    if (form.seedIdleLimit !== initialSnapshot.seedIdleLimit) {
      patch.seedIdleLimit = form.seedIdleLimit;
    }
    if (labelsStr.value !== initialLabelsStr) {
      patch.labels = labelsStr.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (Object.keys(patch).length === 0) {
      close();
      return;
    }
  } else {
    // 单任务模式：完整提交表单所有字段
    patch.bandwidthPriority = form.bandwidthPriority;
    patch['peer-limit'] = form.peerLimit;
    patch.peerLimit = form.peerLimit;
    patch.downloadLimit = form.downloadLimit;
    patch.downloadLimited = form.downloadLimited;
    patch.uploadLimit = form.uploadLimit;
    patch.uploadLimited = form.uploadLimited;
    patch.honorsSessionLimits = form.honorsSessionLimits;
    patch.seedRatioMode = form.seedRatioMode;
    patch.seedRatioLimit = form.seedRatioLimit;
    patch.seedIdleMode = form.seedIdleMode;
    patch.seedIdleLimit = form.seedIdleLimit;
    patch.labels = labelsStr.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  close();
  try {
    await updateTorrentPropsOptimistically(targetIds.value, patch);
    showToast(t('toast.saved'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}
</script>

<style scoped>
.props-dialog {
  width: 520px;
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
  overflow: hidden;
  white-space: nowrap;
}

.header-icon {
  font-size: 18px;
  color: var(--fluent-accent);
}

.props-dialog .md-dialog-title {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 420px;
  color: var(--md-text-primary);
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
  color: var(--md-text-primary);
}

.form-group {
  margin-bottom: 10px;
}

.form-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-check input[type="checkbox"] {
  cursor: pointer;
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
  font-family: var(--font-mono);
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

.divider {
  height: 1px;
  background-color: var(--fluent-border-subtle);
  margin: 10px 0;
}

.mt-2 { margin-top: 8px; }

/* 移动端响应式适配 */
@media (max-width: 600px) {
  .props-dialog {
    width: calc(100vw - 16px);
    max-height: 92vh;
    margin: 8px;
  }

  .form-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .title-text {
    max-width: 240px;
  }

  .md-dialog-content {
    padding: 0 14px 14px;
    max-height: calc(92vh - 110px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
