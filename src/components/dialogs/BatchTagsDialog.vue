<template>
  <div class="fluent-dialog-backdrop" v-if="state.batchTagsDialogOpen" @click.self="close">
    <div class="fluent-dialog batch-tags-dialog" role="dialog" aria-modal="true">
      <!-- 弹窗顶栏 -->
      <div class="dialog-header">
        <div class="header-title">
          <FluentIcon name="local_offer" class="title-icon" />
          <span>{{ t('batchTags.title') }}</span>
        </div>
        <button class="fluent-btn-icon close-btn" @click="close" :title="t('common.cancel')">
          <FluentIcon name="close" />
        </button>
      </div>

      <!-- 弹窗主体内容 -->
      <div class="dialog-body">
        <!-- 任务选中摘要提示 -->
        <div class="selection-banner">
          <FluentIcon name="info" class="banner-icon" />
          <span>{{ t('batchTags.selectedCount', { count: targetIds.length }) }}</span>
        </div>

        <!-- 模式切换单选组 -->
        <div class="form-section">
          <label class="section-label">{{ t('batchTags.modeLabel') }}</label>
          <div class="mode-radio-group">
            <label class="fluent-radio-label">
              <input type="radio" value="append" v-model="mode" />
              <span>{{ t('batchTags.modeAppend') }}</span>
            </label>
            <label class="fluent-radio-label">
              <input type="radio" value="replace" v-model="mode" />
              <span>{{ t('batchTags.modeReplace') }}</span>
            </label>
            <label class="fluent-radio-label">
              <input type="radio" value="clear" v-model="mode" />
              <span>{{ t('batchTags.modeClear') }}</span>
            </label>
          </div>
        </div>

        <template v-if="mode !== 'clear'">
          <!-- 1. 所选任务现有标签 (可点 × 标记移除，实现合并追加时的删除能力) -->
          <div class="form-section" v-if="selectedTasksTags.length > 0 && mode !== 'replace'">
            <label class="section-label">
              <span>{{ t('batchTags.currentSelectedTags') }}</span>
            </label>
            <div class="tags-chips-container selected-existing-pool">
              <span
                v-for="item in selectedTasksTags"
                :key="item.tag"
                class="tag-chip"
                :class="{
                  'tag-chip-to-remove': tagsToRemove.includes(item.tag),
                  'tag-chip-current': !tagsToRemove.includes(item.tag)
                }"
              >
                <span class="chip-tag-name">{{ item.tag }}</span>
                <span class="chip-count-badge" v-if="targetIds.length > 1">({{ item.count }})</span>
                <button
                  type="button"
                  class="chip-remove-btn"
                  @click="toggleTagRemoval(item.tag)"
                  :title="tagsToRemove.includes(item.tag) ? t('batchTags.undoRemove') : t('batchTags.markRemove')"
                >
                  <FluentIcon :name="tagsToRemove.includes(item.tag) ? 'undo' : 'close'" size="12" />
                </button>
              </span>
            </div>
          </div>

          <!-- 2. 当前待应用的标签 Tags 预览池 -->
          <div class="form-section">
            <label class="section-label">{{ t('batchTags.activeTags') }}</label>
            <div class="tags-chips-container">
              <span
                v-for="tag in activeTags"
                :key="tag"
                class="tag-chip active-chip"
              >
                {{ tag }}
                <button class="chip-remove-btn" @click="removeTag(tag)" :title="t('common.delete')">
                  <FluentIcon name="close" size="12" />
                </button>
              </span>
              <span v-if="activeTags.length === 0" class="empty-hint">
                {{ t('batchTags.noActiveTags') }}
              </span>
            </div>
          </div>

          <!-- 3. 新增自定义标签输入框 -->
          <div class="form-section">
            <label class="section-label">{{ t('batchTags.addCustomTag') }}</label>
            <div class="tag-input-row">
              <input
                ref="newTagInputRef"
                type="text"
                v-model="newTagInput"
                class="fluent-input"
                :placeholder="t('batchTags.inputPlaceholder')"
                @keyup.enter="addCustomTag"
              />
              <button class="fluent-btn-secondary add-tag-btn" @click="addCustomTag" :disabled="!newTagInput.trim()">
                <FluentIcon name="add" />
                <span>{{ t('batchTags.add') }}</span>
              </button>
            </div>
          </div>

          <!-- 4. 现有所有已用标签库 (快捷点击点选) -->
          <div class="form-section" v-if="existingTags.length > 0">
            <label class="section-label">{{ t('batchTags.existingTags') }}</label>
            <div class="tags-chips-container existing-pool">
              <button
                v-for="tag in existingTags"
                :key="tag"
                class="tag-chip selectable-chip"
                :class="{ selected: isTagSelectedInPool(tag) }"
                @click="onPoolTagClick(tag)"
              >
                <span>{{ tag }}</span>
                <FluentIcon :name="isTagSelectedInPool(tag) ? 'check' : 'add'" size="12" class="chip-icon" />
              </button>
            </div>
          </div>
        </template>

        <div v-else class="clear-warning-box">
          <FluentIcon name="warning" class="warning-icon text-warning" />
          <span>{{ t('batchTags.clearWarning') }}</span>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="dialog-footer">
        <button class="fluent-btn-secondary" @click="close">
          {{ t('common.cancel') }}
        </button>
        <button
          class="fluent-btn-primary"
          @click="applyTags"
          :disabled="isSubmitDisabled"
        >
          {{ isSubmitting ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { state, applyTorrentLabels } from '../../stores/transmission';
import { t } from '../../locales';

const mode = ref<'append' | 'replace' | 'clear'>('append');
const activeTags = ref<string[]>([]);
const tagsToRemove = ref<string[]>([]);
const newTagInput = ref('');
const newTagInputRef = ref<HTMLInputElement | null>(null);
const isSubmitting = ref(false);

const targetIds = computed(() => {
  return state.selectedIds.length > 0
    ? state.selectedIds
    : state.selectedId !== null
    ? [state.selectedId]
    : [];
});

// 从当前所有选中的种子中聚合各自包含的标签及频次
const selectedTasksTags = computed(() => {
  const map = new Map<string, number>();
  for (const id of targetIds.value) {
    const torrent = state.torrents.find((t) => t.id === id);
    for (const l of torrent?.labels || []) {
      const tr = l.trim();
      if (tr) map.set(tr, (map.get(tr) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      isCommonToAll: count === targetIds.value.length,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
});

// 从当前全局所有种子中聚合所有已存在标签
const existingTags = computed(() => {
  const set = new Set<string>();
  for (const item of state.torrents) {
    if (item.labels && item.labels.length > 0) {
      for (const l of item.labels) {
        const tr = l.trim();
        if (tr) set.add(tr);
      }
    }
  }
  return Array.from(set).sort();
});

const isSubmitDisabled = computed(() => {
  if (targetIds.value.length === 0 || isSubmitting.value) return true;
  if (mode.value === 'clear' || mode.value === 'replace') return false;
  // append 模式：只要有添加或有移除即可提交
  return activeTags.value.length === 0 && tagsToRemove.value.length === 0;
});

function toggleTagRemoval(tag: string) {
  if (tagsToRemove.value.includes(tag)) {
    tagsToRemove.value = tagsToRemove.value.filter((t) => t !== tag);
  } else {
    tagsToRemove.value.push(tag);
  }
}

function isTagSelectedInPool(tag: string): boolean {
  return activeTags.value.includes(tag);
}

function onPoolTagClick(tag: string) {
  toggleTag(tag);
}

// 当弹窗打开时，重置状态
watch(
  () => state.batchTagsDialogOpen,
  (open) => {
    if (open) {
      mode.value = 'append';
      newTagInput.value = '';
      tagsToRemove.value = [];
      isSubmitting.value = false;

      activeTags.value = [];

      nextTick(() => newTagInputRef.value?.focus());
    }
  }
);

function addCustomTag() {
  const tag = newTagInput.value.trim();
  if (!tag) return;
  if (!activeTags.value.includes(tag)) {
    activeTags.value.push(tag);
  }
  // 如果之前被标记了待移除，则取消待移除
  tagsToRemove.value = tagsToRemove.value.filter((t) => t !== tag);
  newTagInput.value = '';
}

function removeTag(tag: string) {
  activeTags.value = activeTags.value.filter((t) => t !== tag);
}

function toggleTag(tag: string) {
  if (activeTags.value.includes(tag)) {
    removeTag(tag);
  } else {
    activeTags.value.push(tag);
    tagsToRemove.value = tagsToRemove.value.filter((t) => t !== tag);
  }
}

function close() {
  state.batchTagsDialogOpen = false;
}

async function applyTags() {
  if (targetIds.value.length === 0) return;
  isSubmitting.value = true;
  try {
    // 为每个任务计算应用后的最终标签集合
    const updates = targetIds.value.map((id) => {
      const torrent = state.torrents.find((item) => item.id === id);
      let finalLabels: string[] = [];

      if (mode.value === 'clear') {
        finalLabels = [];
      } else if (mode.value === 'replace') {
        finalLabels = [...activeTags.value];
      } else {
        // 合并修改 (append)：以任务原有标签为基础，排除 tagsToRemove，追加 activeTags
        const set = new Set<string>(torrent?.labels || []);
        for (const rTag of tagsToRemove.value) {
          set.delete(rTag);
        }
        for (const aTag of activeTags.value) {
          set.add(aTag);
        }
        finalLabels = Array.from(set);
      }

      return { id, labels: finalLabels };
    });

    const ok = await applyTorrentLabels(updates);
    if (ok) close();
  } finally {
    isSubmitting.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && state.batchTagsDialogOpen) {
    event.preventDefault();
    close();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown, true));
onUnmounted(() => window.removeEventListener('keydown', onKeydown, true));
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

.batch-tags-dialog {
  width: 100%;
  max-width: 480px;
  background-color: var(--fluent-bg-canvas);
  border-radius: 8px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
  border: 1px solid var(--fluent-border-divider);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dialogPop 0.18s cubic-bezier(0.1, 0.9, 0.2, 1);
}

@keyframes dialogPop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  height: 48px;
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
  font-size: 15px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.title-icon {
  font-size: 18px;
  color: var(--fluent-accent);
}

.close-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
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
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.selection-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 120, 212, 0.08);
  border-radius: 6px;
  font-size: 13px;
  color: var(--fluent-accent);
  font-weight: 500;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-secondary);
}

.mode-radio-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--fluent-bg-subtle);
  padding: 8px 24px;
  border-radius: 6px;
}

.fluent-radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.tags-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 36px;
  padding: 8px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  background-color: var(--fluent-bg-subtle);
  align-items: center;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  transition: all 0.15s ease;
}

.active-chip {
  background-color: var(--fluent-accent);
  color: #ffffff;
}

.chip-remove-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  opacity: 0.8;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
}

.chip-remove-btn:hover {
  opacity: 1;
}

.empty-hint {
  font-size: 12px;
  color: var(--md-text-disabled);
}

.selected-existing-pool {
  background-color: var(--fluent-bg-subtle);
  border: 1px dashed var(--fluent-border-divider);
}

.tag-chip-current {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--fluent-text-primary);
}

.tag-chip-current .chip-remove-btn {
  color: var(--fluent-text-secondary);
}

.tag-chip-current .chip-remove-btn:hover {
  color: var(--fluent-status-danger);
}

.tag-chip-to-remove {
  background-color: rgba(209, 52, 56, 0.12) !important;
  border: 1px solid rgba(209, 52, 56, 0.4) !important;
  color: var(--fluent-status-danger) !important;
}

.tag-chip-to-remove .chip-tag-name {
  text-decoration: line-through;
}

.tag-chip-to-remove .chip-remove-btn {
  color: var(--fluent-status-danger);
}

.chip-count-badge {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
}

.existing-pool {
  background-color: transparent;
  border: 1px dashed var(--fluent-border-subtle);
}

.selectable-chip {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  border: 1px solid var(--fluent-border-subtle);
  cursor: pointer;
}

.selectable-chip:hover {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-accent);
}

.selectable-chip.selected {
  background-color: rgba(0, 120, 212, 0.15);
  border-color: var(--fluent-accent);
  color: var(--fluent-accent);
  font-weight: 500;
}

.tag-input-row {
  display: flex;
  gap: 8px;
}

.fluent-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.fluent-input:focus {
  border-color: var(--fluent-accent);
}

.fluent-btn-secondary,
.fluent-btn-primary {
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-btn-secondary {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  border: 1px solid var(--fluent-border-subtle);
}

.fluent-btn-secondary:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
}

.fluent-btn-primary {
  background-color: var(--fluent-accent);
  color: #ffffff;
  border: 1px solid transparent;
}

.fluent-btn-primary:hover:not(:disabled) {
  background-color: var(--fluent-accent-hover);
}

.fluent-btn-primary:disabled,
.fluent-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-warning-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: rgba(255, 152, 0, 0.12);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: var(--md-text-primary);
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.dialog-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--fluent-border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  background-color: var(--fluent-bg-subtle);
}
</style>
