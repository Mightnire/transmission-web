// Transmission RPC Client Implementation
// Fully compliant with official rpc-spec.md (Transmission 3.x & 4.x)

import {
  Torrent,
  TorrentSetArgs,
  TorrentAddArgs,
  TorrentAddResult,
  SessionInfo,
  SessionSetArgs,
  SessionStats,
  FreeSpaceResult,
  PortTestResult,
  BlocklistResult,
  BandwidthGroup,
  Priority,
  SeedRatioMode,
  SeedIdleMode,
} from './types';

export class TransmissionRPC {
  private endpoint = '/transmission/rpc';
  private sessionId = '';
  private authHeader = '';

  constructor(endpoint?: string) {
    if (endpoint) this.endpoint = endpoint;
  }

  public setAuth(user: string, pass: string) {
    this.authHeader = 'Basic ' + btoa(`${user}:${pass}`);
  }

  // 基础 RPC 通信原语
  public async request<T = any>(method: string, args: Record<string, any> = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['X-Transmission-Session-Id'] = this.sessionId;
    }
    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }

    let response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        method,
        arguments: args,
      }),
    });

    // 409 CSRF 握手：自动提取最新 X-Transmission-Session-Id 并重试
    if (response.status === 409) {
      const newSid = response.headers.get('X-Transmission-Session-Id');
      if (newSid) {
        this.sessionId = newSid;
        headers['X-Transmission-Session-Id'] = newSid;
        response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            method,
            arguments: args,
          }),
        });
      }
    }

    if (!response.ok) {
      throw new Error(`RPC Request Failed [${method}]: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`RPC Error [${method}]: ${data.result}`);
    }

    return (data.arguments || {}) as T;
  }

  // =========================================================================
  // 3.1 种子动作请求 (Torrent Action Requests)
  // =========================================================================

  public async torrentStart(ids?: number[] | string) {
    const args: Record<string, any> = {};
    if (ids !== undefined) args.ids = ids;
    return this.request('torrent-start', args);
  }

  public async torrentStartNow(ids?: number[] | string) {
    const args: Record<string, any> = {};
    if (ids !== undefined) args.ids = ids;
    return this.request('torrent-start-now', args);
  }

  public async torrentStop(ids?: number[] | string) {
    const args: Record<string, any> = {};
    if (ids !== undefined) args.ids = ids;
    return this.request('torrent-stop', args);
  }

  public async torrentVerify(ids?: number[] | string) {
    const args: Record<string, any> = {};
    if (ids !== undefined) args.ids = ids;
    return this.request('torrent-verify', args);
  }

  public async torrentReannounce(ids?: number[] | string) {
    const args: Record<string, any> = {};
    if (ids !== undefined) args.ids = ids;
    return this.request('torrent-reannounce', args);
  }

  // =========================================================================
  // 3.2 种子属性变更 (Torrent Mutator: torrent-set)
  // =========================================================================

  public async torrentSet(args: TorrentSetArgs) {
    return this.request('torrent-set', args);
  }

  public async setFileWanted(id: number, wantedFiles: number[], unwantedFiles: number[]) {
    const args: Record<string, any> = { ids: [id] };
    if (wantedFiles.length > 0) args['files-wanted'] = wantedFiles;
    if (unwantedFiles.length > 0) args['files-unwanted'] = unwantedFiles;
    return this.torrentSet(args as TorrentSetArgs);
  }

  public async setFilePriority(id: number, priority: Priority, fileIndices: number[]) {
    const args: Record<string, any> = { ids: [id] };
    if (priority === Priority.HIGH) args['priority-high'] = fileIndices;
    else if (priority === Priority.LOW) args['priority-low'] = fileIndices;
    else args['priority-normal'] = fileIndices;
    return this.torrentSet(args as TorrentSetArgs);
  }

  public async setTorrentBandwidthPriority(id: number, priority: Priority) {
    return this.torrentSet({ ids: [id], bandwidthPriority: priority });
  }

  public async setTorrentSpeedLimits(
    id: number,
    limits: { downloadLimit?: number; downloadLimited?: boolean; uploadLimit?: number; uploadLimited?: boolean }
  ) {
    return this.torrentSet({ ids: [id], ...limits });
  }

  public async setTorrentRatio(id: number, mode: SeedRatioMode, limit?: number) {
    const args: TorrentSetArgs = { ids: [id], seedRatioMode: mode };
    if (limit !== undefined) args.seedRatioLimit = limit;
    return this.torrentSet(args);
  }

  public async setTorrentIdleLimit(id: number, mode: SeedIdleMode, limit?: number) {
    const args: TorrentSetArgs = { ids: [id], seedIdleMode: mode };
    if (limit !== undefined) args.seedIdleLimit = limit;
    return this.torrentSet(args);
  }

  public async setTorrentTrackers(id: number, trackerList: string) {
    return this.torrentSet({ ids: [id], trackerList });
  }

  public async setTorrentLabels(ids: number[], labels: string[]) {
    return this.torrentSet({ ids, labels });
  }

  // =========================================================================
  // 3.3 种子属性查询 (Torrent Accessor: torrent-get)
  // =========================================================================

  public async torrentGet<T = Torrent>(fields: string[], ids?: number[] | string): Promise<{ torrents: T[]; removed?: number[] }> {
    const args: Record<string, any> = { fields };
    if (ids !== undefined) args.ids = ids;
    return this.request<{ torrents: T[]; removed?: number[] }>('torrent-get', args);
  }

  // 获取种子列表 (常用高频字段，优化带宽)
  public async getTorrents(ids?: number[] | string): Promise<Torrent[]> {
    const fields = [
      'id', 'name', 'status', 'totalSize', 'sizeWhenDone', 'leftUntilDone',
      'percentDone', 'downloadedEver', 'uploadedEver', 'corruptEver',
      'uploadRatio', 'rateDownload', 'rateUpload', 'peersConnected',
      'peersSendingToUs', 'peersGettingFromUs', 'eta', 'downloadDir',
      'error', 'errorString', 'addedDate', 'doneDate', 'isFinished', 'labels',
      'queuePosition', 'bandwidthPriority', 'recheckProgress',
      'downloadLimit', 'downloadLimited', 'uploadLimit', 'uploadLimited',
      'honorsSessionLimits', 'peer-limit', 'seedRatioLimit', 'seedRatioMode',
      'seedIdleLimit', 'seedIdleMode', 'magnetLink', 'trackers',
      'activityDate', 'comment', 'creator', 'haveValid',
      'isPrivate', 'isStalled', 'metadataPercentComplete',
      'secondsDownloading', 'secondsSeeding',
      'webseedsSendingToUs', 'hashString'
    ];
    const res = await this.torrentGet<Torrent>(fields, ids);
    return res.torrents;
  }

  // 获取超详细单个种子完整信息 (包含完整文件树、节点、Tracker、区块)
  public async getTorrentDetail(id: number): Promise<Torrent | null> {
    const fields = [
      'activityDate', 'addedDate', 'bandwidthPriority', 'comment', 'corruptEver',
      'creator', 'dateCreated', 'desiredAvailable', 'doneDate', 'downloadDir',
      'downloadedEver', 'downloadLimit', 'downloadLimited', 'editDate', 'error',
      'errorString', 'eta', 'etaIdle', 'files', 'fileStats', 'group', 'hashString',
      'haveUnchecked', 'haveValid', 'honorsSessionLimits', 'id', 'isFinished',
      'isPrivate', 'isStalled', 'labels', 'leftUntilDone', 'magnetLink',
      'manualAnnounceTime', 'maxConnectedPeers', 'metadataPercentComplete', 'name',
      'peer-limit', 'peers', 'peersConnected', 'peersFrom', 'peersGettingFromUs',
      'peersSendingToUs', 'percentComplete', 'percentDone', 'pieceCount',
      'pieceSize', 'priorities', 'queuePosition', 'rateDownload', 'rateUpload',
      'recheckProgress', 'secondsDownloading', 'secondsSeeding', 'seedIdleLimit',
      'seedIdleMode', 'seedRatioLimit', 'seedRatioMode', 'sizeWhenDone', 'startDate',
      'status', 'torrentFile', 'totalSize', 'trackers', 'trackerStats', 'uploadedEver',
      'uploadLimit', 'uploadLimited', 'uploadRatio', 'wanted', 'webseeds',
      'webseedsSendingToUs'
    ];
    const res = await this.torrentGet<Torrent>(fields, [id]);
    return res.torrents[0] || null;
  }

  // 增量同步模式 (recently-active)
  public async getRecentlyActive(fields: string[]): Promise<{ torrents: Torrent[]; removed: number[] }> {
    const res = await this.torrentGet<Torrent>(fields, 'recently-active');
    return {
      torrents: res.torrents || [],
      removed: res.removed || [],
    };
  }

  // =========================================================================
  // 3.4 添加种子 (Adding a Torrent: torrent-add)
  // =========================================================================

  public async torrentAdd(args: TorrentAddArgs): Promise<TorrentAddResult> {
    return this.request<TorrentAddResult>('torrent-add', args);
  }

  // =========================================================================
  // 3.5 移除种子 (Removing a Torrent: torrent-remove)
  // =========================================================================

  public async torrentRemove(ids: number[], deleteLocalData = false) {
    return this.request('torrent-remove', { ids, 'delete-local-data': deleteLocalData });
  }

  // =========================================================================
  // 3.6 移动存储位置 (Moving a Torrent: torrent-set-location)
  // =========================================================================

  public async torrentSetLocation(ids: number[], location: string, move = false) {
    return this.request('torrent-set-location', { ids, location, move });
  }

  // =========================================================================
  // 3.7 重命名路径 (Renaming a Torrent Path: torrent-rename-path)
  // =========================================================================

  public async torrentRenamePath(id: number, path: string, name: string): Promise<{ id: number; path: string; name: string }> {
    return this.request('torrent-rename-path', { ids: [id], path, name });
  }

  // =========================================================================
  // 4.1 全局会话配置 (Session Parameters: session-get & session-set)
  // =========================================================================

  public async sessionGet(): Promise<SessionInfo> {
    return this.request<SessionInfo>('session-get');
  }

  public async sessionSet(args: SessionSetArgs) {
    return this.request('session-set', args);
  }

  // =========================================================================
  // 4.2 会话统计 (Session Statistics: session-stats)
  // =========================================================================

  public async sessionStats(): Promise<SessionStats> {
    return this.request<SessionStats>('session-stats');
  }

  // =========================================================================
  // 4.3 黑名单更新 (Blocklist: blocklist-update)
  // =========================================================================

  public async blocklistUpdate(): Promise<BlocklistResult> {
    return this.request<BlocklistResult>('blocklist-update');
  }

  // =========================================================================
  // 4.4 端口连通性检查 (Port Checking: port-test)
  // =========================================================================

  public async portTest(ipProtocol?: 'ipv4' | 'ipv6'): Promise<PortTestResult> {
    const args: Record<string, any> = {};
    if (ipProtocol) args.ip_protocol = ipProtocol;
    return this.request<PortTestResult>('port-test', args);
  }

  // =========================================================================
  // 4.5 会话关闭 (Session Shutdown: session-close)
  // =========================================================================

  public async sessionClose() {
    return this.request('session-close');
  }

  // =========================================================================
  // 4.6 队列操作 (Queue Movement Requests)
  // =========================================================================

  public async queueMoveTop(ids: number[]) {
    return this.request('queue-move-top', { ids });
  }

  public async queueMoveUp(ids: number[]) {
    return this.request('queue-move-up', { ids });
  }

  public async queueMoveDown(ids: number[]) {
    return this.request('queue-move-down', { ids });
  }

  public async queueMoveBottom(ids: number[]) {
    return this.request('queue-move-bottom', { ids });
  }

  // =========================================================================
  // 4.7 检查目录磁盘可用空间 (Free Space: free-space)
  // =========================================================================

  public async freeSpace(path: string): Promise<FreeSpaceResult> {
    return this.request<FreeSpaceResult>('free-space', { path });
  }

  // =========================================================================
  // 4.8 带宽组 (Bandwidth Groups: group-get & group-set)
  // =========================================================================

  public async groupGet(names?: string[]): Promise<{ group: BandwidthGroup[] }> {
    const args: Record<string, any> = {};
    if (names) args.names = names;
    return this.request<{ group: BandwidthGroup[] }>('group-get', args);
  }

  public async groupSet(args: Partial<BandwidthGroup>) {
    return this.request('group-set', args);
  }
  // =========================================================================
  // 别名兼容层 (Backward-compatible Aliases)
  // =========================================================================
  public startTorrents(ids?: number[] | string) { return this.torrentStart(ids); }
  public stopTorrents(ids?: number[] | string) { return this.torrentStop(ids); }
  public verifyTorrents(ids?: number[] | string) { return this.torrentVerify(ids); }
  public removeTorrents(ids: number[], deleteLocalData = false) { return this.torrentRemove(ids, deleteLocalData); }
  public addTorrent(args: TorrentAddArgs) { return this.torrentAdd(args); }
  public getSession() { return this.sessionGet(); }
  public setSession(args: SessionSetArgs) { return this.sessionSet(args); }
  public getSessionStats() { return this.sessionStats(); }
}

export const rpc = new TransmissionRPC();
