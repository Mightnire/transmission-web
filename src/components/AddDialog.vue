<template>
  <div class="md-dialog-overlay" v-if="state.addDialogOpen" @click.self="state.addDialogOpen = false">
    <div class="md-dialog add-dialog">
      <div class="dialog-header">
        <div class="header-title-row">
          <FluentIcon name="add_circle_outline" class="header-icon" />
          <h2 class="md-dialog-title">{{ t('addDialog.title') }}</h2>
        </div>
        <button class="dialog-close-btn" @click="state.addDialogOpen = false" :title="t('common.close')">
          <FluentIcon name="close" />
        </button>
      </div>

      <div class="md-dialog-content">
        <!-- 选项一：磁力链或 URL -->
        <div class="form-group">
          <label class="form-label">{{ t('addDialog.magnetOrUrl') }}</label>
          <textarea
            class="fluent-textarea"
            rows="3"
            :placeholder="t('addDialog.magnetPlaceholder')"
            v-model="magnetUrl"
          ></textarea>
        </div>

        <div class="or-divider">{{ t('addDialog.or') }}</div>

        <!-- 选项二：上传本地种子文件 -->
        <div class="form-group">
          <label class="form-label">{{ t('addDialog.torrentFile') }}</label>
          <div
            class="file-drop-zone"
            :class="{ active: isDragging, 'has-file': !!torrentBase64 }"
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
              @change="handleFileChange"
            />
            <FluentIcon :name="torrentBase64 ? 'check_circle' : 'cloud_upload'" class="upload-icon" />
            <span class="upload-tip">
              {{ selectedFileName || t('addDialog.dragTip') }}
            </span>
          </div>
        </div>

        <!-- 保存目录 -->
        <div class="form-group" style="margin-top: 14px;">
          <label class="form-label">{{ t('addDialog.downloadDir') }}</label>
          <input
            type="text"
            class="fluent-input"
            v-model="downloadDir"
            :placeholder="state.session?.['download-dir'] || '/media/AiDisk_a1/Downloads'"
          />
        </div>

        <!-- 选项：立即开始 -->
        <label class="checkbox-label" style="margin-top: 10px;">
          <input type="checkbox" v-model="startNow" />
          <span>{{ t('addDialog.startNow') }}</span>
        </label>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="state.addDialogOpen = false">
          {{ t('common.cancel') }}
        </button>
        <button class="md-btn md-btn-raised" :disabled="!canSubmit" @click="submit">
          {{ t('addDialog.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { state, fetchTorrents } from '../stores/transmission';
import { t } from '../locales';
import { rpc } from '../api/rpc';

const magnetUrl = ref('');
const downloadDir = ref(state.session?.['download-dir'] || '');
const startNow = ref(true);
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref('');
const torrentBase64 = ref('');

const canSubmit = computed(() => {
  return !!magnetUrl.value.trim() || !!torrentBase64.value;
});

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
}

function processFile(file: File) {
  selectedFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result as string;
    // 取 Base64 内容
    const base64 = result.split(',')[1];
    torrentBase64.value = base64;
  };
  reader.readAsDataURL(file);
}

async function submit() {
  try {
    const opts: any = {
      paused: !startNow.value,
    };
    if (downloadDir.value.trim()) {
      opts.downloadDir = downloadDir.value.trim();
    }

    if (torrentBase64.value) {
      opts.metainfo = torrentBase64.value;
    } else if (magnetUrl.value.trim()) {
      opts.filename = magnetUrl.value.trim();
    }

    await rpc.addTorrent(opts);
    state.addDialogOpen = false;
    magnetUrl.value = '';
    torrentBase64.value = '';
    selectedFileName.value = '';
    fetchTorrents();
  } catch (err: any) {
    alert(t('addDialog.failed', { error: err.message || err }));
  }
}
</script>

<style scoped>
.add-dialog {
  width: 500px;
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

.dialog-close-btn .material-icons {
  font-size: 16px;
}

.add-dialog .md-dialog-title {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
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

.fluent-input,
.fluent-textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fluent-input:focus,
.fluent-textarea:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.or-divider {
  text-align: center;
  position: relative;
  margin: 10px 0;
  font-size: 11px;
  color: var(--md-text-disabled);
}

.or-divider::before,
.or-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 44%;
  height: 1px;
  background-color: var(--fluent-border-subtle);
}

.or-divider::before {
  left: 0;
}

.or-divider::after {
  right: 0;
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
  border-color: var(--md-success);
  background-color: rgba(76, 175, 80, 0.05);
}

.upload-icon {
  font-size: 28px;
  color: var(--fluent-accent);
}

.upload-tip {
  font-size: 12px;
  color: var(--md-text-secondary);
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

@media (max-width: 600px) {
  .add-dialog {
    width: calc(100vw - 16px);
    max-height: 92vh;
    margin: 8px;
  }

  .dialog-header {
    padding: 10px 14px;
  }

  .md-dialog-content {
    padding: 0 14px 14px;
    max-height: calc(92vh - 110px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
