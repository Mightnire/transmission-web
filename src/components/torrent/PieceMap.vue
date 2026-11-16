<template>
  <div class="piece-map-view">
    <div class="piece-map-toolbar">
      <div class="piece-map-summary">
        <strong>{{ t('detail.pieces.progress', { done: completedCount, total: pieceCount }) }}</strong>
        <span v-if="hasAvailability">{{ t('detail.pieces.availabilitySummary', { avg: availabilityAverage, min: availabilityMin }) }}</span>
      </div>
      <div class="piece-map-scale">
        <span>{{ t('detail.pieces.pieceSize', { size: formatBytes(pieceSize) }) }}</span>
        <span v-if="availabilitySupported">{{ t('detail.pieces.legendTitle') }}</span>
      </div>
    </div>

    <div class="piece-map-container" ref="container">
      <canvas
        ref="canvas"
        class="piece-map-canvas"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      ></canvas>

      <div
        class="piece-tooltip"
        v-if="hover"
        :style="{ left: `${hover.left}px`, top: `${hover.top}px` }"
      >
        <strong>{{ t('detail.pieces.pieceNumber', { number: hover.index + 1 }) }}</strong>
        <span>{{ hover.completed ? t('detail.pieces.done') : t('detail.pieces.missing') }}</span>
        <span v-if="hover.availability !== null">{{ t('detail.pieces.availability', { count: hover.availability }) }}</span>
        <span>{{ t('detail.pieces.size', { size: formatBytes(pieceSize) }) }}</span>
        <span v-if="hover.files.length" class="tooltip-files">{{ hover.files.join(' · ') }}</span>
      </div>

      <div class="piece-map-empty" v-if="pieceCount === 0">
        {{ t('detail.pieces.empty') }}
      </div>
    </div>

    <div class="piece-map-legend">
      <span class="legend-entry"><i class="swatch done"></i>{{ t('detail.pieces.legendDone') }}</span>
      <span class="legend-entry"><i class="swatch missing"></i>{{ t('detail.pieces.legendMissing') }}</span>
      <span class="legend-entry" v-if="availabilitySupported"><i class="swatch avail1"></i>{{ t('detail.pieces.legendAvail1') }}</span>
      <span class="legend-entry" v-if="availabilitySupported"><i class="swatch avail2"></i>{{ t('detail.pieces.legendAvail2') }}</span>
      <span class="legend-entry" v-if="availabilitySupported"><i class="swatch avail3"></i>{{ t('detail.pieces.legendAvail3') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { formatBytes } from '../../stores/transmission';
import { t } from '../../locales';
import type { TorrentFile } from '../../api/types';

const props = defineProps<{
  pieces?: string;
  availability?: number[];
  pieceCount: number;
  pieceSize: number;
  files?: TorrentFile[];
}>();

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const hover = ref<{
  index: number;
  left: number;
  top: number;
  completed: boolean;
  availability: number | null;
  files: string[];
} | null>(null);

const completedBits = computed(() => parsePieces(props.pieces, props.pieceCount));
const completedCount = computed(() => completedBits.value.filter(Boolean).length);

// Transmission 3.07 对 availability 返回空数组；只有真正拿到逐块数据时才展示可用性。
const availabilitySupported = computed(() => {
  return props.pieceCount > 0 &&
    Array.isArray(props.availability) &&
    props.availability.length >= props.pieceCount;
});

const availabilityStats = computed(() => {
  if (!availabilitySupported.value) return { avg: '—', min: '—', hasData: false };
  const values: number[] = [];
  for (let index = 0; index < props.pieceCount; index++) {
    if (completedBits.value[index]) continue;
    values.push(props.availability?.[index] ?? 0);
  }
  if (values.length === 0) return { avg: '—', min: '—', hasData: false };
  let sum = 0;
  let min = Number.MAX_SAFE_INTEGER;
  for (const value of values) {
    sum += value;
    min = Math.min(min, value);
  }
  return {
    avg: (sum / values.length).toFixed(1),
    min: min === Number.MAX_SAFE_INTEGER ? 0 : min,
    hasData: true,
  };
});

const availabilityAverage = computed(() => availabilityStats.value.avg);
const availabilityMin = computed(() => availabilityStats.value.min);
const hasAvailability = computed(() => availabilitySupported.value && availabilityStats.value.hasData);

let resizeObserver: ResizeObserver | null = null;
let drawQueued = false;
let metrics = { width: 0, cell: 14, gap: 3, step: 17, columns: 1, padding: 10 };

function parsePieces(base64?: string, count = 0): boolean[] {
  const bits = new Array(count).fill(false);
  if (!base64 || count <= 0) return bits;
  try {
    const binary = atob(base64.replace(/\s/g, ''));
    for (let i = 0; i < count; i++) {
      const byte = binary.charCodeAt(Math.floor(i / 8));
      bits[i] = (byte & (1 << (7 - (i % 8)))) !== 0;
    }
  } catch {
    // 无法解析时保持全部未完成
  }
  return bits;
}

function pieceColor(index: number): string {
  if (completedBits.value[index]) return '#1565c0';
  if (!availabilitySupported.value) return '#f3f3f3';
  const availability = props.availability?.[index] ?? 0;
  if (availability <= 0) return '#f3f3f3';
  if (availability === 1) return '#ef9a9a';
  if (availability === 2) return '#ffcc80';
  return '#a5d6a7';
}

function cellMetrics(count: number, width: number) {
  let cell = 14;
  let gap = 3;
  if (count > 30000) {
    cell = 6;
    gap = 1;
  } else if (count > 12000) {
    cell = 8;
    gap = 2;
  } else if (count > 4000) {
    cell = 10;
    gap = 2;
  }
  const step = cell + gap;
  const padding = 10;
  const columns = Math.max(1, Math.floor((width - padding * 2 + gap) / step));
  return { width, cell, gap, step, columns, padding };
}

function scheduleDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    draw();
  });
}

function draw() {
  const el = canvas.value;
  const host = container.value;
  if (!el || !host) return;

  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, host.clientWidth - 20);
  const count = props.pieceCount;
  metrics = cellMetrics(count, width);
  const rows = Math.max(1, Math.ceil(count / metrics.columns));
  const height = rows * metrics.step + metrics.padding * 2 - metrics.gap;

  el.width = Math.round(width * dpr);
  el.height = Math.round(height * dpr);
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;

  const ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--fluent-bg-canvas').trim() || '#ffffff';
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < count; index++) {
    const col = index % metrics.columns;
    const row = Math.floor(index / metrics.columns);
    const x = metrics.padding + col * metrics.step;
    const y = metrics.padding + row * metrics.step;
    ctx.fillStyle = pieceColor(index);
    ctx.fillRect(x, y, metrics.cell, metrics.cell);

    if (!completedBits.value[index] && (props.availability?.[index] ?? 0) === 0) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, metrics.cell - 1, metrics.cell - 1);
    }

    if (hover.value?.index === index) {
      ctx.strokeStyle = '#0078d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, metrics.cell + 2, metrics.cell + 2);
    }
  }
}

function piecesForFiles(index: number): string[] {
  if (!props.files) return [];
  return props.files
    .filter((file) => {
      if (file.beginPiece === undefined || file.endPiece === undefined) return false;
      return index >= file.beginPiece && index <= file.endPiece;
    })
    .map((file) => file.name.split('/').pop() || file.name)
    .slice(0, 2);
}

function indexFromEvent(event: MouseEvent): number | null {
  const el = canvas.value;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const x = event.clientX - rect.left - metrics.padding;
  const y = event.clientY - rect.top - metrics.padding;
  if (x < 0 || y < 0) return null;
  const col = Math.floor(x / metrics.step);
  const row = Math.floor(y / metrics.step);
  if (col < 0 || col >= metrics.columns) return null;
  const index = row * metrics.columns + col;
  return index >= 0 && index < props.pieceCount ? index : null;
}

function onMouseMove(event: MouseEvent) {
  const index = indexFromEvent(event);
  if (index === null) {
    hover.value = null;
    return;
  }
  const el = canvas.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const left = Math.min(Math.max(8, event.clientX - rect.left + 14), Math.max(8, rect.width - 220));
  const top = Math.min(Math.max(8, event.clientY - rect.top + 14), Math.max(8, rect.height - 120));
  hover.value = {
    index,
    left,
    top,
    completed: completedBits.value[index],
    availability: availabilitySupported.value ? (props.availability?.[index] ?? 0) : null,
    files: piecesForFiles(index),
  };
  scheduleDraw();
}

function onMouseLeave() {
  hover.value = null;
  scheduleDraw();
}

watch(
  () => [props.pieces, props.availability, props.pieceCount, props.pieceSize],
  () => scheduleDraw(),
  { deep: true }
);

onMounted(() => {
  resizeObserver = new ResizeObserver(() => scheduleDraw());
  if (container.value) resizeObserver.observe(container.value);
  nextTick(scheduleDraw);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped>
.piece-map-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.piece-map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 8px 14px;
  border-bottom: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-subtle);
  font-size: 11px;
  color: var(--md-text-secondary);
}

.piece-map-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.piece-map-summary strong {
  color: var(--md-text-primary);
  font-weight: 600;
}

.piece-map-scale {
  display: flex;
  gap: 14px;
}

.piece-map-container {
  flex: 1;
  overflow: auto;
  position: relative;
  padding: 10px;
  background: var(--fluent-bg-canvas);
}

.piece-map-canvas {
  display: block;
  cursor: crosshair;
}

.piece-tooltip {
  position: absolute;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 220px;
  padding: 7px 9px;
  border: 1px solid var(--fluent-border-divider);
  border-radius: 4px;
  background: var(--fluent-bg-canvas);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  font-size: 11px;
  color: var(--md-text-secondary);
  pointer-events: none;
}

.piece-tooltip strong {
  color: var(--md-text-primary);
  margin-bottom: 2px;
}

.tooltip-files {
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid var(--fluent-border-subtle);
  color: var(--md-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.piece-map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-text-secondary);
  font-size: 12px;
}

.piece-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 8px 14px;
  border-top: 1px solid var(--fluent-border-subtle);
  background: var(--fluent-bg-subtle);
  font-size: 10.5px;
  color: var(--md-text-secondary);
}

.legend-entry {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.swatch {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  display: inline-block;
}

.swatch.done { background: #1565c0; }
.swatch.missing { background: #f3f3f3; border: 1px solid rgba(0, 0, 0, 0.12); }
.swatch.avail1 { background: #ef9a9a; }
.swatch.avail2 { background: #ffcc80; }
.swatch.avail3 { background: #a5d6a7; }
</style>
