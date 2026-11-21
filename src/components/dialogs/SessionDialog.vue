<template>
  <div
    class="md-dialog-overlay"
    :class="{ embedded: props.embedded }"
    v-if="props.embedded || state.sessionDialogOpen"
    @click.self="!props.embedded && (state.sessionDialogOpen = false)"
  >
    <div class="md-dialog session-dialog chrome-settings-root">
      <!-- 独立弹窗模式头部 -->
      <div class="dialog-header" v-if="!props.embedded">
        <div class="header-title-row">
          <FluentIcon name="settings" class="header-icon" />
          <h2 class="md-dialog-title">{{ t('session.title') }}</h2>
        </div>
        <button class="md-icon-button" @click="state.sessionDialogOpen = false" :title="t('common.close')">
          <FluentIcon name="close" />
        </button>
      </div>

      <!-- Chrome 风格一长页设置：左侧分类锚点导航 + 右侧连续滚动卡片流 -->
      <div class="chrome-settings-layout">
        <!-- 左侧分类锚点 (Sticky Section Nav) -->
        <nav class="chrome-nav" role="navigation" aria-label="Settings Categories">
          <button
            v-for="item in navSections"
            :key="item.id"
            class="chrome-nav-btn"
            :class="{ active: currentSection === item.id }"
            @click="scrollToSection(item.id)"
          >
            <FluentIcon :name="item.icon" class="chrome-nav-icon" />
            <span class="chrome-nav-text">{{ item.label }}</span>
          </button>
        </nav>

        <!-- 右侧连续滚动长页 (Continuous Scroll Content) -->
        <div class="chrome-scroll-container" ref="scrollContainer" @scroll.passive="onScroll">
          <!-- 0. 界面与偏好 (Web 前端设置整合) -->
          <section id="settings-sec-ui" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="palette" class="sec-icon" />
              <h3>{{ t('session.tabs.ui') }}</h3>
            </header>

            <div class="section-card">
              <!-- 1. 外观与语言 -->
              <h4 class="sub-title">{{ t('session.ui.general') }}</h4>
              <div class="form-row align-items-center">
                <span>{{ t('session.ui.language') }}</span>
                <select class="select-input fixed-width-select" v-model="form.appLocale">
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ru-RU">Русский</option>
                </select>
              </div>
              <div class="form-row mt-2">
                <label class="form-check">
                  <input type="checkbox" v-model="form.compactDensity" />
                  <span>{{ t('session.ui.compactDensity') }}</span>
                </label>
              </div>

              <div class="divider"></div>

              <!-- 2. 侧边栏分组显示 -->
              <h4 class="sub-title">{{ t('session.ui.sidebarGroups') }}</h4>
              <div class="form-vertical-switches">
                <label class="form-check">
                  <input type="checkbox" v-model="form.showTrackerGroup" />
                  <span>{{ t('session.ui.showTrackers') }}</span>
                </label>
                <label class="form-check">
                  <input type="checkbox" v-model="form.showTagGroup" />
                  <span>{{ t('session.ui.showTags') }}</span>
                </label>
                <label class="form-check">
                  <input type="checkbox" v-model="form.showFolderGroup" />
                  <span>{{ t('session.ui.showFolders') }}</span>
                </label>
              </div>

              <div class="divider"></div>

              <!-- 3. 数据刷新频率 -->
              <h4 class="sub-title">{{ t('session.ui.polling') }}</h4>
              <div class="form-row">
                <span>{{ t('session.ui.pollTorrents') }}</span>
                <div class="unit-group">
                  <input type="number" class="num-input fixed-num" v-model.number="form.pollIntervalTorrents" min="1" max="60" />
                  <span class="unit-label">{{ t('common.sec') }}</span>
                </div>
              </div>
              <div class="form-row">
                <span>{{ t('session.ui.pollStats') }}</span>
                <div class="unit-group">
                  <input type="number" class="num-input fixed-num" v-model.number="form.pollIntervalStats" min="1" max="60" />
                  <span class="unit-label">{{ t('common.sec') }}</span>
                </div>
              </div>

              <div class="divider"></div>

              <!-- 4. 保存路径显示别名替换 -->
              <div class="card-header-row">
                <div>
                  <h4 class="sub-title" style="margin-bottom: 4px;">{{ t('session.ui.pathAliases') }}</h4>
                  <p class="desc-text">{{ t('session.ui.pathAliasesDesc') }}</p>
                </div>
                <div class="header-btns">
                  <button type="button" class="md-btn md-btn-flat mini-btn" @click="autoDetectPaths" :title="t('session.ui.autoDetect')">
                    <FluentIcon name="bolt" class="btn-icon text-warning" />
                    <span>{{ t('session.ui.autoDetect') }}</span>
                  </button>
                  <button type="button" class="md-btn md-btn-flat mini-btn primary" @click="addPathAliasRule">
                    <FluentIcon name="add" class="btn-icon" />
                    <span>{{ t('session.ui.addRule') }}</span>
                  </button>
                </div>
              </div>

              <div class="alias-table-wrapper" v-if="form.pathAliases.length > 0">
                <table class="alias-table">
                  <thead>
                    <tr>
                      <th style="width: 46%;">{{ t('session.ui.originalPath') }}</th>
                      <th style="width: 28px; text-align: center;"></th>
                      <th style="width: 46%;">{{ t('session.ui.aliasName') }}</th>
                      <th class="col-actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(rule, idx) in form.pathAliases" :key="idx">
                      <td>
                        <input
                          type="text"
                          class="alias-input"
                          v-model="rule.from"
                          placeholder="/media/AiDisk_a1"
                        />
                      </td>
                      <td class="arrow-cell">→</td>
                      <td>
                        <input
                          type="text"
                          class="alias-input"
                          v-model="rule.to"
                          placeholder="U盘"
                        />
                      </td>
                      <td class="col-actions">
                        <button
                          type="button"
                          class="alias-delete-btn"
                          @click="removePathAliasRule(idx)"
                          :title="t('common.delete')"
                        >
                          <FluentIcon name="delete" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="empty-alias-hint" v-else>
                <FluentIcon name="drive_file_rename_outline" class="empty-icon text-muted" />
                <span>{{ t('session.ui.noAliases') }}</span>
              </div>
            </div>
          </section>

          <!-- 1. 速度与计划 (包含常规限速与计划任务) -->
          <section id="settings-sec-speed" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="speed" class="sec-icon" />
              <h3>{{ t('session.tabs.speed') }}</h3>
            </header>
            <div class="section-card">
              <h4 class="sub-title">{{ t('session.speed.normal') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.speedLimitDownEnabled" />
                  <span>{{ t('session.speed.downLimit') }}</span>
                </label>
                <div class="unit-group">
                  <input
                    type="number"
                    class="num-input"
                    v-model.number="form.speedLimitDown"
                    :disabled="!form.speedLimitDownEnabled"
                  />
                  <span class="unit-label">KB/s</span>
                </div>
              </div>

              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.speedLimitUpEnabled" />
                  <span>{{ t('session.speed.upLimit') }}</span>
                </label>
                <div class="unit-group">
                  <input
                    type="number"
                    class="num-input"
                    v-model.number="form.speedLimitUp"
                    :disabled="!form.speedLimitUpEnabled"
                  />
                  <span class="unit-label">KB/s</span>
                </div>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.speed.turtle') }}</h4>
              <div class="form-row">
                <span>{{ t('session.speed.turtleDown') }}</span>
                <div class="unit-group">
                  <input type="number" class="num-input" v-model.number="form.altSpeedDown" />
                  <span class="unit-label">KB/s</span>
                </div>
              </div>
              <div class="form-row">
                <span>{{ t('session.speed.turtleUp') }}</span>
                <div class="unit-group">
                  <input type="number" class="num-input" v-model.number="form.altSpeedUp" />
                  <span class="unit-label">KB/s</span>
                </div>
              </div>

              <div class="form-row mt-2">
                <label class="form-check">
                  <input type="checkbox" v-model="form.altSpeedTimeEnabled" />
                  <span class="font-bold">{{ t('session.speed.scheduleEnable') }}</span>
                </label>
              </div>

              <div class="sub-box" v-if="form.altSpeedTimeEnabled">
                <div class="form-row">
                  <span>{{ t('session.speed.scheduleTime') }}</span>
                  <div class="time-range-group">
                    <input type="time" class="time-input" v-model="timeBeginStr" />
                    <span>{{ t('session.speed.to') }}</span>
                    <input type="time" class="time-input" v-model="timeEndStr" />
                  </div>
                </div>

                <div class="form-row">
                  <span>{{ t('session.speed.days') }}</span>
                  <select class="select-input" v-model.number="form.altSpeedTimeDay">
                    <option :value="127">{{ t('session.speed.daysAll') }}</option>
                    <option :value="62">{{ t('session.speed.daysWork') }}</option>
                    <option :value="65">{{ t('session.speed.daysWeekend') }}</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. 队列与调度 (并发限制与停滞时间) -->
          <section id="settings-sec-queue" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="low_priority" class="sec-icon" />
              <h3>{{ t('session.tabs.queue') }}</h3>
            </header>
            <div class="section-card">
              <h4 class="sub-title">{{ t('session.queue.concurrency') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.downloadQueueEnabled" />
                  <span>{{ t('session.queue.downQueue') }}</span>
                </label>
                <input
                  type="number"
                  class="num-input"
                  v-model.number="form.downloadQueueSize"
                  :disabled="!form.downloadQueueEnabled"
                />
              </div>

              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.seedQueueEnabled" />
                  <span>{{ t('session.queue.seedQueue') }}</span>
                </label>
                <input
                  type="number"
                  class="num-input"
                  v-model.number="form.seedQueueSize"
                  :disabled="!form.seedQueueEnabled"
                />
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.queue.stalled') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.queueStalledEnabled" />
                  <span>{{ t('session.queue.stalledEnable') }}</span>
                </label>
              </div>
              <div class="form-row">
                <span style="padding-left: 24px;">{{ t('session.queue.stalledTime') }}</span>
                <div class="unit-group">
                  <input
                    type="number"
                    class="num-input"
                    v-model.number="form.queueStalledMinutes"
                    :disabled="!form.queueStalledEnabled"
                  />
                  <span class="unit-label">{{ t('session.queue.minutes') }}</span>
                </div>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.queue.seedRules') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.seedRatioLimited" />
                  <span>{{ t('session.queue.ratioLimit') }}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  class="num-input"
                  v-model.number="form.seedRatioLimit"
                  :disabled="!form.seedRatioLimited"
                />
              </div>

              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.idleSeedingLimitEnabled" />
                  <span>{{ t('session.queue.idleLimit') }}</span>
                </label>
                <div class="unit-group">
                  <input
                    type="number"
                    class="num-input"
                    v-model.number="form.idleSeedingLimit"
                    :disabled="!form.idleSeedingLimitEnabled"
                  />
                  <span class="unit-label">{{ t('session.queue.minutes') }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. 网络与协议 (P2P协议、端口与加密) -->
          <section id="settings-sec-network" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="lan" class="sec-icon" />
              <h3>{{ t('session.tabs.network') }}</h3>
            </header>
            <div class="section-card">
              <h4 class="sub-title">{{ t('session.network.peerPort') }}</h4>
              <div class="form-row">
                <span>{{ t('session.network.portLabel') }}</span>
                <div class="port-input-group">
                  <input type="number" class="num-input" v-model.number="form.peerPort" />
                  <button class="md-btn md-btn-flat btn-sm" @click="testPort" :disabled="testingPort">
                    <FluentIcon :name="testingPort ? 'sync' : 'network_check'" style="font-size: 16px;" />
                    <span>{{ testingPort ? t('session.network.portTesting') : t('session.network.testPort') }}</span>
                  </button>
                </div>
              </div>

              <div class="port-status-box" v-if="portStatus !== null">
                <FluentIcon :name="portStatus ? 'check_circle' : 'cancel'" :style="{ color: portStatus ? 'var(--md-success)' : 'var(--md-error)' }" />
                <span>{{ portStatus ? t('session.network.portOpen') : t('session.network.portClosed') }}</span>
              </div>

              <div class="form-row mt-2">
                <label class="form-check">
                  <input type="checkbox" v-model="form.peerPortRandomOnStart" />
                  <span>{{ t('session.network.randomPort') }}</span>
                </label>
              </div>

              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.portForwardingEnabled" />
                  <span>{{ t('session.network.upnp') }}</span>
                </label>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.network.protocols') }}</h4>
              <div class="form-vertical-switches">
                <div class="form-row">
                  <label class="form-check">
                    <input type="checkbox" v-model="form.dhtEnabled" />
                    <span>{{ t('session.network.dht') }}</span>
                  </label>
                </div>
                <div class="form-row">
                  <label class="form-check">
                    <input type="checkbox" v-model="form.pexEnabled" />
                    <span>{{ t('session.network.pex') }}</span>
                  </label>
                </div>
                <div class="form-row">
                  <label class="form-check">
                    <input type="checkbox" v-model="form.lpdEnabled" />
                    <span>{{ t('session.network.lpd') }}</span>
                  </label>
                </div>
                <div class="form-row">
                  <label class="form-check">
                    <input type="checkbox" v-model="form.utpEnabled" />
                    <span>{{ t('session.network.utp') }}</span>
                  </label>
                </div>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.network.encryption') }}</h4>
              <div class="form-row">
                <span>{{ t('session.network.encPolicy') }}</span>
                <select class="select-input" v-model="form.encryption">
                  <option value="tolerated">{{ t('session.network.encTolerated') }}</option>
                  <option value="preferred">{{ t('session.network.encPreferred') }}</option>
                  <option value="required">{{ t('session.network.encRequired') }}</option>
                </select>
              </div>

              <div class="form-row">
                <span>{{ t('session.network.peerGlobal') }}</span>
                <input type="number" class="num-input" v-model.number="form.peerLimitGlobal" />
              </div>
              <div class="form-row">
                <span>{{ t('session.network.peerPerTorrent') }}</span>
                <input type="number" class="num-input" v-model.number="form.peerLimitPerTorrent" />
              </div>
            </div>
          </section>

          <!-- 4. 存储与缓存 (目录、可用空间、写缓存调节) -->
          <section id="settings-sec-storage" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="hard_drive" class="sec-icon" />
              <h3>{{ t('session.tabs.storage') }}</h3>
            </header>
            <div class="section-card">
              <h4 class="sub-title">{{ t('session.storage.dirs') }}</h4>
              <div class="form-group">
                <label class="form-label">{{ t('session.storage.downloadDir') }}</label>
                <input type="text" class="text-input" v-model="form.downloadDir" @blur="checkFreeSpace" />
              </div>

              <div class="free-space-badge" v-if="freeSpaceBytes !== null">
                <FluentIcon name="storage" />
                <span>{{ t('session.storage.freeSpace', { size: formatBytes(freeSpaceBytes) }) }}</span>
              </div>

              <div class="form-group mt-2">
                <div class="form-row">
                  <label class="form-check">
                    <input type="checkbox" v-model="form.incompleteDirEnabled" />
                    <span>{{ t('session.storage.incompleteDir') }}</span>
                  </label>
                </div>
                <input
                  type="text"
                  class="text-input mt-1"
                  v-model="form.incompleteDir"
                  :disabled="!form.incompleteDirEnabled"
                />
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.storage.cacheTitle') }}</h4>
              <div class="form-row">
                <div>
                  <span>{{ t('session.storage.cacheSize') }}</span>
                  <div class="form-hint">{{ t('session.storage.cacheHint') }}</div>
                </div>
                <div class="unit-group">
                  <input type="number" class="num-input" v-model.number="form.cacheSizeMb" min="1" max="64" />
                  <span class="unit-label">MB</span>
                </div>
              </div>

              <div class="form-row mt-2">
                <label class="form-check">
                  <input type="checkbox" v-model="form.renamePartialFiles" />
                  <span>{{ t('session.storage.renamePartial') }}</span>
                </label>
              </div>

              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.trashOriginalTorrentFiles" />
                  <span>{{ t('session.storage.trashTorrent') }}</span>
                </label>
              </div>
            </div>
          </section>

          <!-- 5. 安全与自动化 (黑名单、默认Tracker、完成脚本) -->
          <section id="settings-sec-automation" class="chrome-section">
            <header class="section-title">
              <FluentIcon name="security" class="sec-icon" />
              <h3>{{ t('session.tabs.automation') }}</h3>
            </header>
            <div class="section-card">
              <h4 class="sub-title">{{ t('session.automation.blocklist') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.blocklistEnabled" />
                  <span>{{ t('session.automation.blocklistEnable') }}</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('session.automation.blocklistUrl') }}</label>
                <input type="text" class="text-input" v-model="form.blocklistUrl" :disabled="!form.blocklistEnabled" />
              </div>
              <div class="blocklist-action-row">
                <button class="md-btn md-btn-flat" @click="updateBlocklist" :disabled="updatingBlocklist || !form.blocklistEnabled">
                  <FluentIcon name="security" style="font-size: 16px;" />
                  <span>{{ updatingBlocklist ? t('session.automation.blocklistUpdating') : t('session.automation.blocklistUpdate') }}</span>
                </button>
                <span class="blocklist-size" v-if="state.session?.['blocklist-size']">
                  {{ t('session.automation.blocklistRules', { count: state.session['blocklist-size'] }) }}
                </span>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.automation.defaultTrackers') }}</h4>
              <div class="form-group">
                <label class="form-label">{{ t('session.automation.defaultTrackersHint') }}</label>
                <textarea
                  class="textarea-input"
                  rows="3"
                  v-model="form.defaultTrackers"
                  placeholder="udp://tracker.opentrackr.org:1337/announce&#10;http://tracker.openbittorrent.com:80/announce"
                ></textarea>
              </div>

              <div class="divider"></div>

              <h4 class="sub-title">{{ t('session.automation.doneScript') }}</h4>
              <div class="form-row">
                <label class="form-check">
                  <input type="checkbox" v-model="form.scriptTorrentDoneEnabled" />
                  <span>{{ t('session.automation.doneScriptEnable') }}</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('session.automation.doneScriptPath') }}</label>
                <input
                  type="text"
                  class="text-input"
                  v-model="form.scriptTorrentDoneFilename"
                  :disabled="!form.scriptTorrentDoneEnabled"
                  placeholder="/etc/storage/torrent_done.sh"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 底部保存/取消操作条 -->
      <div class="chrome-actions-bar">
        <button class="md-btn md-btn-flat" @click="handleCancel">
          {{ t('common.cancel') }}
        </button>
        <button class="md-btn md-btn-raised" @click="saveSettings">
          {{ t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import {
  state,
  fetchSession,
  formatBytes,
  showToast,
  describeError,
  saveUIPreferences,
} from '../../stores/transmission';
import { useEscapeKey } from '../../composables/useEscapeKey';
import { t, currentLocale, setLocale, LocaleKey } from '../../locales';
import { rpc } from '../../api/rpc';
import FluentIcon from '../common/FluentIcon.vue';

const props = defineProps<{ embedded?: boolean }>();
const emit = defineEmits<{ (e: 'done'): void }>();

type SectionId = 'ui' | 'speed' | 'queue' | 'network' | 'storage' | 'automation';
const currentSection = ref<SectionId>('ui');
const scrollContainer = ref<HTMLElement | null>(null);
let isManualScroll = false;

const navSections = computed(() => [
  { id: 'ui' as SectionId, label: t('session.tabs.ui'), icon: 'palette' },
  { id: 'speed' as SectionId, label: t('session.tabs.speed'), icon: 'speed' },
  { id: 'queue' as SectionId, label: t('session.tabs.queue'), icon: 'low_priority' },
  { id: 'network' as SectionId, label: t('session.tabs.network'), icon: 'lan' },
  { id: 'storage' as SectionId, label: t('session.tabs.storage'), icon: 'hard_drive' },
  { id: 'automation' as SectionId, label: t('session.tabs.automation'), icon: 'security' },
]);

function scrollToSection(id: SectionId) {
  currentSection.value = id;
  const container = scrollContainer.value;
  const target = document.getElementById(`settings-sec-${id}`);
  if (!container || !target) return;

  isManualScroll = true;
  const containerTop = container.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const scrollOffset = targetTop - containerTop + container.scrollTop - 10;

  container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
  setTimeout(() => {
    isManualScroll = false;
  }, 500);
}

function onScroll() {
  if (isManualScroll) return;
  const container = scrollContainer.value;
  if (!container) return;

  const sections: SectionId[] = ['ui', 'speed', 'queue', 'network', 'storage', 'automation'];

  // 接近底部时直接高亮最后一项
  if (container.scrollHeight - container.scrollTop - container.clientHeight < 24) {
    currentSection.value = sections[sections.length - 1];
    return;
  }

  const containerTop = container.getBoundingClientRect().top;

  for (let i = sections.length - 1; i >= 0; i--) {
    const s = sections[i];
    const el = document.getElementById(`settings-sec-${s}`);
    if (el) {
      const elTop = el.getBoundingClientRect().top;
      if (elTop - containerTop <= 90) {
        currentSection.value = s;
        break;
      }
    }
  }
}

function handleCancel() {
  if (props.embedded) {
    emit('done');
  } else {
    state.sessionDialogOpen = false;
  }
}

const testingPort = ref(false);
const portStatus = ref<boolean | null>(null);
const freeSpaceBytes = ref<number | null>(null);
const updatingBlocklist = ref(false);

const timeBeginStr = ref('00:00');
const timeEndStr = ref('00:00');

const form = reactive({
  // Web 前端专属偏好
  appLocale: (localStorage.getItem('locale') as LocaleKey) || 'zh-CN',
  compactDensity: state.compactDensity,
  showTrackerGroup: state.uiPreferences.showTrackerGroup,
  showTagGroup: state.uiPreferences.showTagGroup,
  showFolderGroup: state.uiPreferences.showFolderGroup,
  pollIntervalTorrents: state.uiPreferences.pollIntervalTorrents,
  pollIntervalStats: state.uiPreferences.pollIntervalStats,
  pathAliases: [] as Array<{ from: string; to: string }>,

  speedLimitDownEnabled: false,
  speedLimitDown: 0,
  speedLimitUpEnabled: false,
  speedLimitUp: 0,
  altSpeedDown: 50,
  altSpeedUp: 50,
  altSpeedTimeEnabled: false,
  altSpeedTimeBegin: 0,
  altSpeedTimeEnd: 0,
  altSpeedTimeDay: 127,
  downloadQueueEnabled: false,
  downloadQueueSize: 5,
  seedQueueEnabled: false,
  seedQueueSize: 5,
  queueStalledEnabled: true,
  queueStalledMinutes: 30,
  seedRatioLimited: false,
  seedRatioLimit: 2.0,
  idleSeedingLimitEnabled: false,
  idleSeedingLimit: 30,
  peerPort: 51413,
  peerPortRandomOnStart: false,
  portForwardingEnabled: true,
  dhtEnabled: true,
  pexEnabled: true,
  lpdEnabled: false,
  utpEnabled: true,
  encryption: 'preferred',
  peerLimitGlobal: 200,
  peerLimitPerTorrent: 50,
  downloadDir: '',
  incompleteDirEnabled: false,
  incompleteDir: '',
  cacheSizeMb: 16,
  renamePartialFiles: true,
  trashOriginalTorrentFiles: false,
  blocklistEnabled: false,
  blocklistUrl: '',
  defaultTrackers: '',
  scriptTorrentDoneEnabled: false,
  scriptTorrentDoneFilename: '',
});

// 时间分秒换算
watch(timeBeginStr, (val) => {
  if (!val) return;
  const [h, m] = val.split(':').map(Number);
  form.altSpeedTimeBegin = (h || 0) * 60 + (m || 0);
});

watch(timeEndStr, (val) => {
  if (!val) return;
  const [h, m] = val.split(':').map(Number);
  form.altSpeedTimeEnd = (h || 0) * 60 + (m || 0);
});

function minsToTimeStr(mins = 0) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function testPort() {
  testingPort.value = true;
  portStatus.value = null;
  try {
    const res = await rpc.portTest();
    portStatus.value = res['port-is-open'];
  } catch {
    portStatus.value = false;
  } finally {
    testingPort.value = false;
  }
}

async function checkFreeSpace() {
  if (!form.downloadDir) return;
  try {
    const res = await rpc.freeSpace(form.downloadDir);
    freeSpaceBytes.value = res['size-bytes'];
  } catch {
    freeSpaceBytes.value = null;
  }
}

async function updateBlocklist() {
  updatingBlocklist.value = true;
  try {
    const res = await rpc.blocklistUpdate();
    showToast(t('session.automation.blocklistSuccess', { count: res['blocklist-size'] }), 'success');
    await fetchSession();
  } catch (err: any) {
    showToast(t('session.automation.blocklistFailed', { error: describeError(err) }), 'error');
  } finally {
    updatingBlocklist.value = false;
  }
}

function initForm(s: any) {
  form.appLocale = (localStorage.getItem('locale') as LocaleKey) || 'zh-CN';
  form.compactDensity = state.compactDensity;
  form.showTrackerGroup = state.uiPreferences.showTrackerGroup;
  form.showTagGroup = state.uiPreferences.showTagGroup;
  form.showFolderGroup = state.uiPreferences.showFolderGroup;
  form.pollIntervalTorrents = state.uiPreferences.pollIntervalTorrents;
  form.pollIntervalStats = state.uiPreferences.pollIntervalStats;
  form.pathAliases = (state.uiPreferences.pathAliases || []).map((r) => ({ ...r }));

  form.speedLimitDownEnabled = s['speed-limit-down-enabled'] || false;
  form.speedLimitDown = s['speed-limit-down'] || 0;
  form.speedLimitUpEnabled = s['speed-limit-up-enabled'] || false;
  form.speedLimitUp = s['speed-limit-up'] || 0;
  form.altSpeedDown = s['alt-speed-down'] || 50;
  form.altSpeedUp = s['alt-speed-up'] || 50;
  form.altSpeedTimeEnabled = s['alt-speed-time-enabled'] || false;
  form.altSpeedTimeBegin = s['alt-speed-time-begin'] || 0;
  form.altSpeedTimeEnd = s['alt-speed-time-end'] || 0;
  form.altSpeedTimeDay = s['alt-speed-time-day'] ?? 127;

  timeBeginStr.value = minsToTimeStr(form.altSpeedTimeBegin);
  timeEndStr.value = minsToTimeStr(form.altSpeedTimeEnd);

  form.downloadQueueEnabled = s['download-queue-enabled'] || false;
  form.downloadQueueSize = s['download-queue-size'] || 5;
  form.seedQueueEnabled = s['seed-queue-enabled'] || false;
  form.seedQueueSize = s['seed-queue-size'] || 5;
  form.queueStalledEnabled = s['queue-stalled-enabled'] ?? true;
  form.queueStalledMinutes = s['queue-stalled-minutes'] || 30;
  form.seedRatioLimited = s['seedRatioLimited'] || false;
  form.seedRatioLimit = s['seedRatioLimit'] ?? 2.0;
  form.idleSeedingLimitEnabled = s['idle-seeding-limit-enabled'] || false;
  form.idleSeedingLimit = s['idle-seeding-limit'] || 30;

  form.peerPort = s['peer-port'] || 51413;
  form.peerPortRandomOnStart = s['peer-port-random-on-start'] || false;
  form.portForwardingEnabled = s['port-forwarding-enabled'] ?? true;
  form.dhtEnabled = s['dht-enabled'] ?? true;
  form.pexEnabled = s['pex-enabled'] ?? true;
  form.lpdEnabled = s['lpd-enabled'] || false;
  form.utpEnabled = s['utp-enabled'] ?? true;
  form.encryption = s['encryption'] || 'preferred';
  form.peerLimitGlobal = s['peer-limit-global'] || 200;
  form.peerLimitPerTorrent = s['peer-limit-per-torrent'] || 50;

  form.downloadDir = s['download-dir'] || '';
  form.incompleteDirEnabled = s['incomplete-dir-enabled'] || false;
  form.incompleteDir = s['incomplete-dir'] || '';
  form.cacheSizeMb = s['cache-size-mb'] || 16;
  form.renamePartialFiles = s['rename-partial-files'] ?? true;
  form.trashOriginalTorrentFiles = s['trash-original-torrent-files'] || false;

  form.blocklistEnabled = s['blocklist-enabled'] || false;
  form.blocklistUrl = s['blocklist-url'] || '';
  form.defaultTrackers = s['default-trackers'] || '';
  form.scriptTorrentDoneEnabled = (s as any)['script-torrent-done-enabled'] || false;
  form.scriptTorrentDoneFilename = (s as any)['script-torrent-done-filename'] || '';

  if (form.downloadDir) {
    checkFreeSpace();
  }
}

function addPathAliasRule() {
  form.pathAliases.push({ from: '', to: '' });
}

function removePathAliasRule(index: number) {
  form.pathAliases.splice(index, 1);
}

function autoDetectPaths() {
  const existingFroms = new Set(form.pathAliases.map((r) => r.from.trim()));
  const discovered = new Set<string>();

  if (state.session?.['download-dir']) {
    discovered.add(state.session['download-dir'].trim());
  }
  for (const t of state.torrents) {
    if (t.downloadDir && t.downloadDir.trim()) {
      discovered.add(t.downloadDir.trim());
    }
  }

  let added = 0;
  for (const p of discovered) {
    if (p && !existingFroms.has(p)) {
      form.pathAliases.push({ from: p, to: '' });
      existingFroms.add(p);
      added++;
    }
  }

  if (added > 0) {
    showToast(`已识别并添加 ${added} 条路径候选`, 'info');
  } else {
    showToast('未发现新的未配置路径', 'info');
  }
}

// 核心修复：仅在用户打开弹窗的一瞬间根据当前 session 同步一次表单！
watch(
  () => state.sessionDialogOpen,
  (open) => {
    if (open && state.session) {
      initForm(state.session);
    }
  }
);

let embeddedInitialized = false;
function initEmbeddedForm(session: any) {
  if (!props.embedded || embeddedInitialized || !session) return;
  initForm(session);
  embeddedInitialized = true;
}

onMounted(() => {
  initEmbeddedForm(state.session);
});

watch(
  () => state.session,
  (session) => {
    initEmbeddedForm(session);
  }
);

function isSafeAbsolutePath(pathStr: string): boolean {
  if (!pathStr) return false;
  const p = pathStr.trim();
  if (p.startsWith('/') && !p.startsWith('//')) return true;
  if (/^[a-zA-Z]:[\\/]/.test(p)) return true;
  return false;
}

async function saveSettings() {
  // 1. 同步并持久化前端 UI 偏好设置
  if (form.appLocale && form.appLocale !== currentLocale.value) {
    setLocale(form.appLocale);
  }

  if (form.compactDensity !== state.compactDensity) {
    state.compactDensity = form.compactDensity;
    localStorage.setItem('compact_density', String(form.compactDensity));
  }

  state.uiPreferences.showTrackerGroup = form.showTrackerGroup;
  state.uiPreferences.showTagGroup = form.showTagGroup;
  state.uiPreferences.showFolderGroup = form.showFolderGroup;
  state.uiPreferences.pollIntervalTorrents = Math.max(1, form.pollIntervalTorrents || 3);
  state.uiPreferences.pollIntervalStats = Math.max(1, form.pollIntervalStats || 3);
  state.uiPreferences.pathAliases = form.pathAliases.filter((r) => r.from && r.from.trim());
  saveUIPreferences();

  const payload: any = {
    'speed-limit-down-enabled': form.speedLimitDownEnabled,
    'speed-limit-down': form.speedLimitDown,
    'speed-limit-up-enabled': form.speedLimitUpEnabled,
    'speed-limit-up': form.speedLimitUp,
    'alt-speed-down': form.altSpeedDown,
    'alt-speed-up': form.altSpeedUp,
    'alt-speed-time-enabled': form.altSpeedTimeEnabled,
    'alt-speed-time-begin': form.altSpeedTimeBegin,
    'alt-speed-time-end': form.altSpeedTimeEnd,
    'alt-speed-time-day': form.altSpeedTimeDay,
    'download-queue-enabled': form.downloadQueueEnabled,
    'download-queue-size': form.downloadQueueSize,
    'seed-queue-enabled': form.seedQueueEnabled,
    'seed-queue-size': form.seedQueueSize,
    'queue-stalled-enabled': form.queueStalledEnabled,
    'queue-stalled-minutes': form.queueStalledMinutes,
    seedRatioLimited: form.seedRatioLimited,
    seedRatioLimit: form.seedRatioLimit,
    'idle-seeding-limit-enabled': form.idleSeedingLimitEnabled,
    'idle-seeding-limit': form.idleSeedingLimit,
    'peer-port': form.peerPort,
    'peer-port-random-on-start': form.peerPortRandomOnStart,
    'port-forwarding-enabled': form.portForwardingEnabled,
    'dht-enabled': form.dhtEnabled,
    'pex-enabled': form.pexEnabled,
    'lpd-enabled': form.lpdEnabled,
    'utp-enabled': form.utpEnabled,
    encryption: form.encryption,
    'peer-limit-global': form.peerLimitGlobal,
    'peer-limit-per-torrent': form.peerLimitPerTorrent,
    'cache-size-mb': form.cacheSizeMb,
    'rename-partial-files': form.renamePartialFiles,
    'trash-original-torrent-files': form.trashOriginalTorrentFiles,
    'incomplete-dir-enabled': form.incompleteDirEnabled,
    'blocklist-enabled': form.blocklistEnabled,
    'script-torrent-done-enabled': form.scriptTorrentDoneEnabled,
  };

  // 路径合法性校验
  if (form.downloadDir && form.downloadDir.trim()) {
    const trimmed = form.downloadDir.trim();
    if (isSafeAbsolutePath(trimmed)) {
      payload['download-dir'] = trimmed;
    } else {
      showToast(t('common.failed', { error: '下载保存路径必须为合法的绝对路径！' }), 'error');
      return;
    }
  }

  if (form.incompleteDirEnabled && form.incompleteDir && form.incompleteDir.trim()) {
    const trimmed = form.incompleteDir.trim();
    if (isSafeAbsolutePath(trimmed)) {
      payload['incomplete-dir'] = trimmed;
    } else {
      showToast(t('common.failed', { error: '未完成目录必须为合法的绝对路径！' }), 'error');
      return;
    }
  }

  if (form.blocklistEnabled && form.blocklistUrl && form.blocklistUrl.trim()) {
    payload['blocklist-url'] = form.blocklistUrl.trim();
  }
  if (form.defaultTrackers && form.defaultTrackers.trim()) {
    payload['default-trackers'] = form.defaultTrackers.trim();
  }
  if (form.scriptTorrentDoneFilename && form.scriptTorrentDoneFilename.trim()) {
    payload['script-torrent-done-filename'] = form.scriptTorrentDoneFilename.trim();
  }

  try {
    await rpc.setSession(payload);
    if (state.session) {
      Object.assign(state.session, payload);
    }
    state.sessionDialogOpen = false;
    await fetchSession();
    if (props.embedded) emit('done');
    showToast(t('toast.saved'), 'success');
  } catch (err: any) {
    showToast(t('common.failed', { error: describeError(err) }), 'error');
  }
}

useEscapeKey(() => {
  if (state.sessionDialogOpen && !props.embedded) {
    state.sessionDialogOpen = false;
  }
});
</script>

<style scoped>
.session-dialog {
  width: 820px;
  max-width: 95vw;
  height: 82vh;
  max-height: 850px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--fluent-border-subtle);
  flex-shrink: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: var(--fluent-accent);
}

.session-dialog .md-dialog-title {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--md-text-primary);
}

/* Chrome 风格双栏布局：左侧导航 + 右侧连续滚动 */
.chrome-settings-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chrome-nav {
  width: 176px;
  flex-shrink: 0;
  padding: 14px 8px;
  background-color: var(--fluent-bg-subtle);
  border-right: 1px solid var(--fluent-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100%;
}

.chrome-nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.chrome-nav-btn:hover {
  color: var(--md-text-primary);
  background-color: var(--fluent-bg-hover);
}

.chrome-nav-btn.active {
  color: var(--fluent-accent);
  background-color: var(--fluent-bg-canvas);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chrome-nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.chrome-nav-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧连续滚动内容区 */
.chrome-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 18px 26px 40px;
  scroll-behavior: smooth;
}

.chrome-section {
  margin-bottom: 28px;
  scroll-margin-top: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.section-title h3 {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fluent-accent);
  margin: 0;
}

.sec-icon {
  font-size: 18px;
  color: var(--fluent-accent);
}

.section-card {
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.sub-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--md-text-primary);
  margin: 14px 0 8px;
  letter-spacing: 0.01em;
}

.sub-title:first-child {
  margin-top: 0;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
}

.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-text-secondary);
  margin-bottom: 4px;
}

.form-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
}

.form-check input[type="checkbox"] {
  cursor: pointer;
}

.form-vertical-switches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-hint {
  font-size: 11px;
  color: var(--md-text-secondary);
  margin-top: 2px;
}

.unit-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.unit-label {
  font-size: 11px;
  color: var(--md-text-secondary);
}

.num-input {
  width: 90px;
  padding: 4px 8px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  text-align: right;
  font-family: var(--font-mono);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.num-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.num-input:disabled {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.text-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.text-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.text-input:disabled {
  background-color: var(--fluent-bg-subtle);
  color: var(--md-text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.textarea-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  box-sizing: border-box;
  font-family: var(--font-mono);
  font-size: 11px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.textarea-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.select-input {
  padding: 4px 8px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.select-input:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.port-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.port-status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 4px;
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  margin-top: 6px;
}

.free-space-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 120, 212, 0.08);
  border: 1px solid rgba(0, 120, 212, 0.2);
  border-radius: 4px;
  color: var(--fluent-accent);
}

.sub-box {
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 6px;
}

.time-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 3px 6px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-family: var(--font-mono);
}

.divider {
  height: 1px;
  background-color: var(--fluent-border-subtle);
  margin: 14px 0;
}

.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.font-bold { font-weight: 600; }

.blocklist-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.blocklist-size {
  font-size: 12px;
  color: var(--md-text-secondary);
}

.chrome-actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 20px;
  border-top: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-canvas);
  flex-shrink: 0;
}

/* 嵌入 Backstage 时的样式 */
.md-dialog-overlay.embedded {
  position: static;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  padding: 0;
  background: transparent;
  overflow: hidden;
}

.md-dialog-overlay.embedded .chrome-settings-root {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  border: none;
  box-shadow: none;
  border-radius: 0;
  background: transparent;
  animation: none !important;
  transform: none !important;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.md-dialog-overlay.embedded .chrome-scroll-container {
  padding: 16px 28px 48px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .session-dialog {
    width: 100%;
    max-width: 100vw;
    height: 100%;
    margin: 0;
  }

  .chrome-settings-layout {
    flex-direction: column !important;
    height: 100%;
    min-height: 0;
  }

  .chrome-nav {
    width: 100% !important;
    height: auto !important;
    max-height: 48px;
    position: static !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    border-right: none !important;
    border-bottom: 1px solid var(--fluent-border-subtle) !important;
    padding: 6px 10px !important;
    gap: 8px !important;
    flex-shrink: 0 !important;
    -webkit-overflow-scrolling: touch;
  }

  .chrome-nav-btn {
    white-space: nowrap !important;
    padding: 6px 12px !important;
    font-size: 12px !important;
    flex-shrink: 0 !important;
  }

  .chrome-scroll-container {
    flex: 1 !important;
    min-height: 0 !important;
    padding: 14px 16px 36px !important;
    overflow-y: auto !important;
  }

  .form-row {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }

  .unit-group {
    margin-left: auto;
  }
}

/* 界面与偏好卡片规整样式 */
.fixed-width-select {
  width: 260px;
  max-width: 100%;
}

.fixed-num {
  width: 70px;
}

.form-vertical-switches {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.form-vertical-switches .form-check {
  font-size: 13px;
  color: var(--fluent-text-primary);
}

/* 路径替换别名表格与卡片样式 */
.desc-text {
  font-size: 12px;
  color: var(--fluent-text-muted);
  margin: 0;
  line-height: 1.4;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.header-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mini-btn {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-subtle);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: var(--fluent-bg-canvas);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-btn:hover {
  background-color: var(--fluent-bg-hover);
}

.mini-btn.primary {
  color: var(--fluent-accent);
  border-color: rgba(0, 120, 212, 0.35);
  background-color: rgba(0, 120, 212, 0.06);
}

.mini-btn.primary:hover {
  background-color: rgba(0, 120, 212, 0.12);
}

.btn-icon {
  font-size: 14px;
}

.alias-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background-color: var(--fluent-bg-canvas);
}

.alias-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.alias-table th {
  background-color: var(--fluent-bg-subtle);
  color: var(--fluent-text-muted);
  text-align: left;
  padding: 6px 10px;
  font-weight: 600;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.alias-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  vertical-align: middle;
}

.alias-table tr:last-child td {
  border-bottom: none;
}

.arrow-cell {
  width: 24px;
  text-align: center;
  color: var(--fluent-text-muted);
  font-weight: bold;
}

.alias-input {
  width: 100%;
  box-sizing: border-box;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  font-size: 12px;
  color: var(--fluent-text-primary);
  background-color: var(--fluent-bg-canvas);
}

.alias-input:focus {
  outline: none;
  border-color: var(--fluent-accent);
}

.col-actions {
  width: 36px;
  text-align: center;
}

.alias-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--fluent-text-muted);
  padding: 4px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.alias-delete-btn:hover {
  color: var(--md-danger, #d13438);
  background-color: rgba(209, 52, 56, 0.1);
}

.empty-alias-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--fluent-text-muted);
  font-size: 12px;
  border: 1px dashed var(--fluent-border-subtle);
  border-radius: 4px;
}
</style>
