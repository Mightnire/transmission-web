import { Torrent, SessionInfo, SessionStats } from './types';

class TransmissionRPC {
  private endpoint = '/transmission/rpc';
  private sessionId = '';
  private authHeader = '';

  constructor(endpoint?: string) {
    if (endpoint) this.endpoint = endpoint;
  }

  public setAuth(user: string, pass: string) {
    this.authHeader = 'Basic ' + btoa(`${user}:${pass}`);
  }

  private async request<T = any>(method: string, args: Record<string, any> = {}): Promise<T> {
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

    // 409 握手：提取 X-Transmission-Session-Id 并重试
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
      throw new Error(`RPC Request Failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`RPC Error: ${data.result}`);
    }

    return data.arguments as T;
  }

  // 获取种子列表 (轻量精简字段，极度省流量)
  public async getTorrents(ids?: number[]): Promise<Torrent[]> {
    const fields = [
      'id', 'name', 'status', 'totalSize', 'sizeWhenDone', 'leftUntilDone',
      'percentDone', 'downloadedEver', 'uploadedEver', 'corruptEver',
      'uploadRatio', 'rateDownload', 'rateUpload', 'peersConnected',
      'peersSendingToUs', 'peersGettingFromUs', 'eta', 'downloadDir',
      'error', 'errorString', 'addedDate', 'doneDate', 'isFinished', 'labels'
    ];

    const args: Record<string, any> = { fields };
    if (ids && ids.length > 0) args.ids = ids;

    const res = await this.request<{ torrents: Torrent[] }>('torrent-get', args);
    return res.torrents;
  }

  // 获取单个种子的详细文件、Peer与Tracker信息
  public async getTorrentDetail(id: number): Promise<Torrent | null> {
    const fields = [
      'id', 'name', 'files', 'fileStats', 'peers', 'trackerStats'
    ];
    const res = await this.request<{ torrents: Torrent[] }>('torrent-get', { fields, ids: [id] });
    return res.torrents[0] || null;
  }

  // 启停控制
  public async startTorrents(ids: number[]) {
    return this.request('torrent-start', { ids });
  }

  public async stopTorrents(ids: number[]) {
    return this.request('torrent-stop', { ids });
  }

  public async verifyTorrents(ids: number[]) {
    return this.request('torrent-verify', { ids });
  }

  public async reannounceTorrents(ids: number[]) {
    return this.request('torrent-reannounce', { ids });
  }

  public async removeTorrents(ids: number[], deleteLocalData = false) {
    return this.request('torrent-remove', { ids, 'delete-local-data': deleteLocalData });
  }

  // 添加种子 (支持磁力链接或 Base64 种子文件)
  public async addTorrent(options: { filename?: string; metainfo?: string; downloadDir?: string; paused?: boolean }) {
    const args: Record<string, any> = {};
    if (options.filename) args.filename = options.filename;
    if (options.metainfo) args.metainfo = options.metainfo;
    if (options.downloadDir) args['download-dir'] = options.downloadDir;
    if (options.paused !== undefined) args.paused = options.paused;
    return this.request('torrent-add', args);
  }

  // 文件优先级与选择 (精准受控)
  public async setFileWanted(id: number, wantedFiles: number[], unwantedFiles: number[]) {
    const args: Record<string, any> = { ids: [id] };
    if (wantedFiles.length > 0) args['files-wanted'] = wantedFiles;
    if (unwantedFiles.length > 0) args['files-unwanted'] = unwantedFiles;
    return this.request('torrent-set', args);
  }

  public async setFilePriority(id: number, priority: -1 | 0 | 1, fileIndices: number[]) {
    const args: Record<string, any> = { ids: [id] };
    if (priority === 1) args['priority-high'] = fileIndices;
    else if (priority === -1) args['priority-low'] = fileIndices;
    else args['priority-normal'] = fileIndices;
    return this.request('torrent-set', args);
  }

  // 全局会话信息与统计
  public async getSession(): Promise<SessionInfo> {
    return this.request<SessionInfo>('session-get');
  }

  public async setSession(args: Partial<SessionInfo>) {
    return this.request('session-set', args);
  }

  public async getSessionStats(): Promise<SessionStats> {
    return this.request<SessionStats>('session-stats');
  }
}

export const rpc = new TransmissionRPC();
