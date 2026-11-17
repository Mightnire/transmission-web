// Transmission RPC Specification Types
// Fully compliant with official rpc-spec.md (Transmission 3.x / 4.x)

export enum TorrentStatus {
  STOPPED = 0,         // 暂停
  CHECK_WAIT = 1,      // 等待校验
  CHECK = 2,           // 正在校验
  DOWNLOAD_WAIT = 3,   // 等待下载
  DOWNLOAD = 4,        // 正在下载
  SEED_WAIT = 5,       // 等待做种
  SEED = 6,            // 正在做种
}

export enum Priority {
  LOW = -1,
  NORMAL = 0,
  HIGH = 1,
}

export enum SeedRatioMode {
  GLOBAL = 0,
  SINGLE = 1,
  UNLIMITED = 2,
}

export enum SeedIdleMode {
  GLOBAL = 0,
  SINGLE = 1,
  UNLIMITED = 2,
}

export interface TorrentFile {
  bytesCompleted: number;
  length: number;
  name: string;
  beginPiece?: number;
  endPiece?: number;
}

export interface TorrentFileStat {
  bytesCompleted: number;
  wanted: boolean;
  priority: Priority;
}

export interface TorrentPeer {
  address: string;
  bytesToClient?: number;
  bytesToPeer?: number;
  clientName: string;
  clientIsChoked: boolean;
  clientIsInterested: boolean;
  flagStr: string;
  isDownloadingFrom: boolean;
  isEncrypted: boolean;
  isIncoming: boolean;
  isUploadingTo: boolean;
  isUTP: boolean;
  peerIsChoked: boolean;
  peerIsInterested: boolean;
  port: number;
  progress: number;
  rateToClient: number;
  rateToPeer: number;
}

export interface TorrentTracker {
  announce: string;
  id: number;
  scrape: string;
  tier: number;
}

export interface TorrentTrackerStat {
  announce: string;
  announceState: number;
  downloadCount: number;
  hasAnnounced: boolean;
  hasScraped: boolean;
  host: string;
  id: number;
  isBackup: boolean;
  lastAnnouncePeerCount: number;
  lastAnnounceResult: string;
  lastAnnounceStartTime: number;
  lastAnnounceSucceeded: boolean;
  lastAnnounceTime: number;
  lastAnnounceTimedOut: boolean;
  lastScrapeResult: string;
  lastScrapeSucceeded: boolean;
  lastScrapeStartTime: number;
  lastScrapeTime: number;
  lastScrapeTimedOut: boolean;
  leecherCount: number;
  nextAnnounceTime: number;
  nextScrapeTime: number;
  scrape: string;
  scrapeState: number;
  seederCount: number;
  sitename?: string;
  downloaderCount?: number;
  tier: number;
}

// 完整种子字段定义 (按照 rpc-spec.md 3.3 Accessor 规范)
export interface Torrent {
  activityDate: number;
  addedDate: number;
  availability?: number[];
  bandwidthPriority: Priority;
  comment: string;
  corruptEver: number;
  creator: string;
  dateCreated: number;
  desiredAvailable?: number;
  doneDate: number;
  downloadDir: string;
  downloadedEver: number;
  downloadLimit: number;
  downloadLimited: boolean;
  editDate?: number;
  error: number;
  errorString: string;
  eta: number;
  etaIdle?: number;
  fileCount?: number;
  files?: TorrentFile[];
  fileStats?: TorrentFileStat[];
  group?: string;
  hashString: string;
  haveUnchecked: number;
  haveValid: number;
  honorsSessionLimits: boolean;
  id: number;
  isFinished: boolean;
  isPrivate: boolean;
  isStalled: boolean;
  labels: string[];
  leftUntilDone: number;
  magnetLink?: string;
  manualAnnounceTime?: number;
  maxConnectedPeers?: number;
  metadataPercentComplete: number;
  name: string;
  peerLimit?: number;
  peers?: TorrentPeer[];
  peersConnected: number;
  peersFrom?: {
    fromCache: number;
    fromDht: number;
    fromHolepunch?: number;
    fromIncoming: number;
    fromLpd: number;
    fromLtep: number;
    fromPex: number;
    fromTracker: number;
  };
  peersGettingFromUs: number;
  peersSendingToUs: number;
  percentComplete?: number;
  percentDone: number;
  pieces?: string;
  pieceCount: number;
  pieceSize: number;
  primaryMimeType?: string;
  priorities?: Priority[];
  queuePosition: number;
  rateDownload: number;
  rateUpload: number;
  recheckProgress: number;
  secondsDownloading: number;
  secondsSeeding: number;
  seedIdleLimit: number;
  seedIdleMode: SeedIdleMode;
  seedRatioLimit: number;
  seedRatioMode: SeedRatioMode;
  sequentialDownload?: boolean;
  sizeWhenDone: number;
  startDate: number;
  status: TorrentStatus;
  torrentFile?: string;
  totalSize: number;
  trackers?: TorrentTracker[];
  trackerStats?: TorrentTrackerStat[];
  uploadedEver: number;
  uploadLimit: number;
  uploadLimited: boolean;
  uploadRatio: number;
  wanted?: number[];
  webseeds?: string[];
  webseedsSendingToUs?: number;
}

// 种子属性设置参数 (rpc-spec.md 3.2 Mutator)
export interface TorrentSetArgs {
  ids: number[] | 'recently-active';
  bandwidthPriority?: Priority;
  downloadLimit?: number;
  downloadLimited?: boolean;
  'files-wanted'?: number[];
  'files-unwanted'?: number[];
  group?: string;
  honorsSessionLimits?: boolean;
  labels?: string[];
  location?: string;
  'peer-limit'?: number;
  'priority-high'?: number[];
  'priority-low'?: number[];
  'priority-normal'?: number[];
  queuePosition?: number;
  seedIdleLimit?: number;
  seedIdleMode?: SeedIdleMode;
  seedRatioLimit?: number;
  seedRatioMode?: SeedRatioMode;
  trackerAdd?: string[];
  trackerList?: string;
  trackerRemove?: number[];
  trackerReplace?: [number, string][];
  uploadLimit?: number;
  uploadLimited?: boolean;
}

// 添加种子参数 (rpc-spec.md 3.4)
export interface TorrentAddArgs {
  cookies?: string;
  'download-dir'?: string;
  filename?: string;
  metainfo?: string;
  paused?: boolean;
  'peer-limit'?: number;
  bandwidthPriority?: Priority;
  'files-wanted'?: number[];
  'files-unwanted'?: number[];
  'priority-high'?: number[];
  'priority-low'?: number[];
  'priority-normal'?: number[];
  labels?: string[];
}

export interface TorrentAddResult {
  'torrent-added'?: {
    hashString: string;
    id: number;
    name: string;
  };
  'torrent-duplicate'?: {
    hashString: string;
    id: number;
    name: string;
  };
}

// 全局 Session 配置参数 (rpc-spec.md 4.1)
export interface SessionInfo {
  'alt-speed-down': number;
  'alt-speed-enabled': boolean;
  'alt-speed-time-begin': number;
  'alt-speed-time-day': number;
  'alt-speed-time-enabled': boolean;
  'alt-speed-time-end': number;
  'alt-speed-up': number;
  'blocklist-enabled': boolean;
  'blocklist-size': number;
  'blocklist-url': string;
  'config-dir': string;
  'default-trackers'?: string;
  'dht-enabled': boolean;
  'download-dir': string;
  'download-dir-free-space'?: number;
  'download-queue-enabled': boolean;
  'download-queue-size': number;
  encryption: 'required' | 'preferred' | 'tolerated';
  'idle-seeding-limit': number;
  'idle-seeding-limit-enabled': boolean;
  'incomplete-dir': string;
  'incomplete-dir-enabled': boolean;
  'lpd-enabled': boolean;
  'peer-limit-global': number;
  'peer-limit-per-torrent': number;
  'peer-port': number;
  'peer-port-random-on-start': boolean;
  'pex-enabled': boolean;
  'port-forwarding-enabled': boolean;
  'queue-stalled-enabled': boolean;
  'queue-stalled-minutes': number;
  'rename-partial-files': boolean;
  'rpc-version': number;
  'rpc-version-minimum': number;
  'rpc-version-semver'?: string;
  'seed-queue-enabled': boolean;
  'seed-queue-size': number;
  'seedRatioLimit': number;
  'seedRatioLimited': boolean;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
  'start-added-torrents': boolean;
  'trash-original-torrent-files': boolean;
  'units'?: {
    speed_units: string[];
    speed_bytes: number;
    size_units: string[];
    size_bytes: number;
    memory_units: string[];
    memory_bytes: number;
  };
  'utp-enabled': boolean;
  version: string;
}

export type SessionSetArgs = Partial<SessionInfo>;

// 会话统计 (rpc-spec.md 4.2)
export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  uploadSpeed: number;
  'cumulative-stats': {
    downloadedBytes: number;
    filesAdded: number;
    secondsActive: number;
    sessionCount: number;
    uploadedBytes: number;
  };
  'current-stats': {
    downloadedBytes: number;
    filesAdded: number;
    secondsActive: number;
    sessionCount: number;
    uploadedBytes: number;
  };
}

// 磁盘可用空间 (rpc-spec.md 4.7)
export interface FreeSpaceResult {
  path: string;
  'size-bytes': number;
  total_size?: number;
}

// 端口连通性测试 (rpc-spec.md 4.4)
export interface PortTestResult {
  'port-is-open': boolean;
  ip_protocol?: string;
}

// 黑名单更新结果 (rpc-spec.md 4.3)
export interface BlocklistResult {
  'blocklist-size': number;
}

// 带宽组 (rpc-spec.md 4.8)
export interface BandwidthGroup {
  name: string;
  honorsSessionLimits: boolean;
  speed_limit_down_enabled: boolean;
  speed_limit_down: number;
  speed_limit_up_enabled: boolean;
  speed_limit_up: number;
}
