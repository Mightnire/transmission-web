<template>
  <div class="workspace-container">
    <!-- 桌面端紧凑数据表格 (BiglyBT 风格) -->
    <TorrentTable v-if="isDesktop || state.viewMode === 'table'" />

    <!-- 移动端流式卡片列表 -->
    <div class="mobile-cards-view" v-else>
      <div class="cards-wrapper" v-if="filteredTorrents.length > 0">
        <TorrentCard
          v-for="torrent in filteredTorrents"
          :key="torrent.id"
          :torrent="torrent"
        />
      </div>

      <div class="empty-state" v-else>
        <span class="material-icons empty-icon">inbox</span>
        <p class="empty-text">当前分类下没有下载任务</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { state, filteredTorrents } from '../stores/transmission';
import TorrentTable from './TorrentTable.vue';
import TorrentCard from './TorrentCard.vue';

const isDesktop = ref(window.innerWidth >= 768);

function handleResize() {
  isDesktop.value = window.innerWidth >= 768;
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.workspace-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.mobile-cards-view {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--md-text-secondary);
}

.empty-icon {
  font-size: 56px;
  opacity: 0.4;
  margin-bottom: 12px;
}
</style>
