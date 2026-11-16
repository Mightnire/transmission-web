import { t } from '../locales';

/** 容量 / 速度 / 剩余时间 / 状态文本等展示格式化工具。 */
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
