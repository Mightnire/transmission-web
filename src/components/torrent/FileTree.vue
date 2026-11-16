<template>
  <div class="file-tree-container">
    <div class="file-tree-header">
      <span class="file-tree-summary">
        {{ t('fileTree.summary', {
          total: files.length,
          selected: selectedCount,
          selectedBytes: formatBytes(totalSelectedBytes),
          totalBytes: formatBytes(totalBytes)
        }) }}
      </span>

      <div class="file-tree-actions">
        <span class="file-tree-selection" v-if="selectedFileCount > 0">
          {{ t('fileTree.selectedFiles', { count: selectedFileCount }) }}
        </span>
        <label class="batch-priority" :title="t('fileTree.batchPriorityHint')">
          <span>{{ t('fileTree.batchPriority') }}</span>
          <select v-model.number="batchPriority" class="priority-select batch-priority-select" :class="priorityClass(batchPriority)">
            <option :value="1">{{ t('fileTree.priorityHigh') }}</option>
            <option :value="0">{{ t('fileTree.priorityNormal') }}</option>
            <option :value="-1">{{ t('fileTree.priorityLow') }}</option>
          </select>
        </label>
        <button
          class="batch-apply-btn"
          @click="applyBatchPriority"
          :disabled="selectedFileCount === 0"
          :title="t('fileTree.batchPriorityHint')"
        >
          {{ t('fileTree.applyPriority') }}
        </button>
      </div>
    </div>

    <!-- 树节点递归列表 -->
    <div class="file-nodes-list">
      <template v-for="node in treeRoot" :key="node.path">
        <div
          class="tree-row"
          :style="{ paddingLeft: `${node.depth * 20 + 16}px` }"
          :class="{
            'is-dir': node.isDir,
            'file-selected': isNodeSelected(node),
            'prio-high': !node.isDir && nodePriority(node) === 1,
            'prio-low': !node.isDir && nodePriority(node) === -1,
          }"
          @click="toggleNodeSelection(node, $event)"
          @contextmenu.prevent.stop="openNodeMenu($event, node)"
        >
          <!-- 当前层级的树形引导线 -->
          <span class="tree-guides" aria-hidden="true" v-if="node.depth > 0">
            <span
              v-for="(last, index) in node.ancestorLast"
              :key="`guide-${index}`"
              class="guide-col guide-ancestor"
              :class="{ 'guide-stop': last }"
            ></span>
            <span class="guide-col guide-current" :class="{ 'guide-stop': node.isLast }"></span>
          </span>

          <!-- 折叠展开图标 (目录专用) -->
          <FluentIcon :name="isCollapsed(node.path) ? 'chevron_right' : 'expand_more'" class="expand-icon" v-if="node.isDir" @click.stop="toggleCollapse(node.path)" />
          <span class="expand-placeholder" v-else></span>

          <!-- 勾选框（勾选 = 下载此文件） -->
          <input
            type="checkbox"
            class="tree-checkbox"
            :checked="isNodeWanted(node)"
            :title="t('fileTree.wantedHint')"
            @click.stop
            @change="onCheckChange(node, $event)"
          />

          <!-- 目录/文件图标 -->
          <FluentIcon :name="node.isDir ? (isCollapsed(node.path) ? 'folder' : 'folder_open') : 'insert_drive_file'" class="node-type-icon" />

          <!-- 名称 -->
          <span
            class="node-name"
            :class="{
              'name-prio-high': !node.isDir && nodePriority(node) === 1,
              'name-prio-low': !node.isDir && nodePriority(node) === -1,
            }"
            :title="node.name"
          >{{ node.name }}</span>

          <!-- 文件大小与进度条 -->
          <div class="node-meta">
            <span class="node-size">{{ formatBytes(node.size) }}</span>
            <div class="mini-progress-track">
              <div
                class="mini-progress-bar"
                :style="{ width: `${node.progress * 100}%` }"
              ></div>
            </div>
            <span class="node-pct">{{ (node.progress * 100).toFixed(0) }}%</span>

            <!-- 重命名按钮 -->
            <button class="rename-file-btn" @click.stop="renamePath(node)" :title="t('fileTree.renameTitle')">
              <FluentIcon name="edit" style="font-size: 14px;" />
            </button>

            <!-- 优先级调整 (仅文件) -->
            <select
              v-if="!node.isDir"
              class="priority-select"
              :class="priorityClass(nodePriority(node))"
              :value="fileStats[node.fileIndex!]?.priority ?? 0"
              @click.stop
              @change="changePriority(node.fileIndex!, $event)"
            >
              <option :value="1">{{ t('fileTree.priorityHigh') }}</option>
              <option :value="0">{{ t('fileTree.priorityNormal') }}</option>
              <option :value="-1">{{ t('fileTree.priorityLow') }}</option>
            </select>
          </div>
        </div>
      </template>
    </div>
  </div>

  <Teleport to="body">
    <div
      class="file-context-menu"
      v-if="contextMenu.open && contextNode"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <div class="context-menu-title" :title="contextNode.name">{{ contextNode.name }}</div>
      <button class="context-menu-item" @click="contextRename">
        <FluentIcon name="edit" />
        <span>{{ t('fileTree.menuRename') }}</span>
      </button>
      <button class="context-menu-item" @click="contextToggleWanted">
        <FluentIcon :name="isNodeWanted(contextNode) ? 'close' : 'check_circle'" />
        <span>{{ isNodeWanted(contextNode) ? t('fileTree.menuUnwanted') : t('fileTree.menuWanted') }}</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" @click="contextSetPriority(Priority.HIGH)">
        <FluentIcon name="arrow_upward" class="name-prio-high" />
        <span>{{ t('fileTree.menuHigh') }}</span>
      </button>
      <button class="context-menu-item" @click="contextSetPriority(Priority.NORMAL)">
        <FluentIcon name="remove" />
        <span>{{ t('fileTree.menuNormal') }}</span>
      </button>
      <button class="context-menu-item" @click="contextSetPriority(Priority.LOW)">
        <FluentIcon name="arrow_downward" class="name-prio-low" />
        <span>{{ t('fileTree.menuLow') }}</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" @click="contextCopyName">
        <FluentIcon name="content_copy" />
        <span>{{ t('fileTree.menuCopyName') }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { TorrentFile, TorrentFileStat, Priority } from '../../api/types';
import { state, fetchTorrents, formatBytes, openPrompt, showToast } from '../../stores/transmission';
import { t } from '../../locales';
import { rpc } from '../../api/rpc';

const props = defineProps<{
  torrentId: number;
  files: TorrentFile[];
  fileStats: TorrentFileStat[];
}>();

// 会话级内存缓存：仅在当前页面会话内记住折叠状态，绝不写入 LocalStorage，杜绝存储膨胀！
const sessionCollapsedCache = new Map<number, Set<string>>();

// 清理历史遗留在 LocalStorage 中的旧缓存键
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('tr_tree_collapsed_'))
    .forEach((k) => localStorage.removeItem(k));
} catch {}

const collapsedSet = ref<Set<string>>(
  sessionCollapsedCache.get(props.torrentId) || new Set()
);

const batchPriority = ref<Priority>(Priority.NORMAL);

// 独立的多选集合：用于批量操作，与“勾选=下载此文件”完全解耦
const selectedFiles = ref<Set<number>>(new Set());
const selectedFileCount = computed(() => selectedFiles.value.size);

const contextMenu = reactive({ open: false, x: 0, y: 0 });
const contextNode = ref<TreeNode | null>(null);

function nodeFileIndices(node: TreeNode): number[] {
  if (!node.isDir) return node.fileIndex !== undefined ? [node.fileIndex] : [];
  const prefix = node.path + '/';
  return props.files
    .map((file, index) => (file.name.startsWith(prefix) ? index : -1))
    .filter((index) => index >= 0);
}

function isNodeSelected(node: TreeNode): boolean {
  const indices = nodeFileIndices(node);
  return indices.length > 0 && indices.every((index) => selectedFiles.value.has(index));
}

function toggleNodeSelection(node: TreeNode, event: MouseEvent) {
  const indices = nodeFileIndices(node);
  if (indices.length === 0) return;

  const additive = event.ctrlKey || event.metaKey;
  const allSelected = indices.every((index) => selectedFiles.value.has(index));
  const next = new Set(additive ? selectedFiles.value : []);

  if (allSelected) {
    for (const index of indices) next.delete(index);
  } else {
    for (const index of indices) next.add(index);
  }

  selectedFiles.value = next;
}

function openNodeMenu(event: MouseEvent, node: TreeNode) {
  if (!isNodeSelected(node)) {
    selectedFiles.value = new Set(nodeFileIndices(node));
  }
  contextNode.value = node;
  contextMenu.x = Math.min(event.clientX, window.innerWidth - 220);
  contextMenu.y = Math.min(event.clientY, window.innerHeight - 280);
  contextMenu.open = true;
}

function closeContextMenu() {
  contextMenu.open = false;
  contextNode.value = null;
}

function contextRename() {
  const node = contextNode.value;
  closeContextMenu();
  if (node) renamePath(node);
}

async function contextToggleWanted() {
  const node = contextNode.value;
  closeContextMenu();
  if (!node) return;
  const wanted = !isNodeWanted(node);
  const indices = nodeFileIndices(node);
  if (indices.length === 0) return;
  await rpc.setFileWanted(props.torrentId, wanted ? indices : [], wanted ? [] : indices);
  await refreshDetail();
}

async function contextSetPriority(priority: Priority) {
  const node = contextNode.value;
  closeContextMenu();
  if (!node) return;
  const indices = nodeFileIndices(node);
  if (indices.length === 0) return;
  await rpc.setFilePriority(props.torrentId, priority, indices);
  showToast(t('fileTree.priorityApplied'), 'success');
  await refreshDetail();
}

async function contextCopyName() {
  const node = contextNode.value;
  closeContextMenu();
  if (!node) return;
  try {
    await navigator.clipboard.writeText(node.name);
    showToast(t('fileTree.copied'), 'success');
  } catch {
    showToast(t('toast.copyFailed'), 'error');
  }
}

function onGlobalClick() {
  if (contextMenu.open) closeContextMenu();
}

onMounted(() => window.addEventListener('click', onGlobalClick));
onUnmounted(() => window.removeEventListener('click', onGlobalClick));

function nodePriority(node: TreeNode): Priority {
  if (node.isDir || node.fileIndex === undefined) return Priority.NORMAL;
  return (props.fileStats[node.fileIndex]?.priority ?? Priority.NORMAL) as Priority;
}

function priorityClass(priority: number): string {
  if (priority === Priority.HIGH) return 'prio-high';
  if (priority === Priority.LOW) return 'prio-low';
  return 'prio-normal';
}

function isNodeWanted(node: TreeNode): boolean {
  if (node.isDir) return node.wanted;
  return !!props.fileStats[node.fileIndex!]?.wanted;
}

async function refreshDetail() {
  const detail = await rpc.getTorrentDetail(props.torrentId);
  if (detail) {
    state.activeTorrentDetail = { ...(state.activeTorrentDetail || {}), ...detail };
  }
}

async function applyBatchPriority() {
  const indices = Array.from(selectedFiles.value);
  if (indices.length === 0) return;

  await rpc.setFilePriority(props.torrentId, batchPriority.value, indices);
  showToast(t('fileTree.priorityApplied'), 'success');
  await refreshDetail();
}

watch(
  () => props.torrentId,
  (newId) => {
    if (!sessionCollapsedCache.has(newId)) {
      sessionCollapsedCache.set(newId, new Set());
    }
    collapsedSet.value = sessionCollapsedCache.get(newId)!;
  }
);

function isCollapsed(path: string): boolean {
  return collapsedSet.value.has(path);
}

function toggleCollapse(path: string) {
  if (collapsedSet.value.has(path)) {
    collapsedSet.value.delete(path);
  } else {
    collapsedSet.value.add(path);
  }
  sessionCollapsedCache.set(props.torrentId, collapsedSet.value);
}

function renamePath(node: TreeNode) {
  openPrompt({
    title: t('fileTree.renameTitle'),
    label: t('fileTree.renamePrompt'),
    value: node.name,
    confirmText: t('common.save'),
    onConfirm: async (newName) => {
      if (newName === node.name) return;
      await rpc.torrentRenamePath(props.torrentId, node.path, newName);
      const detail = await rpc.getTorrentDetail(props.torrentId);
      if (detail) {
        state.activeTorrentDetail = { ...(state.activeTorrentDetail || {}), ...detail };
      }
      await fetchTorrents();
      showToast(t('toast.renamed'), 'success');
    },
  });
}

// 树节点结构
interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  completedBytes: number;
  progress: number;
  wanted: boolean;
  depth: number;
  isLast: boolean;
  ancestorLast: boolean[];
  fileIndex?: number;
  children?: TreeNode[];
}

// 构建树结构 (并按折叠状态展平成列表以保持极高渲染性能)
const treeRoot = computed(() => {
  if (!props.files || !props.fileStats) return [];

  interface DirMap {
    [key: string]: {
      node: TreeNode;
      children: DirMap;
    };
  }

  const root: DirMap = {};

  props.files.forEach((f, idx) => {
    const parts = f.name.split('/');
    let current = root;
    let currentPath = '';

    parts.forEach((part, i) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          node: {
            name: part,
            path: currentPath,
            isDir: !isFile,
            size: isFile ? f.length : 0,
            completedBytes: isFile ? f.bytesCompleted : 0,
            progress: isFile && f.length > 0 ? f.bytesCompleted / f.length : 0,
            wanted: isFile ? (props.fileStats[idx]?.wanted ?? true) : true,
            depth: i,
            isLast: false,
            ancestorLast: [],
            fileIndex: isFile ? idx : undefined,
          },
          children: {},
        };
      }

      current = current[part].children;
    });
  });

  // 目录本身没有 RPC 进度字段，但可以由子文件聚合出真实的大小与完成度
  function aggregateDirs(dir: DirMap) {
    for (const key of Object.keys(dir)) {
      const item = dir[key];
      if (!item.node.isDir) continue;
      aggregateDirs(item.children);

      let size = 0;
      let completed = 0;
      let allWanted = true;
      for (const child of Object.values(item.children)) {
        size += child.node.size;
        completed += child.node.completedBytes;
        allWanted = allWanted && child.node.wanted;
      }
      item.node.size = size;
      item.node.completedBytes = completed;
      item.node.progress = size > 0 ? completed / size : 0;
      item.node.wanted = allWanted;
    }
  }

  aggregateDirs(root);

  // 递归展平列表并应用折叠过滤
  const flatList: TreeNode[] = [];

  function traverse(dir: DirMap, isParentCollapsed = false, ancestorLast: boolean[] = []) {
    const keys = Object.keys(dir);
    keys.forEach((key, index) => {
      const item = dir[key];
      const isLast = index === keys.length - 1;
      item.node.isLast = isLast;
      item.node.ancestorLast = ancestorLast;
      if (!isParentCollapsed) {
        flatList.push(item.node);
      }
      const selfCollapsed = isParentCollapsed || isCollapsed(item.node.path);
      if (item.node.isDir) {
        // 根节点本身不画引导线，因此 depth 0 的子节点从空祖先链开始
        const nextAncestors = item.node.depth === 0 ? [] : [...ancestorLast, isLast];
        traverse(item.children, selfCollapsed, nextAncestors);
      }
    });
  }

  traverse(root, false);
  return flatList;
});

const totalBytes = computed(() => {
  return props.files.reduce((acc, f) => acc + f.length, 0);
});

const totalSelectedBytes = computed(() => {
  return props.files.reduce((acc, f, idx) => {
    return props.fileStats[idx]?.wanted ? acc + f.length : acc;
  }, 0);
});

const selectedCount = computed(() => {
  return props.fileStats.filter((st) => st.wanted).length;
});

async function onCheckChange(node: TreeNode, e: Event) {
  const target = e.target as HTMLInputElement;
  const wanted = target.checked;

  if (node.isDir) {
    // 目录下所有文件同步
    const wantedIndices: number[] = [];
    const unwantedIndices: number[] = [];

    props.files.forEach((f, idx) => {
      if (f.name.startsWith(node.path + '/')) {
        if (wanted) wantedIndices.push(idx);
        else unwantedIndices.push(idx);
      }
    });

    await rpc.setFileWanted(props.torrentId, wantedIndices, unwantedIndices);
  } else if (node.fileIndex !== undefined) {
    if (wanted) {
      await rpc.setFileWanted(props.torrentId, [node.fileIndex], []);
    } else {
      await rpc.setFileWanted(props.torrentId, [], [node.fileIndex]);
    }
  }
  await refreshDetail();
}

async function changePriority(index: number, e: Event) {
  const target = e.target as HTMLSelectElement;
  const prio = parseInt(target.value) as -1 | 0 | 1;
  await rpc.setFilePriority(props.torrentId, prio, [index]);
  await refreshDetail();
}
</script>

<style scoped>
.file-tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--fluent-bg-canvas);
  border-radius: 4px;
}

.file-tree-header {
  margin: 0;
  padding: 8px 16px;
  background-color: var(--fluent-bg-subtle);
  border: none;
  border-bottom: 1px solid var(--fluent-border-subtle);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--md-text-secondary);
}

.file-tree-summary {
  font-weight: 500;
  letter-spacing: 0.01em;
}

.file-tree-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-priority {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.batch-priority-select {
  width: 84px;
}

.batch-apply-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(0, 120, 212, 0.45);
  border-radius: 4px;
  background: rgba(0, 120, 212, 0.06);
  color: var(--fluent-accent);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.batch-apply-btn:hover:not(:disabled) {
  background: rgba(0, 120, 212, 0.12);
  border-color: var(--fluent-accent);
}

.batch-apply-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.file-tree-selection {
  font-size: 11px;
  color: var(--fluent-accent);
  font-weight: 500;
  white-space: nowrap;
}

.file-tree-divider {
  width: 1px;
  height: 18px;
  background: var(--fluent-border-subtle);
}

.file-nodes-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.tree-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 34px;
  padding-right: 16px;
  font-size: 12px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  transition: background-color 0.1s ease;
}

.tree-row:hover {
  background-color: var(--fluent-bg-hover);
}

.tree-row.file-selected {
  background-color: rgba(0, 120, 212, 0.08);
}

.tree-row.file-selected:hover {
  background-color: rgba(0, 120, 212, 0.13);
}

[data-theme="dark"] .tree-row.file-selected {
  background-color: rgba(40, 134, 222, 0.18);
}

[data-theme="dark"] .tree-row.file-selected:hover {
  background-color: rgba(40, 134, 222, 0.26);
}

.tree-row.is-dir {
  font-weight: 500;
}

.tree-row.prio-high {
  box-shadow: inset 3px 0 0 #c62828;
}

.tree-row.prio-low {
  box-shadow: inset 3px 0 0 #0078d4;
}

/* Windows Explorer 风格层级引导线 */
.tree-guides {
  position: absolute;
  left: 16px;
  top: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
}

.guide-col {
  position: relative;
  width: 20px;
  flex-shrink: 0;
}

.guide-col::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--fluent-border-divider);
}

.guide-ancestor.guide-stop::before {
  display: none;
}

.guide-current.guide-stop::before {
  display: block;
  bottom: 50%;
}

.guide-current::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: var(--fluent-border-divider);
}

.expand-icon {
  font-size: 18px;
  cursor: pointer;
  color: var(--md-text-secondary);
  width: 20px;
}

.expand-placeholder {
  width: 20px;
}

.tree-checkbox {
  margin-right: 8px;
  cursor: pointer;
}

.node-type-icon {
  font-size: 18px;
  margin-right: 6px;
  color: var(--md-text-secondary);
}

.node-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
}

.node-name.name-prio-high {
  color: #c62828;
  font-weight: 600;
}

.node-name.name-prio-low {
  color: #0078d4;
  font-weight: 600;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
  margin-left: auto;
}

.mini-progress-track {
  width: 90px;
  height: 5px;
  background: var(--fluent-border-subtle);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-bar {
  height: 100%;
  background: var(--fluent-accent);
  border-radius: 3px;
  transition: width 0.25s ease;
}

.priority-select {
  height: 22px;
  font-size: 11px;
  padding: 0 4px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  outline: none;
}

.priority-select:focus {
  border-color: var(--fluent-accent);
}

.priority-select.prio-high {
  color: #c62828;
  border-color: rgba(198, 40, 40, 0.35);
  background: rgba(198, 40, 40, 0.08);
}

.priority-select.prio-low {
  color: #0078d4;
  border-color: rgba(0, 120, 212, 0.3);
  background: rgba(0, 120, 212, 0.07);
}

.rename-file-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.15s;
}

.rename-file-btn:hover {
  color: var(--fluent-accent);
  background: var(--fluent-bg-hover);
}

.file-context-menu {
  position: fixed;
  width: 214px;
  padding: 4px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-divider);
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  z-index: 100000;
}

.context-menu-title {
  padding: 5px 9px 7px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  font-size: 11px;
  color: var(--md-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 9px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--md-text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.context-menu-item:hover {
  background: var(--fluent-bg-hover);
}

.context-menu-divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--fluent-border-subtle);
}
</style>
