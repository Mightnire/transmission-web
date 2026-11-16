<template>
  <!-- 0. 通用 Fluent 输入弹窗（替代原生 prompt） -->
  <div class="fluent-dialog-backdrop" v-if="state.promptDialog" @click.self="closePrompt">
    <div class="fluent-dialog action-modal" role="dialog" aria-modal="true" :aria-label="state.promptDialog.title">
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="edit" class="title-icon text-accent" />
          <span>{{ state.promptDialog.title }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="closePrompt">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body">
        <div class="form-group" v-if="state.promptDialog.label">
          <label class="form-label">{{ state.promptDialog.label }}</label>
          <textarea
            v-if="state.promptDialog.multiline"
            ref="promptInput"
            v-model="promptValue"
            class="fluent-input prompt-textarea"
            :rows="state.promptDialog.rows || 4"
            :placeholder="state.promptDialog.placeholder || ''"
          ></textarea>
          <input
            v-else
            ref="promptInput"
            type="text"
            v-model="promptValue"
            class="fluent-input"
            :placeholder="state.promptDialog.placeholder || ''"
            @keyup.enter="submitPrompt"
          />
        </div>
        <p class="form-error" v-if="promptError">{{ promptError }}</p>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="closePrompt">
          {{ t('common.cancel') }}
        </button>
        <button
          class="fluent-btn-primary"
          @click="submitPrompt"
          :disabled="!promptValue.trim() || isPromptSubmitting"
        >
          {{ isPromptSubmitting ? t('common.loading') : (state.promptDialog.confirmText || t('common.save')) }}
        </button>
      </div>
    </div>
  </div>

  <!-- 0.1 通用 Fluent 确认弹窗（替代原生 confirm） -->
  <div class="fluent-dialog-backdrop" v-if="state.confirmDialog" @click.self="closeConfirm">
    <div class="fluent-dialog action-modal" role="dialog" aria-modal="true" :aria-label="state.confirmDialog.title">
      <div class="dialog-header" :class="{ 'danger-header': state.confirmDialog.danger }">
        <div class="header-title">
          <FluentIcon :name="state.confirmDialog.danger ? 'warning' : 'info'" class="title-icon" :class="state.confirmDialog.danger ? 'text-danger' : 'text-accent'" />
          <span>{{ state.confirmDialog.title }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="closeConfirm">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body">
        <p class="confirm-prompt-text">{{ state.confirmDialog.message }}</p>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="closeConfirm">
          {{ t('common.cancel') }}
        </button>
        <button
          class="fluent-btn-primary"
          :class="{ 'fluent-btn-danger': state.confirmDialog.danger }"
          @click="submitConfirm"
          :disabled="isConfirmSubmitting"
        >
          {{ isConfirmSubmitting ? t('common.loading') : (state.confirmDialog.confirmText || t('common.confirm')) }}
        </button>
      </div>
    </div>
  </div>

  <!-- 1. 更改存储路径弹窗 -->
  <div class="fluent-dialog-backdrop" v-if="state.locationDialogOpen" @click.self="closeLocation">
    <div class="fluent-dialog action-modal" role="dialog">
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="folder_open" class="title-icon text-accent" />
          <span>{{ t('dialog.setLocationTitle') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="closeLocation">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body">
        <div class="form-group">
          <label class="form-label">{{ t('dialog.setLocationPrompt') }}</label>
          <input
            ref="locationInput"
            type="text"
            v-model="newLocation"
            class="fluent-input"
            @keyup.enter="submitLocation"
            placeholder="/mnt/..."
          />
        </div>
        <label class="fluent-check-label">
          <input type="checkbox" v-model="moveData" />
          <span>{{ t('dialog.moveData') }}</span>
        </label>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="closeLocation">
          {{ t('common.cancel') }}
        </button>
        <button class="fluent-btn-primary" @click="submitLocation" :disabled="!newLocation.trim() || isSubmitting">
          {{ isSubmitting ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 2. 重命名弹窗 -->
  <div class="fluent-dialog-backdrop" v-if="state.renameDialogOpen" @click.self="closeRename">
    <div class="fluent-dialog action-modal" role="dialog">
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="edit" class="title-icon text-accent" />
          <span>{{ t('dialog.renameTitle') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="closeRename">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body">
        <div class="form-group">
          <label class="form-label">{{ t('dialog.renamePrompt') }}</label>
          <input
            ref="renameInput"
            type="text"
            v-model="newName"
            class="fluent-input"
            @keyup.enter="submitRename"
          />
        </div>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="closeRename">
          {{ t('common.cancel') }}
        </button>
        <button class="fluent-btn-primary" @click="submitRename" :disabled="!newName.trim() || isSubmitting">
          {{ isSubmitting ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 3. 删除任务确认弹窗 -->
  <div class="fluent-dialog-backdrop" v-if="state.confirmRemoveDialogOpen" @click.self="state.confirmRemoveDialogOpen = false">
    <div class="fluent-dialog action-modal confirm-delete-modal" role="dialog">
      <div class="dialog-header danger-header">
        <div class="header-title">
          <FluentIcon name="delete" class="title-icon text-danger" />
          <span>{{ t('dialog.confirmDeleteTitle') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="state.confirmRemoveDialogOpen = false">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body">
        <p class="confirm-prompt-text">
          {{ t('dialog.confirmDeletePrompt', { count: targetCount }) }}
        </p>
        <label class="fluent-check-label danger-check">
          <input type="checkbox" v-model="state.removeTrashData" />
          <span>{{ t('dialog.deleteWithData') }}</span>
        </label>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="state.confirmRemoveDialogOpen = false">
          {{ t('common.cancel') }}
        </button>
        <button class="fluent-btn-danger" @click="submitRemove" :disabled="isSubmitting">
          {{ isSubmitting ? t('common.loading') : t('common.delete') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 4. 会话与传输统计弹窗 -->
  <div class="fluent-dialog-backdrop" v-if="state.statsDialogOpen" @click.self="state.statsDialogOpen = false">
    <div class="fluent-dialog stats-modal" role="dialog">
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="insights" class="title-icon text-accent" />
          <span>{{ t('dialog.statsTitle') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="state.statsDialogOpen = false">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body stats-body">
        <!-- 本次会话卡片 -->
        <div class="stats-card">
          <div class="card-caption">
            <FluentIcon name="schedule" class="text-accent" />
            <span>{{ t('dialog.statCurrent') }}</span>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.uploaded') }}</span>
              <span class="stat-v text-success">{{ formatBytes(state.stats?.['current-stats']?.uploadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.downloaded') }}</span>
              <span class="stat-v text-primary">{{ formatBytes(state.stats?.['current-stats']?.downloadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.ratio') }}</span>
              <span class="stat-v">{{ calcRatio(state.stats?.['current-stats']?.uploadedBytes, state.stats?.['current-stats']?.downloadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.activeTime') }}</span>
              <span class="stat-v">{{ formatDuration(state.stats?.['current-stats']?.secondsActive) }}</span>
            </div>
          </div>
        </div>

        <!-- 历史累计卡片 -->
        <div class="stats-card">
          <div class="card-caption">
            <FluentIcon name="all_inclusive" class="text-info" />
            <span>{{ t('dialog.statTotal') }}</span>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.uploaded') }}</span>
              <span class="stat-v text-success">{{ formatBytes(state.stats?.['cumulative-stats']?.uploadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.downloaded') }}</span>
              <span class="stat-v text-primary">{{ formatBytes(state.stats?.['cumulative-stats']?.downloadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.ratio') }}</span>
              <span class="stat-v">{{ calcRatio(state.stats?.['cumulative-stats']?.uploadedBytes, state.stats?.['cumulative-stats']?.downloadedBytes) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-k">{{ t('dialog.activeTime') }}</span>
              <span class="stat-v">{{ formatDuration(state.stats?.['cumulative-stats']?.secondsActive) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-primary" @click="state.statsDialogOpen = false">
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 5. 关于 Transmission 软件弹窗 -->
  <div class="fluent-dialog-backdrop" v-if="state.aboutDialogOpen" @click.self="state.aboutDialogOpen = false">
    <div class="fluent-dialog about-modal" role="dialog">
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="info" class="title-icon text-accent" />
          <span>{{ t('dialog.aboutTitle') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="state.aboutDialogOpen = false">
          <FluentIcon name="close" />
        </button>
      </div>
      <div class="dialog-body about-body">
        <TransmissionLogo :size="64" class="about-big-logo" />
        <h3 class="about-app-name">Transmission Web</h3>
        <p class="about-subtitle">{{ t('dialog.aboutSubtitle') }}</p>
        
        <div class="about-specs-list">
          <div class="spec-row">
            <span class="spec-label">{{ t('dialog.aboutVersion', { version: appVersion }) }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{{ t('dialog.aboutCore', { version: state.session?.version || '3.x/4.x' }) }}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{{ t('dialog.aboutRpc', { version: state.session?.['rpc-version'] || 16, minVersion: state.session?.['rpc-version-minimum'] || 1 }) }}</span>
          </div>
          <div class="spec-badge-box">
            <span class="spec-badge">✓ {{ t('dialog.aboutOffline') }}</span>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="fluent-btn-primary" @click="state.aboutDialogOpen = false">
          {{ t('common.confirm') }}
        </button>
      </div>
    </div>
  </div>

  <!-- 6. 全局 Fluent Toast 提示条 (彻底消除任何 alert) -->
  <Transition name="toast-fade">
    <div
      class="fluent-toast"
      :class="`toast-${state.toastType}`"
      v-if="state.toastMessage"
      role="status"
      aria-live="polite"
    >
      <FluentIcon :name="toastIcon" class="toast-icon" :class="toastIconClass" />
      <span class="toast-text">{{ state.toastMessage }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  state,
  formatBytes,
  removeSelected,
  fetchTorrents,
  showToast,
  describeError,
  closePrompt,
  closeConfirm,
} from '../stores/transmission';
import { rpc } from '../api/rpc';
import { t } from '../locales';

const appVersion = __APP_VERSION__;

// 仅用于让模板中的 ref 类型保持简单
const promptInput = ref<any>(null);
const locationInput = ref<HTMLInputElement | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);

const promptValue = ref('');
const promptError = ref('');
const isPromptSubmitting = ref(false);
const isConfirmSubmitting = ref(false);

const toastIcon = computed(() => {
  if (state.toastType === 'success') return 'check_circle';
  if (state.toastType === 'error') return 'error';
  return 'info';
});

const toastIconClass = computed(() => {
  if (state.toastType === 'success') return 'text-success';
  if (state.toastType === 'error') return 'text-danger';
  return 'text-accent';
});

const newLocation = ref('');
const moveData = ref(true);
const newName = ref('');
const isSubmitting = ref(false);

const targetId = computed(() => {
  if (state.selectedId !== null) return state.selectedId;
  if (state.selectedIds.length > 0) return state.selectedIds[0];
  return null;
});

const targetTorrent = computed(() => {
  if (targetId.value === null) return null;
  return state.torrents.find((t) => t.id === targetId.value) || null;
});

const targetCount = computed(() => {
  return state.selectedIds.length > 0 ? state.selectedIds.length : (state.selectedId !== null ? 1 : 0);
});

watch(
  () => state.locationDialogOpen,
  (open) => {
    if (open) {
      newLocation.value = targetTorrent.value?.downloadDir || '/mnt';
      moveData.value = true;
      isSubmitting.value = false;
      nextTick(() => locationInput.value?.focus());
    }
  }
);

watch(
  () => state.renameDialogOpen,
  (open) => {
    if (open) {
      newName.value = targetTorrent.value?.name || '';
      isSubmitting.value = false;
      nextTick(() => renameInput.value?.focus());
    }
  }
);

watch(
  () => state.promptDialog,
  (dialog) => {
    if (dialog) {
      promptValue.value = dialog.value || '';
      promptError.value = '';
      isPromptSubmitting.value = false;
      nextTick(() => {
        const el = promptInput.value as HTMLInputElement | HTMLTextAreaElement | null;
        el?.focus();
        if (el && el instanceof HTMLInputElement) el.select();
      });
    }
  }
);

watch(
  () => state.confirmDialog,
  (dialog) => {
    if (dialog) isConfirmSubmitting.value = false;
  }
);

async function submitPrompt() {
  const dialog = state.promptDialog;
  if (!dialog || !promptValue.value.trim()) return;
  const value = promptValue.value.trim();
  const validationError = dialog.validate?.(value) || null;
  if (validationError) {
    promptError.value = validationError;
    return;
  }

  promptError.value = '';
  isPromptSubmitting.value = true;
  try {
    const result = await dialog.onConfirm(value);
    if (result === false) return;
    closePrompt();
  } catch (err: any) {
    promptError.value = err?.message || String(err);
    showToast(t('common.failed', { error: promptError.value }), 'error');
  } finally {
    isPromptSubmitting.value = false;
  }
}

async function submitConfirm() {
  const dialog = state.confirmDialog;
  if (!dialog) return;
  isConfirmSubmitting.value = true;
  try {
    const result = await dialog.onConfirm();
    if (result === false) return;
    closeConfirm();
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  } finally {
    isConfirmSubmitting.value = false;
  }
}

function onDialogKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  if (state.promptDialog) {
    event.preventDefault();
    closePrompt();
  } else if (state.confirmDialog) {
    event.preventDefault();
    closeConfirm();
  } else if (state.confirmRemoveDialogOpen) {
    event.preventDefault();
    state.confirmRemoveDialogOpen = false;
  } else if (state.locationDialogOpen) {
    event.preventDefault();
    closeLocation();
  } else if (state.renameDialogOpen) {
    event.preventDefault();
    closeRename();
  } else if (state.statsDialogOpen) {
    event.preventDefault();
    state.statsDialogOpen = false;
  } else if (state.aboutDialogOpen) {
    event.preventDefault();
    state.aboutDialogOpen = false;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onDialogKeydown, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onDialogKeydown, true);
});

function closeLocation() {
  state.locationDialogOpen = false;
}

function closeRename() {
  state.renameDialogOpen = false;
}

async function submitLocation() {
  if (!targetId.value || !newLocation.value.trim()) return;
  isSubmitting.value = true;
  try {
    const ids = state.selectedIds.length > 0 ? state.selectedIds : [targetId.value];
    await rpc.torrentSetLocation(ids, newLocation.value.trim(), moveData.value);
    await fetchTorrents();
    closeLocation();
    showToast(t('toast.locationChanged'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  } finally {
    isSubmitting.value = false;
  }
}

async function submitRename() {
  if (!targetId.value || !newName.value.trim()) return;
  isSubmitting.value = true;
  try {
    const oldName = targetTorrent.value?.name || '';
    await rpc.torrentRenamePath(targetId.value, oldName, newName.value.trim());
    await fetchTorrents();
    closeRename();
    showToast(t('toast.renamed'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  } finally {
    isSubmitting.value = false;
  }
}

async function submitRemove() {
  isSubmitting.value = true;
  try {
    const ok = await removeSelected(state.removeTrashData);
    if (!ok) return;
    state.confirmRemoveDialogOpen = false;
    showToast(t('toast.removed'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  } finally {
    isSubmitting.value = false;
  }
}

function calcRatio(up = 0, down = 0): string {
  if (down === 0) return up > 0 ? '∞' : '0.00';
  return (up / down).toFixed(2);
}

function formatDuration(sec = 0): string {
  if (!sec || sec <= 0) return `0 ${t('common.min')}`;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t('common.day')} ${h} ${t('common.hour')}`;
  if (h > 0) return `${h} ${t('common.hour')} ${m} ${t('common.min')}`;
  return `${m} ${t('common.min')}`;
}
</script>

<style scoped>
.fluent-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
}

.action-modal,
.stats-modal,
.about-modal {
  width: 100%;
  max-width: 460px;
  background-color: var(--fluent-bg-canvas);
  border-radius: 6px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
  border: 1px solid var(--fluent-border-divider);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.16s cubic-bezier(0.1, 0.9, 0.2, 1);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background-color: var(--fluent-bg-subtle);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
  cursor: pointer;
}

.close-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.dialog-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-secondary);
}

.fluent-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 13px;
  outline: none;
}

.fluent-input:focus {
  border-color: var(--fluent-accent);
}

.prompt-textarea {
  height: auto;
  min-height: 88px;
  padding: 8px 10px;
  resize: vertical;
  line-height: 1.5;
  font-family: inherit;
}

.form-error {
  font-size: 12px;
  color: var(--md-error);
  line-height: 1.4;
}

.danger-header {
  background-color: rgba(211, 47, 47, 0.08);
}

.danger-header .title-icon {
  color: var(--md-error);
}

.fluent-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  color: var(--md-text-primary);
}

.danger-check {
  color: #d32f2f;
  font-weight: 500;
}

.confirm-prompt-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--md-text-primary);
}

.dialog-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--fluent-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  background-color: var(--fluent-bg-subtle);
}

.fluent-btn-secondary,
.fluent-btn-primary,
.fluent-btn-danger {
  height: 30px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.fluent-btn-secondary {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-primary);
}

.fluent-btn-secondary:hover {
  background-color: var(--fluent-bg-hover);
}

.fluent-btn-primary {
  background-color: var(--fluent-accent);
  border: 1px solid transparent;
  color: #ffffff;
}

.fluent-btn-primary:hover:not(:disabled) {
  background-color: var(--fluent-accent-hover);
}

.fluent-btn-danger {
  background-color: #d32f2f;
  border: 1px solid transparent;
  color: #ffffff;
}

.fluent-btn-danger:hover:not(:disabled) {
  background-color: #b71c1c;
}

.fluent-btn-primary:disabled,
.fluent-btn-secondary:disabled,
.fluent-btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 统计弹窗特定样式 */
.stats-modal {
  max-width: 500px;
}

.stats-body {
  gap: 12px;
}

.stats-card {
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 10px 14px;
  background-color: var(--fluent-bg-subtle);
}

.card-caption {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--md-text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-k {
  color: var(--md-text-secondary);
}

.stat-v {
  font-weight: 600;
  color: var(--md-text-primary);
}

/* 关于弹窗特定样式 */
.about-body {
  align-items: center;
  text-align: center;
  padding: 24px 20px;
  gap: 6px;
}

.about-big-logo {
  margin-bottom: 8px;
}

.about-app-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--md-text-primary);
}

.about-subtitle {
  font-size: 12px;
  color: var(--md-text-secondary);
  margin-bottom: 12px;
}

.about-specs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  background-color: var(--fluent-bg-subtle);
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  color: var(--md-text-primary);
}

.spec-badge-box {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--fluent-border-subtle);
}

.spec-badge {
  font-size: 11px;
  font-weight: 600;
  color: #2e7d32;
}

/* 全局 Toast */
.fluent-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  border: 1px solid var(--fluent-border-divider);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  border-radius: 20px;
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  z-index: 100000;
  max-width: min(92vw, 560px);
}

.toast-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fluent-toast.toast-error {
  border-color: rgba(211, 47, 47, 0.5);
}

.fluent-toast.toast-success {
  border-color: rgba(46, 125, 50, 0.45);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
