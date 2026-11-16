<template>
  <div class="app-root" :class="{ 'compact-density': state.compactDensity }">
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

    <!-- Office 2016 全屏文件菜单 (Backstage) -->
    <FileBackstage />

    <!-- 添加任务弹窗 (支持磁链、HTTP、文件拖拽、设置保存目录) -->
    <AddDialog />

    <!-- 全局首选项弹窗 (RPC session-get/set 端口测试与黑名单更新) -->
    <SessionDialog />

    <!-- 批量修改标签弹窗 (特色功能) -->
    <BatchTagsDialog />

    <!-- Fluent 动作弹窗与 Toast (彻底消除任何原生 prompt/alert/confirm) -->
    <FluentActionDialogs />

    <!-- 单任务独立属性配置弹窗 -->
    <TorrentPropsDialog :torrentId="state.propsTorrentId" v-model="state.propsDialogOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { state, startPolling, stopPolling } from './stores/transmission';
import { t } from './locales';
import AppBar from './components/layout/AppBar.vue';
import Drawer from './components/layout/Drawer.vue';
import TorrentList from './components/layout/TorrentList.vue';
import TorrentDetail from './components/torrent/TorrentDetail.vue';
import AddDialog from './components/dialogs/AddDialog.vue';
import SessionDialog from './components/dialogs/SessionDialog.vue';
import TorrentPropsDialog from './components/dialogs/TorrentPropsDialog.vue';
import BatchTagsDialog from './components/dialogs/BatchTagsDialog.vue';
import FluentActionDialogs from './components/dialogs/FluentActionDialogs.vue';
import FileBackstage from './components/backstage/FileBackstage.vue';

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
</style>
