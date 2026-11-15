// Transmission 官方 RPC 规范数据模型

export enum TorrentStatus {
  STOPPED = 0,
  CHECK_WAIT = 1,
  CHECK = 2,
  DOWNLOAD_WAIT = 3,
  DOWNLOAD = 4,
  SEED_WAIT = 5,
  SEED = 6,
}

export interface TorrentFile {
  name: string;
  bytesCompleted: number;
  length: number;
}

export interface TorrentFileStat {
  bytesCompleted: number;
  wanted: boolean;
  priority: -1 | 0 | 1; // -1: Low, 0: Normal, 1: High
}

export interface TorrentPeer {
  address: string;
  clientName: string;
  progress: number;
  rateToClient: number;
  rateToPeer: number;
  isUTP: boolean;
  flagStr: string;
}

export interface TorrentTracker {
  id: number;
  announce: string;
  scrape: string;
  tier: number;
}

export interface TorrentTrackerStat {
  id: number;
  announce: string;
  announceState: number;
  hasAnnounced: boolean;
  lastAnnounceResult: string;
  lastAnnouncePeerCount: number;
  seederCount: number;
  leecherCount: number;
}

export interface Torrent {
  id: number;
  name: string;
  status: TorrentStatus;
  totalSize: number;
  sizeWhenDone: number;
  leftUntilDone: number;
  percentDone: number;       // 真正校验通过的有效数据百分比 (0.0 ~ 1.0)
  downloadedEver: number;    // 累计网络传输消耗流量
  uploadedEver: number;
  corruptEver: number;       // 校验失败丢弃的坏块流量
  uploadRatio: number;
  rateDownload: number;
  rateUpload: number;
  peersConnected: number;
  peersSendingToUs: number;
  peersGettingFromUs: number;
  eta: number;               // 剩余秒数 (-1 为不可用, -2 为未知)
  downloadDir: string;
  error: number;
  errorString: string;
  addedDate: number;
  doneDate: number;
  isFinished: boolean;
  labels: string[];
  files?: TorrentFile[];
  fileStats?: TorrentFileStat[];
  peers?: TorrentPeer[];
  trackerStats?: TorrentTrackerStat[];
}

export interface SessionInfo {
  version: string;
  rpcVersion: number;
  downloadDir: string;
  speedLimitDown: number;
  speedLimitDownEnabled: boolean;
  speedLimitUp: number;
  speedLimitUpEnabled: boolean;
  altSpeedDown: number;
  altSpeedUp: number;
  altSpeedEnabled: boolean; // 龟速模式 Turtle Mode
  port: number;
  portIsOpen: boolean;
}

export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  torrentCount: number;
  pausedTorrentCount: number;
  cumulativeStats: {
    downloadedBytes: number;
    uploadedBytes: number;
  };
}
