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
        <FluentIcon name="menu" />
      </button>

      <!-- 应用标题 / 品牌标识 (Transmission 官方高保真变速杆 Logo) -->
      <div class="fluent-brand">
        <TransmissionLogo :size="20" class="brand-logo" />
        <span class="brand-text">Transmission</span>
      </div>

      <!-- Office 2016 全屏“文件”菜单入口 -->
      <div class="file-menu-wrapper">
        <button
          class="ribbon-file-btn"
          :class="{ active: state.fileMenuOpen }"
          @click.stop="openFileMenu"
        >
          <span>{{ t('ribbon.file') }}</span>
        </button>
      </div>

      <!-- Ribbon 选项卡列表 (桌面端展示，纯正 Office 2016 纯文字高效规范) -->
      <nav class="ribbon-tabs desktop-only">
        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tasks' && !isRibbonCollapsed }"
          @click.stop="selectTab('tasks')"
        >
          <span class="tab-text">{{ t('ribbon.tabs.tasks') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'transfer' && !isRibbonCollapsed }"
          @click.stop="selectTab('transfer')"
        >
          <span class="tab-text">{{ t('ribbon.tabs.transfer') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'tools' && !isRibbonCollapsed }"
          @click.stop="selectTab('tools')"
        >
          <span class="tab-text">{{ t('ribbon.tabs.tools') }}</span>
        </button>

        <button
          class="ribbon-tab-btn"
          :class="{ active: currentTab === 'view' && !isRibbonCollapsed }"
          @click.stop="selectTab('view')"
        >
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
          <FluentIcon :name="state.viewMode === 'table' ? 'view_agenda' : 'table_chart'" />
        </button>

        <!-- 乌龟临时限速开关 -->
        <button
          class="fluent-tool-btn"
          :class="{ 'btn-active-turtle': state.session?.['alt-speed-enabled'] }"
          @click="toggleTurtleMode"
          :title="t('toolbar.turtle')"
        >
          <FluentIcon name="speed" />
        </button>

        <!-- 全局首选项 -->
        <button class="fluent-tool-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
          <FluentIcon name="settings" />
        </button>

        <!-- 主题切换 -->
        <button class="fluent-tool-btn" @click="toggleTheme" :title="t('app.toggleTheme')">
          <FluentIcon :name="isDark ? 'light_mode' : 'dark_mode'" />
        </button>

        <!-- 语言选择 (图标下拉菜单) -->
        <div class="lang-dropdown-wrapper">
          <button
            class="fluent-tool-btn"
            @click.stop="toggleMenu('lang', $event)"
            :title="t('app.language')"
          >
            <FluentIcon name="translate" />
          </button>
        </div>

        <!-- Ribbon 展开/折叠图钉按钮 (支持 Ctrl+F1) -->
        <button
          class="fluent-tool-btn toggle-ribbon-btn desktop-only"
          @click="toggleRibbonCollapse"
          :title="isRibbonCollapsed ? t('ribbon.expand') : t('ribbon.collapse')"
        >
          <FluentIcon :name="isRibbonCollapsed ? 'expand_more' : 'expand_less'" />
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
              <FluentIcon name="add_circle" class="large-icon" />
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
                <FluentIcon name="play_arrow" class="text-success" />
                <span>{{ hasSelection ? t('toolbar.start') : t('toolbar.startAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('start', $event)"
              >
                <FluentIcon name="arrow_drop_down" />
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
                <FluentIcon name="pause" class="text-warning" />
                <span>{{ hasSelection ? t('toolbar.pause') : t('toolbar.pauseAll') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="state.torrents.length === 0"
                @click.stop="toggleMenu('stop', $event)"
              >
                <FluentIcon name="arrow_drop_down" />
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
                <FluentIcon name="delete" class="text-danger" />
                <span>{{ t('toolbar.delete') }}</span>
              </button>
              <button
                class="split-arrow-btn"
                :disabled="!hasSelection"
                @click.stop="toggleMenu('delete', $event)"
              >
                <FluentIcon name="arrow_drop_down" />
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.basic') }}</span>
            <button class="dialog-launcher-btn" @click="state.addDialogOpen = true" :title="t('toolbar.addTitle')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>

        <!-- 组织与标记组 (✨特色新功能：批量标签 + 优先级) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 批量设置标签大按钮 -->
            <button
              class="fluent-btn-large"
              :disabled="!hasSelection"
              @click="state.batchTagsDialogOpen = true"
              :title="t('ribbon.batchTags')"
            >
              <FluentIcon name="local_offer" class="large-icon text-accent" />
              <span class="btn-caption">{{ t('ribbon.batchTags') }}</span>
            </button>

            <!-- 快速优先级按钮列 -->
            <div class="btn-stack">
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="setPriority(1)"
                :title="t('ribbon.highPriority')"
              >
                <FluentIcon name="arrow_upward" class="text-danger" />
                <span>{{ t('props.priorityHigh') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="setPriority(0)"
                :title="t('ribbon.normalPriority')"
              >
                <FluentIcon name="remove" />
                <span>{{ t('props.priorityNormal') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="setPriority(-1)"
                :title="t('ribbon.lowPriority')"
              >
                <FluentIcon name="arrow_downward" class="text-primary" />
                <span>{{ t('props.priorityLow') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.organize') }}</span>
            <button class="dialog-launcher-btn" :disabled="!hasSelection" @click="state.batchTagsDialogOpen = true" :title="t('ribbon.batchTags')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>

        <!-- 检索与视图组 -->
        <div class="ribbon-group search-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-large"
              :class="{ active: state.detailOpen }"
              @click="state.detailOpen = !state.detailOpen"
              :title="t('ribbon.props')"
            >
              <FluentIcon name="tune" class="large-icon" />
              <span class="btn-caption">{{ t('ribbon.props') }}</span>
            </button>

            <div class="search-box-wrap">
              <div class="fluent-search-input">
                <FluentIcon name="search" class="search-ico" />
                <input
                  type="text"
                  v-model="state.filter.search"
                  :placeholder="t('app.searchPlaceholder')"
                  class="search-native-input"
                />
                <button
                  class="search-clear-btn"
                  v-if="state.filter.search"
                  @click="state.filter.search = ''"
                >
                  <FluentIcon name="close" />
                </button>
              </div>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.find') }}</span>
          </div>
        </div>
      </div>

      <!-- 2.2 传输与网络标签页 (Transfer) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'transfer'">
        <!-- 队列调度组 (2x2 双行矩阵 + 立即开始大按钮) -->
        <div class="ribbon-group" v-if="isQueueEnabled">
          <div class="ribbon-controls">
            <!-- 立即开始 (高保真大按钮) -->
            <button
              class="fluent-btn-large primary-btn"
              :disabled="!hasSelection"
              @click="handleStartNow"
              :title="t('ribbon.startNow')"
            >
              <FluentIcon name="bolt" class="large-icon text-warning" />
              <span class="btn-caption">{{ t('ribbon.startNow') }}</span>
            </button>

            <!-- 2x2 队列调整双行矩阵 -->
            <div class="btn-matrix-2x2">
              <div class="btn-stack-2row">
                <button
                  class="fluent-btn-small"
                  :disabled="!hasSelection"
                  @click="moveQueue('top')"
                  :title="t('toolbar.queueTop')"
                >
                  <FluentIcon name="vertical_align_top" />
                  <span>{{ t('toolbar.queueTop') }}</span>
                </button>
                <button
                  class="fluent-btn-small"
                  :disabled="!hasSelection"
                  @click="moveQueue('bottom')"
                  :title="t('toolbar.queueBottom')"
                >
                  <FluentIcon name="vertical_align_bottom" />
                  <span>{{ t('toolbar.queueBottom') }}</span>
                </button>
              </div>
              <div class="btn-stack-2row">
                <button
                  class="fluent-btn-small"
                  :disabled="!hasSelection"
                  @click="moveQueue('up')"
                  :title="t('toolbar.queueUp')"
                >
                  <FluentIcon name="arrow_upward" />
                  <span>{{ t('toolbar.queueUp') }}</span>
                </button>
                <button
                  class="fluent-btn-small"
                  :disabled="!hasSelection"
                  @click="moveQueue('down')"
                  :title="t('toolbar.queueDown')"
                >
                  <FluentIcon name="arrow_downward" />
                  <span>{{ t('toolbar.queueDown') }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.queue') }}</span>
            <button class="dialog-launcher-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>

        <!-- 网络与 Tracker 组 (重新宣告大按钮 + 校验/磁链双行堆叠) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <!-- 重新宣告 -->
            <button
              class="fluent-btn-large"
              :disabled="!hasSelection"
              @click="handleReannounce"
              :title="t('ribbon.reannounce')"
            >
              <FluentIcon name="broadcast" class="large-icon text-accent" />
              <span class="btn-caption">{{ t('ribbon.reannounce') }}</span>
            </button>

            <!-- 垂直双行堆叠：数据校验 + 复制磁链 -->
            <div class="btn-stack-2row">
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="verifySelected()"
                :title="t('toolbar.verify')"
              >
                <FluentIcon name="check_circle" class="text-info" />
                <span>{{ t('toolbar.verify') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="copyMagnet"
                :title="t('detail.general.copyMagnet')"
              >
                <FluentIcon name="content_copy" />
                <span>{{ t('detail.general.copyMagnet') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.network') }}</span>
          </div>
        </div>

        <!-- 乌龟临时限速模式组 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-large"
              :class="{ active: state.session?.['alt-speed-enabled'] }"
              @click="toggleTurtleMode"
              :title="t('toolbar.turtle')"
            >
              <FluentIcon name="speed" class="large-icon" />
              <span class="btn-caption">{{ t('toolbar.turtle') }}</span>
            </button>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.turtle') }}</span>
            <button class="dialog-launcher-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>
      </div>

      <!-- 2.3 存储与维护标签页 (Tools) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'tools'">
        <!-- 存储与重命名组 (双行堆叠) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-stack-2row">
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="handleSetLocation"
                :title="t('ribbon.setLocation')"
              >
                <FluentIcon name="folder_open" />
                <span>{{ t('ribbon.setLocation') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="handleRename"
                :title="t('ribbon.rename')"
              >
                <FluentIcon name="edit" />
                <span>{{ t('ribbon.rename') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.storage') }}</span>
          </div>
        </div>

        <!-- 服务与系统维护组 (首选项大按钮 + 统计/关于双行堆叠) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="fluent-btn-large" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <FluentIcon name="settings" class="large-icon" />
              <span class="btn-caption">{{ t('toolbar.settings') }}</span>
            </button>
            <div class="btn-stack-2row">
              <button class="fluent-btn-small" @click="openStatsDialog" :title="t('sidebar.stats')">
                <FluentIcon name="insights" />
                <span>{{ t('sidebar.stats') }}</span>
              </button>
              <button class="fluent-btn-small" @click="openAboutDialog" :title="t('ribbon.about')">
                <FluentIcon name="info" />
                <span>{{ t('ribbon.about') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.maintenance') }}</span>
            <button class="dialog-launcher-btn" @click="state.sessionDialogOpen = true" :title="t('toolbar.settings')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>
      </div>

      <!-- 2.4 视图与偏好标签页 (View) -->
      <div class="ribbon-tab-pane" v-else-if="currentTab === 'view'">
        <!-- 侧边栏与分组 (Office 2016 规范双行切换按钮，大方干掉复选框) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-stack-2row">
              <button
                class="fluent-btn-small ribbon-toggle-btn"
                :class="{ active: state.uiPreferences.showTrackerGroup }"
                @click="state.uiPreferences.showTrackerGroup = !state.uiPreferences.showTrackerGroup; saveUIPreferences()"
                :title="t('ribbon.showTrackers')"
              >
                <FluentIcon name="dns" />
                <span>{{ t('ribbon.showTrackers') }}</span>
              </button>
              <button
                class="fluent-btn-small ribbon-toggle-btn"
                :class="{ active: state.uiPreferences.showTagGroup }"
                @click="state.uiPreferences.showTagGroup = !state.uiPreferences.showTagGroup; saveUIPreferences()"
                :title="t('ribbon.showTags')"
              >
                <FluentIcon name="local_offer" />
                <span>{{ t('ribbon.showTags') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.panels') }}</span>
          </div>
        </div>

        <!-- 表格列自定义组 (双行堆叠) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-stack-2row">
              <button
                class="fluent-btn-small"
                @click.stop="toggleMenu('columns', $event)"
                :title="t('ribbon.customizeCols')"
              >
                <FluentIcon name="view_column" />
                <span>{{ t('ribbon.customizeCols') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                @click="handleResetColumns"
                :title="t('ribbon.resetCols')"
              >
                <FluentIcon name="restart_alt" />
                <span>{{ t('ribbon.resetCols') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.columns') }}</span>
            <button class="dialog-launcher-btn" @click.stop="toggleMenu('columns', $event)" :title="t('ribbon.customizeCols')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>

        <!-- 刷新频率调节 (Office 规范带图标紧凑行) -->
        <div class="ribbon-group">
          <div class="ribbon-controls view-prefs-col office-select-group">
            <div class="office-select-row" :title="t('ribbon.pollTorrents')">
              <FluentIcon name="sync" class="row-icon text-muted" size="14" />
              <span class="input-prefix-label">{{ t('ribbon.pollTorrents') }}</span>
              <select
                class="fluent-select"
                v-model="state.uiPreferences.pollIntervalTorrents"
                @change="saveUIPreferences"
              >
                <option :value="1">{{ t('ribbon.sec1s') }}</option>
                <option :value="2">{{ t('ribbon.sec2s') }}</option>
                <option :value="3">{{ t('ribbon.sec3s') }}</option>
                <option :value="5">{{ t('ribbon.sec5s') }}</option>
                <option :value="10">{{ t('ribbon.sec10s') }}</option>
              </select>
            </div>
            <div class="office-select-row" :title="t('ribbon.pollStats')">
              <FluentIcon name="insights" class="row-icon text-muted" size="14" />
              <span class="input-prefix-label">{{ t('ribbon.pollStats') }}</span>
              <select
                class="fluent-select"
                v-model="state.uiPreferences.pollIntervalStats"
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
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.frequency') }}</span>
          </div>
        </div>
      </div>

      <!-- 2.5 种子设置上下文专用标签页 (Torrent Props) -->
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
                <FluentIcon name="arrow_upward" class="text-danger" />
                <span>{{ t('props.priorityHigh') }}</span>
              </button>
              <button
                class="priority-btn"
                :class="{ active: currentTorrentPriority === 0 }"
                @click="setTorrentPriority(0)"
                :title="t('ribbon.normalPriority')"
              >
                <FluentIcon name="remove" />
                <span>{{ t('props.priorityNormal') }}</span>
              </button>
              <button
                class="priority-btn"
                :class="{ active: currentTorrentPriority === -1 }"
                @click="setTorrentPriority(-1)"
                :title="t('ribbon.lowPriority')"
              >
                <FluentIcon name="arrow_downward" class="text-primary" />
                <span>{{ t('props.priorityLow') }}</span>
              </button>
            </div>

            <div class="single-row-input">
              <span class="input-prefix-label">{{ t('ribbon.maxPeers') }}</span>
              <input
                type="number"
                class="fluent-mini-input"
                :value="currentTorrentPeerLimit"
                @change="onTorrentPeerLimitChange"
                min="1"
                max="500"
              />
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.rules') }}</span>
          </div>
        </div>

        <!-- 独立限速 (Down/Up) -->
        <div class="ribbon-group">
          <div class="ribbon-controls limits-col">
            <div class="limit-setting-row">
              <label class="office-checkbox-row compact" :title="t('ribbon.limitDown')">
                <input
                  type="checkbox"
                  class="office-checkbox-native"
                  :checked="currentTorrentDownloadLimited"
                  @change="toggleTorrentDownloadLimited"
                />
                <span class="row-label">{{ t('ribbon.limitDown') }}</span>
              </label>
              <input
                type="number"
                class="fluent-mini-input"
                :disabled="!currentTorrentDownloadLimited"
                :value="currentTorrentDownloadLimit"
                @change="onTorrentDownloadLimitChange"
                min="0"
                step="50"
              />
              <span class="unit-text">KB/s</span>
            </div>

            <div class="limit-setting-row">
              <label class="office-checkbox-row compact" :title="t('ribbon.limitUp')">
                <input
                  type="checkbox"
                  class="office-checkbox-native"
                  :checked="currentTorrentUploadLimited"
                  @change="toggleTorrentUploadLimited"
                />
                <span class="row-label">{{ t('ribbon.limitUp') }}</span>
              </label>
              <input
                type="number"
                class="fluent-mini-input"
                :disabled="!currentTorrentUploadLimited"
                :value="currentTorrentUploadLimit"
                @change="onTorrentUploadLimitChange"
                min="0"
                step="50"
              />
              <span class="unit-text">KB/s</span>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.torrentLimits') }}</span>
          </div>
        </div>

        <!-- 做种停止规则 (规整双行参数网格) -->
        <div class="ribbon-group">
          <div class="ribbon-controls seed-rules-col">
            <div class="seed-rule-row">
              <span class="rule-label">{{ t('ribbon.ratioMode') }}</span>
              <select class="fluent-select compact rule-select" :value="currentTorrentSeedRatioMode" @change="onTorrentRatioModeChange">
                <option :value="0">{{ t('props.ratioGlobal') }}</option>
                <option :value="1">{{ t('props.ratioSingle') }}</option>
                <option :value="2">{{ t('props.ratioUnlimited') }}</option>
              </select>
              <input
                type="number"
                class="fluent-mini-input rule-input"
                :disabled="currentTorrentSeedRatioMode !== 1"
                :value="currentTorrentSeedRatioMode === 1 ? currentTorrentSeedRatioLimit : ''"
                :placeholder="currentTorrentSeedRatioMode === 1 ? '' : '—'"
                @change="onTorrentRatioLimitChange"
                step="0.1"
                min="0"
              />
              <span class="unit-text" :class="{ 'unit-muted': currentTorrentSeedRatioMode !== 1 }">×</span>
            </div>

            <div class="seed-rule-row">
              <span class="rule-label">{{ t('ribbon.idleMode') }}</span>
              <select class="fluent-select compact rule-select" :value="currentTorrentSeedIdleMode" @change="onTorrentIdleModeChange">
                <option :value="0">{{ t('props.ratioGlobal') }}</option>
                <option :value="1">{{ t('props.idleSingle') }}</option>
                <option :value="2">{{ t('props.ratioUnlimited') }}</option>
              </select>
              <input
                type="number"
                class="fluent-mini-input rule-input"
                :disabled="currentTorrentSeedIdleMode !== 1"
                :value="currentTorrentSeedIdleMode === 1 ? currentTorrentSeedIdleLimit : ''"
                :placeholder="currentTorrentSeedIdleMode === 1 ? '' : '—'"
                @change="onTorrentIdleLimitChange"
                min="1"
              />
              <span class="unit-text" :class="{ 'unit-muted': currentTorrentSeedIdleMode !== 1 }">{{ t('common.min') }}</span>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.torrentSeed') }}</span>
          </div>
        </div>

        <!-- 属性与操作 (2x2 双行矩阵) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-matrix-2x2">
              <div class="btn-stack-2row">
                <button class="fluent-btn-small" @click="handleSetLocation" :title="t('ribbon.setLocation')">
                  <FluentIcon name="folder_open" />
                  <span>{{ t('ribbon.setLocation') }}</span>
                </button>
                <button class="fluent-btn-small" @click="handleRename" :title="t('ribbon.rename')">
                  <FluentIcon name="edit" />
                  <span>{{ t('ribbon.rename') }}</span>
                </button>
              </div>
              <div class="btn-stack-2row">
                <button class="fluent-btn-small" @click="copyMagnet" :title="t('detail.general.copyMagnet')">
                  <FluentIcon name="content_copy" />
                  <span>{{ t('detail.general.copyMagnet') }}</span>
                </button>
                <button class="fluent-btn-small primary" @click="openProps" :title="t('ribbon.props')">
                  <FluentIcon name="tune" />
                  <span>{{ t('ribbon.props') }}...</span>
                </button>
              </div>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.torrentMeta') }}</span>
            <button class="dialog-launcher-btn" @click="openProps" :title="t('ribbon.props')">
              <FluentIcon name="dialog_launcher" size="10" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 移动端紧凑工具条 (仅屏幕 < 768px 显示) -->
    <div class="mobile-compact-bar mobile-only">
      <!-- 模式 A：无选中任务时的常规工具条 -->
      <template v-if="!hasSelection">
        <button class="fluent-btn-mobile btn-primary" @click="state.addDialogOpen = true" :title="t('toolbar.add')">
          <FluentIcon name="add" />
        </button>
        <button class="fluent-btn-mobile" @click="handleStartAll" :title="t('toolbar.startAll')">
          <FluentIcon name="fast_forward" class="text-success" />
        </button>
        <button class="fluent-btn-mobile" @click="handleStopAll" :title="t('toolbar.pauseAll')">
          <FluentIcon name="pause_circle_outline" class="text-warning" />
        </button>
        <button class="fluent-btn-mobile" @click="selectAllTorrents" :title="t('ribbon.selectAll')">
          <FluentIcon name="select_all" />
        </button>
        <div class="mobile-search-wrap">
          <FluentIcon name="search" class="search-prefix-icon" />
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
            <FluentIcon name="close" />
          </button>
        </div>
      </template>

      <!-- 模式 B：有选中任务时的批量选择工具条 -->
      <template v-else>
        <div class="selection-badge">
          <span class="badge-text">{{ t('ribbon.selectedCount', { count: selectedCount }) }}</span>
        </div>
        <button class="fluent-btn-mobile" @click="selectAllTorrents" :title="t('ribbon.selectAll')">
          <FluentIcon name="select_all" />
        </button>
        <button class="fluent-btn-mobile" @click="state.batchTagsDialogOpen = true" :title="t('ribbon.batchTags')">
          <FluentIcon name="local_offer" class="text-accent" />
        </button>
        <button class="fluent-btn-mobile" @click="handleStart" :title="t('common.start')">
          <FluentIcon name="play_arrow" class="text-success" />
        </button>
        <button class="fluent-btn-mobile" @click="handleStop" :title="t('common.pause')">
          <FluentIcon name="pause" class="text-warning" />
        </button>
        <button class="fluent-btn-mobile" @click="handleRemove(false)" :title="t('common.delete')">
          <FluentIcon name="delete" class="text-danger" />
        </button>
        <button class="fluent-btn-mobile" v-if="selectedCount === 1" @click="openProps" :title="t('ribbon.tabs.torrentProps')">
          <FluentIcon name="tune" />
        </button>
        <button class="fluent-btn-mobile clear-sel-btn" @click="clearSelection" :title="t('common.cancel')">
          <FluentIcon name="close" />
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
          <FluentIcon name="fast_forward" />
          <span>{{ t('toolbar.startAll') }}</span>
        </div>
        <div class="menu-opt" :class="{ disabled: !hasSelection }" @click="handleStartNow">
          <FluentIcon name="bolt" />
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
          <FluentIcon name="pause_circle_outline" />
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
          <FluentIcon name="delete_forever" />
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
          <FluentIcon name="check" class="menu-check-ico" :style="{ visibility: currentLocale === 'zh-CN' ? 'visible' : 'hidden' }" />
          <span>简体中文</span>
        </div>
        <div class="menu-opt" :class="{ active: currentLocale === 'en-US' }" @click="selectLocale('en-US')">
          <FluentIcon name="check" class="menu-check-ico" :style="{ visibility: currentLocale === 'en-US' ? 'visible' : 'hidden' }" />
          <span>English</span>
        </div>
        <div class="menu-opt" :class="{ active: currentLocale === 'ru-RU' }" @click="selectLocale('ru-RU')">
          <FluentIcon name="check" class="menu-check-ico" :style="{ visibility: currentLocale === 'ru-RU' ? 'visible' : 'hidden' }" />
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
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  state,
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
  openLocationDialog,
  openRenameDialog,
  openConfirmRemove,
  openAboutDialog,
  openStatsDialog,
  showToast,
  describeError,
  copyTorrentMagnet,
  startTorrentsAction,
  stopTorrentsAction,
  startNowTorrentsAction,
  reannounceSelected,
  openFileMenu,
} from '../stores/transmission';
import { rpc } from '../api/rpc';
import { t, currentLocale, setLocale, LocaleKey } from '../locales';

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');
const currentTab = ref<'tasks' | 'transfer' | 'tools' | 'view' | 'torrentProps'>('tasks');
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
const currentTorrentSeedRatioMode = computed(() => primaryTorrent.value?.seedRatioMode ?? 0);
const currentTorrentSeedRatioLimit = computed(() => primaryTorrent.value?.seedRatioLimit ?? 2.0);
const currentTorrentSeedIdleMode = computed(() => primaryTorrent.value?.seedIdleMode ?? 0);
const currentTorrentSeedIdleLimit = computed(() => primaryTorrent.value?.seedIdleLimit ?? 30);

// 当没有选中任何种子且当前在上下文标签页时，自动切回主任务标签；反之若选中则确保上下文 Tab 完整可见
watch(hasSelection, (newVal) => {
  if (!newVal && currentTab.value === 'torrentProps') {
    currentTab.value = 'tasks';
  } else if (newVal) {
    nextTick(() => {
      const ctxTab = document.querySelector('.ribbon-tab-btn.contextual-tab') as HTMLElement | null;
      if (ctxTab) {
        ctxTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    });
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
    await fetchTorrents();
    showToast(t('common.failed', { error: describeError(err) }), 'error');
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

function onTorrentDownloadLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val >= 0) {
    updateSelectedTorrents({ downloadLimit: val });
  }
}

function onTorrentUploadLimitChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val >= 0) {
    updateSelectedTorrents({ uploadLimit: val });
  }
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

function selectTab(tab: 'tasks' | 'transfer' | 'tools' | 'view' | 'torrentProps') {
  currentTab.value = tab;
  state.ribbonTab = tab;
  if (isRibbonCollapsed.value) {
    isRibbonCollapsed.value = false;
    localStorage.setItem('ribbon_collapsed', 'false');
  }
  nextTick(() => {
    const activeEl = document.querySelector('.ribbon-tab-btn.active') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  });
}

function toggleRibbonCollapse() {
  isRibbonCollapsed.value = !isRibbonCollapsed.value;
  localStorage.setItem('ribbon_collapsed', String(isRibbonCollapsed.value));
}

// 快捷键 Ctrl+F1 折叠/展开
function onGlobalClick(e: MouseEvent) {
  if (!menus.start && !menus.stop && !menus.delete && !menus.lang && !menus.columns) {
    return;
  }
  const target = e.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('.fluent-dropdown-menu')) {
    return;
  }
  if (
    target.closest('.split-arrow-btn') ||
    target.closest('.lang-dropdown-wrapper') ||
    target.closest('.fluent-btn-small')
  ) {
    return;
  }
  closeAllMenus();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeAllMenus();
    return;
  }
  if (e.ctrlKey && e.key === 'F1') {
    e.preventDefault();
    toggleRibbonCollapse();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('click', onGlobalClick, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('click', onGlobalClick, true);
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
  if (allIds.length > 0) startTorrentsAction(allIds);
}

async function handleStartNow() {
  closeAllMenus();
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (state.selectedId ? [state.selectedId] : []);
  if (ids.length === 0) return;
  await startNowTorrentsAction(ids);
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
  if (allIds.length > 0) stopTorrentsAction(allIds);
}

function handleRemove(trashData = false) {
  closeAllMenus();
  if (!hasSelection.value) return;
  openConfirmRemove(trashData);
}

function copyMagnet() {
  if (!selectedTorrentId.value) return;
  copyTorrentMagnet(selectedTorrentId.value);
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
  await reannounceSelected(targetTorrentIds.value);
}

async function setPriority(pri: number) {
  await updateSelectedTorrents({ bandwidthPriority: pri });
}

function handleSetLocation() {
  if (!hasSelection.value) return;
  openLocationDialog();
}

function handleRename() {
  if (!hasSelection.value) return;
  openRenameDialog();
}

function toggleTheme() {
  isDark.value = !isDark.value;
  const val = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', val);
  localStorage.setItem('theme', val);
}
</script>

<style scoped>
/* Fluent Ribbon Root 架构 (Office 2016 纯平扁平化，零圆角、零外阴影) */
.fluent-ribbon-root {
  background-color: var(--fluent-bg-canvas);
  border-bottom: 1px solid var(--fluent-border-subtle);
  display: flex;
  flex-direction: column;
  user-select: none;
  position: relative;
  z-index: 200;
  box-shadow: none !important;
  flex-shrink: 0;
}

/* 1. 标题与 Tab 行 (高度 38px，Office 2016 纯平单色，无渐变、无底边线) */
.ribbon-header-row {
  height: 38px;
  display: flex;
  align-items: stretch;
  padding: 0 8px 0 8px;
  gap: 4px;
  background-color: var(--ribbon-header-bg);
  border-bottom: none !important;
  position: relative;
  box-shadow: none !important;
}

.hamburger-btn {
  color: var(--ribbon-header-text) !important;
  align-self: center;
}

.hamburger-btn:hover {
  background-color: var(--ribbon-header-tab-hover) !important;
}

.fluent-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 6px;
  align-self: center;
}

.brand-logo {
  flex-shrink: 0;
}

.brand-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
}

/* 文件 (File) 菜单按钮 (Office 2016 纯平直角块，零 border-radius) */
.file-menu-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
}

.ribbon-file-btn {
  height: 100%;
  padding: 0 16px;
  background-color: var(--ribbon-file-btn-bg);
  color: #ffffff;
  border: none !important;
  border-radius: 0 !important;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-sizing: border-box;
}

.ribbon-file-btn:hover,
.ribbon-file-btn.active {
  background-color: var(--ribbon-file-btn-hover);
}

/* Fluent 选项卡导航 (Office 2016 零缝隙纯文字与纯平直角) */
.ribbon-tabs {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.ribbon-tabs::-webkit-scrollbar {
  display: none;
}

.ribbon-tab-btn {
  height: 100%;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  gap: 0;
  background: transparent;
  border: none !important;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  border-radius: 0 !important;
  box-shadow: none !important;
  transition: all 0.1s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
  box-sizing: border-box;
}

.ribbon-tab-btn:hover {
  background-color: var(--ribbon-header-tab-hover);
  color: #ffffff;
}

/* 激活状态：彻底消除 1px 底横线，无缝与画板融为一体，坚决无 border-radius */
.ribbon-tab-btn.active {
  background-color: var(--fluent-bg-canvas);
  color: var(--ribbon-header-tab-active-text);
  font-weight: 600;
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  z-index: 2;
}

/* Office 2016 鲜艳上下文选项卡 (告别与红色混浊的脏暗紫！高辨识度琥珀指示金顶) */
.ribbon-tab-btn.contextual-tab {
  background-color: var(--ribbon-contextual-bg);
  color: #ffffff;
  border: none !important;
  border-radius: 0 !important;
  font-weight: 600;
  line-height: 1;
}

.ribbon-tab-btn.contextual-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--ribbon-contextual-border);
  z-index: 3;
}

.ribbon-tab-btn.contextual-tab:hover {
  background-color: rgba(255, 255, 255, 0.32);
}

.ribbon-tab-btn.contextual-tab.active {
  background-color: var(--fluent-bg-canvas);
  color: #b71c1c;
  border: none !important;
  border-bottom: none !important;
  border-radius: 0 !important;
}

[data-theme="dark"] .ribbon-tab-btn.contextual-tab.active {
  color: #ffa000;
}

.tab-text {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.tab-icon {
  font-size: 15px;
}

/* 右侧系统工具 */
.ribbon-sys-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: center;
  flex-shrink: 0;
  margin-left: auto;
}

.ribbon-sys-tools .fluent-tool-btn {
  color: rgba(255, 255, 255, 0.9);
}

.ribbon-sys-tools .fluent-tool-btn:hover {
  background-color: var(--ribbon-header-tab-hover);
  color: #ffffff;
}

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

.btn-active-turtle {
  background-color: #ff9800 !important;
  color: #ffffff !important;
}

/* 2. 第二层：Ribbon 命令画板 (Office 2016 规范高度 94px，宽裕无截断) */
.ribbon-body {
  height: 94px;
  min-height: 94px;
  background-color: var(--fluent-bg-canvas);
  display: flex;
  padding: 4px 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  box-sizing: border-box;
  flex-shrink: 0;
}

.ribbon-tab-pane {
  display: flex;
  align-items: stretch;
  gap: 10px;
  height: 100%;
  flex-shrink: 0;
}

/* 磁贴功能组 (Command Group) */
.ribbon-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--fluent-border-divider);
  padding-right: 10px;
  position: relative;
  flex-shrink: 0;
  height: 100%;
  box-sizing: border-box;
}

.ribbon-group:last-child {
  border-right: none;
}

.ribbon-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
}

/* 功能组底栏 (标题 + Launcher) */
.group-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.group-title {
  font-size: 10px;
  line-height: 16px;
  color: var(--md-text-disabled);
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-align: center;
}

.dialog-launcher-btn {
  position: absolute;
  right: -2px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--md-text-disabled);
  padding: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  line-height: 1;
  width: 14px;
  height: 14px;
}

.dialog-launcher-btn:hover {
  color: var(--fluent-accent);
  background-color: var(--fluent-bg-hover);
}

.dialog-launcher-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

/* Fluent 大按钮 (Large Button) */
.fluent-btn-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 58px;
  padding: 2px 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  cursor: pointer;
  color: var(--md-text-primary);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.fluent-btn-large:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-large.primary-btn {
  color: var(--fluent-accent);
}

.fluent-btn-large.primary-btn .large-icon {
  color: var(--fluent-accent);
}

.fluent-btn-large.active {
  background-color: rgba(0, 120, 212, 0.12);
  border-color: var(--fluent-accent);
  color: var(--fluent-accent);
}

.fluent-btn-large:disabled {
  opacity: 0.38;
  cursor: default;
}

.large-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.btn-caption {
  font-size: 11px;
  line-height: 1.15;
  text-align: center;
  max-width: 68px;
  word-break: break-word;
}

/* 按钮垂直堆叠列 (三行紧凑排版，高度与大按钮精确对齐) */
.btn-stack {
  display: flex;
  flex-direction: column;
  gap: 1px;
  justify-content: center;
}

.btn-stack .fluent-btn-small {
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  gap: 4px;
}

/* 双行紧凑按钮堆叠 (Office 规范，饱满无空旷) */
.btn-stack-2row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
}

.btn-stack-2row .fluent-btn-small {
  height: 25px;
  padding: 0 8px;
  font-size: 11px;
  gap: 5px;
}

/* 2x2 按钮矩阵 (队列调度与属性操作) */
.btn-matrix-2x2 {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 拆分操作按钮 (Split Button) */
.fluent-split-btn {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: var(--fluent-radius);
  background-color: var(--fluent-bg-canvas);
  transition: all 0.15s ease;
}

.fluent-split-btn:hover {
  border-color: var(--fluent-border-divider);
  background-color: var(--fluent-bg-hover);
}

.split-main-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--md-text-primary);
  cursor: pointer;
}

.split-main-btn:disabled {
  opacity: 0.38;
  cursor: default;
}

.split-arrow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 4px;
  background: transparent;
  border: none;
  border-left: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-secondary);
  cursor: pointer;
}

.split-arrow-btn:disabled {
  opacity: 0.38;
  cursor: default;
}

/* Fluent 小型横向按钮 */
.fluent-btn-small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.fluent-btn-small:hover:not(:disabled) {
  background-color: var(--fluent-bg-hover);
  border-color: var(--fluent-border-subtle);
}

.fluent-btn-small:disabled {
  opacity: 0.38;
  cursor: default;
}

.fluent-btn-small.primary {
  color: var(--fluent-accent);
  font-weight: 500;
}

.fluent-btn-small.ribbon-toggle-btn.active {
  background-color: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.18);
  color: var(--fluent-accent);
  font-weight: 600;
}

[data-theme="dark"] .fluent-btn-small.ribbon-toggle-btn.active {
  background-color: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
  color: #60cdff;
}

/* Office 2016 规范左对齐复选框行与控件组 (无圆角药丸框、紧凑整洁) */
.office-checkbox-group,
.office-select-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  align-items: flex-start;
  min-width: 116px;
}

.office-checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 4px;
  border-radius: 0;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  color: var(--md-text-primary);
  background: transparent;
  border: 1px solid transparent;
  transition: background-color 0.1s ease;
  width: 100%;
  box-sizing: border-box;
}

.office-checkbox-row:hover {
  background-color: var(--fluent-bg-hover);
}

.office-checkbox-row.compact {
  height: 20px;
  padding: 0 2px;
}

.office-checkbox-native {
  margin: 0;
  width: 13px;
  height: 13px;
  cursor: pointer;
  accent-color: var(--fluent-accent);
}

.office-checkbox-row .row-icon {
  flex-shrink: 0;
}

.office-checkbox-row .row-label {
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.office-select-row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  font-size: 11px;
  width: 100%;
}

.office-select-row .row-icon {
  flex-shrink: 0;
}

.office-select-row .input-prefix-label {
  font-size: 11px;
  color: var(--md-text-secondary);
  white-space: nowrap;
}

.office-select-row .fluent-select {
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  border-radius: 0;
  outline: none;
}

.office-select-row .fluent-select:focus {
  border-color: var(--fluent-accent);
}

/* 切换状态按钮 */
.fluent-toggle-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--fluent-radius);
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fluent-toggle-item:hover {
  background-color: var(--fluent-bg-hover);
}

.fluent-toggle-item.active {
  background-color: rgba(0, 120, 212, 0.12);
  border-color: rgba(0, 120, 212, 0.3);
  color: var(--fluent-accent);
  font-weight: 500;
}

.fluent-toggle-item.compact {
  height: 22px;
  padding: 0 4px;
}

/* 输入框与控件排版 */
.view-prefs-col,
.limits-col,
.seed-rules-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
}

.poll-row,
.limit-setting-row,
.seed-rule-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.seed-rule-row .rule-label {
  width: 68px;
  font-size: 11px;
  color: var(--md-text-secondary);
  white-space: nowrap;
  text-align: right;
  flex-shrink: 0;
}

.seed-rule-row .rule-select {
  width: 108px;
  flex-shrink: 0;
}

.seed-rule-row .rule-input {
  width: 44px;
  text-align: center;
  flex-shrink: 0;
}

.seed-rule-row .rule-input:disabled {
  opacity: 0.35;
  background-color: var(--fluent-bg-canvas);
  border-color: var(--fluent-border-subtle);
  cursor: not-allowed;
}

.seed-rule-row .unit-text {
  width: 16px;
  font-size: 10px;
  color: var(--md-text-disabled);
  flex-shrink: 0;
}

.seed-rule-row .unit-muted {
  visibility: hidden;
}

.input-prefix-label {
  font-size: 11px;
  color: var(--md-text-secondary);
  white-space: nowrap;
}

.fluent-select {
  height: 22px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  outline: none;
}

.fluent-select.compact {
  height: 20px;
}

.fluent-mini-input {
  width: 52px;
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  outline: none;
}

.unit-text {
  font-size: 10px;
  color: var(--md-text-disabled);
}

/* 优先级三段组 */
.priority-btn-group {
  display: inline-flex;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.priority-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  background: transparent;
  border: none;
  font-size: 11px;
  cursor: pointer;
  color: var(--md-text-primary);
  border-right: 1px solid var(--fluent-border-subtle);
}

.priority-btn:last-child {
  border-right: none;
}

.priority-btn:hover {
  background-color: var(--fluent-bg-hover);
}

.priority-btn.active {
  background-color: rgba(0, 120, 212, 0.15);
  color: var(--fluent-accent);
  font-weight: 600;
}

.single-row-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 搜索框 */
.search-group {
  margin-left: auto;
}

.fluent-search-input {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  gap: 6px;
  width: 170px;
}

.search-native-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--md-text-primary);
  font-size: 11px;
}

.search-clear-btn {
  background: transparent;
  border: none;
  color: var(--md-text-disabled);
  cursor: pointer;
  display: flex;
  padding: 0;
}

/* 移动端紧凑工具条 */
.mobile-compact-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: var(--fluent-bg-canvas);
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.fluent-btn-mobile {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-primary);
  cursor: pointer;
}

.fluent-btn-mobile.btn-primary {
  background-color: var(--fluent-accent);
  color: #ffffff;
  border-color: transparent;
}

.mobile-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 32px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  padding: 0 8px;
  gap: 6px;
}

.mobile-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  color: var(--md-text-primary);
}

.selection-badge {
  padding: 4px 8px;
  background-color: rgba(0, 120, 212, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: var(--fluent-accent);
  font-weight: 600;
}

/* 通用 Teleport 下拉菜单 */
.fluent-dropdown-menu.teleported {
  min-width: 150px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-divider);
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--md-text-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.menu-opt:hover:not(.disabled) {
  background-color: var(--fluent-bg-hover);
}

.menu-opt.disabled {
  opacity: 0.4;
  cursor: default;
}

.menu-check-ico {
  font-size: 14px;
  color: var(--fluent-accent);
}

.columns-dropdown-menu {
  width: 180px;
}

.cols-menu-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--md-text-secondary);
  padding: 6px 8px;
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.cols-menu-list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.cols-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.cols-menu-item:hover {
  background-color: var(--fluent-bg-hover);
}

/* 响应式断点 (支持小屏笔记本与窄窗自适应，绝不挤压 Tab 栏) */
@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 1080px) {
  .fluent-brand .brand-text {
    display: none; /* 释放 ~85px 空间 */
  }
  .ribbon-tab-btn {
    padding: 0 9px; /* 紧凑 Tab 内边距 */
  }
  .ribbon-sys-tools {
    gap: 2px;
  }
}

@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
}
</style>
