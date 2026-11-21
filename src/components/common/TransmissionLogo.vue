<template>
  <svg
    class="transmission-logo"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- 1. 外基座金属渐变 (上到下立体反射) -->
      <linearGradient id="tr-base-grad" x1="10.19" y1="16.59" x2="10.19" y2="46.59" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#787b76" />
        <stop offset="0.87" stop-color="#babcb9" />
        <stop offset="1" stop-color="#787b76" />
      </linearGradient>

      <!-- 2. 内凹面板渐变 (下到上浅色象牙面板) -->
      <linearGradient id="tr-panel-grad" x1="13.6" y1="39.6" x2="14.1" y2="19.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#f0f2ef" />
        <stop offset="1" stop-color="#cdd1c8" />
      </linearGradient>

      <!-- 3. 下箭头凹槽深色通道渐变 -->
      <linearGradient id="tr-slot-grad" x1="23.94" y1="20.44" x2="23.94" y2="37.63" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#555753" />
        <stop offset="1" stop-color="#2e3436" />
      </linearGradient>
      <linearGradient id="tr-slot-stroke" x1="20.77" y1="37.63" x2="20.56" y2="20.44" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#888a85" />
        <stop offset="1" stop-color="#2e3436" />
      </linearGradient>

      <!-- 4. 经典 Transmission 红色横向把手渐变 (位于垂直主轴杆后方) -->
      <linearGradient id="tr-handle-grad" x1="8.48" y1="4.5" x2="8.48" y2="10.57" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#cc0000" />
        <stop offset="0.36" stop-color="#ef0000" />
        <stop offset="1" stop-color="#aa0000" />
      </linearGradient>

      <!-- 5. 红色把手顶部高光条渐变 -->
      <linearGradient id="tr-handle-hilite" x1="24" y1="5.07" x2="24" y2="10.01" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.8" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>

      <!-- 6. 垂直金属排挡杆主轴 (浮在红色手柄上方，具有圆柱立体光泽) -->
      <linearGradient id="tr-shaft-grad" x1="20.48" y1="15" x2="27.58" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#9a9c97" />
        <stop offset="0.25" stop-color="#ffffff" />
        <stop offset="0.65" stop-color="#d4d6d2" />
        <stop offset="1" stop-color="#80827d" />
      </linearGradient>

      <!-- 7. 杆身插槽底部投影 -->
      <linearGradient id="tr-shaft-shadow" x1="23.7" y1="30.1" x2="23.7" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#2e3436" stop-opacity="0.9" />
        <stop offset="1" stop-color="#2e3436" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- 1. 外基座金属底座 (带俯视梯形透视) -->
    <path
      d="M 10 16.59 C 8.82 16.55 7.64 17.57 7.53 18.81 C 6.64 26.1 5.33 33.4 4.66 40.69 L 4.66 43.75 C 4.69 45.33 5.73 46.39 6.88 46.59 L 41.5 46.59 C 42.48 46.57 43.57 45.89 43.53 44.59 L 43.53 40.66 L 40.41 19.44 C 40.15 18.14 39.04 16.75 37.5 16.59 Z"
      fill="url(#tr-base-grad)"
      stroke="#555753"
      stroke-width="1"
    />

    <!-- 2. 金属内凹梯形面板 -->
    <path
      d="M 10.6 39.62 C 9.47 39.5 8.67 38.76 8.7 37.4 L 10.6 21.41 C 10.89 20.34 11.59 19.49 12.68 19.49 L 34.61 19.49 C 35.69 19.46 36.78 20.21 37.06 21.1 L 39.48 37.24 C 39.54 38.71 38.93 39.56 37.91 39.52 Z"
      fill="url(#tr-panel-grad)"
      stroke="#555753"
      stroke-width="1"
    />

    <!-- 3. 下边缘微高光倒角线 -->
    <path
      d="M 11.42 41.49 L 39.53 41.49"
      stroke="#ffffff"
      stroke-width="1"
      stroke-linecap="round"
      opacity="0.45"
    />

    <!-- 4. 下箭头档位槽 (黑色通道) -->
    <path
      d="M 20.47 20.44 L 18.41 32.47 L 15.44 32.47 L 23.47 37.63 L 32.44 32.47 L 29.47 32.47 L 27.59 20.44 Z"
      fill="url(#tr-slot-grad)"
      stroke="url(#tr-slot-stroke)"
      stroke-width="1"
    />

    <!-- 5. 红色横向操纵手柄 (位于垂直金属竖杆后方) -->
    <rect
      x="8.48"
      y="4.51"
      width="31.11"
      height="6.06"
      rx="3.03"
      ry="2"
      fill="url(#tr-handle-grad)"
      stroke="#930000"
      stroke-width="1"
    />

    <!-- 6. 红色手柄反光弧线 -->
    <rect
      x="9.5"
      y="5.57"
      width="29.08"
      height="3.94"
      rx="1.83"
      ry="1.28"
      fill="none"
      stroke="url(#tr-handle-hilite)"
      stroke-width="0.8"
      opacity="0.65"
    />

    <!-- 7. 垂直金属排挡杆主轴 (浮在红色手柄上方，顶部高于红色手柄) -->
    <rect
      x="20.48"
      y="3.6"
      width="7.1"
      height="25.97"
      rx="1.08"
      fill="url(#tr-shaft-grad)"
      stroke="#787a75"
      stroke-width="0.9"
    />

    <!-- 8. 排挡杆入槽处暗部阴影 -->
    <rect
      x="19.98"
      y="22.01"
      width="8.13"
      height="8.04"
      rx="1.08"
      fill="url(#tr-shaft-shadow)"
    />

    <!-- 9. 排挡杆高光边线 -->
    <rect
      x="21.43"
      y="4.63"
      width="5.15"
      height="23.94"
      rx="1.08"
      fill="none"
      stroke="#ffffff"
      stroke-width="0.6"
      opacity="0.35"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
  }>(),
  {
    size: 22,
  }
);
</script>

<style scoped>
.transmission-logo {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}
</style>