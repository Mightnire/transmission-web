<template>
  <div class="app-root">
    <!-- 顶部导航与工具栏 (BiglyBT 风格) -->
    <AppBar />

    <!-- 主体区域：左侧常驻分类树 + 右侧工作区 -->
    <div class="app-body">
      <!-- 侧边栏 (桌面端常驻，移动端抽屉) -->
      <Drawer />

      <!-- 主工作区 (上方表格 + 下方详情面板) -->
      <main class="main-workspace">
        <TorrentList />
        <TorrentDetail />
      </main>
    </div>

    <!-- 移动端专用的悬浮添加按钮 (桌面端已整合进顶部工具栏) -->
    <button
      class="mobile-fab"
      v-if="isMobile && !state.detailOpen"
      @click="state.addDialogOpen = true"
      :title="t('toolbar.addTitle')"
      v-ripple
    >
      <span class="material-icons">add</span>
    </button>

    <!-- 添加任务弹窗 (支持磁链、HTTP、文件拖拽、设置保存目录) -->
    <AddDialog />

    <!-- 全局首选项弹窗 (RPC session-get/set 端口测试与黑名单更新) -->
    <SessionDialog />

    <!-- 单任务独立属性配置弹窗 -->
    <TorrentPropsDialog :torrentId="state.propsTorrentId" v-model="state.propsDialogOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { state, startPolling, stopPolling } from './stores/transmission';
import { t } from './locales';
import AppBar from './components/AppBar.vue';
import Drawer from './components/Drawer.vue';
import TorrentList from './components/TorrentList.vue';
import TorrentDetail from './components/TorrentDetail.vue';
import AddDialog from './components/AddDialog.vue';
import SessionDialog from './components/SessionDialog.vue';
import TorrentPropsDialog from './components/TorrentPropsDialog.vue';

const isMobile = ref(window.innerWidth < 768);

function handleResize() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(() => {
  // 恢复保存的主题
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  window.addEventListener('resize', handleResize);

  // 启动 3 秒高频平滑轮询
  startPolling(3000);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  stopPolling();
});
</script>

<style scoped>
.app-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--md-bg);
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 仅移动端小屏渲染的 FAB 按钮 */
.mobile-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--md-accent);
  color: #ffffff;
  border: none;
  outline: none;
  cursor: pointer;
  box-shadow: var(--md-shadow-4dp);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.mobile-fab .material-icons {
  font-size: 26px;
}
</style>
