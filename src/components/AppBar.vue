<template>
  <header class="fluent-ribbon-root" :class="{ 'ribbon-collapsed': isRibbonCollapsed }" @click="closeAllMenus">
    <!-- 1. 顶层：窗口标题与 Fluent Ribbon 选项卡栏 (高度 36px) -->
    <div class="ribbon-header-row">
      <!-- 侧边栏切换按钮 (汉堡菜单) -->
      <button
        class="fluent-tool-btn hamburger-btn"
        @click.stop="toggleSidebar"
        :title="t('app.toggleSidebar')"
      >
        <span class="material-icons">menu</span>
      </button>

      <!-- 应用标题 / 品牌标识 -->
      <div class="fluent-brand">
        <span class="material-icons brand-icon">cloud_download</span>
        <span class="brand-text">Transmission</span>
      </div>

      <!-- Ribbon 选项卡列表 (桌面端展示) -->
      <nav class="ribbon-tabs desktop-only">
        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tasks' && !isRibbonCollapsed }"
          @click.stop="selectTab('tasks')"
        >
          <span class="material-icons tab-icon">home</span>
          <span class="tab-text">{{ t('ribbon.tabs.tasks') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          v-if="isQueueEnabled"
          :class="{ active: currentTab === 'queue' && !isRibbonCollapsed }"
          @click.stop="selectTab('queue')"
        >
          <span class="material-icons tab-icon">low_priority</span>
          <span class="tab-text">{{ t('ribbon.tabs.queue') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'bandwidth' && !isRibbonCollapsed }"
          @click.stop="selectTab('bandwidth')"
        >
          <span class="material-icons tab-icon">speed</span>
          <span class="tab-text">{{ t('ribbon.tabs.bandwidth') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tools' && !isRibbonCollapsed }"
          @click.stop="selectTab('tools')"
        >
          <span class="material-icons tab-icon">build</span>
          <span class="tab-text">{{ t('ribbon.tabs.tools') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'view' && !isRibbonCollapsed }"
          @click.stop="selectTab('view')"
        >
          <span class="material-icons tab-icon">tune</span>
          <span class="tab-text">{{ t('ribbon.tabs.view') }}</span>
        </button>

        <!-- 上下文标签页：类似 Word 图片格式 (选中种子时高亮出现) -->
        <button
          class="ribbon-tab-btn contextual-tab"
          v-if="hasSelection"
          :class="{ active: currentTab === 'torrentProps' && !isRibbonCollapsed }"
          @click.stop="selectTab('torrentProps')"
          :title="t('ribbon.tabs.torrentProps')"
        >
          <span class="material-icons tab-icon">tune</span>
          <span class="tab-text">{{ t('ribbon.tabs.torrentProps') }}</span>
        </button>
      </nav>

      <!-- 右侧：系统状态与快捷工具 -->
      <div class="ribbon-sys-tools">
        <!-- 视图切换 (卡片 / 表格) -->
        <button
          class="fluent-tool-btn"
          @click="toggleViewMode"
          :title="state.viewMode === 'table' ? t('common.cardsView') : t('common.tableView')"
        >
          <span class="material-icons">{{ state.viewMode === 'table' ? 'view_agenda' : 'table_chart' }}</span>
        </button>

        <!-- 乌龟临时限速开关 -->
        <button
          class="fluent-tool-btn"
          :class="{ 'btn-active-turtle': state.session?.['alt-speed-enabled'] }"
          @click="toggleTurtleMode"
          :title="t('toolbar.turtle')"
        >
          <span class="material-icons">speed</span>
        </button>

        <!-- 全局首选项 -->
        <button class="fluent-tool-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
          <span class="material-icons">settings</span>
        </button>

        <!-- 主题切换 -->
        <button class="fluent-tool-btn" @click="toggleTheme" :title="t('app.toggleTheme')">
          <span class="material-icons">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <!-- 语言选择 (图标下拉菜单) -->
        <div class="lang-dropdown-wrapper">
          <button
            class="fluent-tool-btn"
            @click.stop="toggleMenu('lang', $event)"
            :title="t('app.language')"
          >
            <span class="material-icons">translate</span>
          </button>
        </div>

        <!-- Ribbon 展开/折叠图钉按钮 (支持 Ctrl+F1) -->
        <button
          class="fluent-tool-btn toggle-ribbon-btn desktop-only"
          @click="toggleRibbonCollapse"
          :title="isRibbonCollapsed ? t('ribbon.expand') : t('ribbon.collapse')"
        >
          <span class="material-icons">{{ isRibbonCollapsed ? 'expand_more' : 'expand_less' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. 第二层：Fluent 功能区画板 (Ribbon Command Canvas) -->
    <div class="ribbon-body desktop-only" v-show="!isRibbonCollapsed">
      <!-- 2.1 任务标签页 (Tasks) -->
      <div class="ribbon-tab-pane" v-if="currentTab === 'tasks'">
        <!-- 基础操作组 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 添加任务 (大按钮) -->
            <button class="fluent-btn-large primary-btn" @click="state.addDialogOpen = true" :title="t('toolbar.addTitle')">
              <span class="material-icons large-icon">add_circle</span>
              <span class="btn-caption">{{ t('toolbar.add') }}</span>
            </button>

            <!-- 开始 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn"
                :disabled="state.torrents.length === 0"
                @click="handleStart"
                :title="hasSelection ? t('toolbar.start') : t('toolbar.startAll')"
              >
                <span class="material-icons text-success">play_arrow</span>
                <span>{{ hasSelection ? t('toolbar.start') : t('toolbar.startAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('start', $event)"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
            </div>

            <!-- 暂停 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn"
                :disabled="state.torrents.length === 0"
                @click="handleStop"
                :title="hasSelection ? t('toolbar.pause') : t('toolbar.pauseAll')"
              >
                <span class="material-icons text-warning">pause</span>
                <span>{{ hasSelection ? t('toolbar.pause') : t('toolbar.pauseAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('stop', $event)"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
            </div>

            <!-- 删除 (Split Button) -->
            <div class="fluent-split-btn">
              <button
                class="split-main-btn btn-danger"
                :disabled="!hasSelection"
                @click="handleRemove(false)"
                :title="t('toolbar.deleteTitle')"
              >
                <span class="material-icons text-danger">delete</span>
                <span>{{ t('toolbar.delete') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="!hasSelection"
                @click.stop="toggleMenu('delete', $event)"
              >
                <span class="material-icons">arrow_drop_down</span>
              </button>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.basic') }}</div>
        </div>

        <!-- 校验与链接组 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 重新校验 -->
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="verifySelected"
              :title="t('toolbar.verifyTitle')"
            >
              <span class="material-icons">check_circle_outline</span>
              <span>{{ t('toolbar.verify') }}</span>
            </button>

            <!-- 复制磁链 -->
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="copyMagnet"
              :title="t('menu.copyMagnet')"
            >
              <span class="material-icons">link</span>
              <span>{{ t('menu.copyMagnet') }}</span>
            </button>

            <!-- 任务属性 -->
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="openProps"
              :title="t('ribbon.props')"
            >
              <span class="material-icons">tune</span>
              <span>{{ t('ribbon.props') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.data') }}</div>
        </div>

        <!-- 视图与快速搜索组 -->
        <div class="ribbon-group search-group">
          <div class="ribbon-controls">
            <!-- 详情面板切换 -->
            <button
              class="fluent-btn-small"
              :class="{ 'btn-selected': state.detailOpen }"
              @click="state.detailOpen = !state.detailOpen"
              :title="t('toolbar.detailTitle')"
            >
              <span class="material-icons">vertical_split</span>
              <span>{{ t('toolbar.detail') }}</span>
            </button>

            <!-- Fluent 极简搜索框 -->
            <div class="fluent-search-box">
              <span class="material-icons search-ico">search</span>
              <input
                type="text"
                class="fluent-search-input"
                :placeholder="t('app.searchPlaceholder')"
                v-model="state.filter.search"
              />
              <span
                class="material-icons clear-ico"
                v-if="state.filter.search"
                @click="state.filter.search = ''"
              >close</span>
            </div>
          </div>
          <div class="group-title">{{ t('sidebar.filters') }}</div>
        </div>
      </div>

      <!-- 2.2 队列与调度标签页 (Queue) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'queue'">
        <!-- 队列排序 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('top')"
              title="Move to Top"
            >
              <span class="material-icons">vertical_align_top</span>
              <span>{{ t('menu.moveTop') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('up')"
              title="Move Up"
            >
              <span class="material-icons">arrow_upward</span>
              <span>{{ t('menu.moveUp') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('down')"
              title="Move Down"
            >
              <span class="material-icons">arrow_downward</span>
              <span>{{ t('menu.moveDown') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="moveQueue('bottom')"
              title="Move to Bottom"
            >
              <span class="material-icons">vertical_align_bottom</span>
              <span>{{ t('menu.moveBottom') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.queueOrder') }}</div>
        </div>

        <!-- 调度执行 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="handleStartNow"
              :title="t('ribbon.startNow')"
            >
              <span class="material-icons text-warning">bolt</span>
              <span>{{ t('ribbon.startNow') }}</span>
            </button>

            <button
              class="fluent-btn-small"
              :disabled="!hasSelection"
              @click="handleReannounce"
              :title="t('ribbon.reannounce')"
            >
              <span class="material-icons">sync</span>
              <span>{{ t('ribbon.reannounce') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.exec') }}</div>
        </div>
      </div>

      <!-- 2.3 限速与做种规则标签页 (Bandwidth) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'bandwidth'">
        <!-- 乌龟临时限速模式 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-large"
              :class="{ 'btn-active-turtle': state.session?.['alt-speed-enabled'] }"
              @click="toggleTurtleMode"
              :title="t('toolbar.turtle')"
            >
              <span class="material-icons large-icon">speed</span>
              <span class="btn-caption">{{ t('toolbar.turtle') }}</span>
            </button>

            <div class="turtle-info-card" v-if="state.session">
              <div class="turtle-rate">⬇ {{ state.session['alt-speed-down'] }} KB/s</div>
              <div class="turtle-rate">⬆ {{ state.session['alt-speed-up'] }} KB/s</div>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.turtle') }}</div>
        </div>

        <!-- 优先级快速分配 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :class="{ active: currentTorrentPriority === 1 }"
              :disabled="!hasSelection"
              @click="setPriority(1)"
              :title="t('ribbon.highPriority')"
            >
              <span class="material-icons text-danger">priority_high</span>
              <span>{{ t('ribbon.highPriority') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :class="{ active: currentTorrentPriority === 0 }"
              :disabled="!hasSelection"
              @click="setPriority(0)"
              :title="t('ribbon.normalPriority')"
            >
              <span class="material-icons">remove</span>
              <span>{{ t('ribbon.normalPriority') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              :class="{ active: currentTorrentPriority === -1 }"
              :disabled="!hasSelection"
              @click="setPriority(-1)"
              :title="t('ribbon.lowPriority')"
            >
              <span class="material-icons text-secondary">arrow_downward</span>
              <span>{{ t('ribbon.lowPriority') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.rules') }}</div>
        </div>
      </div>

      <!-- 2.4 维护与工具标签页 (Tools) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'tools'">
        <!-- 存储与重命名 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="handleSetLocation"
              :title="t('ribbon.setLocation')"
            >
              <span class="material-icons">folder_open</span>
              <span>{{ t('ribbon.setLocation') }}</span>
            </button>

            <button
              class="fluent-btn-small"
              :disabled="!selectedTorrentId"
              @click="handleRename"
              :title="t('ribbon.rename')"
            >
              <span class="material-icons">edit</span>
              <span>{{ t('ribbon.rename') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.location') }}</div>
        </div>

        <!-- 系统与首选项 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="fluent-btn-small" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <span class="material-icons">settings</span>
              <span>{{ t('toolbar.settings') }}</span>
            </button>

            <button class="fluent-btn-small" @click="fetchTorrents" title="Refresh">
              <span class="material-icons">refresh</span>
              <span>{{ t('common.verify') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.system') }}</div>
        </div>
      </div>

      <!-- 2.5 视图与首选项画板 -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'view'">
        <!-- 侧边栏与分组 (Word 风格 Toggle 激活高亮) -->
        <div class="ribbon-group">
          <div class="ribbon-controls view-prefs-col">
            <button
              type="button"
              class="fluent-toggle-btn"
              :class="{ active: state.uiPreferences.showTrackerGroup }"
              @click="togglePreference('showTrackerGroup')"
              :title="t('ribbon.showTrackers')"
            >
              <span class="material-icons btn-icon">{{ state.uiPreferences.showTrackerGroup ? 'check_box' : 'check_box_outline_blank' }}</span>
              <span>{{ t('ribbon.showTrackers') }}</span>
            </button>
            <button
              type="button"
              class="fluent-toggle-btn"
              :class="{ active: state.uiPreferences.showTagGroup }"
              @click="togglePreference('showTagGroup')"
              :title="t('ribbon.showTags')"
            >
              <span class="material-icons btn-icon">{{ state.uiPreferences.showTagGroup ? 'check_box' : 'check_box_outline_blank' }}</span>
              <span>{{ t('ribbon.showTags') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.sidebarView') }}</div>
        </div>

        <!-- 刷新频率 -->
        <div class="ribbon-group">
          <div class="ribbon-controls view-prefs-col">
            <div class="poll-row">
              <span class="input-prefix-label">{{ t('ribbon.pollTorrents') }}</span>
              <select
                class="fluent-select-mini"
                v-model.number="state.uiPreferences.pollIntervalTorrents"
                @change="saveUIPreferences"
              >
                <option :value="1">{{ t('ribbon.sec1s') }}</option>
                <option :value="2">{{ t('ribbon.sec2s') }}</option>
                <option :value="3">{{ t('ribbon.sec3s') }}</option>
                <option :value="5">{{ t('ribbon.sec5s') }}</option>
                <option :value="10">{{ t('ribbon.sec10s') }}</option>
              </select>
            </div>
            <div class="poll-row">
              <span class="input-prefix-label">{{ t('ribbon.pollStats') }}</span>
              <select
                class="fluent-select-mini"
                v-model.number="state.uiPreferences.pollIntervalStats"
                @change="saveUIPreferences"
              >
                <option :value="1">{{ t('ribbon.sec1s') }}</option>
                <option :value="2">{{ t('ribbon.sec2s') }}</option>
                <option :value="3">{{ t('ribbon.sec3s') }}</option>
                <option :value="5">{{ t('ribbon.sec5s') }}</option>
                <option :value="10">{{ t('ribbon.sec10s') }}</option>
              </select>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.polling') }}</div>
        </div>

        <!-- 表格列自定义 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              @click.stop="toggleMenu('columns', $event)"
              :title="t('ribbon.customizeCols')"
            >
              <span class="material-icons">view_column</span>
              <span>{{ t('ribbon.customizeCols') }}</span>
            </button>
            <button
              class="fluent-btn-small"
              @click="handleResetColumns"
              :title="t('ribbon.resetCols')"
            >
              <span class="material-icons">restart_alt</span>
              <span>{{ t('ribbon.resetCols') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.columns') }}</div>
        </div>
      </div>

      <!-- 2.6 选中种子专属上下文画板 (Contextual Ribbon Pane - 类似 Word 图片格式) -->
      <div class="ribbon-tab-pane contextual-pane" v-else-if="currentTab === 'torrentProps'">
        <!-- 优先级与连接数 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="priority-btn-group">
              <button
                class="priority-btn"
                :class="{ active: currentTorrentPriority === 1 }"
                @click="setTorrentPriority(1)"
                :title="t('ribbon.highPriority')"
              >
                <span class="material-icons text-danger">arrow_upward</span>
                <span>{{ t('priority.high') }}</span>
              </button>
              <button
                class="priority-btn"
                :class="{ active: currentTorrentPriority === 0 }"
                @click="setTorrentPriority(0)"
                :title="t('ribbon.normalPriority')"
              >
                <span class="material-icons text-info">remove</span>
                <span>{{ t('priority.normal') }}</span>
              </button>
              <button
                class="priority-btn"
                :class="{ active: currentTorrentPriority === -1 }"
                @click="setTorrentPriority(-1)"
                :title="t('ribbon.lowPriority')"
              >
                <span class="material-icons text-secondary">arrow_downward</span>
                <span>{{ t('priority.low') }}</span>
              </button>
            </div>

            <!-- 最大连接数 -->
            <div class="fluent-input-compact">
              <span class="input-prefix-label">{{ t('ribbon.maxPeers') || t('props.peerLimit') }}</span>
              <input
                type="number"
                class="num-field"
                :value="currentTorrentPeerLimit"
                @change="onTorrentPeerLimitChange"
                min="1"
                max="1000"
              />
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.rules') }}</div>
        </div>

        <!-- 独立限速 (Down/Up) -->
        <div class="ribbon-group">
          <div class="ribbon-controls limits-col">
            <!-- 下载限速 (Word 激活高亮 Toggle) -->
            <div class="limit-row">
              <button
                type="button"
                class="limit-toggle-pill"
                :class="{ active: currentTorrentDownloadLimited }"
                @click="toggleTorrentDownloadLimited"
                :title="t('ribbon.limitDown')"
              >
                <span class="material-icons mini-check-ico">{{ currentTorrentDownloadLimited ? 'check_box' : 'check_box_outline_blank' }}</span>
                <span>{{ t('ribbon.limitDown') }}</span>
              </button>
              <input
                type="number"
                class="num-field limit-num"
                :disabled="!currentTorrentDownloadLimited"
                :value="currentTorrentDownloadLimit"
                @change="onTorrentDownloadLimitChange"
                min="0"
                step="50"
              />
              <span class="unit-txt">KB/s</span>
            </div>

            <!-- 上传限速 (Word 激活高亮 Toggle) -->
            <div class="limit-row">
              <button
                type="button"
                class="limit-toggle-pill"
                :class="{ active: currentTorrentUploadLimited }"
                @click="toggleTorrentUploadLimited"
                :title="t('ribbon.limitUp')"
              >
                <span class="material-icons mini-check-ico">{{ currentTorrentUploadLimited ? 'check_box' : 'check_box_outline_blank' }}</span>
                <span>{{ t('ribbon.limitUp') }}</span>
              </button>
              <input
                type="number"
                class="num-field limit-num"
                :disabled="!currentTorrentUploadLimited"
                :value="currentTorrentUploadLimit"
                @change="onTorrentUploadLimitChange"
                min="0"
                step="50"
              />
              <span class="unit-txt">KB/s</span>
            </div>

            <!-- 遵循全局限制 (Word 激活高亮 Toggle) -->
            <button
              type="button"
              class="limit-toggle-pill honors-pill"
              :class="{ active: currentTorrentHonorsSession }"
              @click="toggleTorrentHonorsSession"
              :title="t('props.honorsSession')"
            >
              <span class="material-icons mini-check-ico">{{ currentTorrentHonorsSession ? 'check_box' : 'check_box_outline_blank' }}</span>
              <span>{{ t('ribbon.honorsSession') || t('props.honorsSession') }}</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.torrentLimits') }}</div>
        </div>

        <!-- 做种停止规则 -->
        <div class="ribbon-group">
          <div class="ribbon-controls seed-rules-col">
            <!-- 分享率 -->
            <div class="seed-row">
              <span class="input-prefix-label">{{ t('ribbon.ratioMode') || t('props.ratioMode') }}</span>
              <select class="fluent-select-mini" :value="currentTorrentSeedRatioMode" @change="onTorrentRatioModeChange">
                <option :value="0">{{ t('props.ratioGlobal') }}</option>
                <option :value="1">{{ t('props.ratioSingle') }}</option>
                <option :value="2">{{ t('props.ratioUnlimited') }}</option>
              </select>
              <input
                v-if="currentTorrentSeedRatioMode === 1"
                type="number"
                class="num-field seed-num"
                :value="currentTorrentSeedRatioLimit"
                @change="onTorrentRatioLimitChange"
                step="0.1"
                min="0"
              />
            </div>

            <!-- 空闲超时 -->
            <div class="seed-row">
              <span class="input-prefix-label">{{ t('ribbon.idleMode') || t('props.idleMode') }}</span>
              <select class="fluent-select-mini" :value="currentTorrentSeedIdleMode" @change="onTorrentIdleModeChange">
                <option :value="0">{{ t('props.idleGlobal') }}</option>
                <option :value="1">{{ t('props.idleSingle') }}</option>
                <option :value="2">{{ t('props.idleUnlimited') }}</option>
              </select>
              <div class="idle-input-wrap" v-if="currentTorrentSeedIdleMode === 1">
                <input
                  type="number"
                  class="num-field seed-num"
                  :value="currentTorrentSeedIdleLimit"
                  @change="onTorrentIdleLimitChange"
                  min="1"
                />
                <span class="unit-txt">min</span>
              </div>
            </div>
          </div>
          <div class="group-title">{{ t('ribbon.groups.torrentSeed') }}</div>
        </div>

        <!-- 存储、信息与操作 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="fluent-btn-small" @click="handleSetLocation" :title="t('ribbon.setLocation')">
              <span class="material-icons">folder_open</span>
              <span>{{ t('ribbon.setLocation') }}</span>
            </button>
            <button class="fluent-btn-small" @click="handleRename" :title="t('ribbon.rename')">
              <span class="material-icons">edit</span>
              <span>{{ t('ribbon.rename') }}</span>
            </button>
            <button class="fluent-btn-small" @click="copyMagnet" :title="t('detail.general.copyMagnet')">
              <span class="material-icons">link</span>
              <span>{{ t('detail.general.copyMagnet') }}</span>
            </button>
            <button class="fluent-btn-small primary" @click="openProps" :title="t('ribbon.props')">
              <span class="material-icons">tune</span>
              <span>{{ t('ribbon.props') }}...</span>
            </button>
          </div>
          <div class="group-title">{{ t('ribbon.groups.torrentMeta') }}</div>
        </div>
      </div>
    </div>

    <!-- 3. 移动端紧凑工具条 (仅屏幕 < 768px 显示) -->
    <div class="mobile-compact-bar mobile-only">
      <!-- 模式 A：无选中任务时的常规工具条 -->
      <template v-if="!hasSelection">
        <button class="fluent-btn-mobile btn-primary" @click="state.addDialogOpen = true" :title="t('toolbar.add')">
          <span class="material-icons">add</span>
        </button>
        <button class="fluent-btn-mobile" @click="handleStartAll" :title="t('toolbar.startAll')">
          <span class="material-icons text-success">fast_forward</span>
        </button>
        <button class="fluent-btn-mobile" @click="handleStopAll" :title="t('toolbar.pauseAll')">
          <span class="material-icons text-warning">pause_circle_outline</span>
        </button>
        <button class="fluent-btn-mobile" @click="selectAllTorrents" :title="t('ribbon.selectAll')">
          <span class="material-icons">select_all</span>
        </button>
        <div class="mobile-search-wrap">
          <span class="material-icons search-prefix-icon">search</span>
          <input
            type="text"
            class="mobile-search-input"
            :placeholder="t('app.searchPlaceholder')"
            v-model="state.filter.search"
          />
          <button
            class="mobile-clear-btn"
            v-if="state.filter.search"
            @click="state.filter.search = ''"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
      </template>

      <!-- 模式 B：有选中任务时的批量选择工具条 -->
      <template v-else>
        <div class="selection-badge">
          <span class="badge-text">{{ t('ribbon.selectedCount', { count: selectedCount }) }}</span>
        </div>
        <button class="fluent-btn-mobile" @click="selectAllTorrents" :title="t('ribbon.selectAll')">
          <span class="material-icons">select_all</span>
        </button>
        <button class="fluent-btn-mobile" @click="handleStart" :title="t('common.start')">
          <span class="material-icons text-success">play_arrow</span>
        </button>
        <button class="fluent-btn-mobile" @click="handleStop" :title="t('common.pause')">
          <span class="material-icons text-warning">pause</span>
        </button>
        <button class="fluent-btn-mobile" @click="handleRemove(false)" :title="t('common.delete')">
          <span class="material-icons text-danger">delete</span>
        </button>
        <button class="fluent-btn-mobile" v-if="selectedCount === 1" @click="openProps" :title="t('ribbon.tabs.torrentProps')">
          <span class="material-icons">tune</span>
        </button>
        <button class="fluent-btn-mobile clear-sel-btn" @click="clearSelection" :title="t('common.cancel')">
          <span class="material-icons">close</span>
        </button>
      </template>
    </div>

    <!-- 全局 Teleport 浮层下拉菜单：彻底逃离 Ribbon 裁剪与 z-index 层叠 -->
    <Teleport to="body">
      <!-- 开始菜单 -->
      <div
        class="fluent-dropdown-menu teleported"
        v-if="menus.start"
        :style="{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="menu-opt" @click="handleStartAll">
          <span class="material-icons">fast_forward</span>
          <span>{{ t('toolbar.startAll') }}</span>
        </div>
        <div class="menu-opt" :class="{ disabled: !hasSelection }" @click="handleStartNow">
          <span class="material-icons">bolt</span>
          <span>{{ t('ribbon.startNow') }}</span>
        </div>
      </div>

      <!-- 暂停菜单 -->
      <div
        class="fluent-dropdown-menu teleported"
        v-if="menus.stop"
        :style="{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="menu-opt" @click="handleStopAll">
          <span class="material-icons">pause_circle_outline</span>
          <span>{{ t('toolbar.pauseAll') }}</span>
        </div>
      </div>

      <!-- 删除菜单 -->
      <div
        class="fluent-dropdown-menu teleported"
        v-if="menus.delete"
        :style="{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="menu-opt text-danger" @click="handleRemove(true)">
          <span class="material-icons">delete_forever</span>
          <span>{{ t('ribbon.deleteWithData') }}</span>
        </div>
      </div>

      <!-- 语言菜单 -->
      <div
        class="fluent-dropdown-menu teleported lang-dropdown-menu"
        v-if="menus.lang"
        :style="{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="menu-opt" :class="{ active: currentLocale === 'zh-CN' }" @click="selectLocale('zh-CN')">
          <span class="material-icons menu-check-ico" :style="{ visibility: currentLocale === 'zh-CN' ? 'visible' : 'hidden' }">check</span>
          <span>简体中文</span>
        </div>
        <div class="menu-opt" :class="{ active: currentLocale === 'en-US' }" @click="selectLocale('en-US')">
          <span class="material-icons menu-check-ico" :style="{ visibility: currentLocale === 'en-US' ? 'visible' : 'hidden' }">check</span>
          <span>English</span>
        </div>
        <div class="menu-opt" :class="{ active: currentLocale === 'ru-RU' }" @click="selectLocale('ru-RU')">
          <span class="material-icons menu-check-ico" :style="{ visibility: currentLocale === 'ru-RU' ? 'visible' : 'hidden' }">check</span>
          <span>Русский</span>
        </div>
      </div>

      <!-- 表格列选择菜单 -->
      <div
        class="fluent-dropdown-menu teleported columns-dropdown-menu"
        v-if="menus.columns"
        :style="{ position: 'fixed', top: `${menuPos.top}px`, left: `${menuPos.left}px`, zIndex: 9999 }"
        @click.stop
      >
        <div class="cols-menu-header">{{ t('ribbon.colsMenuTitle') }}</div>
        <div class="cols-menu-list">
          <label class="cols-menu-item" v-for="col in state.columns" :key="col.id">
            <input type="checkbox" v-model="col.visible" @change="saveColumns" />
            <span>{{ t(col.labelKey) }}</span>
          </label>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue';
import {
  state,
  formatSpeed,
  toggleTurtleMode,
  startSelected,
  stopSelected,
  verifySelected,
  removeSelected,
  openTorrentProps,
  fetchTorrents,
  saveColumns,
  resetColumns,
  saveUIPreferences,
  toggleViewMode,
  selectAllTorrents,
  clearSelection,
} from '../stores/transmission';
import { rpc } from '../api/rpc';
import { t, currentLocale, setLocale, LocaleKey } from '../locales';

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');
const currentTab = ref<'tasks' | 'queue' | 'bandwidth' | 'tools' | 'torrentProps' | 'view'>('tasks');
const isRibbonCollapsed = ref(localStorage.getItem('ribbon_collapsed') === 'true');

// 下拉菜单浮层状态
const menus = reactive({
  start: false,
  stop: false,
  delete: false,
  lang: false,
  columns: false,
});

const menuPos = reactive({ top: 0, left: 0 });

function closeAllMenus() {
  menus.start = false;
  menus.stop = false;
  menus.delete = false;
  menus.lang = false;
  menus.columns = false;
}

function toggleMenu(type: 'start' | 'stop' | 'delete' | 'lang' | 'columns', event?: MouseEvent) {
  const current = menus[type];
  closeAllMenus();
  if (!current && event) {
    const el = (event.currentTarget as HTMLElement).closest(
      '.fluent-split-btn, .lang-dropdown-wrapper, .fluent-btn-small'
    );
    if (el) {
      const rect = el.getBoundingClientRect();
      menuPos.top = rect.bottom + 2;
      menuPos.left = Math.max(8, Math.min(rect.left, window.innerWidth - 200));
    }
  }
  menus[type] = !current;
}

function handleResetColumns() {
  resetColumns();
  menus.columns = false;
}

function selectLocale(loc: LocaleKey) {
  setLocale(loc);
  menus.lang = false;
}

function toggleSidebar() {
  if (window.innerWidth >= 768) {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', String(state.sidebarCollapsed));
  } else {
    state.sidebarOpen = !state.sidebarOpen;
  }
}

const isQueueEnabled = computed(() => {
  if (!state.session) return true;
  return !!(state.session['download-queue-enabled'] || state.session['seed-queue-enabled']);
});

const hasSelection = computed(() => {
  return state.selectedIds.length > 0 || state.selectedId !== null;
});

const selectedCount = computed(() => {
  return state.selectedIds.length > 0 ? state.selectedIds.length : (state.selectedId !== null ? 1 : 0);
});

const selectedTorrentId = computed(() => {
  if (state.selectedId !== null) return state.selectedId;
  if (state.selectedIds.length > 0) return state.selectedIds[0];
  return null;
});

const targetTorrentIds = computed<number[]>(() => {
  if (state.selectedIds.length > 0) return state.selectedIds;
  if (state.selectedId !== null) return [state.selectedId];
  return [];
});

const primaryTorrent = computed(() => {
  if (selectedTorrentId.value === null) return null;
  return state.torrents.find((t) => t.id === selectedTorrentId.value) || null;
});

const currentTorrentPriority = computed(() => primaryTorrent.value?.bandwidthPriority ?? 0);
const currentTorrentPeerLimit = computed(() => (primaryTorrent.value as any)?.['peer-limit'] ?? primaryTorrent.value?.peerLimit ?? 60);
const currentTorrentDownloadLimited = computed(() => primaryTorrent.value?.downloadLimited ?? false);
const currentTorrentDownloadLimit = computed(() => primaryTorrent.value?.downloadLimit ?? 100);
const currentTorrentUploadLimited = computed(() => primaryTorrent.value?.uploadLimited ?? false);
const currentTorrentUploadLimit = computed(() => primaryTorrent.value?.uploadLimit ?? 100);
const currentTorrentHonorsSession = computed(() => primaryTorrent.value?.honorsSessionLimits ?? true);
const currentTorrentSeedRatioMode = computed(() => primaryTorrent.value?.seedRatioMode ?? 0);
const currentTorrentSeedRatioLimit = computed(() => primaryTorrent.value?.seedRatioLimit ?? 2.0);
const currentTorrentSeedIdleMode = computed(() => primaryTorrent.value?.seedIdleMode ?? 0);
const currentTorrentSeedIdleLimit = computed(() => primaryTorrent.value?.seedIdleLimit ?? 30);

// 当没有选中任何种子且当前在上下文标签页时，自动切回主任务标签
watch(hasSelection, (newVal) => {
  if (!newVal && currentTab.value === 'torrentProps') {
    currentTab.value = 'tasks';
  }
});

async function updateSelectedTorrents(props: Record<string, any>) {
  const ids = targetTorrentIds.value;
  if (ids.length === 0) return;
  for (const id of ids) {
    const item = state.torrents.find((t) => t.id === id);
    if (item) Object.assign(item, props);
  }
  try {
    await rpc.torrentSet({ ids, ...props });
  } catch (err: any) {
    alert(t('common.failed', { error: err.message || err }));
  }
}

function setTorrentPriority(p: number) {
  updateSelectedTorrents({ bandwidthPriority: p });
}

function onTorrentPeerLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val > 0) {
    updateSelectedTorrents({ 'peer-limit': val });
  }
}

function togglePreference(key: 'showTrackerGroup' | 'showTagGroup') {
  state.uiPreferences[key] = !state.uiPreferences[key];
  saveUIPreferences();
}

function toggleTorrentDownloadLimited() {
  updateSelectedTorrents({ downloadLimited: !currentTorrentDownloadLimited.value });
}

function toggleTorrentUploadLimited() {
  updateSelectedTorrents({ uploadLimited: !currentTorrentUploadLimited.value });
}

function toggleTorrentHonorsSession() {
  updateSelectedTorrents({ honorsSessionLimits: !currentTorrentHonorsSession.value });
}

function onTorrentDownloadLimitedToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  updateSelectedTorrents({ downloadLimited: checked });
}

function onTorrentDownloadLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val >= 0) {
    updateSelectedTorrents({ downloadLimit: val });
  }
}

function onTorrentUploadLimitedToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  updateSelectedTorrents({ uploadLimited: checked });
}

function onTorrentUploadLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val >= 0) {
    updateSelectedTorrents({ uploadLimit: val });
  }
}

function onTorrentHonorsSessionToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  updateSelectedTorrents({ honorsSessionLimits: checked });
}

function onTorrentRatioModeChange(e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value, 10);
  updateSelectedTorrents({ seedRatioMode: val });
}

function onTorrentRatioLimitChange(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  if (!isNaN(val) && val >= 0) {
    updateSelectedTorrents({ seedRatioLimit: val });
  }
}

function onTorrentIdleModeChange(e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value, 10);
  updateSelectedTorrents({ seedIdleMode: val });
}

function onTorrentIdleLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val > 0) {
    updateSelectedTorrents({ seedIdleLimit: val });
  }
}

function selectTab(tab: 'tasks' | 'queue' | 'bandwidth' | 'tools' | 'torrentProps' | 'view') {
  currentTab.value = tab;
  state.ribbonTab = tab;
  if (isRibbonCollapsed.value) {
    isRibbonCollapsed.value = false;
    localStorage.setItem('ribbon_collapsed', 'false');
  }
}

function toggleRibbonCollapse() {
  isRibbonCollapsed.value = !isRibbonCollapsed.value;
  localStorage.setItem('ribbon_collapsed', String(isRibbonCollapsed.value));
}

// 快捷键 Ctrl+F1 折叠/展开
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'F1') {
    e.preventDefault();
    toggleRibbonCollapse();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 操作函数
function handleStart() {
  closeAllMenus();
  if (hasSelection.value) {
    startSelected();
  } else {
    handleStartAll();
  }
}

function handleStartAll() {
  closeAllMenus();
  const allIds = state.torrents.map((t) => t.id);
  if (allIds.length > 0) rpc.startTorrents(allIds);
}

async function handleStartNow() {
  closeAllMenus();
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.torrentStartNow(ids);
  await fetchTorrents();
}

function handleStop() {
  closeAllMenus();
  if (hasSelection.value) {
    stopSelected();
  } else {
    handleStopAll();
  }
}

function handleStopAll() {
  closeAllMenus();
  const allIds = state.torrents.map((t) => t.id);
  if (allIds.length > 0) rpc.stopTorrents(allIds);
}

function handleRemove(trashData = false) {
  closeAllMenus();
  const count = state.selectedIds.length > 0 ? state.selectedIds.length : (state.selectedId ? 1 : 0);
  if (count === 0) return;
  const msg = trashData
    ? t('menu.confirmRemoveData', { count })
    : t('toolbar.confirmDelete', { count });
  if (confirm(msg)) {
    removeSelected(trashData);
  }
}

function copyMagnet() {
  if (!selectedTorrentId.value) return;
  const tId = selectedTorrentId.value;
  const target = state.torrents.find((t) => t.id === tId);
  if (target?.magnetLink) {
    navigator.clipboard.writeText(target.magnetLink);
    alert(t('menu.magnetCopied'));
  } else {
    rpc.getTorrentDetail(tId).then((d) => {
      if (d?.magnetLink) {
        navigator.clipboard.writeText(d.magnetLink);
        alert(t('menu.magnetCopied'));
      }
    });
  }
}

function openProps() {
  if (selectedTorrentId.value) {
    openTorrentProps(selectedTorrentId.value);
  }
}

async function moveQueue(action: 'top' | 'up' | 'down' | 'bottom') {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  if (action === 'top') await rpc.queueMoveTop(ids);
  if (action === 'up') await rpc.queueMoveUp(ids);
  if (action === 'down') await rpc.queueMoveDown(ids);
  if (action === 'bottom') await rpc.queueMoveBottom(ids);
  await fetchTorrents();
}

async function handleReannounce() {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await rpc.torrentReannounce(ids);
  alert(t('ribbon.reannounce') + ': OK');
}

async function setPriority(pri: number) {
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  for (const id of ids) {
    await rpc.torrentSet({ ids: [id], bandwidthPriority: pri });
  }
  await fetchTorrents();
}

async function handleSetLocation() {
  if (!selectedTorrentId.value) return;
  const id = selectedTorrentId.value;
  const curT = state.torrents.find((t) => t.id === id);
  const newLoc = prompt(t('menu.promptLocation'), curT?.downloadDir || '/mnt');
  if (newLoc && newLoc !== curT?.downloadDir) {
    const moveData = confirm(t('menu.confirmMoveData'));
    await rpc.torrentSetLocation([id], newLoc, moveData);
    await fetchTorrents();
  }
}

async function handleRename() {
  if (!selectedTorrentId.value) return;
  const id = selectedTorrentId.value;
  const curT = state.torrents.find((t) => t.id === id);
  if (!curT) return;
  const newName = prompt(t('menu.promptRename'), curT.name);
  if (newName && newName !== curT.name) {
    try {
      await rpc.torrentRenamePath(id, curT.name, newName);
      await fetchTorrents();
    } catch (e: any) {
      alert(t('menu.renameFailed', { error: e.message }));
    }
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  const val = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', val);
  localStorage.setItem('theme', val);
}

function onLocaleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  setLocale(target.value as LocaleKey);
}
</script>

<style scoped>
/* Fluent Ribbon Root 架构 */
.fluent-ribbon-root {
  background-color: var(--fluent-bg-subtle);
  border-bottom: 1px solid var(--fluent-border-subtle);
  display: flex;
  flex-direction: column;
  user-select: none;
  position: relative;
  z-index: 200;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 1. 标题与 Tab 行 (高度 36px) */
.ribbon-header-row {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.fluent-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}

.brand-icon {
  font-size: 20px;
  color: var(--fluent-accent);
}

.brand-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary);
  letter-spacing: 0.01em;
}

/* Fluent 选项卡导航 */
.ribbon-tabs {
  display: flex;
  height: 100%;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.ribbon-tabs::-webkit-scrollbar {
  display: none;
}

.ribbon-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  height: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--md-text-secondary);
  cursor: pointer;
  border-radius: 0;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.ribbon-tab-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.ribbon-tab-btn.active {
  color: var(--fluent-accent);
  border-bottom-color: var(--fluent-accent);
  background-color: var(--fluent-bg-canvas);
  font-weight: 600;
}

/* Word 风格上下文标签 (微软 Office 经典工具紫，与常规蓝形成鲜明上下文对照) */
.ribbon-tab-btn.contextual-tab {
  background-color: rgba(119, 25, 170, 0.08);
  color: #7719aa;
  font-weight: 600;
  border-bottom: 2px solid rgba(119, 25, 170, 0.4);
}

[data-theme="dark"] .ribbon-tab-btn.contextual-tab {
  background-color: rgba(177, 151, 252, 0.12);
  color: #b197fc;
  border-bottom-color: rgba(177, 151, 252, 0.4);
}

.ribbon-tab-btn.contextual-tab:hover {
  background-color: rgba(119, 25, 170, 0.16);
  color: #58107e;
}

[data-theme="dark"] .ribbon-tab-btn.contextual-tab:hover {
  background-color: rgba(177, 151, 252, 0.22);
  color: #d0bfff;
}

.ribbon-tab-btn.contextual-tab.active {
  background-color: var(--fluent-bg-canvas);
  color: #7719aa;
  border-bottom-color: #7719aa;
}

[data-theme="dark"] .ribbon-tab-btn.contextual-tab.active {
  color: #b197fc;
  border-bottom-color: #b197fc;
}

.tab-icon {
  font-size: 15px;
}

/* 右侧系统工具 */
.ribbon-sys-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.speed-capsule {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--fluent-bg-hover);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: monospace;
}

.speed-part {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.speed-part.down { color: var(--md-info); }
.speed-part.up { color: var(--md-success); }
.speed-part .material-icons { font-size: 13px; }

.fluent-tool-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--fluent-radius);
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-tool-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.fluent-tool-btn .material-icons {
  font-size: 18px;
}

.btn-active-turtle {
  background-color: rgba(255, 152, 0, 0.15) !important;
  color: #ef6c00 !important;
}

.fluent-lang-select select {
  background: transparent;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  color: var(--md-text-primary);
  font-size: 11px;
  padding: 2px 4px;
  outline: none;
  cursor: pointer;
}

/* 2. 第二层：Ribbon 命令画板 (高度 80px，支持水平滚动) */
.ribbon-body {
  height: 80px;
  background-color: var(--fluent-bg-canvas);
  display: flex;
  padding: 3px 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.ribbon-tab-pane {
  display: flex;
  align-items: stretch;
  gap: 8px;
  height: 100%;
  flex-shrink: 0;
}

/* 磁贴功能组 (Command Group) */
.ribbon-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--fluent-border-divider);
  padding-right: 8px;
  position: relative;
  flex-shrink: 0;
}

.ribbon-group:last-child {
  border-right: none;
}

.ribbon-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.group-title {
  text-align: center;
  font-size: 10px;
  color: var(--md-text-disabled);
  letter-spacing: 0.02em;
  margin-top: 2px;
  white-space: nowrap;
}

/* Fluent 大按钮 (Large Button) */
.fluent-btn-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 52px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 2px;
}

.fluent-btn-large:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-large:active:not(:disabled) {
  transform: scale(0.97);
  background-color: var(--fluent-bg-active);
}

.fluent-btn-large.primary-btn {
  background-color: var(--fluent-accent);
  color: #ffffff;
}

.fluent-btn-large.primary-btn:hover {
  background-color: var(--fluent-accent-hover);
}

.fluent-btn-large .large-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.fluent-btn-large .btn-caption {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* Fluent 分裂按钮 (Split Button) */
.fluent-split-btn {
  display: inline-flex;
  align-items: center;
  height: 52px;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  position: relative;
}

.fluent-split-btn:hover {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.split-main-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--md-text-primary);
  cursor: pointer;
}

.split-main-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.split-main-btn .material-icons {
  font-size: 20px;
  margin-bottom: 2px;
}

.split-arrow-btn {
  width: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-left: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-secondary);
  cursor: pointer;
}

.split-arrow-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.split-arrow-btn:hover:not(:disabled) {
  background-color: var(--fluent-bg-active);
}

.split-arrow-btn .material-icons {
  font-size: 14px;
}

/* Fluent 下拉浮动菜单 */
.fluent-dropdown-menu {
  position: absolute;
  top: 54px;
  left: 0;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  min-width: 150px;
  z-index: 500;
  padding: 4px 0;
}

.menu-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
  transition: background-color 0.15s;
}

.menu-opt:hover:not(.disabled) {
  background-color: var(--fluent-bg-hover);
}

.menu-opt.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-opt .material-icons {
  font-size: 16px;
}

.menu-check-ico {
  font-size: 15px !important;
  color: var(--fluent-accent);
}

/* 图五：Word 风格下拉菜单选中项高亮 */
.menu-opt.active {
  background-color: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.18);
  font-weight: 600;
  border-radius: 4px;
}

[data-theme='dark'] .menu-opt.active {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.22);
}

/* Fluent 小按钮 (Small Button) */
.fluent-btn-small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  font-size: 12px;
  color: var(--md-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.fluent-btn-small:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-small:active:not(:disabled) {
  transform: scale(0.98);
}

.fluent-btn-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fluent-btn-small .material-icons {
  font-size: 16px;
}

/* =========================================================
   Microsoft Word / Fluent Ribbon 激活高亮规范 (Toggle Active)
   ========================================================= */

/* 1. 图三：详情按钮与小型 Toggle 按钮激活状态 */
.btn-selected,
.fluent-btn-small.active,
.fluent-toggle-btn.active,
.limit-toggle-pill.active {
  background-color: rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(0, 0, 0, 0.24) !important;
  color: var(--md-text-primary) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08) !important;
  font-weight: 500;
}

[data-theme='dark'] .btn-selected,
[data-theme='dark'] .fluent-btn-small.active,
[data-theme='dark'] .fluent-toggle-btn.active,
[data-theme='dark'] .limit-toggle-pill.active {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  color: var(--md-text-primary) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* 2. 图二：视图与首选项中的 Toggle 按钮基础样式 */
.fluent-toggle-btn {
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 11.5px;
  user-select: none;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.fluent-toggle-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.fluent-toggle-btn .btn-icon {
  font-size: 15px;
  color: var(--md-text-secondary);
}

.fluent-toggle-btn.active .btn-icon {
  color: var(--fluent-accent);
}

/* 3. 图四：独立限速与遵循全局限速的 Toggle 按钮基础样式 */
.limit-toggle-pill {
  height: 22px;
  padding: 0 5px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  user-select: none;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.limit-toggle-pill:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.limit-toggle-pill .mini-check-ico {
  font-size: 14px;
  color: var(--md-text-secondary);
}

.limit-toggle-pill.active .mini-check-ico {
  color: var(--fluent-accent);
}

.limit-toggle-pill.honors-pill {
  height: 22px;
  align-self: flex-start;
  margin-top: 1px;
}

/* Fluent 搜索框 */
.fluent-search-box {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  transition: border-color 0.15s;
}

.fluent-search-box:focus-within {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
}

.fluent-search-input {
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--md-text-primary);
  outline: none;
  width: 140px;
}

.fluent-search-box .search-ico {
  font-size: 16px;
  color: var(--md-text-secondary);
}

.fluent-search-box .clear-ico {
  font-size: 14px;
  cursor: pointer;
  color: var(--md-text-secondary);
}

/* 乌龟卡片微显 */
.turtle-info-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 11px;
  font-family: monospace;
  color: var(--md-text-secondary);
  padding: 0 6px;
  line-height: 1.3;
}

/* 颜色状态类 */
.text-success { color: var(--md-success) !important; }
.text-warning { color: var(--md-warning) !important; }
.text-danger { color: var(--md-error) !important; }
.text-secondary { color: var(--md-text-secondary) !important; }

/* 上下文面板控件组 */
.priority-btn-group {
  display: flex;
  gap: 2px;
  background-color: var(--fluent-bg-subtle);
  border-radius: var(--fluent-radius);
  padding: 2px;
  border: 1px solid var(--fluent-border-subtle);
}

.priority-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border: none;
  background: transparent;
  border-radius: var(--fluent-radius);
  font-size: 11px;
  color: var(--md-text-secondary);
  cursor: pointer;
  transition: all 0.12s ease;
}

.priority-btn:hover {
  background-color: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.contextual-pane {
  border-top: 1px solid rgba(119, 25, 170, 0.25);
}

[data-theme="dark"] .contextual-pane {
  border-top: 1px solid rgba(177, 151, 252, 0.25);
}

.contextual-pane input[type="checkbox"] {
  accent-color: #7719aa;
}

[data-theme="dark"] .contextual-pane input[type="checkbox"] {
  accent-color: #b197fc;
}

.priority-btn.active {
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  border: none;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

[data-theme="dark"] .priority-btn.active {
  background-color: var(--fluent-bg-active);
  color: #ffffff;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.priority-btn .material-icons {
  font-size: 14px;
}

.fluent-input-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.input-prefix-label {
  font-size: 11px;
  white-space: nowrap;
}

.num-field {
  width: 54px;
  padding: 2px 6px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 11px;
  outline: none;
  font-family: monospace;
  text-align: right;
  transition: border-color 0.15s;
}

.num-field:focus {
  border-color: var(--fluent-accent);
}

.num-field:disabled {
  opacity: 0.5;
  background-color: var(--fluent-bg-subtle);
}

.limits-col, .seed-rules-col, .view-prefs-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
}

.limit-row, .seed-row, .poll-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  height: 20px;
}

.columns-dropdown-menu {
  min-width: 170px;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
}

.cols-menu-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--fluent-accent);
  padding: 3px 6px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  margin-bottom: 4px;
}

.cols-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cols-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  font-size: 11px;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  transition: background-color 0.12s;
}

.cols-menu-item:hover {
  background-color: var(--fluent-bg-hover);
}

.cols-menu-item input[type="checkbox"] {
  accent-color: var(--fluent-accent);
}

.fluent-check-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--md-text-primary);
  cursor: pointer;
  white-space: nowrap;
}

.fluent-check-label input[type="checkbox"] {
  accent-color: var(--fluent-accent);
  cursor: pointer;
}

.limit-num {
  width: 50px;
}

.unit-txt {
  font-size: 10px;
  color: var(--md-text-disabled);
}

.mini-check {
  font-size: 10px;
  color: var(--md-text-secondary);
}

.fluent-select-mini {
  padding: 1px 4px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  font-size: 11px;
  outline: none;
  cursor: pointer;
}

.seed-num {
  width: 44px;
}

.idle-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* 3. 移动端紧凑模式 */
.mobile-compact-bar {
  display: none;
  height: 44px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  background-color: var(--fluent-bg-canvas);
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.fluent-btn-mobile {
  width: 32px;
  height: 32px;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.fluent-btn-mobile:active {
  background-color: var(--fluent-bg-hover);
  transform: scale(0.96);
}

.fluent-btn-mobile.btn-primary {
  background-color: rgba(0, 120, 212, 0.12);
  border-color: rgba(0, 120, 212, 0.35);
  color: var(--fluent-accent);
}

.fluent-btn-mobile.clear-sel-btn {
  margin-left: auto;
}

.fluent-btn-mobile .material-icons {
  font-size: 18px;
}

.selection-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background-color: rgba(0, 120, 212, 0.12);
  border: 1px solid rgba(0, 120, 212, 0.3);
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--fluent-accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.mobile-search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.search-prefix-icon {
  position: absolute;
  left: 7px;
  font-size: 16px;
  color: var(--md-text-secondary);
  pointer-events: none;
}

.mobile-search-input {
  width: 100%;
  height: 30px;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-subtle);
  padding: 0 26px 0 28px;
  background: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  font-size: 11.5px;
  outline: none;
  transition: all 0.15s ease;
}

.mobile-search-input:focus {
  border-color: var(--fluent-accent);
  background-color: var(--fluent-bg-canvas);
}

.mobile-clear-btn {
  position: absolute;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--md-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.mobile-clear-btn .material-icons {
  font-size: 14px;
}

.lang-dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.lang-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 120px;
  z-index: 300;
}

/* 响应式断点 */
@media (max-width: 1080px) {
  .ribbon-tab-btn .tab-text {
    display: none;
  }
  .ribbon-tab-btn {
    padding: 0 10px;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }

  .ribbon-header-row {
    height: 42px;
    padding: 0 8px;
  }

  .fluent-tool-btn {
    width: 28px;
    height: 28px;
  }

  .fluent-tool-btn .material-icons {
    font-size: 16px;
  }

  .brand-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .brand-text {
    display: none;
  }
}
</style>
