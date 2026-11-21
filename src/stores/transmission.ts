import { reactive, ref, computed } from 'vue';
import { Torrent, TorrentStatus, SessionInfo, SessionStats } from '../api/types';
import { rpc } from '../api/rpc';
import { t } from '../locales';
import { createDefaultColumns, loadSavedColumns, saveColumnsToStorage, type TableColumnConfig } from '../core/columns';
export type { TableColumnConfig } from '../core/columns';
export { formatBytes, formatSpeed, formatETA, getStatusText } from '../core/format';

export interface TorrentFilter {
  status: 'all' | 'active' | 'downloading' | 'seeding' | 'queued' | 'paused' | 'error' | 'finished';
  search: string;
  sortBy:
    | 'queuePosition'
    | 'status'
    | 'name'
    | 'percentDone'
    | 'rateDownload'
    | 'rateUpload'
    | 'totalSize'
    | 'addedDate'
    | 'doneDate'
    | 'activityDate'
    | 'downloadedEver'
    | 'uploadedEver'
    | 'leftUntilDone'
    | 'haveValid'
    | 'sizeWhenDone'
    | 'peersConnected'
    | 'webseedsSendingToUs'
    | 'secondsSeeding'
    | 'secondsDownloading'
    | 'bandwidthPriority'
    | 'isStalled'
    | 'metadataPercentComplete'
    | 'recheckProgress'
    | 'uploadRatio';
  sortAsc: boolean;
}

export interface UIPreferences {
  showTrackerGroup: boolean;
  showTagGroup: boolean;
  pollIntervalTorrents: number;
  pollIntervalStats: number;
}

export type ToastType = 'info' | 'success' | 'error';

export interface PromptDialogOptions {
  title: string;
  label?: string;
  value?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  confirmText?: string;
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => Promise<boolean | void> | boolean | void;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => Promise<boolean | void> | boolean | void;
}

export interface SpeedSample {
  time: number;
  down: number;
  up: number;
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

function loadDetailHeight(): number {
  const saved = Number(localStorage.getItem('detail_panel_height'));
  if (Number.isFinite(saved) && saved >= 180) return Math.min(saved, 900);
  return 380;
}

function getInitialViewMode(): 'table' | 'cards' {
  if (typeof window === 'undefined') return 'table';
  // 清理可能污染大屏的旧版单一 key
  localStorage.removeItem('view_mode');
  const isMobile = window.innerWidth < 768;
  const key = isMobile ? 'view_mode_mobile' : 'view_mode_desktop';
  const saved = localStorage.getItem(key) as ('table' | 'cards') | null;
  if (saved === 'table' || saved === 'cards') return saved;
  // 大屏设备绝对默认高效列表视图！手机默认卡片视图
  return isMobile ? 'cards' : 'table';
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
  ribbonTab: 'tasks' | 'transfer' | 'tools' | 'view' | 'torrentProps';
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
  batchTagsDialogOpen: boolean;
  locationDialogOpen: boolean;
  renameDialogOpen: boolean;
  confirmRemoveDialogOpen: boolean;
  removeTrashData: boolean;
  aboutDialogOpen: boolean;
  statsDialogOpen: boolean;
  toastMessage: string | null;
  toastType: ToastType;
  promptDialog: PromptDialogOptions | null;
  confirmDialog: ConfirmDialogOptions | null;
  fileMenuOpen: boolean;
  fileMenuTab: 'info' | 'stats' | 'add' | 'settings' | 'about';
  detailHeight: number;
  speedHistory: SpeedSample[];
  isPolling: boolean;
  viewMode: 'table' | 'cards';
  compactDensity: boolean;
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
  batchTagsDialogOpen: false,
  locationDialogOpen: false,
  renameDialogOpen: false,
  confirmRemoveDialogOpen: false,
  removeTrashData: false,
  aboutDialogOpen: false,
  statsDialogOpen: false,
  toastMessage: null,
  toastType: 'info',
  promptDialog: null,
  confirmDialog: null,
  fileMenuOpen: false,
  fileMenuTab: 'info',
  detailHeight: loadDetailHeight(),
  speedHistory: [],
  isPolling: false,
  viewMode: getInitialViewMode(),
  compactDensity: typeof window !== 'undefined' && localStorage.getItem('compact_density') === 'true',
});

if (typeof window !== 'undefined') {
  let lastIsMobile = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile !== lastIsMobile) {
      lastIsMobile = isMobile;
      const key = isMobile ? 'view_mode_mobile' : 'view_mode_desktop';
      const saved = localStorage.getItem(key) as ('table' | 'cards') | null;
      state.viewMode = saved === 'table' || saved === 'cards' ? saved : (isMobile ? 'cards' : 'table');
    }
  });
}

if (typeof window !== 'undefined') {
  (window as any).__APP_STATE__ = state;
}

export function saveColumns() {
  saveColumnsToStorage(state.columns);
}

export function resetColumns() {
  state.columns = createDefaultColumns();
  saveColumns();
}

export function saveUIPreferences() {
  localStorage.setItem('ui_preferences', JSON.stringify(state.uiPreferences));
  restartPolling();
}

let torrentTimer: any = null;
let statsTimer: any = null;

/**
 * 乐观更新保护层：
 * Transmission 的 RPC 返回后，服务端状态未必已经完成跃迁；若此时立刻用
 * 刚拉回的快照覆盖本地状态，界面会出现「已暂停 -> 正在做种 -> 已暂停」的
 * 闪烁。这里用短期 overrides 维持用户刚触发的状态，直到服务端返回可接受
 * 的确认状态或 TTL 到期。
 */
interface PendingStatusOverride {
  display: TorrentStatus;
  accept: TorrentStatus[];
  expires: number;
}

const PENDING_STATUS_TTL = 10_000;
const pendingStatus = new Map<number, PendingStatusOverride>();
const pendingRemoved = new Map<number, number>();

function trackPendingStatus(ids: number[], display: TorrentStatus, accept: TorrentStatus[], ttl = PENDING_STATUS_TTL) {
  const expires = Date.now() + ttl;
  for (const id of ids) pendingStatus.set(id, { display, accept, expires });
}

function clearPendingStatus(ids: number[]) {
  for (const id of ids) pendingStatus.delete(id);
}

function applyPendingState(list: Torrent[]): Torrent[] {
  const now = Date.now();
  const presentIds = new Set(list.map((t) => t.id));

  for (const torrent of list) {
    const pending = pendingStatus.get(torrent.id);
    if (!pending) continue;
    // 服务端已报错时不要再掩盖真实状态
    if (torrent.error || pending.accept.includes(torrent.status) || now > pending.expires) {
      pendingStatus.delete(torrent.id);
      continue;
    }
    torrent.status = pending.display;
    if (pending.display === TorrentStatus.STOPPED) {
      torrent.rateDownload = 0;
      torrent.rateUpload = 0;
    }
  }

  for (const id of pendingStatus.keys()) {
    if (!presentIds.has(id)) pendingStatus.delete(id);
  }

  for (const [id, expires] of pendingRemoved) {
    if (now > expires || !presentIds.has(id)) pendingRemoved.delete(id);
  }

  return pendingRemoved.size > 0 ? list.filter((t) => !pendingRemoved.has(t.id)) : list;
}

// 获取种子列表与刷新当前选中详情
let hasFullTorrentSnapshot = false;
let incrementalSupported = true;
let incrementalPolls = 0;

async function refreshActiveDetail() {
  if (state.selectedId === null || !state.detailOpen) return;
  const basic = state.torrents.find((t) => t.id === state.selectedId);
  const detail = await rpc.getTorrentDetail(state.selectedId);
  if (detail) {
    state.activeTorrentDetail = { ...(basic || {}), ...detail };
  }
}

async function fetchFullTorrents() {
  const list = await rpc.getTorrents();
  state.torrents = applyPendingState(list);
  hasFullTorrentSnapshot = true;
}

async function fetchIncrementalTorrents() {
  const response = await rpc.getTorrentsIncremental();
  const byId = new Map(state.torrents.map((torrent) => [torrent.id, torrent]));

  for (const update of response.torrents) {
    const existing = byId.get(update.id);
    if (existing) Object.assign(existing, update);
    else byId.set(update.id, update);
  }
  for (const id of response.removed) byId.delete(id);

  state.torrents = applyPendingState(Array.from(byId.values()));
}

export async function fetchTorrents() {
  try {
    const shouldFullFetch = !hasFullTorrentSnapshot || !incrementalSupported || incrementalPolls++ % 20 === 0;
    if (shouldFullFetch) {
      await fetchFullTorrents();
    } else {
      try {
        await fetchIncrementalTorrents();
      } catch (error) {
        // 某些旧版本或代理会拒绝 recently-active；失败一次后回退全量。
        incrementalSupported = false;
        hasFullTorrentSnapshot = false;
        await fetchFullTorrents();
      }
    }

    await refreshActiveDetail();
  } catch (e) {
    console.warn('Failed to fetch torrents:', e);
  }
}

// RPC 返回后短暂补拉一次，让服务端确认态尽快替换本地乐观态
function scheduleConfirmFetch() {
  setTimeout(() => {
    fetchTorrents();
  }, 700);
}

export async function fetchSession() {
  try {
    const [sess, stats] = await Promise.all([rpc.getSession(), rpc.getSessionStats()]);
    state.session = sess;
    state.stats = stats;
    recordSpeedSample(stats);
  } catch (e) {
    console.warn('Failed to fetch session:', e);
  }
}

const SPEED_HISTORY_LIMIT = 120;

function recordSpeedSample(stats: SessionStats) {
  const now = Date.now();
  const down = stats.downloadSpeed || 0;
  const up = stats.uploadSpeed || 0;
  const last = state.speedHistory[state.speedHistory.length - 1];

  // 轮询/手动刷新可能同时到达，1.5s 内只保留一个采样点
  if (last && now - last.time < 1500) {
    last.down = down;
    last.up = up;
    return;
  }

  state.speedHistory.push({ time: now, down, up });
  if (state.speedHistory.length > SPEED_HISTORY_LIMIT) {
    state.speedHistory.splice(0, state.speedHistory.length - SPEED_HISTORY_LIMIT);
  }
}

export function openFileMenu(tab?: 'info' | 'stats' | 'add' | 'settings' | 'about') {
  if (typeof tab === 'string') {
    state.fileMenuTab = tab;
  } else {
    state.fileMenuTab = 'info';
  }
  state.fileMenuOpen = true;
}

export function closeFileMenu() {
  state.fileMenuOpen = false;
}

export function toggleCompactDensity() {
  state.compactDensity = !state.compactDensity;
  localStorage.setItem('compact_density', String(state.compactDensity));
}

export function saveDetailHeight() {
  localStorage.setItem('detail_panel_height', String(Math.round(state.detailHeight)));
}

export function setDetailHeight(height: number) {
  const max = Math.max(360, Math.round(window.innerHeight * 0.75));
  state.detailHeight = Math.min(max, Math.max(180, Math.round(height)));
  saveDetailHeight();
}

export function toggleDetailHeight() {
  const expanded = Math.min(620, Math.round(window.innerHeight * 0.65));
  if (state.detailHeight < expanded - 40) {
    setDetailHeight(expanded);
  } else {
    setDetailHeight(380);
  }
}

export function restartPolling() {
  if (torrentTimer) clearInterval(torrentTimer);
  if (statsTimer) clearInterval(statsTimer);
  hasFullTorrentSnapshot = false;
  incrementalPolls = 0;
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

function selectionIds(): number[] {
  return state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId !== null ? [state.selectedId] : []);
}

// 核心操作：停止/暂停（乐观更新 + 服务端确认保护 + 失败回滚）
export async function stopTorrentsAction(ids: number[]) {
  if (!ids || ids.length === 0) return;

  const backups: { id: number; status: TorrentStatus; rateDownload: number; rateUpload: number }[] = [];
  for (const id of ids) {
    const t = state.torrents.find((x) => x.id === id);
    if (t) {
      backups.push({
        id: t.id,
        status: t.status,
        rateDownload: t.rateDownload,
        rateUpload: t.rateUpload,
      });
      t.status = TorrentStatus.STOPPED;
      t.rateDownload = 0;
      t.rateUpload = 0;
    }
  }

  trackPendingStatus(ids, TorrentStatus.STOPPED, [TorrentStatus.STOPPED]);
  try {
    await rpc.stopTorrents(ids);
    await fetchTorrents();
    scheduleConfirmFetch();
  } catch (err: any) {
    clearPendingStatus(ids);
    for (const b of backups) {
      const t = state.torrents.find((x) => x.id === b.id);
      if (t) {
        t.status = b.status;
        t.rateDownload = b.rateDownload;
        t.rateUpload = b.rateUpload;
      }
    }
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}

// 核心操作：开始/继续（乐观更新 + 服务端确认保护 + 失败回滚）
export async function startTorrentsAction(ids: number[]) {
  if (!ids || ids.length === 0) return;

  const backups: { id: number; status: TorrentStatus }[] = [];
  for (const id of ids) {
    const t = state.torrents.find((x) => x.id === id);
    if (t) {
      backups.push({ id: t.id, status: t.status });
      if (t.isFinished || (t.leftUntilDone !== undefined && t.leftUntilDone === 0) || t.percentDone >= 1) {
        t.status = TorrentStatus.SEED_WAIT;
        trackPendingStatus(
          [id],
          TorrentStatus.SEED_WAIT,
          [TorrentStatus.SEED_WAIT, TorrentStatus.SEED]
        );
      } else {
        t.status = TorrentStatus.DOWNLOAD_WAIT;
        trackPendingStatus(
          [id],
          TorrentStatus.DOWNLOAD_WAIT,
          [
            TorrentStatus.DOWNLOAD_WAIT,
            TorrentStatus.DOWNLOAD,
            TorrentStatus.CHECK_WAIT,
            TorrentStatus.CHECK,
          ]
        );
      }
    }
  }

  try {
    await rpc.startTorrents(ids);
    await fetchTorrents();
    scheduleConfirmFetch();
  } catch (err: any) {
    clearPendingStatus(ids);
    for (const b of backups) {
      const t = state.torrents.find((x) => x.id === b.id);
      if (t) {
        t.status = b.status;
      }
    }
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}

// 核心操作：跳过队列立即开始（乐观更新 + 服务端确认保护 + 失败回滚）
export async function startNowTorrentsAction(ids: number[]) {
  if (!ids || ids.length === 0) return;

  const backups: { id: number; status: TorrentStatus }[] = [];
  for (const id of ids) {
    const t = state.torrents.find((x) => x.id === id);
    if (t) {
      backups.push({ id: t.id, status: t.status });
      if (t.isFinished || (t.leftUntilDone !== undefined && t.leftUntilDone === 0) || t.percentDone >= 1) {
        t.status = TorrentStatus.SEED;
        trackPendingStatus(
          [id],
          TorrentStatus.SEED,
          [TorrentStatus.SEED, TorrentStatus.SEED_WAIT]
        );
      } else {
        t.status = TorrentStatus.DOWNLOAD;
        trackPendingStatus(
          [id],
          TorrentStatus.DOWNLOAD,
          [TorrentStatus.DOWNLOAD, TorrentStatus.DOWNLOAD_WAIT, TorrentStatus.CHECK]
        );
      }
    }
  }

  try {
    await rpc.torrentStartNow(ids);
    await fetchTorrents();
    scheduleConfirmFetch();
  } catch (err: any) {
    clearPendingStatus(ids);
    for (const b of backups) {
      const t = state.torrents.find((x) => x.id === b.id);
      if (t) {
        t.status = b.status;
      }
    }
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}

// 批量操作代理
export async function startSelected() {
  await startTorrentsAction(selectionIds());
}

export async function stopSelected() {
  await stopTorrentsAction(selectionIds());
}

export async function verifySelected(idsArg?: number[]): Promise<boolean> {
  const ids = idsArg?.length ? idsArg : selectionIds();
  if (ids.length === 0) return false;

  const backups: { id: number; status: TorrentStatus }[] = [];
  for (const id of ids) {
    const t = state.torrents.find((x) => x.id === id);
    if (t) {
      backups.push({ id: t.id, status: t.status });
      t.status = TorrentStatus.CHECK_WAIT;
    }
  }

  try {
    await rpc.verifyTorrents(ids);
    showToast(t('toast.verifyStarted'), 'success');
    // 校验是长任务：不做立即拉取（避免旧快照把 CHECK_WAIT 冲掉），交给轮询
    setTimeout(() => {
      fetchTorrents();
    }, 1500);
    return true;
  } catch (err: any) {
    for (const b of backups) {
      const t = state.torrents.find((x) => x.id === b.id);
      if (t) t.status = b.status;
    }
    showToast(t('common.failed', { error: describeError(err) }), 'error');
    return false;
  }
}

/** 校验本地数据前先弹出 Fluent 确认框 */
export function confirmVerifySelected(idsArg?: number[]) {
  const ids = idsArg?.length ? idsArg : selectionIds();
  if (ids.length === 0) return;

  openConfirm({
    title: t('dialog.verifyTitle'),
    message: t('dialog.verifyPrompt', { count: ids.length }),
    confirmText: t('dialog.verifyConfirm'),
    onConfirm: async () => verifySelected(ids),
  });
}

export async function removeSelected(deleteLocalData = false): Promise<boolean> {
  const ids = selectionIds();
  if (ids.length === 0) return false;

  const backupTorrents = state.torrents.filter((t) => ids.includes(t.id));
  const backupSelectedIds = [...state.selectedIds];
  const backupSelectedId = state.selectedId;
  const expires = Date.now() + PENDING_STATUS_TTL;
  for (const id of ids) pendingRemoved.set(id, expires);

  state.torrents = state.torrents.filter((t) => !ids.includes(t.id));
  state.selectedIds = [];
  state.selectedId = null;
  state.activeTorrentDetail = null;

  try {
    await rpc.removeTorrents(ids, deleteLocalData);
    await fetchTorrents();
    scheduleConfirmFetch();
    return true;
  } catch (err: any) {
    for (const id of ids) pendingRemoved.delete(id);
    state.torrents.push(...backupTorrents);
    state.selectedIds = backupSelectedIds;
    state.selectedId = backupSelectedId;
    showToast(t('common.failed', { error: describeError(err) }), 'error');
    return false;
  }
}

export async function reannounceSelected(idsArg?: number[]): Promise<boolean> {
  const ids = idsArg?.length ? idsArg : selectionIds();
  if (ids.length === 0) return false;
  try {
    await rpc.torrentReannounce(ids);
    showToast(t('toast.reannounced'), 'success');
    return true;
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
    return false;
  }
}

/**
 * 批量写入标签：把最终标签相同的任务合并成一次 torrent-set，
 * 结束时只拉取一次列表，避免 N 个任务触发 N 次 RPC + N 次全量刷新。
 */
export async function applyTorrentLabels(updates: { id: number; labels: string[] }[]): Promise<boolean> {
  if (updates.length === 0) return true;

  const backups = updates.map((update) => {
    const torrent = state.torrents.find((item) => item.id === update.id);
    return { id: update.id, labels: torrent?.labels ? [...torrent.labels] : [] };
  });

  // 本地乐观更新，界面立即反映新标签
  for (const update of updates) {
    const torrent = state.torrents.find((item) => item.id === update.id);
    if (torrent) torrent.labels = [...update.labels];
  }

  const groups = new Map<string, number[]>();
  for (const update of updates) {
    const key = JSON.stringify([...update.labels].sort());
    const list = groups.get(key);
    if (list) list.push(update.id);
    else groups.set(key, [update.id]);
  }

  try {
    for (const [key, ids] of groups) {
      await rpc.torrentSet({ ids, labels: JSON.parse(key) as string[] });
    }
    await fetchTorrents();
    showToast(t('toast.labelsApplied'), 'success');
    return true;
  } catch (err: any) {
    for (const backup of backups) {
      const torrent = state.torrents.find((item) => item.id === backup.id);
      if (torrent) torrent.labels = backup.labels;
    }
    showToast(t('common.failed', { error: describeError(err) }), 'error');
    return false;
  }
}

export async function toggleTurtleMode() {
  if (!state.session) return;
  const newMode = !state.session['alt-speed-enabled'];
  await rpc.setSession({ 'alt-speed-enabled': newMode });
  state.session['alt-speed-enabled'] = newMode;
}

let toastTimer: any = null;
export function showToast(msg: string, type: ToastType = 'info', duration = 2400) {
  state.toastMessage = msg;
  state.toastType = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toastMessage = null;
  }, type === 'error' ? Math.max(duration, 4000) : duration);
}

/** 把浏览器/网络层的英文异常转成可读的本地化错误信息 */
export function describeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(raw)) {
    return t('common.networkError');
  }
  return raw || t('common.unknownError');
}

export function openPrompt(options: PromptDialogOptions) {
  state.promptDialog = options;
}

export function closePrompt() {
  state.promptDialog = null;
}

export function openConfirm(options: ConfirmDialogOptions) {
  state.confirmDialog = options;
}

export function closeConfirm() {
  state.confirmDialog = null;
}

export function openConfirmRemove(trashData = false) {
  state.removeTrashData = trashData;
  state.confirmRemoveDialogOpen = true;
}

export function openLocationDialog() {
  state.locationDialogOpen = true;
}

export function openRenameDialog() {
  state.renameDialogOpen = true;
}

export function openAboutDialog() {
  openFileMenu('about');
}

export function openStatsDialog() {
  openFileMenu('stats');
}

// 通用跨环境剪贴板复制 (彻底解决 HTTP 路由器环境下 navigator.clipboard 为 undefined 的报错！)
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. 如果支持现代 Clipboard API 且在安全上下文中
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard.writeText failed, fallback to execCommand:', e);
    }
  }

  // 2. 经典不可破坏的兜底降级方案 (在 HTTP 192.168.2.1 物理路由器上 100% 成功)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback execCommand copy failed:', err);
    return false;
  }
}

// 统一磁链复制助手 (支持 Hash 兜底秒级合成，绝不静默装死)
export async function copyTorrentMagnet(id: number): Promise<boolean> {
  const target = state.torrents.find((t) => t.id === id);
  let magnet = target?.magnetLink;

  // 如果没有 magnetLink 但有 hashString，本地秒级组装标准 Magnet URI
  if (!magnet && target?.hashString) {
    magnet = `magnet:?xt=urn:btih:${target.hashString}&dn=${encodeURIComponent(target.name)}`;
    if (target.trackers && target.trackers.length > 0) {
      for (const tr of target.trackers) {
        if (tr.announce) {
          magnet += `&tr=${encodeURIComponent(tr.announce)}`;
        }
      }
    }
  }

  // 若仍为空，尝试异步向后端请求最新详情
  if (!magnet) {
    try {
      const detail = await rpc.getTorrentDetail(id);
      if (detail?.magnetLink) {
        magnet = detail.magnetLink;
      } else if (detail?.hashString) {
        magnet = `magnet:?xt=urn:btih:${detail.hashString}&dn=${encodeURIComponent(detail.name)}`;
      }
    } catch (e) {
      console.warn('Failed to fetch detail for magnet:', e);
    }
  }

  if (magnet) {
    const ok = await copyToClipboard(magnet);
    if (ok) {
      showToast(t('menu.magnetCopied'), 'success');
      return true;
    }
  }

  showToast(t('toast.copyFailed'), 'error');
  return false;
}

// 计算过滤与排序后的种子列表
export const filteredTorrents = computed(() => {
  let list = state.torrents;

  // 状态筛选
  if (state.filter.status !== 'all') {
    list = list.filter((t) => {
      switch (state.filter.status) {
        case 'active':
          return t.rateDownload > 0 || t.rateUpload > 0;
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
    } else if (sortBy === 'status') {
      const aScore = a.error !== 0 ? 100 : a.status;
      const bScore = b.error !== 0 ? 100 : b.status;
      cmp = aScore - bScore;
      if (cmp === 0) {
        cmp = (b.percentDone || 0) - (a.percentDone || 0);
      }
    } else {
      const aValue = (a as unknown as Record<string, unknown>)[sortBy];
      const bValue = (b as unknown as Record<string, unknown>)[sortBy];
      if (typeof aValue === 'string' || typeof bValue === 'string') {
        cmp = String(aValue ?? '').localeCompare(String(bValue ?? ''));
      } else {
        cmp = (Number(aValue) || 0) - (Number(bValue) || 0);
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  return list;
});

export function setViewMode(mode: 'table' | 'cards') {
  state.viewMode = mode;
  if (typeof window !== 'undefined') {
    const key = window.innerWidth < 768 ? 'view_mode_mobile' : 'view_mode_desktop';
    localStorage.setItem(key, mode);
  }
}

export function toggleViewMode() {
  setViewMode(state.viewMode === 'table' ? 'cards' : 'table');
}

export function selectAllTorrents() {
  const allIds = filteredTorrents.value.map((t) => t.id);
  if (state.selectedIds.length === allIds.length && allIds.length > 0) {
    state.selectedIds = [];
    state.selectedId = null;
  } else {
    state.selectedIds = [...allIds];
    state.selectedId = allIds[0] || null;
  }
}

export function clearSelection() {
  state.selectedIds = [];
  state.selectedId = null;
}

