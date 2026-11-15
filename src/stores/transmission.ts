import { reactive, ref, computed } from 'vue';
import { Torrent, TorrentStatus, SessionInfo, SessionStats } from '../api/types';
import { rpc } from '../api/rpc';
import { t } from '../locales';

export interface TorrentFilter {
  status: 'all' | 'active' | 'downloading' | 'seeding' | 'queued' | 'paused' | 'error' | 'finished';
  search: string;
  sortBy: 'queuePosition' | 'name' | 'percentDone' | 'rateDownload' | 'rateUpload' | 'totalSize' | 'addedDate' | 'uploadRatio';
  sortAsc: boolean;
}

export interface TableColumnConfig {
  id: string;
  labelKey: string;
  visible: boolean;
  width: number;
  minWidth: number;
}

export interface UIPreferences {
  showTrackerGroup: boolean;
  showTagGroup: boolean;
  pollIntervalTorrents: number;
  pollIntervalStats: number;
}

const DEFAULT_COLUMNS: TableColumnConfig[] = [
  { id: 'status', labelKey: 'common.status', visible: true, width: 38, minWidth: 30 },
  { id: 'name', labelKey: 'common.name', visible: true, width: 340, minWidth: 160 },
  { id: 'size', labelKey: 'common.size', visible: true, width: 85, minWidth: 60 },
  { id: 'progress', labelKey: 'common.progress', visible: true, width: 140, minWidth: 90 },
  { id: 'statustext', labelKey: 'common.status', visible: true, width: 110, minWidth: 70 },
  { id: 'downSpeed', labelKey: 'common.downSpeed', visible: true, width: 85, minWidth: 60 },
  { id: 'upSpeed', labelKey: 'common.upSpeed', visible: true, width: 85, minWidth: 60 },
  { id: 'eta', labelKey: 'common.eta', visible: true, width: 85, minWidth: 60 },
  { id: 'ratio', labelKey: 'common.ratio', visible: true, width: 68, minWidth: 50 },
  { id: 'peers', labelKey: 'common.peers', visible: true, width: 75, minWidth: 50 },
  { id: 'corrupt', labelKey: 'common.corrupt', visible: false, width: 85, minWidth: 60 },
];

function loadSavedColumns(): TableColumnConfig[] {
  try {
    const raw = localStorage.getItem('torrent_table_columns');
    if (raw) {
      const parsed: TableColumnConfig[] = JSON.parse(raw);
      return DEFAULT_COLUMNS.map((def) => {
        const found = parsed.find((p) => p.id === def.id);
        return found ? { ...def, visible: found.visible, width: found.width } : { ...def };
      });
    }
  } catch (e) {
    console.warn('Failed to parse saved columns:', e);
  }
  return DEFAULT_COLUMNS.map((c) => ({ ...c }));
}

const DEFAULT_UI_PREFS: UIPreferences = {
  showTrackerGroup: true,
  showTagGroup: true,
  pollIntervalTorrents: 3,
  pollIntervalStats: 3,
};

function loadSavedUIPreferences(): UIPreferences {
  try {
    const raw = localStorage.getItem('ui_preferences');
    if (raw) {
      return { ...DEFAULT_UI_PREFS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse saved UI preferences:', e);
  }
  return { ...DEFAULT_UI_PREFS };
}

export const state = reactive<{
  torrents: Torrent[];
  session: SessionInfo | null;
  stats: SessionStats | null;
  selectedId: number | null;
  selectedIds: number[];
  activeTorrentDetail: Torrent | null;
  filter: TorrentFilter;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  ribbonTab: 'tasks' | 'queue' | 'bandwidth' | 'tools' | 'torrentProps' | 'view';
  columns: TableColumnConfig[];
  uiPreferences: UIPreferences;
  columnsDialogOpen: boolean;
  selectedTag: string | null;
  selectedTracker: string | null;
  addDialogOpen: boolean;
  sessionDialogOpen: boolean;
  detailOpen: boolean;
  propsDialogOpen: boolean;
  propsTorrentId: number | null;
  isPolling: boolean;
  viewMode: 'table' | 'cards';
}>({
  torrents: [],
  session: null,
  stats: null,
  selectedId: null,
  selectedIds: [],
  activeTorrentDetail: null,
  filter: {
    status: 'all',
    search: '',
    sortBy: 'queuePosition',
    sortAsc: true,
  },
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
  ribbonTab: 'tasks',
  columns: loadSavedColumns(),
  uiPreferences: loadSavedUIPreferences(),
  columnsDialogOpen: false,
  selectedTag: null,
  selectedTracker: null,
  addDialogOpen: false,
  sessionDialogOpen: false,
  detailOpen: false,
  propsDialogOpen: false,
  propsTorrentId: null,
  isPolling: false,
  viewMode: 'table',
});

export function saveColumns() {
  localStorage.setItem('torrent_table_columns', JSON.stringify(state.columns));
}

export function resetColumns() {
  state.columns = DEFAULT_COLUMNS.map((c) => ({ ...c }));
  saveColumns();
}

export function saveUIPreferences() {
  localStorage.setItem('ui_preferences', JSON.stringify(state.uiPreferences));
  restartPolling();
}

let torrentTimer: any = null;
let statsTimer: any = null;

// 获取种子列表与刷新当前选中详情
export async function fetchTorrents() {
  try {
    const list = await rpc.getTorrents();
    state.torrents = list;

    // 如果选中了某个任务且详情面板打开，刷新其详细属性
    if (state.selectedId !== null && state.detailOpen) {
      const basic = state.torrents.find((t) => t.id === state.selectedId);
      const detail = await rpc.getTorrentDetail(state.selectedId);
      if (detail) {
        state.activeTorrentDetail = { ...(basic || {}), ...detail };
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

export function restartPolling() {
  if (torrentTimer) clearInterval(torrentTimer);
  if (statsTimer) clearInterval(statsTimer);
  state.isPolling = true;

  fetchTorrents();
  fetchSession();

  const tInt = Math.max(1, state.uiPreferences.pollIntervalTorrents || 3) * 1000;
  const sInt = Math.max(1, state.uiPreferences.pollIntervalStats || 3) * 1000;

  torrentTimer = setInterval(() => {
    fetchTorrents();
  }, tInt);

  statsTimer = setInterval(() => {
    fetchSession();
  }, sInt);
}

export function startPolling(intervalMs?: number) {
  if (intervalMs && !localStorage.getItem('ui_preferences')) {
    state.uiPreferences.pollIntervalTorrents = Math.round(intervalMs / 1000);
    state.uiPreferences.pollIntervalStats = Math.round(intervalMs / 1000);
  }
  restartPolling();
}

export function stopPolling() {
  if (torrentTimer) {
    clearInterval(torrentTimer);
    torrentTimer = null;
  }
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
  state.isPolling = false;
}

// 选中管理
export function selectTorrent(id: number, multi = false) {
  if (!multi) {
    state.selectedIds = [id];
    state.selectedId = id;
  } else {
    const idx = state.selectedIds.indexOf(id);
    if (idx > -1) {
      state.selectedIds.splice(idx, 1);
      state.selectedId = state.selectedIds[state.selectedIds.length - 1] || null;
    } else {
      state.selectedIds.push(id);
      state.selectedId = id;
    }
  }

  // 选中后加载详细元数据
  if (state.selectedId !== null && state.detailOpen) {
    rpc.getTorrentDetail(state.selectedId).then((detail) => {
      const basic = state.torrents.find((t) => t.id === state.selectedId);
      if (detail) {
        state.activeTorrentDetail = { ...(basic || {}), ...detail };
      }
    });
  }
}

export function toggleDetail(id?: number) {
  if (id !== undefined && id !== null) {
    selectTorrent(id);
    state.detailOpen = true;
  } else {
    state.detailOpen = !state.detailOpen;
  }

  if (state.detailOpen && state.selectedId !== null) {
    rpc.getTorrentDetail(state.selectedId).then((detail) => {
      const basic = state.torrents.find((t) => t.id === state.selectedId);
      if (detail) {
        state.activeTorrentDetail = { ...(basic || {}), ...detail };
      }
    });
  }
}

export function openTorrentProps(id: number) {
  state.propsTorrentId = id;
  state.propsDialogOpen = true;
}

// 批量操作
export async function startSelected() {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.startTorrents(ids);
  await fetchTorrents();
}

export async function stopSelected() {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.stopTorrents(ids);
  await fetchTorrents();
}

export async function verifySelected() {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.verifyTorrents(ids);
  await fetchTorrents();
}

export async function removeSelected(deleteLocalData = false) {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.removeTorrents(ids, deleteLocalData);
  state.selectedIds = [];
  state.selectedId = null;
  state.activeTorrentDetail = null;
  await fetchTorrents();
}

export async function toggleTurtleMode() {
  if (!state.session) return;
  const newMode = !state.session['alt-speed-enabled'];
  await rpc.setSession({ 'alt-speed-enabled': newMode });
  state.session['alt-speed-enabled'] = newMode;
}

// 格式化函数工具箱
export function formatBytes(bytes?: number, decimals = 1): string {
  if (bytes === undefined || bytes === null || bytes === 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
  return formatBytes(bytesPerSec) + '/s';
}

export function formatETA(seconds?: number): string {
  if (seconds === undefined || seconds === null || seconds < 0) return '—';
  if (seconds === 0) return t('common.finished');
  if (seconds > 86400 * 30) return '∞';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}${t('common.day')} ${h}${t('common.hour')}`;
  if (h > 0) return `${h}${t('common.hour')} ${m}${t('common.min')}`;
  if (m > 0) return `${m}${t('common.min')} ${s}${t('common.sec')}`;
  return `${s}${t('common.sec')}`;
}

export function getStatusText(status: number): string {
  switch (status) {
    case 0: return t('status.stopped');
    case 1: return t('status.checkWait');
    case 2: return t('status.checking');
    case 3: return t('status.downloadWait');
    case 4: return t('status.downloading');
    case 5: return t('status.seedWait');
    case 6: return t('status.seeding');
    default: return t('status.unknown');
  }
}

// 计算过滤与排序后的种子列表
export const filteredTorrents = computed(() => {
  let list = state.torrents;

  // 状态筛选
  if (state.filter.status !== 'all') {
    list = list.filter((t) => {
      switch (state.filter.status) {
        case 'active':
          return (t.rateDownload > 0 || t.rateUpload > 0) || (t.status === TorrentStatus.DOWNLOAD || t.status === TorrentStatus.SEED);
        case 'downloading':
          return t.status === TorrentStatus.DOWNLOAD || t.status === TorrentStatus.DOWNLOAD_WAIT;
        case 'seeding':
          return t.status === TorrentStatus.SEED || t.status === TorrentStatus.SEED_WAIT;
        case 'queued':
          return t.status === TorrentStatus.DOWNLOAD_WAIT || t.status === TorrentStatus.SEED_WAIT;
        case 'paused':
          return t.status === TorrentStatus.STOPPED;
        case 'finished':
          return t.isFinished || t.percentDone >= 1.0;
        case 'error':
          return t.error !== 0;
        default:
          return true;
      }
    });
  }

  // 搜索关键字筛选
  if (state.filter.search.trim()) {
    const q = state.filter.search.trim().toLowerCase();
    list = list.filter((t) => t.name.toLowerCase().includes(q));
  }

  // 标签筛选
  if (state.selectedTag) {
    list = list.filter((t) => t.labels && t.labels.includes(state.selectedTag!));
  }

  // Tracker 筛选
  if (state.selectedTracker) {
    list = list.filter((t) => {
      if (!t.trackers || t.trackers.length === 0) return false;
      return t.trackers.some((tr) => {
        try {
          const u = new URL(tr.announce);
          return u.hostname.toLowerCase() === state.selectedTracker!.toLowerCase();
        } catch {
          return tr.announce.toLowerCase().includes(state.selectedTracker!.toLowerCase());
        }
      });
    });
  }

  // 排序
  const { sortBy, sortAsc } = state.filter;
  list = [...list].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'queuePosition') {
      cmp = (a.queuePosition ?? 999999) - (b.queuePosition ?? 999999);
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'percentDone') {
      cmp = a.percentDone - b.percentDone;
    } else if (sortBy === 'rateDownload') {
      cmp = a.rateDownload - b.rateDownload;
    } else if (sortBy === 'rateUpload') {
      cmp = a.rateUpload - b.rateUpload;
    } else if (sortBy === 'totalSize') {
      cmp = a.totalSize - b.totalSize;
    } else if (sortBy === 'uploadRatio') {
      cmp = a.uploadRatio - b.uploadRatio;
    } else if (sortBy === 'addedDate') {
      cmp = a.addedDate - b.addedDate;
    }
    return sortAsc ? cmp : -cmp;
  });

  return list;
});
