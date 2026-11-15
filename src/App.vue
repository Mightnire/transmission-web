<template>
  <div class="app-root">
    <!-- 顶部导航栏 -->
    <AppBar />

    <!-- 侧边抽屉 -->
    <Drawer />

    <!-- 主体任务列表 -->
    <main class="main-content">
      <TorrentList />
    </main>

    <!-- 底部悬浮添加按钮 (MD1 FAB) -->
    <button class="md-fab" @click="state.addDialogOpen = true" title="添加新任务" v-ripple>
      <span class="material-icons" style="font-size: 28px;">add</span>
    </button>

    <!-- 底部详情面板 -->
    <TorrentDetail />

    <!-- 添加任务弹窗 -->
    <AddDialog />

    <!-- 全局配置弹窗 -->
    <SessionDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { state, startPolling, stopPolling } from './stores/transmission';
import AppBar from './components/AppBar.vue';
import Drawer from './components/Drawer.vue';
import TorrentList from './components/TorrentList.vue';
import TorrentDetail from './components/TorrentDetail.vue';
import AddDialog from './components/AddDialog.vue';
import SessionDialog from './components/SessionDialog.vue';

onMounted(() => {
  // 恢复保存的主题
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // 启动 3 秒高频平滑轮询
  startPolling(3000);
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
}
</style>
