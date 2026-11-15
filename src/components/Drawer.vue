<template>
  <div>
    <!-- 背景遮罩 -->
    <div class="md-drawer-backdrop" v-if="state.drawerOpen" @click="state.drawerOpen = false"></div>

    <!-- 抽屉容器 -->
    <aside class="md-drawer" :class="{ open: state.drawerOpen }">
      <!-- 头部 Banner -->
      <div class="md-drawer-header">
        <h2 class="title">Transmission MD1</h2>
        <p class="subtitle">v{{ state.session?.version || '3.00+' }} · 极轻量路由器专版</p>
      </div>

      <!-- 导航列表 -->
      <div class="md-drawer-content">
        <div class="section-title">状态筛选</div>
        
        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'all' }"
          @click="setStatusFilter('all')"
          v-ripple
        >
          <span class="material-icons">all_inclusive</span>
          <span class="label">全部任务</span>
          <span class="count">{{ state.torrents.length }}</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'downloading' }"
          @click="setStatusFilter('downloading')"
          v-ripple
        >
          <span class="material-icons" style="color: var(--md-info);">arrow_downward</span>
          <span class="label">正在下载</span>
          <span class="count">{{ counts.downloading }}</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'seeding' }"
          @click="setStatusFilter('seeding')"
          v-ripple
        >
          <span class="material-icons" style="color: var(--md-success);">arrow_upward</span>
          <span class="label">正在做种</span>
          <span class="count">{{ counts.seeding }}</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'finished' }"
          @click="setStatusFilter('finished')"
          v-ripple
        >
          <span class="material-icons" style="color: #8bc34a;">check_circle</span>
          <span class="label">已完成</span>
          <span class="count">{{ counts.finished }}</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'paused' }"
          @click="setStatusFilter('paused')"
          v-ripple
        >
          <span class="material-icons" style="color: var(--md-text-secondary);">pause</span>
          <span class="label">已暂停</span>
          <span class="count">{{ counts.paused }}</span>
        </div>

        <div
          class="nav-item"
          :class="{ active: state.filter.status === 'error' }"
          @click="setStatusFilter('error')"
          v-ripple
        >
          <span class="material-icons" style="color: var(--md-error);">error</span>
          <span class="label">异常与警告</span>
          <span class="count">{{ counts.error }}</span>
        </div>

        <div class="divider"></div>

        <div class="section-title">排序方式</div>
        <div class="sort-options">
          <label class="sort-radio" v-for="opt in sortOptions" :key="opt.value">
            <input
              type="radio"
              name="sortBy"
              :value="opt.value"
              v-model="state.filter.sortBy"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>

        <div class="sort-order-toggle" @click="state.filter.sortAsc = !state.filter.sortAsc" v-ripple>
          <span class="material-icons">{{ state.filter.sortAsc ? 'arrow_upward' : 'arrow_downward' }}</span>
          <span>{{ state.filter.sortAsc ? '正序升序' : '倒序降序' }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../stores/transmission';

function setStatusFilter(status: any) {
  state.filter.status = status;
  state.drawerOpen = false;
}

const counts = computed(() => {
  let downloading = 0;
  let seeding = 0;
  let finished = 0;
  let paused = 0;
  let error = 0;

  for (const t of state.torrents) {
    if (t.error !== 0) error++;
    if (t.status === 4 || t.status === 3) downloading++;
    else if (t.status === 6 || t.status === 5) seeding++;
    else if (t.status === 0) paused++;
    if (t.percentDone >= 1.0) finished++;
  }

  return { downloading, seeding, finished, paused, error };
});

const sortOptions = [
  { label: '添加时间', value: 'addedDate' },
  { label: '真实进度', value: 'percentDone' },
  { label: '下载速度', value: 'rateDownload' },
  { label: '上传速度', value: 'rateUpload' },
  { label: '种子名称', value: 'name' },
  { label: '文件大小', value: 'totalSize' },
];
</script>

<style scoped>
.md-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.54);
  z-index: 200;
}

.md-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 280px;
  background-color: var(--md-surface);
  box-shadow: var(--md-shadow-8dp);
  z-index: 201;
  transform: translateX(-100%);
  transition: transform 0.28s var(--md-transition-standard);
  display: flex;
  flex-direction: column;
}

.md-drawer.open {
  transform: translateX(0);
}

.md-drawer-header {
  height: 140px;
  background-color: var(--md-primary);
  color: #ffffff;
  padding: 24px 16px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: var(--md-shadow-1dp);
}

.md-drawer-header .title {
  font-size: 20px;
  font-weight: 500;
}

.md-drawer-header .subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.md-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.section-title {
  padding: 12px 16px 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  cursor: pointer;
  color: var(--md-text-primary);
  transition: background-color 0.2s;
  gap: 16px;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.nav-item.active {
  background-color: rgba(63, 81, 181, 0.12);
  color: var(--md-primary);
  font-weight: 500;
}

.nav-item .label {
  flex: 1;
  font-size: 14px;
}

.nav-item .count {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--md-divider);
}

.divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 8px 0;
}

.sort-options {
  padding: 4px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sort-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.sort-order-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--md-primary);
}
</style>
