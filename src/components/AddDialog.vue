<template>
  <div class="md-dialog-overlay" v-if="state.addDialogOpen" @click.self="state.addDialogOpen = false">
    <div class="md-dialog">
      <h2 class="md-dialog-title">{{ t('addDialog.title') }}</h2>

      <div class="md-dialog-content">
        <!-- 选项一：磁力链或 URL -->
        <div class="form-group">
          <label class="form-label">{{ t('addDialog.magnetOrUrl') }}</label>
          <textarea
            class="md-textarea"
            rows="3"
            :placeholder="t('addDialog.magnetPlaceholder')"
            v-model="magnetUrl"
          ></textarea>
        </div>

        <div class="or-divider">或</div>

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
            <span class="material-icons upload-icon">
              {{ torrentBase64 ? 'check_circle' : 'cloud_upload' }}
            </span>
            <span class="upload-tip">
              {{ selectedFileName || t('addDialog.dragTip') }}
            </span>
          </div>
        </div>

        <!-- 保存目录 -->
        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">{{ t('addDialog.downloadDir') }}</label>
          <input
            type="text"
            class="md-input"
            v-model="downloadDir"
            :placeholder="state.session?.['download-dir'] || '/media/AiDisk_a1/Downloads'"
          />
        </div>

        <!-- 选项：立即开始 -->
        <label class="checkbox-label" style="margin-top: 12px;">
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
    alert('添加任务失败: ' + (err.message || err));
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-text-secondary);
  margin-bottom: 6px;
}

.md-input,
.md-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--md-divider);
  border-radius: 2px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.md-input:focus,
.md-textarea:focus {
  border-color: var(--md-primary);
}

.or-divider {
  text-align: center;
  position: relative;
  margin: 12px 0;
  font-size: 12px;
  color: var(--md-text-secondary);
}

.or-divider::before,
.or-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 42%;
  height: 1px;
  background-color: var(--md-divider);
}

.or-divider::before {
  left: 0;
}

.or-divider::after {
  right: 0;
}

.file-drop-zone {
  border: 2px dashed var(--md-divider);
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.file-drop-zone:hover,
.file-drop-zone.active {
  border-color: var(--md-primary);
  background-color: rgba(63, 81, 181, 0.04);
}

.file-drop-zone.has-file {
  border-color: var(--md-success);
  background-color: rgba(76, 175, 80, 0.04);
}

.upload-icon {
  font-size: 36px;
  color: var(--md-primary);
}

.upload-tip {
  font-size: 13px;
  color: var(--md-text-secondary);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
