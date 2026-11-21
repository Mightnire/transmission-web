/**
 * 种子表格列定义与持久化。
 * 这里只处理“列配置”本身，不依赖 store，便于单测和复用。
 */
export interface TableColumnConfig {
  id: string;
  labelKey: string;
  visible: boolean;
  width: number;
  minWidth: number;
}

export const DEFAULT_COLUMNS: TableColumnConfig[] = [
  { id: 'status', labelKey: 'common.status', visible: true, width: 38, minWidth: 30 },
  { id: 'queuePosition', labelKey: 'common.queue', visible: false, width: 44, minWidth: 36 },
  { id: 'name', labelKey: 'common.name', visible: true, width: 300, minWidth: 160 },
  { id: 'size', labelKey: 'common.size', visible: true, width: 72, minWidth: 60 },
  { id: 'progress', labelKey: 'common.progress', visible: true, width: 120, minWidth: 90 },
  { id: 'statustext', labelKey: 'tableCols.statusText', visible: true, width: 100, minWidth: 70 },
  { id: 'downSpeed', labelKey: 'common.downSpeed', visible: true, width: 76, minWidth: 60 },
  { id: 'upSpeed', labelKey: 'common.upSpeed', visible: true, width: 76, minWidth: 60 },
  { id: 'eta', labelKey: 'common.eta', visible: true, width: 76, minWidth: 60 },
  { id: 'ratio', labelKey: 'common.ratio', visible: true, width: 60, minWidth: 50 },
  { id: 'peers', labelKey: 'common.peers', visible: true, width: 64, minWidth: 50 },
  { id: 'corrupt', labelKey: 'common.corrupt', visible: false, width: 85, minWidth: 60 },
  { id: 'downloaded', labelKey: 'tableCols.downloaded', visible: false, width: 88, minWidth: 70 },
  { id: 'uploaded', labelKey: 'tableCols.uploaded', visible: false, width: 88, minWidth: 70 },
  { id: 'remaining', labelKey: 'tableCols.remaining', visible: false, width: 88, minWidth: 70 },
  { id: 'haveValid', labelKey: 'tableCols.haveValid', visible: false, width: 88, minWidth: 70 },
  { id: 'sizeDone', labelKey: 'tableCols.sizeDone', visible: false, width: 88, minWidth: 70 },
  { id: 'addedDate', labelKey: 'tableCols.addedDate', visible: false, width: 132, minWidth: 100 },
  { id: 'doneDate', labelKey: 'tableCols.doneDate', visible: false, width: 132, minWidth: 100 },
  { id: 'activityDate', labelKey: 'tableCols.activityDate', visible: false, width: 132, minWidth: 100 },
  { id: 'seedingTime', labelKey: 'tableCols.seedingTime', visible: false, width: 92, minWidth: 70 },
  { id: 'downloadingTime', labelKey: 'tableCols.downloadingTime', visible: false, width: 92, minWidth: 70 },
  { id: 'peersDetail', labelKey: 'tableCols.peersDetail', visible: false, width: 92, minWidth: 70 },
  { id: 'webSeeds', labelKey: 'tableCols.webSeeds', visible: false, width: 82, minWidth: 60 },
  { id: 'priority', labelKey: 'tableCols.priority', visible: false, width: 72, minWidth: 60 },
  { id: 'metadata', labelKey: 'tableCols.metadata', visible: false, width: 80, minWidth: 60 },
  { id: 'stalled', labelKey: 'tableCols.stalled', visible: false, width: 64, minWidth: 50 },
  { id: 'savePath', labelKey: 'tableCols.savePath', visible: false, width: 180, minWidth: 120 },
  { id: 'labels', labelKey: 'tableCols.labels', visible: false, width: 110, minWidth: 70 },
  { id: 'hash', labelKey: 'tableCols.hash', visible: false, width: 130, minWidth: 100 },
  { id: 'private', labelKey: 'tableCols.private', visible: false, width: 64, minWidth: 50 },
  { id: 'recheck', labelKey: 'tableCols.recheck', visible: false, width: 90, minWidth: 70 },
  { id: 'downloadLimit', labelKey: 'tableCols.downloadLimit', visible: false, width: 82, minWidth: 60 },
  { id: 'uploadLimit', labelKey: 'tableCols.uploadLimit', visible: false, width: 82, minWidth: 60 },
  { id: 'error', labelKey: 'tableCols.error', visible: false, width: 180, minWidth: 120 },
  { id: 'comment', labelKey: 'tableCols.comment', visible: false, width: 180, minWidth: 120 },
  { id: 'creator', labelKey: 'tableCols.creator', visible: false, width: 120, minWidth: 80 },
];

const COLUMNS_STORAGE_KEY = 'torrent_table_columns';
const COLUMNS_VERSION_KEY = 'torrent_table_columns_version';
const COLUMNS_LAYOUT_VERSION = '2';

export function createDefaultColumns(): TableColumnConfig[] {
  return DEFAULT_COLUMNS.map((column) => ({ ...column }));
}

export function loadSavedColumns(): TableColumnConfig[] {
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (raw) {
      const parsed: TableColumnConfig[] = JSON.parse(raw);
      const savedVersion = localStorage.getItem(COLUMNS_VERSION_KEY);

      const resetWidths = savedVersion !== COLUMNS_LAYOUT_VERSION;
      const merged: TableColumnConfig[] = [];
      const seen = new Set<string>();

      // 保留用户保存的列顺序；新版本新增的列追加到末尾。
      for (const saved of parsed) {
        const def = DEFAULT_COLUMNS.find((column) => column.id === saved.id);
        if (!def || seen.has(def.id)) continue;
        seen.add(def.id);
        merged.push({
          ...def,
          visible: saved.visible,
          ...(resetWidths ? {} : { width: saved.width }),
        });
      }
      for (const def of DEFAULT_COLUMNS) {
        if (!seen.has(def.id)) merged.push({ ...def });
      }

      if (resetWidths) {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(COLUMNS_VERSION_KEY, COLUMNS_LAYOUT_VERSION);
      }
      return merged;
    }
  } catch (e) {
    console.warn('Failed to parse saved columns:', e);
  }
  localStorage.setItem(COLUMNS_VERSION_KEY, COLUMNS_LAYOUT_VERSION);
  return createDefaultColumns();
}

export function saveColumnsToStorage(columns: TableColumnConfig[]): void {
  localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
}
