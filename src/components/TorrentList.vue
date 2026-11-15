<template>
  <div class="torrent-list-container">
    <!-- 顶部搜索框 -->
    <div class="search-bar-card md-card">
      <span class="material-icons search-icon">search</span>
      <input
        type="text"
        class="search-input"
        placeholder="搜索种子名称..."
        v-model="state.filter.search"
      />
      <button
        class="clear-btn"
        v-if="state.filter.search"
        @click="state.filter.search = ''"
      >
        <span class="material-icons">close</span>
      </button>
    </div>

    <!-- 列表展示 -->
    <div class="torrent-cards-wrapper" v-if="filteredTorrents.length > 0">
      <TorrentCard
        v-for="torrent in filteredTorrents"
        :key="torrent.id"
        :torrent="torrent"
      />
    </div>

    <!-- 空状态提示 -->
    <div class="empty-state" v-else>
      <span class="material-icons empty-icon">inbox</span>
      <p class="empty-text">当前分类下没有下载任务</p>
      <button class="md-btn md-btn-raised" @click="state.addDialogOpen = true" v-ripple>
        <span class="material-icons" style="margin-right: 4px;">add</span>
        添加新任务
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { state, filteredTorrents } from '../stores/transmission';
import TorrentCard from './TorrentCard.vue';
</script>

<style scoped>
.torrent-list-container {
  padding: 16px;
  max-width: 1024px;
  margin: 0 auto;
  padding-bottom: 96px; /* 为 FAB 与底部详情面板留白 */
}

.search-bar-card {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  background-color: var(--md-surface);
}

.search-icon {
  color: var(--md-text-secondary);
  font-size: 20px;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  height: 40px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--md-text-primary);
  font-size: 14px;
}

.clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.torrent-cards-wrapper {
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--md-text-secondary);
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  color: var(--md-text-disabled);
}

.empty-text {
  font-size: 15px;
}
</style>
