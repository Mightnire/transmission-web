<template>
  <div class="panel network-panel">
    <div class="panel-head">
      <div>
        <h3>{{ t('backstage.network') }}</h3>
        <p>{{ t('backstage.networkSubtitle') }}</p>
      </div>
      <FluentIcon name="lan" class="panel-icon text-accent" />
    </div>

    <div class="network-grid">
      <div class="network-item">
        <span>DHT</span>
        <strong :class="{ off: !state.session?.['dht-enabled'] }">{{ onOff(state.session?.['dht-enabled']) }}</strong>
      </div>
      <div class="network-item">
        <span>PEX</span>
        <strong :class="{ off: !state.session?.['pex-enabled'] }">{{ onOff(state.session?.['pex-enabled']) }}</strong>
      </div>
      <div class="network-item">
        <span>LPD</span>
        <strong :class="{ off: !state.session?.['lpd-enabled'] }">{{ onOff(state.session?.['lpd-enabled']) }}</strong>
      </div>
      <div class="network-item">
        <span>uTP</span>
        <strong :class="{ off: !state.session?.['utp-enabled'] }">{{ onOff(state.session?.['utp-enabled']) }}</strong>
      </div>
      <div class="network-item">
        <span>{{ t('backstage.encryption') }}</span>
        <strong>{{ encryptionLabel }}</strong>
      </div>
      <div class="network-item">
        <span>{{ t('backstage.peerPort') }}</span>
        <strong class="monospace">{{ state.session?.['peer-port'] || '—' }}</strong>
      </div>
      <div class="network-item">
        <span>{{ t('backstage.blocklist') }}</span>
        <strong>{{ state.session?.['blocklist-size'] ? t('backstage.blocklistRules', { count: state.session['blocklist-size'] }) : '—' }}</strong>
      </div>
    </div>

    <div class="network-actions">
      <div class="network-actions-left">
        <button class="network-btn" @click="testPort" :disabled="testingPort">
          <FluentIcon :name="testingPort ? 'sync' : 'network_check'" />
          <span>{{ testingPort ? t('backstage.portTesting') : t('backstage.testPort') }}</span>
        </button>
        <span
          class="port-result"
          v-if="portStatus !== null"
          :class="portStatus ? 'ok' : 'bad'"
        >
          <i></i>
          {{ portStatus ? t('backstage.portOpen') : t('backstage.portClosed') }}
        </span>
        <span class="port-result muted" v-else>{{ t('backstage.portUntested') }}</span>
      </div>

      <div class="network-actions-right">
        <button
          class="network-btn"
          @click="updateBlocklist"
          :disabled="updatingBlocklist || !state.session?.['blocklist-enabled']"
        >
          <FluentIcon name="security" />
          <span>{{ updatingBlocklist ? t('backstage.blocklistUpdating') : t('backstage.blocklistUpdate') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, showToast, fetchSession } from '../../stores/transmission';
import { rpc } from '../../api/rpc';
import { t } from '../../locales';
import FluentIcon from '../common/FluentIcon.vue';

const testingPort = ref(false);
const portStatus = ref<boolean | null>(null);
const updatingBlocklist = ref(false);

const encryptionLabel = computed(() => {
  const mode = state.session?.encryption;
  if (mode === 'required') return t('backstage.encryptionRequired');
  if (mode === 'preferred') return t('backstage.encryptionPreferred');
  if (mode === 'tolerated') return t('backstage.encryptionTolerated');
  return '—';
});

function onOff(value?: boolean): string {
  return value ? t('backstage.on') : t('backstage.off');
}

async function testPort() {
  testingPort.value = true;
  try {
    const result = await rpc.portTest();
    portStatus.value = result['port-is-open'];
  } catch {
    portStatus.value = null;
    showToast(t('backstage.portTestFailed'), 'error');
  } finally {
    testingPort.value = false;
  }
}

async function updateBlocklist() {
  updatingBlocklist.value = true;
  try {
    const result = await rpc.blocklistUpdate();
    showToast(t('backstage.blocklistUpdated', { count: result['blocklist-size'] }), 'success');
    await fetchSession();
  } catch {
    showToast(t('backstage.blocklistUpdateFailed'), 'error');
  } finally {
    updatingBlocklist.value = false;
  }
}
</script>

<style scoped>
.network-panel {
  margin-bottom: 16px;
  background: var(--fluent-bg-canvas);
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  padding: 14px 16px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panel-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-text-primary);
}

.panel-head p {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--md-text-secondary);
}

.panel-icon {
  font-size: 18px;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  margin: 10px 0 12px;
  border: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-border-subtle);
}

.network-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: var(--fluent-bg-canvas);
  font-size: 11px;
  color: var(--md-text-secondary);
}

.network-item strong {
  font-weight: 600;
  color: var(--md-text-primary);
}

.network-item strong.off {
  color: var(--md-text-secondary);
  font-weight: 400;
}

.network-item strong.monospace {
  font-family: var(--font-mono);
}

.network-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.network-actions-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.network-actions-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.network-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 3px;
  background: var(--fluent-bg-subtle);
  color: var(--md-text-primary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.network-btn:hover:not(:disabled) {
  border-color: var(--fluent-accent);
  color: var(--fluent-accent);
}

.network-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.port-result {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.port-result i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.port-result.ok { color: #2e7d32; }
.port-result.bad { color: #c62828; }
.port-result.muted { color: var(--md-text-secondary); }
</style>
