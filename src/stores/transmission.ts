import { reactive, ref, computed } from 'vue';
import { Torrent, TorrentStatus, SessionInfo, SessionStats } from '../api/types';
import { rpc } from '../api/rpc';

export interface TorrentFilter {
  status: 'all' | 'downloading' | 'seeding' | 'paused' | 'error' | 'finished';
  search: string;
  sortBy: 'name' | 'percentDone' | 'rateDownload' | 'rateUpload' | 'totalSize' | 'addedDate';
  sortAsc: boolean;
}

export const state = reactive<{
  torrents: Torrent[];
  session: SessionInfo | null;
  stats: SessionStats | null;
  selectedId: number | null;
  activeTorrentDetail: Torrent | null;
  filter: TorrentFilter;
  drawerOpen: boolean;
  addDialogOpen: boolean;
  sessionDialogOpen: boolean;
  isPolling: boolean;
}>({
  torrents: [],
  session: null,
  stats: null,
  selectedId: null,
  activeTorrentDetail: null,
  filter: {
    status: 'all',
    search: '',
    sortBy: 'addedDate',
    sortAsc: false,
  },
  drawerOpen: false,
  addDialogOpen: false,
  sessionDialogOpen: false,
  isPolling: false,
});

let pollTimer: any = null;

export async function fetchTorrents() {
  try {
    const list = await rpc.getTorrents();
    state.torrents = list;

    // 如果当前选中的种子正在查看详情，同步刷新它的详情
    if (state.selectedId !== null) {
      const detail = await rpc.getTorrentDetail(state.selectedId);
      if (detail) {
        state.activeTorrentDetail = detail;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch torrents:', e);
  }
}

export async function fetchSession() {
  try {
    const [sess, stats] = await Promise.all([rpc.getSession(), rpc.getSessionStats()]);
    state.session = sess;
    state.stats = stats;
  } catch (e) {
    console.warn('Failed to fetch session:', e);
  }
}

export function startPolling(intervalMs = 3000) {
  if (pollTimer) clearInterval(pollTimer);
  state.isPolling = true;
  fetchTorrents();
  fetchSession();
  pollTimer = setInterval(() => {
    fetchTorrents();
    fetchSession();
  }, intervalMs);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  state.isPolling = false;
}

// 格式化函数工具箱
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + '/s';
}

export function formatETA(seconds: number): string {
  if (seconds < 0) return '∞';
  if (seconds === 0) return '完成';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}天 ${hours}时`;
  if (hours > 0) return `${hours}时 ${minutes}分`;
  if (minutes > 0) return `${minutes}分 ${secs}秒`;
  return `${secs}秒`;
}

// 过滤与排序后的种子列表
export const filteredTorrents = computed(() => {
  return state.torrents
    .filter((t) => {
      // 状态筛选
      if (state.filter.status === 'downloading') {
        if (t.status !== TorrentStatus.DOWNLOAD && t.status !== TorrentStatus.DOWNLOAD_WAIT) return false;
      } else if (state.filter.status === 'seeding') {
        if (t.status !== TorrentStatus.SEED && t.status !== TorrentStatus.SEED_WAIT) return false;
      } else if (state.filter.status === 'paused') {
        if (t.status !== TorrentStatus.STOPPED) return false;
      } else if (state.filter.status === 'error') {
        if (t.error === 0) return false;
      } else if (state.filter.status === 'finished') {
        if (t.percentDone < 1.0) return false;
      }

      // 关键字搜索
      if (state.filter.search) {
        const query = state.filter.search.toLowerCase();
        return t.name.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      const field = state.filter.sortBy;
      const factor = state.filter.sortAsc ? 1 : -1;
      if (field === 'name') {
        return a.name.localeCompare(b.name) * factor;
      }
      return ((a[field] as number) - (b[field] as number)) * factor;
    });
});
