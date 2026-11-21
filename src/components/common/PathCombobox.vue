<template>
  <div class="path-combobox-container" ref="containerRef">
    <div class="path-combobox-input-wrapper">
      <input
        ref="inputRef"
        type="text"
        class="fluent-input path-combobox-input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="openDropdown"
        @click.stop="openDropdown"
        @keydown.esc="closeDropdown"
        @keyup.enter="$emit('enter')"
      />
      <button
        type="button"
        class="path-combobox-toggle-btn"
        :class="{ active: isOpen }"
        :disabled="disabled"
        @click.stop="toggleDropdown"
        :title="t('addDialog.selectPath')"
        tabindex="-1"
      >
        <FluentIcon name="expand_more" />
      </button>
    </div>

    <!-- 下拉推荐浮层 -->
    <div
      class="path-combobox-dropdown"
      :class="{ 'placement-up': placement === 'up' }"
      :style="{ minWidth: minDropdownWidth || '360px', maxHeight: maxHeight + 'px' }"
      v-if="isOpen && filteredPaths.length > 0"
      @click.stop
    >
      <div class="dropdown-group-header">
        <FluentIcon name="folder_copy" class="group-icon" />
        <span>{{ t('addDialog.existingFolderGroups') }}</span>
      </div>
      <div
        class="dropdown-item"
        v-for="item in filteredPaths"
        :key="item.path"
        :class="{ selected: modelValue === item.path }"
        @click.stop="selectItem(item.path)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { state, formatDisplayPath } from '../../stores/transmission';
import { t } from '../../locales';
import FluentIcon from './FluentIcon.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    minDropdownWidth?: string;
  }>(),
  {
    placeholder: '',
    disabled: false,
    minDropdownWidth: '360px',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'select', val: string): void;
  (e: 'enter'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const placement = ref<'down' | 'up'>('down');
const maxHeight = ref(220);

function updatePlacement() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow < 220 && spaceAbove > spaceBelow) {
    placement.value = 'up';
    maxHeight.value = Math.max(120, Math.min(240, spaceAbove - 16));
  } else {
    placement.value = 'down';
    maxHeight.value = Math.max(120, Math.min(240, spaceBelow - 16));
  }
}

function openDropdown() {
  if (props.disabled) return;
  updatePlacement();
  isOpen.value = true;
}

function closeDropdown() {
  isOpen.value = false;
}

function toggleDropdown() {
  if (props.disabled) return;
  updatePlacement();
  isOpen.value = !isOpen.value;
}

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function selectItem(path: string) {
  emit('update:modelValue', path);
  emit('select', path);
  closeDropdown();
}

// 自动汇聚现有任务保存路径
const allFolderGroups = computed(() => {
  const map = new Map<string, number>();
  const def = state.session?.['download-dir'];
  if (def && typeof def === 'string') {
    map.set(def, 0);
  }
  for (const tor of state.torrents) {
    if (tor.downloadDir) {
      map.set(tor.downloadDir, (map.get(tor.downloadDir) || 0) + 1);
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

const filteredPaths = computed(() => {
  const q = (props.modelValue || '').trim().toLowerCase();
  if (!q) return allFolderGroups.value;
  return allFolderGroups.value.filter(
    (item) => item.path.toLowerCase().includes(q) || (item.alias && item.alias.toLowerCase().includes(q))
  );
});

function onDocumentClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>

<style scoped>
.path-combobox-container {
  position: relative;
  width: 100%;
}

.path-combobox-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.path-combobox-input {
  width: 100%;
  box-sizing: border-box;
  height: 28px;
  padding: 0 30px 0 8px !important;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  font-size: 12px;
  font-family: inherit;
  color: var(--fluent-text-primary);
  background-color: var(--fluent-bg-canvas);
  outline: none;
  transition: border-color 0.15s ease;
}

.path-combobox-input:focus {
  border-color: var(--fluent-accent);
}

.path-combobox-input:disabled {
  opacity: 0.5;
  background-color: var(--fluent-bg-subtle);
  cursor: not-allowed;
}

.path-combobox-toggle-btn {
  position: absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: calc(100% - 2px);
  border: none;
  background: transparent;
  color: var(--fluent-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0 var(--fluent-radius) var(--fluent-radius) 0;
  transition: all 0.15s ease;
}

.path-combobox-toggle-btn:hover:not(:disabled) {
  background: var(--fluent-bg-hover);
  color: var(--fluent-text-primary);
}

.path-combobox-toggle-btn.active {
  color: var(--fluent-accent);
  transform: translateY(-50%) rotate(180deg);
}

.path-combobox-toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.path-combobox-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  max-width: 480px;
  max-height: 220px;
  overflow-y: auto;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  z-index: 1050;
  padding: 4px 0;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--fluent-border-strong) transparent;
}

.path-combobox-dropdown.placement-up {
  top: auto;
  bottom: calc(100% + 4px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.18);
}

.path-combobox-dropdown::-webkit-scrollbar {
  width: 6px;
}

.path-combobox-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.path-combobox-dropdown::-webkit-scrollbar-thumb {
  background-color: var(--fluent-border-strong);
  border-radius: 3px;
}

.dropdown-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-text-secondary);
  border-bottom: 1px solid var(--fluent-border-subtle);
  margin-bottom: 2px;
}

.group-icon {
  font-size: 13px;
  color: var(--fluent-accent);
  margin-right: 6px;
}

@supports (gap: 6px) {
  .group-icon {
    margin-right: 0;
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.dropdown-item:hover {
  background-color: var(--fluent-bg-hover);
}

.dropdown-item.selected {
  background-color: var(--fluent-bg-subtle);
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
  color: var(--fluent-accent);
  flex-shrink: 0;
  margin-right: 8px;
}

@supports (gap: 8px) {
  .item-icon {
    margin-right: 0;
  }
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
  color: var(--fluent-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-path {
  font-size: 11px;
  color: var(--fluent-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-path.muted {
  font-size: 10px;
  color: var(--fluent-text-secondary);
}

.item-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--fluent-border-subtle);
  color: var(--fluent-text-secondary);
  flex-shrink: 0;
}
</style>
