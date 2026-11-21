<template>
  <div
    class="md-dialog-overlay"
    :class="{ embedded: props.embedded }"
    v-if="props.embedded || state.addDialogOpen"
    @click.self="!props.embedded && (state.addDialogOpen = false)"
  >
    <div class="md-dialog add-dialog" :class="{ 'embedded-card': props.embedded }">
      <!-- 弹窗模式头部 -->
      <div class="dialog-header" v-if="!props.embedded">
        <div class="header-title-row">
          <FluentIcon name="add_circle_outline" class="header-icon" />
          <h2 class="md-dialog-title">{{ t('addDialog.title') }}</h2>
        </div>
        <button class="dialog-close-btn" @click="state.addDialogOpen = false" :title="t('common.close')">
          <FluentIcon name="close" />
        </button>
      </div>

      <div class="md-dialog-content">
        <!-- 下载源区块 -->
        <div class="fluent-form-section">
          <!-- 1. 链接与磁力链 -->
          <div class="section-title-row">
            <div class="section-left">
              <FluentIcon name="link" class="section-icon" />
              <label class="section-title">{{ t('addDialog.magnetOrUrl') }}</label>
            </div>
            <span class="section-badge" v-if="parsedUrls.length > 0">
              {{ t('addDialog.linksDetected', { count: parsedUrls.length }) }}
            </span>
          </div>

          <div class="form-group">
            <textarea
              class="fluent-textarea multi-link-textarea"
              rows="3"
              :placeholder="t('addDialog.magnetPlaceholderMulti')"
              v-model="magnetUrl"
            ></textarea>
          </div>

          <!-- 分割线 -->
          <div class="or-divider">
            <span>{{ t('addDialog.or') }}</span>
          </div>

          <!-- 2. 本地种子文件 -->
          <div class="section-title-row">
            <div class="section-left">
              <FluentIcon name="folder_zip" class="section-icon" />
              <label class="section-title">{{ t('addDialog.torrentFile') }}</label>
            </div>
            <div class="section-actions-row">
              <span class="section-badge" v-if="selectedFiles.length > 0">
                {{ t('addDialog.filesSelected', { count: selectedFiles.length }) }}
              </span>
              <button
                type="button"
                class="clear-files-btn"
                v-if="selectedFiles.length > 0"
                @click.stop="clearAllFiles"
              >
                {{ t('addDialog.clearAll') }}
              </button>
            </div>
          </div>

          <div
            class="file-drop-zone"
            :class="{ active: isDragging, 'has-file': selectedFiles.length > 0 }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
          >
            <input
              type="file"
              ref="fileInputRef"
              style="display: none;"
              accept=".torrent"
              multiple
              @change="handleFileChange"
            />
            <FluentIcon :name="selectedFiles.length > 0 ? 'check_circle' : 'cloud_upload'" class="upload-icon" />
            <span class="upload-tip">
              {{ t('addDialog.dragTip') }}
            </span>
          </div>

          <!-- 已选种子文件列表 -->
          <div class="selected-files-list" v-if="selectedFiles.length > 0">
            <div class="file-chip" v-for="file in selectedFiles" :key="file.id">
              <FluentIcon name="description" class="file-chip-icon" />
              <span class="file-chip-name" :title="file.name">{{ file.name }}</span>
              <span class="file-chip-size">{{ formatBytes(file.size) }}</span>
              <button
                type="button"
                class="file-chip-remove"
                @click.stop="removeFile(file.id)"
                :title="t('common.delete')"
              >
                <FluentIcon name="close" />
              </button>
            </div>
          </div>
        </div>

        <!-- 保存选项区块 -->
        <div class="fluent-form-section options-section">
          <div class="section-title-row">
            <div class="section-left">
              <FluentIcon name="folder_open" class="section-icon" />
              <label class="section-title">{{ t('addDialog.downloadDir') }}</label>
            </div>
          </div>

          <div class="form-group">
            <input
              type="text"
              class="fluent-input"
              v-model="downloadDir"
              :placeholder="state.session?.['download-dir'] || '/media/AiDisk_a1/Downloads'"
            />
            <div class="dir-free-space" v-if="freeSpaceBytes !== null">
              <FluentIcon name="hard_drive" style="font-size: 13px;" />
              <span>{{ t('addDialog.freeSpace', { size: formatBytes(freeSpaceBytes) }) }}</span>
            </div>
          </div>

          <label class="checkbox-label" style="margin-top: 10px;">
            <input type="checkbox" v-model="startNow" />
            <span>{{ t('addDialog.startNow') }}</span>
          </label>
        </div>
      </div>

      <div class="md-dialog-actions" :class="{ 'embedded-actions': props.embedded }">
        <button
          class="md-btn md-btn-flat"
          @click="props.embedded ? emit('done') : (state.addDialogOpen = false)"
          :disabled="isSubmitting"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          class="md-btn md-btn-raised primary-submit-btn"
          :disabled="!canSubmit || isSubmitting"
          @click="submit"
        >
          <FluentIcon name="sync" class="spin-icon" v-if="isSubmitting" />
          <FluentIcon name="add" v-else />
          <span>{{ totalCount > 1 ? t('addDialog.submitBatch', { count: totalCount }) : t('addDialog.submit') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { state, fetchTorrents, showToast, describeError, formatBytes } from '../../stores/transmission';
import { useEscapeKey } from '../../composables/useEscapeKey';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';
import FluentIcon from '../common/FluentIcon.vue';

interface SelectedTorrentFile {
  id: string;
  name: string;
  size: number;
  base64: string;
}

const props = defineProps<{ embedded?: boolean }>();
const emit = defineEmits<{ (e: 'done'): void }>();

const magnetUrl = ref('');
const downloadDir = ref(state.session?.['download-dir'] || '');
const freeSpaceBytes = ref<number | null>(null);
const startNow = ref(true);
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<SelectedTorrentFile[]>([]);
const isSubmitting = ref(false);

const parsedUrls = computed(() => {
  return magnetUrl.value
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('#'));
});

const totalCount = computed(() => parsedUrls.value.length + selectedFiles.value.length);
const canSubmit = computed(() => totalCount.value > 0);

async function updateFreeSpace(path?: string) {
  const target = (path || downloadDir.value || state.session?.['download-dir'] || '').trim();
  if (!target) {
    freeSpaceBytes.value = null;
    return;
  }
  try {
    const res = await rpc.freeSpace(target);
    freeSpaceBytes.value = res['size-bytes'] ?? null;
  } catch {
    freeSpaceBytes.value = null;
  }
}

watch(downloadDir, (val) => {
  updateFreeSpace(val);
});

watch(() => state.session?.['download-dir'], (val) => {
  if (!downloadDir.value && val) {
    downloadDir.value = val;
    updateFreeSpace(val);
  }
});

onMounted(() => {
  if (!downloadDir.value && state.session?.['download-dir']) {
    downloadDir.value = state.session['download-dir'];
  }
  updateFreeSpace(downloadDir.value);
});

useEscapeKey(() => {
  if (state.addDialogOpen && !props.embedded) state.addDialogOpen = false;
});

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processFiles(Array.from(files));
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFiles(Array.from(target.files));
  }
  if (target) target.value = '';
}

function processFiles(files: File[]) {
  const torrentFiles = files.filter((f) => f.name.toLowerCase().endsWith('.torrent'));
  if (torrentFiles.length === 0) return;

  for (const file of torrentFiles) {
    if (selectedFiles.value.some((f) => f.name === file.name && f.size === file.size)) continue;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      if (base64) {
        selectedFiles.value.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          base64,
        });
      }
    };
    reader.readAsDataURL(file);
  }
}

function removeFile(id: string) {
  selectedFiles.value = selectedFiles.value.filter((f) => f.id !== id);
}

function clearAllFiles() {
  selectedFiles.value = [];
}

async function submit() {
  if (!canSubmit.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const baseOpts: any = {
      paused: !startNow.value,
    };
    if (downloadDir.value.trim()) {
      baseOpts.downloadDir = downloadDir.value.trim();
    }

    const tasks: Promise<any>[] = [];

    for (const url of parsedUrls.value) {
      tasks.push(rpc.addTorrent({ ...baseOpts, filename: url }));
    }

    for (const file of selectedFiles.value) {
      tasks.push(rpc.addTorrent({ ...baseOpts, metainfo: file.base64 }));
    }

    const results = await Promise.allSettled(tasks);
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      magnetUrl.value = '';
      selectedFiles.value = [];
      fetchTorrents();
      if (props.embedded) emit('done');
      else state.addDialogOpen = false;

      if (failCount === 0) {
        showToast(t('addDialog.batchSuccess', { count: successCount }), 'success');
      } else {
        showToast(t('addDialog.batchPartial', { success: successCount, failed: failCount }), 'info');
      }
    } else {
      const firstError = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      const errMsg = firstError?.reason ? describeError(firstError.reason) : '';
      showToast(t('addDialog.failed', { error: errMsg }), 'error');
    }
  } catch (err: any) {
    showToast(t('addDialog.failed', { error: describeError(err) }), 'error');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.add-dialog {
  width: 520px;
  max-width: 95vw;
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

.dialog-close-btn {
  background: transparent;
  border: none;
  border-radius: var(--fluent-radius);
  color: var(--md-text-secondary);
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.dialog-close-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.add-dialog .md-dialog-title {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.fluent-form-section {
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  font-size: 15px;
  color: var(--fluent-accent);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.section-badge {
  font-size: 10.5px;
  color: var(--fluent-accent);
  background: rgba(0, 120, 212, 0.1);
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 500;
}

.section-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-files-btn {
  border: none;
  background: transparent;
  color: var(--md-text-secondary);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

.clear-files-btn:hover {
  color: var(--md-error);
  text-decoration: underline;
}

.form-group {
  margin-bottom: 0;
}

.fluent-input,
.fluent-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}

.fluent-input:focus,
.fluent-textarea:focus {
  background-color: var(--fluent-bg-canvas);
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.multi-link-textarea {
  resize: vertical;
  min-height: 64px;
  line-height: 1.4;
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.or-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 12px 0 10px;
  color: var(--md-text-disabled);
  font-size: 11px;
}

.or-divider::before,
.or-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px dashed var(--fluent-border-divider);
}

.or-divider span {
  padding: 0 10px;
}

.file-drop-zone {
  border: 1px dashed var(--fluent-border-divider);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background-color: var(--fluent-bg-subtle);
}

.file-drop-zone:hover,
.file-drop-zone.active {
  border-color: var(--fluent-accent);
  background-color: var(--fluent-bg-hover);
}

.file-drop-zone.has-file {
  border-color: var(--fluent-accent);
  background-color: rgba(0, 120, 212, 0.04);
}

.upload-icon {
  font-size: 26px;
  color: var(--fluent-accent);
}

.upload-tip {
  font-size: 12px;
  color: var(--md-text-secondary);
}

.selected-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  max-height: 120px;
  overflow-y: auto;
  padding: 2px 0;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  font-size: 11px;
  color: var(--md-text-primary);
  max-width: 100%;
}

.file-chip-icon {
  font-size: 13px;
  color: var(--fluent-accent);
  flex-shrink: 0;
}

.file-chip-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-chip-size {
  font-size: 10px;
  color: var(--md-text-secondary);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.file-chip-remove {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  padding: 0;
  display: flex;
  align-items: center;
  border-radius: 2px;
}

.file-chip-remove:hover {
  color: var(--md-error);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  accent-color: var(--fluent-accent);
  cursor: pointer;
}

.dir-free-space {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.dir-free-space span {
  font-family: var(--font-mono);
}

.primary-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 嵌入 Backstage 时的现代优雅样式 */
.md-dialog-overlay.embedded {
  position: static;
  display: block;
  padding: 0;
  background: transparent;
  overflow: visible;
}

.add-dialog.embedded-card {
  width: 100%;
  max-width: 680px;
  margin: 0;
  border: none;
  box-shadow: none;
  border-radius: 0;
  background: transparent;
  animation: none !important;
  transform: none !important;
}

.md-dialog-overlay.embedded .md-dialog-content {
  padding: 0;
  max-height: none;
  overflow: visible;
}

.embedded-actions {
  background: transparent;
  border-top: none;
  padding: 10px 0 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 600px) {
  .add-dialog {
    width: calc(100vw - 16px);
    max-height: 92vh;
    margin: 8px;
  }

  .dialog-header {
    padding: 10px 14px;
  }
}
</style>
