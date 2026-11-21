<template>
  <div class="workspace-container">
    <!-- 数据表格模式 (桌面端默认，移动端亦可切换) -->
    <TorrentTable v-if="state.viewMode === 'table'" />

    <!-- 现代流式卡片列表 (移动端与卡片视图) -->
    <div class="mobile-cards-view" v-else>
      <!-- 卡片顶栏：全选与多选操作 -->
      <div class="cards-header-bar" v-if="filteredTorrents.length > 0">
        <label class="select-all-label" @click.stop>
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isSomeSelected"
            @click.stop="selectAllTorrents"
          />
          <span class="select-all-text">
            {{ isAllSelected ? t('common.selectAll') : (selectedCount > 0 ? t('ribbon.selectedCount', { count: selectedCount }) : t('common.selectAll')) }}
          </span>
        </label>

        <div class="cards-selection-actions" v-if="selectedCount > 0">
          <button class="cards-action-btn" @click="invertSelection" :title="t('common.invertSelection')">
            <FluentIcon name="invert_selection" class="btn-icon" />
            <span>{{ t('common.invertSelection') }}</span>
          </button>
          <button class="cards-action-btn" @click="clearSelection" :title="t('common.deselectAll')">
            <FluentIcon name="close" class="btn-icon" />
            <span>{{ t('common.deselectAll') }}</span>
          </button>
        </div>
      </div>

      <div class="cards-wrapper" v-if="filteredTorrents.length > 0">
        <TorrentCard
          v-for="torrent in filteredTorrents"
          :key="torrent.id"
          :torrent="torrent"
        />
      </div>

      <div class="empty-state" v-else>
        <FluentIcon name="inbox" class="empty-icon" />
        <p class="empty-text">{{ t('table.empty') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  state,
  filteredTorrents,
  selectAllTorrents,
  clearSelection,
  invertSelection,
  isAllSelected,
  isSomeSelected,
} from '../../stores/transmission';
import { t } from '../../locales';
import FluentIcon from '../common/FluentIcon.vue';
import TorrentTable from '../torrent/TorrentTable.vue';
import TorrentCard from '../torrent/TorrentCard.vue';

const selectedCount = computed(() => state.selectedIds.length);
</script>

<style scoped>
.workspace-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  position: relative;
}

.mobile-cards-view {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 10px;
  background-color: var(--fluent-bg-canvas);
}

.cards-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  user-select: none;
  font-size: 12px;
  color: var(--md-text-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.select-all-text {
  font-size: 12px;
  color: var(--md-text-primary);
}

.cards-selection-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cards-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.cards-action-btn:hover {
  background: var(--fluent-bg-hover);
  border-color: var(--fluent-border-strong);
}

.cards-action-btn .btn-icon {
  font-size: 14px;
  color: var(--fluent-accent);
}

.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  color: var(--md-text-secondary);
}

.empty-icon {
  font-size: 52px;
  opacity: 0.35;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: var(--md-text-secondary);
}
</style>
