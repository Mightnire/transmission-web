<template>
  <header class="md-app-bar">
    <button class="md-icon-button" @click="state.drawerOpen = true" title="打开侧边导航" v-ripple>
      <span class="material-icons">menu</span>
    </button>

    <h1 class="md-app-bar-title" style="margin-left: 12px;">Transmission</h1>

    <!-- 实时网络流量指示器 -->
    <div class="global-speed-badge" v-if="state.stats">
      <span class="speed-item down" title="全局下载速度">
        <span class="material-icons speed-icon">arrow_downward</span>
        {{ formatSpeed(state.stats.downloadSpeed) }}
      </span>
      <span class="speed-item up" title="全局上传速度">
        <span class="material-icons speed-icon">arrow_upward</span>
        {{ formatSpeed(state.stats.uploadSpeed) }}
      </span>
    </div>

    <!-- 乌龟模式切换 -->
    <button
      class="md-icon-button"
      :class="{ active: state.session?.altSpeedEnabled }"
      @click="toggleTurtle"
      title="乌龟模式 (限速)"
      v-ripple
    >
      <span class="material-icons">slow_motion_video</span>
    </button>

    <!-- 全部暂停/恢复 -->
    <button class="md-icon-button" @click="toggleAll" :title="allPaused ? '全部开始' : '全部暂停'" v-ripple>
      <span class="material-icons">{{ allPaused ? 'play_arrow' : 'pause' }}</span>
    </button>

    <!-- 设置 -->
    <button class="md-icon-button" @click="state.sessionDialogOpen = true" title="全局配置" v-ripple>
      <span class="material-icons">settings</span>
    </button>

    <!-- 主题切换 -->
    <button class="md-icon-button" @click="toggleTheme" title="切换深色/浅色" v-ripple>
      <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
    </button>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { state, formatSpeed } from '../stores/transmission';
import { rpc } from '../api/rpc';

const isDark = ref(localStorage.getItem('theme') === 'dark');

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
}

// 检查是否全部已暂停
const allPaused = computed(() => {
  return state.torrents.length > 0 && state.torrents.every((t) => t.status === 0);
});

async function toggleAll() {
  const ids = state.torrents.map((t) => t.id);
  if (ids.length === 0) return;
  if (allPaused.value) {
    await rpc.startTorrents(ids);
  } else {
    await rpc.stopTorrents(ids);
  }
}

async function toggleTurtle() {
  if (!state.session) return;
  const newAlt = !state.session.altSpeedEnabled;
  state.session.altSpeedEnabled = newAlt;
  await rpc.setSession({ altSpeedEnabled: newAlt });
}
</script>

<style scoped>
.global-speed-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: 16px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.speed-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.speed-icon {
  font-size: 16px;
}

.speed-item.down {
  color: #a7ffeb;
}

.speed-item.up {
  color: #ffe082;
}

.md-icon-button.active {
  background-color: var(--md-accent);
  color: #ffffff;
}

@media (max-width: 600px) {
  .global-speed-badge {
    display: none;
  }
}
</style>
