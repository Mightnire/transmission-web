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
            <div class="combobox-container" ref="dirDropdownRef">
              <div class="combobox-input-wrapper">
                <input
                  type="text"
                  class="fluent-input combobox-input"
                  v-model="downloadDir"
                  :placeholder="state.session?.['download-dir'] || '/media/AiDisk_a1/Downloads'"
                  @focus="openDropdown"
                  @click="openDropdown"
                  @keydown.esc="isDropdownOpen = false"
                />
                <button
                  type="button"
                  class="combobox-toggle-btn"
                  :class="{ active: isDropdownOpen }"
                  @click.stop="toggleDropdown"
                  :title="t('addDialog.selectPath')"
                  tabindex="-1"
                >
                  <FluentIcon name="expand_more" />
                </button>
              </div>

              <!-- 下拉建议浮层 -->
              <div
                class="combobox-dropdown"
                :class="{ 'placement-up': dropdownPlacement === 'up' }"
                :style="{ maxHeight: dropdownMaxHeight + 'px' }"
                v-if="isDropdownOpen && hasDropdownItems"
              >
                <!-- 最近使用 -->
                <div class="dropdown-group" v-if="filteredRecentDirs.length > 0">
                  <div class="dropdown-group-header">
                    <FluentIcon name="history" class="group-icon" />
                    <span>{{ t('addDialog.recentDirs') }}</span>
                  </div>
                  <div
                    class="dropdown-item"
                    v-for="item in filteredRecentDirs"
                    :key="'recent-' + item.path"
                    :class="{ selected: downloadDir === item.path }"
                    @click="selectDir(item.path)"
                  >
                    <div class="item-left">
                      <FluentIcon name="folder" class="item-icon" />
                      <div class="item-content">
                        <span class="item-alias" v-if="item.alias">{{ item.alias }}</span>
                        <span class="item-path" :class="{ muted: !!item.alias }">{{ item.path }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 现有任务保存路径 -->
                <div class="dropdown-group" v-if="filteredFolderGroups.length > 0">
                  <div class="dropdown-group-header">
                    <FluentIcon name="folder_copy" class="group-icon" />
                    <span>{{ t('addDialog.existingFolderGroups') }}</span>
                  </div>
                  <div
                    class="dropdown-item"
                    v-for="item in filteredFolderGroups"
                    :key="'group-' + item.path"
                    :class="{ selected: downloadDir === item.path }"
                    @click="selectDir(item.path)"
                  >
                    <div class="item-left">
                      <FluentIcon name="folder" class="item-icon" />
                      <div class="item-content">
                        <span class="item-alias" v-if="item.alias">{{ item.alias }}</span>
                        <span class="item-path" :class="{ muted: !!item.alias }">{{ item.path }}</span>
                      </div>
                    </div>
                    <span class="item-badge" v-if="item.count">{{ item.count }}</span>
                  </div>
                </div>

                <!-- 默认下载目录 -->
                <div class="dropdown-group" v-if="defaultOption">
                  <div class="dropdown-group-header">
                    <FluentIcon name="settings" class="group-icon" />
                    <span>{{ t('addDialog.defaultDir') }}</span>
                  </div>
                  <div
                    class="dropdown-item"
                    :class="{ selected: downloadDir === defaultOption.path }"
                    @click="selectDir(defaultOption.path)"
                  >
                    <div class="item-left">
                      <FluentIcon name="home" class="item-icon" />
                      <div class="item-content">
                        <span class="item-alias" v-if="defaultOption.alias">{{ defaultOption.alias }}</span>
                        <span class="item-path" :class="{ muted: !!defaultOption.alias }">{{ defaultOption.path }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { state, fetchTorrents, showToast, describeError, formatBytes, formatDisplayPath } from '../../stores/transmission';
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

const RECENT_DIRS_KEY = 'transmission_recent_download_dirs';

function loadRecentDirs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_DIRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const recentDirs = ref<string[]>(loadRecentDirs());

function saveRecentDir(path: string) {
  if (!path || !path.trim()) return;
  const trimmed = path.trim();
  try {
    const list = loadRecentDirs().filter((p) => p !== trimmed);
    list.unshift(trimmed);
    const capped = list.slice(0, 8);
    localStorage.setItem(RECENT_DIRS_KEY, JSON.stringify(capped));
    recentDirs.value = capped;
  } catch {}
}

const dirDropdownRef = ref<HTMLElement | null>(null);
const isDropdownOpen = ref(false);
const dropdownPlacement = ref<'down' | 'up'>('down');
const dropdownMaxHeight = ref<number>(220);

async function updateDropdownPosition() {
  await nextTick();
  if (!dirDropdownRef.value) return;
  const rect = dirDropdownRef.value.getBoundingClientRect();

  // 视口与弹窗/Backstage 容器双重感知：不仅看窗口，还要看最近的滚动容器边界
  const container = dirDropdownRef.value.closest('.md-dialog-content, .backstage-body') as HTMLElement | null;
  const containerRect = container ? container.getBoundingClientRect() : null;

  const limitBottom = containerRect ? Math.min(window.innerHeight, containerRect.bottom) : window.innerHeight;
  const limitTop = containerRect ? Math.max(0, containerRect.top) : 0;

  const spaceBelow = limitBottom - rect.bottom - 12;
  const spaceAbove = rect.top - limitTop - 12;

  // 下方空间不足 200px 且上方空间更充裕时，自适应向上展开；否则向下展开
  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
    dropdownPlacement.value = 'up';
    dropdownMaxHeight.value = Math.min(220, Math.max(90, Math.floor(spaceAbove)));
  } else {
    dropdownPlacement.value = 'down';
    dropdownMaxHeight.value = Math.min(220, Math.max(90, Math.floor(spaceBelow)));
  }
}

async function openDropdown() {
  isDropdownOpen.value = true;
  await updateDropdownPosition();
}

async function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
  if (isDropdownOpen.value) {
    await updateDropdownPosition();
  }
}

watch(isDropdownOpen, (open) => {
  if (open) {
    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition, { passive: true });
    window.addEventListener('scroll', updateDropdownPosition, { passive: true, capture: true });
  } else {
    window.removeEventListener('resize', updateDropdownPosition);
    window.removeEventListener('scroll', updateDropdownPosition, true);
  }
});

function onDocumentClick(e: MouseEvent) {
  if (dirDropdownRef.value && !dirDropdownRef.value.contains(e.target as Node)) {
    isDropdownOpen.value = false;
  }
}

function selectDir(path: string) {
  downloadDir.value = path;
  isDropdownOpen.value = false;
  updateFreeSpace(path);
}

const folderGroups = computed(() => {
  const map = new Map<string, number>();
  for (const t of state.torrents) {
    if (t.downloadDir) {
      map.set(t.downloadDir, (map.get(t.downloadDir) || 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([path, count]) => {
    const alias = formatDisplayPath(path);
    return {
      path,
      count,
      alias: alias !== path ? alias : undefined,
    };
  });
});

const filteredRecentDirs = computed(() => {
  const q = (downloadDir.value || '').trim().toLowerCase();
  return recentDirs.value
    .map((path) => {
      const alias = formatDisplayPath(path);
      return {
        path,
        alias: alias !== path ? alias : undefined,
      };
    })
    .filter((item) => {
      if (!q) return true;
      return (
        item.path.toLowerCase().includes(q) ||
        (item.alias && item.alias.toLowerCase().includes(q))
      );
    });
});

const filteredFolderGroups = computed(() => {
  const q = (downloadDir.value || '').trim().toLowerCase();
  const recentPaths = new Set(filteredRecentDirs.value.map((r) => r.path));
  return folderGroups.value
    .filter((item) => !recentPaths.has(item.path))
    .filter((item) => {
      if (!q) return true;
      return (
        item.path.toLowerCase().includes(q) ||
        (item.alias && item.alias.toLowerCase().includes(q))
      );
    });
});

const defaultOption = computed(() => {
  const def = state.session?.['download-dir'];
  if (!def) return null;
  const recentPaths = new Set(filteredRecentDirs.value.map((r) => r.path));
  const groupPaths = new Set(filteredFolderGroups.value.map((g) => g.path));
  if (recentPaths.has(def) || groupPaths.has(def)) return null;

  const q = (downloadDir.value || '').trim().toLowerCase();
  const alias = formatDisplayPath(def);
  if (q && !def.toLowerCase().includes(q) && (!alias || !alias.toLowerCase().includes(q))) {
    return null;
  }
  return {
    path: def,
    alias: alias !== def ? alias : undefined,
  };
});

const hasDropdownItems = computed(() => {
  return (
    filteredRecentDirs.value.length > 0 ||
    filteredFolderGroups.value.length > 0 ||
    !!defaultOption.value
  );
});

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
  document.addEventListener('mousedown', onDocumentClick);
  if (!downloadDir.value && state.session?.['download-dir']) {
    downloadDir.value = state.session['download-dir'];
  }
  updateFreeSpace(downloadDir.value);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentClick);
  window.removeEventListener('resize', updateDropdownPosition);
  window.removeEventListener('scroll', updateDropdownPosition, true);
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
    const targetDir = downloadDir.value.trim();
    if (targetDir) {
      baseOpts['download-dir'] = targetDir;
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
      if (targetDir) {
        saveRecentDir(targetDir);
      }
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

/* 路径选择 Combobox 样式 */
.combobox-container {
  position: relative;
  width: 100%;
}

.combobox-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.combobox-input {
  width: 100%;
  padding-right: 30px !important;
}

.combobox-toggle-btn {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  width: 28px;
  border: none;
  background: transparent;
  color: var(--md-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0 var(--fluent-radius) var(--fluent-radius) 0;
  transition: all 0.15s ease;
}

.combobox-toggle-btn:hover {
  background: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.combobox-toggle-btn.active {
  color: var(--fluent-accent);
  transform: rotate(180deg);
}

.combobox-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  overflow-y: auto;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  z-index: 1000;
  padding: 4px 0;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border-strong) transparent;
}

.combobox-dropdown::-webkit-scrollbar {
  width: 6px;
}

.combobox-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.combobox-dropdown::-webkit-scrollbar-thumb {
  background-color: var(--fluent-border-strong);
  border-radius: 3px;
}

.combobox-dropdown:not(.placement-up) {
  top: calc(100% + 4px);
}

.combobox-dropdown.placement-up {
  bottom: calc(100% + 4px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.18);
}

.dropdown-group {
  padding-bottom: 4px;
}

.dropdown-group:not(:last-child) {
  border-bottom: 1px solid var(--fluent-border-subtle);
  margin-bottom: 4px;
}

.dropdown-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 3px;
  font-size: 11px;
  font-weight: 600;
  color: var(--md-text-secondary);
}

.group-icon {
  font-size: 13px;
  color: var(--fluent-accent);
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.dropdown-item:hover {
  background: var(--fluent-bg-hover);
}

.dropdown-item.selected {
  background: var(--fluent-bg-subtle);
  font-weight: 500;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.item-icon {
  font-size: 15px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
}

.item-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.item-alias {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-path {
  font-size: 11px;
  color: var(--md-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-path.muted {
  font-size: 10px;
  color: var(--md-text-secondary);
}

.item-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--fluent-border-subtle);
  color: var(--md-text-secondary);
  flex-shrink: 0;
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
  overflow: visible !important;
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
  overflow: visible !important;
}

.md-dialog-overlay.embedded .md-dialog-content {
  padding: 0;
  max-height: none;
  overflow: visible !important;
}

.embedded-actions {
  background: transparent;
  border-top: none;
  padding: 10px 0 24px;
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
