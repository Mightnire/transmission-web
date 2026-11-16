<template>
  <div class="speed-chart">
    <div class="chart-legend">
      <span class="legend-item down">
        <i></i>{{ t('backstage.download') }}
        <b>{{ formatSpeed(lastDown) }}</b>
      </span>
      <span class="legend-item up">
        <i></i>{{ t('backstage.upload') }}
        <b>{{ formatSpeed(lastUp) }}</b>
      </span>
    </div>

    <div class="chart-canvas-wrap">
      <svg class="chart-svg" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" role="img" :aria-label="t('backstage.chartTitle')">
        <defs>
          <linearGradient id="speedDownFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0078d4" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#0078d4" stop-opacity="0.01" />
          </linearGradient>
          <linearGradient id="speedUpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2e7d32" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#2e7d32" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        <g class="chart-grid">
          <template v-for="(line, index) in gridLines" :key="`grid-${index}`">
            <line :x1="PL" :x2="W - PR" :y1="line.y" :y2="line.y" />
            <text x="6" :y="line.y + 4">{{ line.label }}</text>
          </template>
        </g>

        <path v-if="downArea" :d="downArea" fill="url(#speedDownFill)" />
        <path v-if="upArea" :d="upArea" fill="url(#speedUpFill)" />

        <polyline v-if="downLine" :points="downLine" class="series-line down-line" />
        <polyline v-if="upLine" :points="upLine" class="series-line up-line" />

        <template v-if="points.length > 0">
          <circle :cx="lastX" :cy="lastDownY" r="3.5" class="series-dot down-dot" />
          <circle :cx="lastX" :cy="lastUpY" r="3.5" class="series-dot up-dot" />
        </template>

      </svg>

      <div class="chart-empty" v-if="points.length < 2">
        <FluentIcon name="insights" class="empty-chart-icon" />
        <span>{{ t('backstage.chartEmpty') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatSpeed, type SpeedSample } from '../../stores/transmission';
import { t } from '../../locales';

const props = defineProps<{
  points: SpeedSample[];
}>();

const W = 1000;
const H = 260;
const PL = 64;
const PR = 16;
const PT = 14;
const PB = 16;
const plotW = W - PL - PR;
const plotH = H - PT - PB;

const lastDown = computed(() => props.points[props.points.length - 1]?.down || 0);
const lastUp = computed(() => props.points[props.points.length - 1]?.up || 0);

interface AxisUnit {
  label: string;
  div: number;
}

const AXIS_UNITS: AxisUnit[] = [
  { label: 'B/s', div: 1 },
  { label: 'KB/s', div: 1024 },
  { label: 'MB/s', div: 1024 ** 2 },
  { label: 'GB/s', div: 1024 ** 3 },
];

function niceIntegerStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 1.5 ? 1.5 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(1, Math.round(nice * magnitude));
}

const yAxis = computed(() => {
  const peak = props.points.reduce((max, point) => Math.max(max, point.down, point.up), 0);
  const target = Math.max(1024, peak * 1.12);

  // 选择能让 4 个刻度都保持整数的最大单位；例如 1.5 MB/s 用 KB/s，
  // 避免出现 0.4 MB/s 这类小数刻度。
  let unit = AXIS_UNITS[0];
  for (const candidate of AXIS_UNITS) {
    if (target / candidate.div >= 4) unit = candidate;
    else break;
  }

  const step = niceIntegerStep(target / unit.div / 4);
  const max = step * 4 * unit.div;
  return { unit, step, max };
});

const maxValue = computed(() => yAxis.value.max);

function xAt(index: number): number {
  if (props.points.length <= 1) return PL + plotW;
  return PL + (index / (props.points.length - 1)) * plotW;
}

function yAt(value: number): number {
  return PT + plotH - (Math.max(0, value) / maxValue.value) * plotH;
}

const lastX = computed(() => xAt(props.points.length - 1));
const lastDownY = computed(() => yAt(lastDown.value));
const lastUpY = computed(() => yAt(lastUp.value));

const gridLines = computed(() => {
  const { unit, step } = yAxis.value;
  return [0, 1, 2, 3, 4].map((index) => ({
    y: PT + plotH - (index / 4) * plotH,
    label: index === 0 ? '0 B/s' : `${step * index} ${unit.label}`,
  }));
});

function polylineFor(key: 'down' | 'up'): string {
  return props.points.map((point, index) => `${xAt(index)},${yAt(point[key])}`).join(' ');
}

const downLine = computed(() => polylineFor('down'));
const upLine = computed(() => polylineFor('up'));

function areaFor(key: 'down' | 'up'): string {
  if (props.points.length === 0) return '';
  const baseY = PT + plotH;
  const pointsPart = props.points.map((point, index) => `L ${xAt(index)} ${yAt(point[key])}`).join(' ');
  return `M ${xAt(0)} ${baseY} ${pointsPart} L ${lastX.value} ${baseY} Z`;
}

const downArea = computed(() => areaFor('down'));
const upArea = computed(() => areaFor('up'));

</script>

<style scoped>
.speed-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--md-text-secondary);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-item.down i {
  background-color: #0078d4;
}

.legend-item.up i {
  background-color: #2e7d32;
}

.legend-item b {
  color: var(--md-text-primary);
  font-weight: 600;
}

.chart-canvas-wrap {
  position: relative;
  height: 230px;
  border: 1px solid var(--fluent-border-subtle);
  border-radius: 4px;
  background-color: var(--fluent-bg-subtle);
  overflow: hidden;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-grid line {
  stroke: var(--fluent-border-subtle);
  stroke-width: 1;
}

.chart-grid text {
  fill: var(--md-text-secondary);
  font-size: 19px;
}

.series-line {
  fill: none;
  stroke-width: 4;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.down-line {
  stroke: #0078d4;
}

.up-line {
  stroke: #2e7d32;
}

.series-dot {
  stroke: var(--fluent-bg-canvas);
  stroke-width: 2;
}

.down-dot {
  fill: #0078d4;
}

.up-dot {
  fill: #2e7d32;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--md-text-secondary);
  background-color: var(--fluent-bg-subtle);
}

.empty-chart-icon {
  font-size: 22px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .chart-canvas-wrap {
    height: 180px;
  }

  .chart-grid text {
    font-size: 34px;
  }
}
</style>
