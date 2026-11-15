<template>
  <div class="md-dialog-overlay" v-if="state.sessionDialogOpen" @click.self="state.sessionDialogOpen = false">
    <div class="md-dialog">
      <h2 class="md-dialog-title">{{ t('sessionDialog.title') }}</h2>

      <div class="md-dialog-content">
        <!-- 语言设置 (响应用户需求) -->
        <div class="form-group">
          <label class="form-label">{{ t('app.language') }}</label>
          <select class="md-select" :value="currentLocale" @change="onLocaleChange">
            <option value="zh-CN">简体中文 (Chinese)</option>
            <option value="en-US">English (US)</option>
            <option value="ru-RU">Русский (Russian)</option>
          </select>
        </div>

        <div class="divider"></div>

        <!-- 常规限速 -->
        <h4 class="section-title">{{ t('sessionDialog.speedLimits') }}</h4>
        <div class="form-row">
          <label class="form-label-inline">
            <input type="checkbox" v-model="form.speedLimitDownEnabled" />
            <span>{{ t('sessionDialog.downloadLimit') }}</span>
          </label>
          <input
            type="number"
            class="md-input-small"
            v-model.number="form.speedLimitDown"
            :disabled="!form.speedLimitDownEnabled"
          />
        </div>

        <div class="form-row">
          <label class="form-label-inline">
            <input type="checkbox" v-model="form.speedLimitUpEnabled" />
            <span>{{ t('sessionDialog.uploadLimit') }}</span>
          </label>
          <input
            type="number"
            class="md-input-small"
            v-model.number="form.speedLimitUp"
            :disabled="!form.speedLimitUpEnabled"
          />
        </div>

        <div class="divider"></div>

        <!-- 乌龟模式限速 -->
        <h4 class="section-title">{{ t('sessionDialog.altSpeedLimits') }}</h4>
        <div class="form-row">
          <span class="label-text">{{ t('sessionDialog.altDownloadLimit') }}</span>
          <input type="number" class="md-input-small" v-model.number="form.altSpeedDown" />
        </div>

        <div class="form-row">
          <span class="label-text">{{ t('sessionDialog.altUploadLimit') }}</span>
          <input type="number" class="md-input-small" v-model.number="form.altSpeedUp" />
        </div>

        <div class="divider"></div>

        <!-- 存储目录 -->
        <h4 class="section-title">{{ t('sessionDialog.directories') }}</h4>
        <div class="form-group">
          <label class="form-label">{{ t('sessionDialog.downloadDir') }}</label>
          <input type="text" class="md-input" v-model="form.downloadDir" />
        </div>
      </div>

      <div class="md-dialog-actions">
        <button class="md-btn md-btn-flat" @click="state.sessionDialogOpen = false">
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
import { reactive, watch } from 'vue';
import { state, fetchSession } from '../stores/transmission';
import { t, currentLocale, setLocale, LocaleKey } from '../locales';
import { rpc } from '../api/rpc';

const form = reactive({
  speedLimitDown: 0,
  speedLimitDownEnabled: false,
  speedLimitUp: 0,
  speedLimitUpEnabled: false,
  altSpeedDown: 50,
  altSpeedUp: 50,
  downloadDir: '',
});

watch(
  () => state.session,
  (s) => {
    if (s) {
      form.speedLimitDown = s.speedLimitDown;
      form.speedLimitDownEnabled = s.speedLimitDownEnabled;
      form.speedLimitUp = s.speedLimitUp;
      form.speedLimitUpEnabled = s.speedLimitUpEnabled;
      form.altSpeedDown = s.altSpeedDown;
      form.altSpeedUp = s.altSpeedUp;
      form.downloadDir = s.downloadDir;
    }
  },
  { immediate: true }
);

function onLocaleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  setLocale(target.value as LocaleKey);
}

async function saveSettings() {
  try {
    await rpc.setSession({
      speedLimitDown: form.speedLimitDown,
      speedLimitDownEnabled: form.speedLimitDownEnabled,
      speedLimitUp: form.speedLimitUp,
      speedLimitUpEnabled: form.speedLimitUpEnabled,
      altSpeedDown: form.altSpeedDown,
      altSpeedUp: form.altSpeedUp,
      downloadDir: form.downloadDir,
    });
    await fetchSession();
    state.sessionDialogOpen = false;
  } catch (err: any) {
    alert('保存设置失败: ' + err.message);
  }
}
</script>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--md-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.divider {
  height: 1px;
  background-color: var(--md-divider);
  margin: 16px 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--md-text-secondary);
  margin-bottom: 6px;
}

.form-label-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.md-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--md-divider);
  border-radius: 2px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-size: 14px;
  outline: none;
}

.md-input-small {
  width: 100px;
  padding: 6px 8px;
  border: 1px solid var(--md-divider);
  border-radius: 2px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-size: 13px;
  text-align: right;
  outline: none;
}

.md-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--md-divider);
  border-radius: 2px;
  background-color: var(--md-surface);
  color: var(--md-text-primary);
  font-size: 14px;
  outline: none;
}
</style>
