<template>
  <div class="workspace-container">
    <!-- 数据表格模式 (桌面端默认，移动端亦可切换) -->
    <TorrentTable v-if="state.viewMode === 'table'" />

    <!-- 现代流式卡片列表 (移动端优先，触控友好) -->
    <div class="mobile-cards-view" v-else>
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
import { state, filteredTorrents } from '../../stores/transmission';
import { t } from '../../locales';
import TorrentTable from '../torrent/TorrentTable.vue';
import TorrentCard from '../torrent/TorrentCard.vue';
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
