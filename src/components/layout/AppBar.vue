<template>
  <header class="fluent-ribbon-root" :class="{ 'ribbon-collapsed': isRibbonCollapsed, 'compact-density': state.compactDensity }" @click="closeAllMenus">
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

      <!-- Transmission 官方高保真品牌与 Backstage / 文件后台入口一体化按钮 -->
      <div class="file-menu-wrapper">
        <button
          class="ribbon-file-btn brand-file-btn"
          :class="{ active: state.fileMenuOpen, 'brand-breathing': isBrandBreathing }"
          @click.stop="handleBrandFileClick"
          :title="t('ribbon.brandFileHint')"
        >
          <TransmissionLogo :size="state.compactDensity ? 16 : 18" class="brand-logo" />
          <span class="brand-text">Transmission</span>
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

      <!-- Office 365 风格顶栏居中常驻搜索框 (全局可用，不随 Tab 切换消失) -->
      <div class="top-search-wrap desktop-only" :class="{ 'has-value': !!state.filter.search }">
        <FluentIcon name="search" class="top-search-icon" />
        <input
          type="text"
          v-model="state.filter.search"
          :placeholder="t('app.searchPlaceholder')"
          class="top-search-input"
        />
        <button
          class="top-search-clear"
          v-if="state.filter.search"
          @click="state.filter.search = ''"
          :title="t('common.close')"
        >
          <FluentIcon name="close" />
        </button>
      </div>

      <!-- 右侧：全局通用设置与快捷工具 (去重后保留核心项) -->
      <div class="ribbon-sys-tools">
        <!-- 全局首选项 -->
        <button class="fluent-tool-btn" @click="openFileMenu('settings')" :title="t('toolbar.settings')">
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
            <button class="fluent-btn-large primary-btn" @click="openFileMenu('add')" :title="t('toolbar.addTitle')">
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
            <button class="dialog-launcher-btn" @click="openFileMenu('add')" :title="t('toolbar.addTitle')">
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

        <!-- 选择操作组 (标准 Office / Explorer 规范：全选、取消选择、反选) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-stack">
              <button
                class="fluent-btn-small"
                @click="selectAllTorrents"
                :title="`${t('common.selectAll')} (Ctrl+A)`"
              >
                <FluentIcon name="select_all" class="text-accent" />
                <span>{{ t('common.selectAll') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                :disabled="!hasSelection"
                @click="clearSelection"
                :title="`${t('common.deselectAll')} (Esc)`"
              >
                <FluentIcon name="close" />
                <span>{{ t('common.deselectAll') }}</span>
              </button>
              <button
                class="fluent-btn-small"
                @click="invertSelection"
                :title="t('common.invertSelection')"
              >
                <FluentIcon name="invert_selection" />
                <span>{{ t('common.invertSelection') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.select') }}</span>
          </div>
        </div>

        <!-- 详情视图组 -->
        <div class="ribbon-group">
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
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('toolbar.detail') }}</span>
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
                @click="confirmVerifySelected()"
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
              <button class="fluent-btn-small" @click="openFileMenu('stats')" :title="t('sidebar.stats')">
                <FluentIcon name="insights" />
                <span>{{ t('sidebar.stats') }}</span>
              </button>
              <button class="fluent-btn-small" @click="openFileMenu('about')" :title="t('ribbon.about')">
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
        <!-- 侧边栏与分组 (Office 2016 规范切换按钮) -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <div class="btn-stack">
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
              <button
                class="fluent-btn-small ribbon-toggle-btn"
                :class="{ active: state.uiPreferences.showFolderGroup }"
                @click="state.uiPreferences.showFolderGroup = !state.uiPreferences.showFolderGroup; saveUIPreferences()"
                :title="t('ribbon.showFolders')"
              >
                <FluentIcon name="folder" />
                <span>{{ t('ribbon.showFolders') }}</span>
              </button>
            </div>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.panels') }}</span>
          </div>
        </div>

        <!-- 界面密度 -->
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="fluent-btn-small"
              :class="{ active: state.compactDensity }"
              @click="toggleCompactDensity"
              :title="t('ribbon.compactDensityHint')"
            >
              <FluentIcon name="format_line_spacing" />
              <span>{{ t('ribbon.compactDensity') }}</span>
            </button>
          </div>
          <div class="group-footer">
            <span class="group-title">{{ t('ribbon.groups.interface') }}</span>
          </div>
        </div>

        <!-- 表格列自定义组 (双行堆叠，仅表格视图可见，卡片模式自适应隐藏) -->
        <div class="ribbon-group" v-if="state.viewMode === 'table'">
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
              <FluentIcon name="sync" class="row-icon" />
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
              <FluentIcon name="insights" class="row-icon" />
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

        <!-- 属性与操作 (更改路径、重命名、复制磁链、属性) -->
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
      </div>
    </div>

    <!-- 3. 移动端紧凑工具条 (仅屏幕 < 768px 显示) -->
    <div class="mobile-compact-bar mobile-only">
      <!-- 模式 A：无选中任务时的常规工具条 -->
      <template v-if="!hasSelection">
        <button class="fluent-btn-mobile btn-primary" @click="openFileMenu('add')" :title="t('toolbar.add')">
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
        <button class="fluent-btn-mobile" @click="mobileMenuOpen = true" :title="t('ribbon.moreActions')">
          <FluentIcon name="more_vert" />
        </button>
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
        <button class="fluent-btn-mobile" @click="mobileMenuOpen = true" :title="t('ribbon.moreActions')">
          <FluentIcon name="more_vert" />
        </button>
      </template>
    </div>

    <!-- 4. 移动端吸顶微胶囊状态小栏 (紧随移动工具条下方，常驻展示) -->
    <div class="mobile-sub-status-bar mobile-only">
      <!-- 左侧：任务总数 / 选中汇总 (完全套用桌面状态栏逻辑) -->
      <div class="sub-stat-summary">
        <span class="sub-stat-count">{{ selectionText }}</span>
      </div>

      <!-- 中间：实时下载与上传速率 (点击呼出限速设置) -->
      <div class="sub-stat-speeds">
        <button
          class="sub-speed-btn down"
          :class="{
            active: mobileSpeedFlyout.open && mobileSpeedFlyout.type === 'down',
            'is-limited': isDownLimited,
            'is-turtle': isTurtleActive,
            'is-regular-limit': isDownLimited && !isTurtleActive
          }"
          @click.stop="toggleMobileSpeedFlyout('down')"
          :title="downLimitTooltip"
        >
          <FluentIcon name="arrow_downward" class="sub-speed-icon text-info" />
          <span class="sub-speed-val">{{ formatSpeed(currentRateDownload) }}</span>
          <span
            class="sub-speed-limit"
            :class="{ 'turtle-limit': isTurtleActive, 'regular-limit': isDownLimited && !isTurtleActive }"
            v-if="isDownLimited"
          >
            [{{ formatBytes(downLimitBytes) }}/s]
          </span>
        </button>

        <button
          class="sub-speed-btn up"
          :class="{
            active: mobileSpeedFlyout.open && mobileSpeedFlyout.type === 'up',
            'is-limited': isUpLimited,
            'is-turtle': isTurtleActive,
            'is-regular-limit': isUpLimited && !isTurtleActive
          }"
          @click.stop="toggleMobileSpeedFlyout('up')"
          :title="upLimitTooltip"
        >
          <FluentIcon name="arrow_upward" class="sub-speed-icon text-success" />
          <span class="sub-speed-val">{{ formatSpeed(currentRateUpload) }}</span>
          <span
            class="sub-speed-limit"
            :class="{ 'turtle-limit': isTurtleActive, 'regular-limit': isUpLimited && !isTurtleActive }"
            v-if="isUpLimited"
          >
            [{{ formatBytes(upLimitBytes) }}/s]
          </span>
        </button>
      </div>

      <!-- 右侧：乌龟模式开关 + 视图模式切换 -->
      <div class="sub-stat-actions">
        <button
          class="sub-action-btn turtle-btn"
          :class="{ active: state.session?.['alt-speed-enabled'] }"
          @click="toggleTurtleMode"
          :title="t('toolbar.turtle')"
        >
          <FluentIcon name="speed" />
        </button>

        <div class="sub-view-switch" role="group" :aria-label="t('statusbar.tableView')">
          <button
            class="sub-action-btn view-btn"
            :class="{ active: state.viewMode === 'cards' }"
            @click="setViewMode('cards')"
            :title="t('statusbar.cardsView')"
          >
            <FluentIcon name="grid_view" />
          </button>
          <button
            class="sub-action-btn view-btn"
            :class="{ active: state.viewMode === 'table' }"
            @click="setViewMode('table')"
            :title="t('statusbar.tableView')"
          >
            <FluentIcon name="table_chart" />
          </button>
        </div>
      </div>

      <!-- 移动端限速微型 Flyout 气泡 -->
      <div
        class="mobile-speed-flyout"
        :class="mobileSpeedFlyout.type"
        v-if="mobileSpeedFlyout.open"
        @click.stop
      >
        <div class="flyout-header">
          <span>{{ mobileSpeedFlyout.type === 'down' ? t('statusbar.downLimit') : t('statusbar.upLimit') }}</span>
          <button class="flyout-close-btn" @click="mobileSpeedFlyout.open = false" :title="t('common.close')">
            <FluentIcon name="close" />
          </button>
        </div>
        <div class="flyout-body">
          <label class="fluent-check-label">
            <input type="checkbox" v-model="mobileSpeedFlyout.enabled" />
            <span>{{ mobileSpeedFlyout.type === 'down' ? t('statusbar.downLimit') : t('statusbar.upLimit') }}</span>
          </label>
          <div class="flyout-input-row" v-if="mobileSpeedFlyout.enabled">
            <input
              type="number"
              class="num-input flyout-num"
              v-model.number="mobileSpeedFlyout.limit"
              min="0"
              step="50"
            />
            <span class="unit-txt">KB/s</span>
          </div>
        </div>
        <div class="flyout-footer">
          <button class="fluent-btn-mobile-sub cancel" @click="mobileSpeedFlyout.open = false">
            {{ t('common.cancel') }}
          </button>
          <button class="fluent-btn-mobile-sub save" @click="saveMobileSpeedLimit">
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端操作面板：把 Ribbon 的常用命令收进底部弹出层 -->
    <Teleport to="body">
      <div class="mobile-sheet-backdrop" v-if="mobileMenuOpen" @click="mobileMenuOpen = false"></div>
      <div class="mobile-sheet" v-if="mobileMenuOpen" @click.stop>
        <div class="mobile-sheet-handle"></div>
        <div class="mobile-sheet-title">{{ t('ribbon.moreActions') }}</div>
        <div class="mobile-sheet-grid">
          <button class="mobile-sheet-action" @click="runMobile(() => openFileMenu('add'))">
            <FluentIcon name="add" />
            <span>{{ t('toolbar.add') }}</span>
          </button>
          <button class="mobile-sheet-action" @click="runMobile(() => openFileMenu())">
            <FluentIcon name="folder_open" />
            <span>{{ t('backstage.title') }}</span>
          </button>
          <button class="mobile-sheet-action" @click="runMobile(handleStartAll)">
            <FluentIcon name="fast_forward" />
            <span>{{ t('toolbar.startAll') }}</span>
          </button>
          <button class="mobile-sheet-action" @click="runMobile(handleStopAll)">
            <FluentIcon name="pause_circle_outline" />
            <span>{{ t('toolbar.pauseAll') }}</span>
          </button>
          <button class="mobile-sheet-action" @click="runMobile(selectAllTorrents)">
            <FluentIcon name="select_all" />
            <span>{{ t('ribbon.selectAll') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(() => (state.batchTagsDialogOpen = true))">
            <FluentIcon name="local_offer" />
            <span>{{ t('ribbon.batchTags') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(openProps)">
            <FluentIcon name="tune" />
            <span>{{ t('ribbon.props') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(handleRename)">
            <FluentIcon name="edit" />
            <span>{{ t('ribbon.rename') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(openLocationDialog)">
            <FluentIcon name="folder_open" />
            <span>{{ t('ribbon.setLocation') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(confirmVerifySelected)">
            <FluentIcon name="check_circle_outline" />
            <span>{{ t('common.verify') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(reannounceSelected)">
            <FluentIcon name="sync" />
            <span>{{ t('ribbon.reannounce') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(handleStart)">
            <FluentIcon name="play_arrow" />
            <span>{{ t('common.start') }}</span>
          </button>
          <button class="mobile-sheet-action" v-if="hasSelection" @click="runMobile(handleStop)">
            <FluentIcon name="pause" />
            <span>{{ t('common.pause') }}</span>
          </button>
          <button class="mobile-sheet-action danger" v-if="hasSelection" @click="runMobile(() => handleRemove(false))">
            <FluentIcon name="delete" />
            <span>{{ t('common.delete') }}</span>
          </button>
        </div>
      </div>
    </Teleport>

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
          <div class="cols-menu-item" v-for="(col, index) in state.columns" :key="col.id">
            <label class="cols-menu-label">
              <input type="checkbox" v-model="col.visible" @change="saveColumns" />
              <span>{{ t(col.labelKey) }}</span>
            </label>
            <div class="cols-order-buttons">
              <button class="cols-order-btn" :disabled="index === 0" @click.stop="moveColumn(index, -1)" :title="t('ribbon.moveColumnUp')"><FluentIcon name="arrow_upward" /></button>
              <button class="cols-order-btn" :disabled="index === state.columns.length - 1" @click.stop="moveColumn(index, 1)" :title="t('ribbon.moveColumnDown')"><FluentIcon name="arrow_downward" /></button>
            </div>
          </div>
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
  confirmVerifySelected,
  removeSelected,
  openTorrentProps,
  updateTorrentPropsOptimistically,
  fetchTorrents,
  saveColumns,
  resetColumns,
  saveUIPreferences,
  toggleViewMode,
  selectAllTorrents,
  clearSelection,
  invertSelection,
  openLocationDialog,
  openRenameDialog,
  openConfirmRemove,
  openAboutDialog,
  openStatsDialog,
  showToast,
  describeError,
  copyTorrentMagnet,
  copyTorrentMagnets,
  startTorrentsAction,
  stopTorrentsAction,
  startNowTorrentsAction,
  reannounceSelected,
  openFileMenu,
  toggleCompactDensity,
  setViewMode,
  formatBytes,
  formatSpeed,
} from '../../stores/transmission';
import { rpc } from '../../api/rpc';
import { t, currentLocale, setLocale, LocaleKey } from '../../locales';

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark');
const currentTab = ref<'tasks' | 'transfer' | 'tools' | 'view' | 'torrentProps'>('tasks');
const isRibbonCollapsed = ref(localStorage.getItem('ribbon_collapsed') === 'true');
const mobileMenuOpen = ref(false);

// 下拉菜单浮层状态
const menus = reactive({
  start: false,
  stop: false,
  delete: false,
  lang: false,
  columns: false,
});

const menuPos = reactive({ top: 0, left: 0 });

const isBrandBreathing = ref(false);

onMounted(() => {
  if (typeof window !== 'undefined' && !localStorage.getItem('transmission_brand_clicked')) {
    isBrandBreathing.value = true;
  }
});

function handleBrandFileClick() {
  if (isBrandBreathing.value) {
    isBrandBreathing.value = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('transmission_brand_clicked', 'true');
    }
  }
  openFileMenu();
}

function runMobile(action: () => void) {
  mobileMenuOpen.value = false;
  action();
}

function closeAllMenus() {
  menus.start = false;
  menus.stop = false;
  menus.delete = false;
  menus.lang = false;
  menus.columns = false;
  mobileSpeedFlyout.open = false;
}

// 移动端顶部微胶囊状态条：速率与限速状态
const selectedTorrents = computed(() => {
  if (state.selectedIds.length === 0) return [];
  const set = new Set(state.selectedIds);
  return state.torrents.filter((t) => set.has(t.id));
});

const selectedSize = computed(() => {
  return selectedTorrents.value.reduce((acc, cur) => acc + (cur.totalSize || cur.sizeWhenDone || 0), 0);
});

const selectionText = computed(() => {
  const count = state.selectedIds.length;
  if (count === 0) {
    return t('statusbar.totalItems', { count: state.torrents.length });
  }
  return t('statusbar.selectedItems', {
    total: state.torrents.length,
    count,
    size: formatBytes(selectedSize.value),
  });
});

const currentRateDownload = computed(() => {
  return state.stats?.downloadSpeed ?? state.torrents.reduce((acc, t) => acc + (t.rateDownload || 0), 0);
});

const currentRateUpload = computed(() => {
  return state.stats?.uploadSpeed ?? state.torrents.reduce((acc, t) => acc + (t.rateUpload || 0), 0);
});

const isTurtleActive = computed(() => !!state.session?.['alt-speed-enabled']);

const isDownLimited = computed(() => {
  if (isTurtleActive.value) return true;
  return !!state.session?.['speed-limit-down-enabled'];
});

const isUpLimited = computed(() => {
  if (isTurtleActive.value) return true;
  return !!state.session?.['speed-limit-up-enabled'];
});

const downLimitBytes = computed(() => {
  if (isTurtleActive.value) {
    return (state.session?.['alt-speed-down'] ?? 0) * 1024;
  }
  return (state.session?.['speed-limit-down'] ?? 0) * 1024;
});

const upLimitBytes = computed(() => {
  if (isTurtleActive.value) {
    return (state.session?.['alt-speed-up'] ?? 0) * 1024;
  }
  return (state.session?.['speed-limit-up'] ?? 0) * 1024;
});

const downLimitTooltip = computed(() => {
  if (isDownLimited.value) {
    const reason = isTurtleActive.value ? t('toolbar.turtle') : t('statusbar.downLimit');
    return `${t('sidebar.downLimit')} · ${reason}: ${formatBytes(downLimitBytes.value)}/s`;
  }
  return t('sidebar.downLimit');
});

const upLimitTooltip = computed(() => {
  if (isUpLimited.value) {
    const reason = isTurtleActive.value ? t('toolbar.turtle') : t('statusbar.upLimit');
    return `${t('sidebar.upLimit')} · ${reason}: ${formatBytes(upLimitBytes.value)}/s`;
  }
  return t('sidebar.upLimit');
});

const mobileSpeedFlyout = reactive({
  open: false,
  type: 'down' as 'down' | 'up',
  enabled: false,
  limit: 0,
});

function toggleMobileSpeedFlyout(type: 'down' | 'up') {
  if (mobileSpeedFlyout.open && mobileSpeedFlyout.type === type) {
    mobileSpeedFlyout.open = false;
    return;
  }
  mobileSpeedFlyout.type = type;
  if (type === 'down') {
    mobileSpeedFlyout.enabled = !!state.session?.['speed-limit-down-enabled'];
    mobileSpeedFlyout.limit = state.session?.['speed-limit-down'] ?? 100;
  } else {
    mobileSpeedFlyout.enabled = !!state.session?.['speed-limit-up-enabled'];
    mobileSpeedFlyout.limit = state.session?.['speed-limit-up'] ?? 100;
  }
  mobileSpeedFlyout.open = true;
}

async function saveMobileSpeedLimit() {
  const args: any = {};
  if (mobileSpeedFlyout.type === 'down') {
    args['speed-limit-down-enabled'] = mobileSpeedFlyout.enabled;
    args['speed-limit-down'] = mobileSpeedFlyout.limit;
  } else {
    args['speed-limit-up-enabled'] = mobileSpeedFlyout.enabled;
    args['speed-limit-up'] = mobileSpeedFlyout.limit;
  }
  if (state.session) {
    Object.assign(state.session, args);
  }
  await rpc.setSession(args);
  mobileSpeedFlyout.open = false;
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

function moveColumn(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= state.columns.length) return;
  const next = [...state.columns];
  [next[index], next[target]] = [next[target], next[index]];
  state.columns = next;
  saveColumns();
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
  if (window.innerWidth > 1024) {
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
  try {
    await updateTorrentPropsOptimistically(ids, props);
  } catch (err: any) {
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
  const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  const isInput = targetTag === 'input' || targetTag === 'textarea';

  if (e.key === 'Escape') {
    closeAllMenus();
    if (!isInput && hasSelection.value) {
      clearSelection();
    }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A') && !isInput) {
    e.preventDefault();
    selectAllTorrents();
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
  const ids = state.selectedIds.length > 0 ? state.selectedIds : (selectedTorrentId.value ? [selectedTorrentId.value] : []);
  if (ids.length === 0) return;
  copyTorrentMagnets(ids);
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
  height: auto !important;
}

.fluent-ribbon-root.compact-density .ribbon-body {
  height: 38px;
  min-height: 38px;
  padding: 2px 8px;
}

.fluent-ribbon-root.compact-density .ribbon-group {
  padding-right: 8px;
}

.fluent-ribbon-root.compact-density .group-title {
  font-size: 9px;
}

.fluent-ribbon-root.compact-density .ribbon-header-row {
  height: 30px;
  padding: 0 4px;
}

.fluent-ribbon-root.compact-density .brand-file-btn {
  padding: 0 8px;
  gap: 5px;
}

.fluent-ribbon-root.compact-density .brand-file-btn .brand-text {
  font-size: 12px;
}

.fluent-ribbon-root.compact-density .ribbon-tab-btn {
  padding: 0 8px;
  font-size: 11px;
}

.fluent-ribbon-root.compact-density .fluent-search-box {
  height: 22px;
  width: 130px;
}

.fluent-ribbon-root.compact-density .top-search-input {
  font-size: 11px;
}

.fluent-ribbon-root.compact-density .fluent-tool-btn {
  height: 24px;
  width: 24px;
  padding: 0 2px;
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

/* 文件 (File) 菜单与品牌一体化按钮 (Office 2016 纯平直角块，零 border-radius) */
.file-menu-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
}

.brand-logo {
  flex-shrink: 0;
}

.brand-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background-color: var(--ribbon-file-btn-bg);
  border: none !important;
  border-radius: 0 !important;
  cursor: pointer;
  transition: background-color 0.15s ease;
  user-select: none;
}

.brand-file-btn:hover,
.brand-file-btn.active {
  background-color: var(--ribbon-file-btn-hover);
}

.brand-file-btn .brand-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
}

/* 首次进入引导：Transmission 品牌标签呼吸闪烁（明暗呼吸效果，点击即止） */
.brand-file-btn.brand-breathing {
  animation: brandBreathe 2.2s ease-in-out infinite;
  position: relative;
}

.brand-file-btn.brand-breathing:hover,
.brand-file-btn.brand-breathing.active {
  animation: none;
  filter: none;
  opacity: 1;
}

@keyframes brandBreathe {
  0%, 100% {
    filter: brightness(1);
    opacity: 1;
  }
  50% {
    filter: brightness(1.35) drop-shadow(0 0 4px rgba(255, 255, 255, 0.45));
    opacity: 0.78;
  }
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

/* Office 365 顶栏常驻居中搜索框 */
.top-search-wrap {
  display: flex;
  align-items: center;
  align-self: center;
  position: relative;
  width: 140px;
  max-width: 380px;
  height: 26px;
  background-color: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  padding: 0 8px;
  margin: 0 auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: width 0.22s cubic-bezier(0.1, 0.9, 0.2, 1), border-color 0.15s, box-shadow 0.15s;
}

.top-search-wrap:focus-within,
.top-search-wrap.has-value {
  width: 260px;
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent), 0 2px 6px rgba(0, 0, 0, 0.1);
}

.top-search-icon {
  font-size: 14px;
  color: var(--md-text-secondary);
  margin-right: 6px;
  flex-shrink: 0;
}

.top-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 11.5px;
  font-family: inherit;
  color: var(--md-text-primary);
}

.top-search-input::placeholder {
  color: var(--md-text-secondary);
  font-size: 11px;
}

.top-search-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
  font-size: 13px;
  margin-left: 4px;
}

.top-search-clear:hover {
  color: var(--md-text-primary);
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
  cursor: pointer;
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
  gap: 6px;
  height: 24px;
  font-size: 11px;
  width: 100%;
}

.office-select-row .row-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  flex-shrink: 0;
  color: var(--md-text-primary);
}

.office-select-row .input-prefix-label {
  font-size: 11px;
  color: var(--md-text-secondary);
  white-space: nowrap;
}

.office-select-row .fluent-select {
  height: 24px;
  padding: 0 20px 0 6px;
  font-size: 11px;
  border: 1px solid var(--fluent-border-divider);
  background-color: var(--fluent-bg-canvas);
  color: var(--md-text-primary);
  border-radius: var(--fluent-radius);
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666666' d='M4.22 6.47a.75.75 0 0 1 1.06 0L8 9.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.53a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  background-size: 12px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

[data-theme="dark"] .office-select-row .fluent-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23cccccc' d='M4.22 6.47a.75.75 0 0 1 1.06 0L8 9.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.53a.75.75 0 0 1 0-1.06z'/%3E%3C/svg%3E");
}

.office-select-row .fluent-select:hover {
  border-color: var(--fluent-border-strong);
}

.office-select-row .fluent-select:focus {
  border-color: var(--fluent-accent);
  box-shadow: 0 0 0 1px var(--fluent-accent);
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
.mobile-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(2px);
}

.mobile-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1201;
  padding: 8px 14px calc(18px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--fluent-bg-canvas);
  box-shadow: 0 -6px 28px rgba(0, 0, 0, 0.28);
  animation: mobileSheetUp 0.2s ease-out;
}

.mobile-sheet-handle {
  width: 36px;
  height: 4px;
  margin: 0 auto 10px;
  border-radius: 2px;
  background: var(--fluent-border-divider);
}

.mobile-sheet-title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.mobile-sheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.mobile-sheet-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 64px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
}

.mobile-sheet-action:hover {
  background: var(--fluent-bg-hover);
}

.mobile-sheet-action .fluent-icon {
  font-size: 22px;
  color: var(--md-text-secondary);
}

.mobile-sheet-action.danger .fluent-icon {
  color: #c62828;
}

@keyframes mobileSheetUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.mobile-compact-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background-color: var(--fluent-bg-canvas);
  border-bottom: 1px solid var(--fluent-border-subtle);
}

.fluent-btn-mobile {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-primary);
  cursor: pointer;
  font-size: 20px;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.fluent-btn-mobile .fluent-svg-icon {
  width: 20px;
  height: 20px;
}

.fluent-btn-mobile:active {
  transform: scale(0.95);
  background: var(--fluent-bg-hover);
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
  height: 38px;
  background-color: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  padding: 0 10px;
  gap: 8px;
  box-sizing: border-box;
}

.mobile-search-wrap .search-prefix-icon {
  width: 18px;
  height: 18px;
  color: var(--md-text-secondary);
  flex-shrink: 0;
}

.mobile-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: var(--md-text-primary);
}

.mobile-clear-btn {
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--md-text-secondary);
}

.mobile-clear-btn .fluent-svg-icon {
  width: 16px;
  height: 16px;
}

.selection-badge {
  order: 99;
  margin-left: auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  height: 32px;
  line-height: 1;
  padding: 0 10px;
  background-color: rgba(0, 120, 212, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: var(--fluent-accent);
  font-weight: 600;
}

/* 顶部吸顶微胶囊状态小栏 */
.mobile-sub-status-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 10px;
  background-color: var(--fluent-bg-subtle);
  border-bottom: 1px solid var(--fluent-border-subtle);
  gap: 6px;
  font-size: 11px;
}

.sub-stat-summary {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sub-stat-count {
  font-weight: 600;
  color: var(--md-text-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.sub-stat-speeds {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
}

.sub-speed-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 24px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  cursor: pointer;
  font-size: 11px;
  color: var(--md-text-primary);
  white-space: nowrap;
  transition: all 0.15s ease;
}

.sub-speed-btn:hover,
.sub-speed-btn.active {
  border-color: var(--fluent-accent);
  background: var(--fluent-bg-hover);
}

.sub-speed-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.sub-speed-val {
  font-family: var(--font-mono);
  font-weight: 500;
}

.sub-speed-limit {
  font-size: 10px;
  font-weight: 600;
  padding: 0 3px;
  border-radius: 2px;
}

.sub-speed-btn.is-turtle {
  border-color: rgba(245, 124, 0, 0.45);
  background-color: rgba(245, 124, 0, 0.08);
}

.sub-speed-btn.is-regular-limit {
  border-color: rgba(0, 120, 212, 0.45);
  background-color: rgba(0, 120, 212, 0.06);
}

.sub-speed-limit.turtle-limit {
  font-size: 9px;
  color: #b26a00;
  background: rgba(255, 152, 0, 0.18);
  padding: 1px 3px;
  border-radius: 2px;
}

[data-theme="dark"] .sub-speed-limit.turtle-limit {
  color: #ffb74d;
  background: rgba(255, 183, 77, 0.22);
}

.sub-speed-limit.regular-limit {
  font-size: 9px;
  color: var(--fluent-accent);
  background: rgba(0, 120, 212, 0.12);
  padding: 1px 3px;
  border-radius: 2px;
}

.sub-stat-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.sub-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-secondary);
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.sub-action-btn .fluent-svg-icon {
  width: 15px;
  height: 15px;
}

.sub-action-btn:hover {
  background: var(--fluent-bg-hover);
  color: var(--md-text-primary);
}

.sub-action-btn.turtle-btn.active {
  color: var(--md-warning);
  border-color: var(--md-warning);
  background-color: rgba(245, 124, 0, 0.12);
}

.sub-view-switch {
  display: inline-flex;
  border-radius: 4px;
  border: 1px solid var(--fluent-border-subtle);
  overflow: hidden;
  background: var(--fluent-bg-canvas);
}

.sub-view-switch .sub-action-btn {
  border: none;
  border-radius: 0;
  width: 25px;
}

.sub-view-switch .sub-action-btn.active {
  background: var(--fluent-accent);
  color: #ffffff;
}

/* 移动端限速微型浮层 */
.mobile-speed-flyout {
  position: absolute;
  top: 38px;
  left: 10px;
  right: 10px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  padding: 12px;
  z-index: 600;
}

.mobile-speed-flyout .flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--fluent-accent);
}

.mobile-speed-flyout .flyout-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  color: var(--md-text-secondary);
}

.mobile-speed-flyout .flyout-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.mobile-speed-flyout .flyout-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mobile-speed-flyout .flyout-num {
  width: 100px;
  padding: 4px 8px;
  font-size: 12px;
}

.mobile-speed-flyout .flyout-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.fluent-btn-mobile-sub {
  height: 28px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.fluent-btn-mobile-sub.cancel {
  background: transparent;
  border: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-primary);
}

.fluent-btn-mobile-sub.save {
  background: var(--fluent-accent);
  border: none;
  color: #ffffff;
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
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  font-size: 12px;
}

.cols-menu-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}

.cols-order-buttons {
  display: inline-flex;
  gap: 1px;
  opacity: 0.45;
}

.cols-menu-item:hover .cols-order-buttons { opacity: 1; }

.cols-order-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  background: var(--fluent-bg-canvas);
  color: var(--md-text-secondary);
  font-size: 9px;
  line-height: 1;
  cursor: pointer;
}

.cols-order-btn .fluent-icon { font-size: 14px; }

.cols-order-btn:hover:not(:disabled) { border-color: var(--fluent-accent); color: var(--fluent-accent); }
.cols-order-btn:disabled { opacity: 0.25; cursor: default; }

.cols-menu-item:hover { background-color: var(--fluent-bg-hover); }

/* 响应式断点 (支持小屏笔记本与窄窗自适应，绝不挤压 Tab 栏) */
@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 1080px) {
  .brand-file-btn .brand-text {
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

  .ribbon-header-row {
    height: 38px;
    padding: 0 8px;
  }

  .fluent-tool-btn {
    width: 32px;
    height: 32px;
  }

  .fluent-tool-btn .fluent-svg-icon {
    width: 18px;
    height: 18px;
  }

  .brand-logo {
    width: 22px;
    height: 22px;
  }
}

/* OneNote 风格单行 Ribbon：标签栏 + 一行紧凑命令区
   宽屏保留文字，宽度不足时逐级折叠为纯图标（按钮 title 仍可提示）。 */
.fluent-ribbon-root .ribbon-body {
  height: 46px;
  min-height: 46px;
  align-items: center;
  padding: 2px 8px;
  gap: 2px;
}

.fluent-ribbon-root .ribbon-group {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  height: 100%;
  padding: 0 8px 0 0;
}

.fluent-ribbon-root .ribbon-controls {
  flex-direction: row;
  align-items: center;
  gap: 2px;
  height: 100%;
  flex: 0 1 auto;
}

.fluent-ribbon-root .group-footer {
  display: none;
}

.fluent-ribbon-root .fluent-btn-large {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 30px;
  padding: 0 7px;
  gap: 6px;
}

.fluent-ribbon-root .fluent-btn-large .large-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
  margin-bottom: 0;
}

.fluent-ribbon-root .fluent-btn-large .btn-caption {
  font-size: 11px;
  line-height: 1;
  max-width: none;
  white-space: nowrap;
  word-break: normal;
}

.fluent-ribbon-root .btn-stack {
  flex-direction: row;
  align-items: center;
  gap: 2px;
}

.fluent-ribbon-root .btn-stack .fluent-btn-small {
  height: 28px;
}

.fluent-ribbon-root .btn-stack-2row,
.fluent-ribbon-root .btn-matrix-2x2 {
  flex-direction: row;
  align-items: center;
  gap: 2px;
}

.fluent-ribbon-root .btn-stack-2row .fluent-btn-small {
  height: 28px;
}

.fluent-ribbon-root .view-prefs-col,
.fluent-ribbon-root .limits-col,
.fluent-ribbon-root .seed-rules-col {
  flex-direction: row;
  gap: 6px;
}

.fluent-ribbon-root .office-select-row {
  width: auto;
  height: 28px;
  gap: 4px;
}

.fluent-ribbon-root .office-select-row .fluent-select,
.fluent-ribbon-root .ribbon-body .fluent-select {
  height: 24px;
}

.fluent-ribbon-root .ribbon-body .fluent-btn-small {
  height: 28px;
}

.fluent-ribbon-root .ribbon-body .fluent-svg-icon,
.fluent-ribbon-root .ribbon-body .fluent-icon,
.fluent-ribbon-root .fluent-btn-large .large-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
}

.fluent-ribbon-root .dialog-launcher-btn {
  display: none;
}


@media (max-width: 900px) {
  .fluent-ribbon-root .ribbon-body .btn-caption {
    display: none;
  }

  .fluent-ribbon-root .fluent-btn-large {
    padding: 0 6px;
  }
}

@media (max-width: 1000px) {
  .fluent-ribbon-root .ribbon-body .fluent-btn-small span,
  .fluent-ribbon-root .ribbon-body .btn-stack-2row span,
  .fluent-ribbon-root .ribbon-body .ribbon-toggle-btn span {
    display: none;
  }

  .fluent-ribbon-root .ribbon-body .fluent-btn-small {
    padding: 0 6px;
  }
}

@media (max-width: 800px) {
  .fluent-ribbon-root .ribbon-body .input-prefix-label {
    display: none;
  }

  .fluent-ribbon-root .ribbon-body .office-select-row {
    gap: 2px;
  }
}
</style>
