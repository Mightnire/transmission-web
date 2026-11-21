<template>
  <svg
    class="transmission-logo"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- 外层金属圆角基座 -->
    <rect x="2" y="2" width="60" height="60" rx="13" fill="url(#t-baseGrad)" stroke="url(#t-baseStroke)" stroke-width="1.8" />
    
    <!-- 内层凹陷面板 (立体光影) -->
    <rect x="6.5" y="6.5" width="51" height="51" rx="8.5" fill="url(#t-panelGrad)" />
    
    <!-- 凹槽上下双向通道与黑色主箭头 -->
    <path d="M24 24L32 16L40 24H36V28H28V24H24Z" fill="var(--tlogo-arrow-1, #222222)" opacity="0.85" />
    <path d="M22 36H28V28H36V36H42L32 49L22 36Z" fill="var(--tlogo-arrow-2, #151515)" />
    <path d="M24 37H29V29H35V37H40L32 47.5L24 37Z" fill="var(--tlogo-arrow-3, #262626)" />

    <!-- 垂直金属变速杆主轴 -->
    <path d="M26.5 12H37.5L36.5 30H27.5L26.5 12Z" fill="url(#t-shaftGrad)" />

    <!-- 操纵手柄 (鲜明红大理石/红皮革质感) -->
    <rect x="12" y="5.5" width="40" height="13.5" rx="6.75" fill="url(#t-redHandle)" />
    <!-- 操纵手柄高光条 -->
    <ellipse cx="32" cy="7.5" rx="16" ry="1.8" fill="#FF8A80" opacity="0.6" />

    <!-- 左侧释放按钮 (金属按钮) -->
    <path d="M13 7.8L8.5 9.2C7.8 9.5 7.8 10.5 8.5 10.8L13 12.2V7.8Z" fill="url(#t-btnGrad)" stroke="#555" stroke-width="0.5" />

    <!-- 中部加固金属卡箍 -->
    <rect x="25.5" y="4.5" width="13" height="15.5" rx="3.5" fill="url(#t-clampGrad)" stroke="#555555" stroke-width="0.6" />
    <!-- 卡箍中线微高光 -->
    <rect x="31.2" y="4.8" width="1.6" height="14.9" fill="#FFFFFF" opacity="0.75" />

    <defs>
      <!-- 基座金属质感 -->
      <linearGradient id="t-baseGrad" x1="2" y1="2" x2="62" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#555555" />
        <stop offset="0.5" stop-color="#303030" />
        <stop offset="1" stop-color="#1A1A1A" />
      </linearGradient>
      <linearGradient id="t-baseStroke" x1="2" y1="2" x2="62" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#999999" />
        <stop offset="1" stop-color="#333333" />
      </linearGradient>

      <!-- 内面板高光浅灰渐变 -->
      <linearGradient id="t-panelGrad" x1="6.5" y1="6.5" x2="57.5" y2="57.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--tlogo-panel-1, #FFFFFF)" />
        <stop offset="0.65" stop-color="var(--tlogo-panel-2, #EEEEEE)" />
        <stop offset="1" stop-color="var(--tlogo-panel-3, #D5D5D5)" />
      </linearGradient>

      <!-- 垂直轴金属柱 -->
      <linearGradient id="t-shaftGrad" x1="26.5" y1="12" x2="37.5" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#EEEEEE" />
        <stop offset="0.3" stop-color="#FFFFFF" />
        <stop offset="0.7" stop-color="#9E9E9E" />
        <stop offset="1" stop-color="#616161" />
      </linearGradient>

      <!-- 红色把手质感 -->
      <linearGradient id="t-redHandle" x1="12" y1="5.5" x2="52" y2="19" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E53935" />
        <stop offset="0.35" stop-color="#D32F2F" />
        <stop offset="0.7" stop-color="#C62828" />
        <stop offset="1" stop-color="#8E0000" />
      </linearGradient>

      <!-- 左侧按钮 -->
      <linearGradient id="t-btnGrad" x1="8" y1="8" x2="13" y2="12" gradientUnits="userSpaceOnUse">
        <stop stop-color="#EEEEEE" />
        <stop offset="1" stop-color="#757575" />
      </linearGradient>

      <!-- 中间金属卡箍 -->
      <linearGradient id="t-clampGrad" x1="25.5" y1="4.5" x2="38.5" y2="20" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFFFFF" />
        <stop offset="0.25" stop-color="#E0E0E0" />
        <stop offset="0.7" stop-color="#9E9E9E" />
        <stop offset="1" stop-color="#616161" />
      </linearGradient>
    </defs>
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
  --tlogo-panel-1: #FFFFFF;
  --tlogo-panel-2: #EEEEEE;
  --tlogo-panel-3: #D5D5D5;
  --tlogo-arrow-1: #222222;
  --tlogo-arrow-2: #151515;
  --tlogo-arrow-3: #262626;
}

:global([data-theme="dark"]) .transmission-logo {
  --tlogo-panel-1: #383838;
  --tlogo-panel-2: #282828;
  --tlogo-panel-3: #1c1c1c;
  --tlogo-arrow-1: #777777;
  --tlogo-arrow-2: #999999;
  --tlogo-arrow-3: #666666;
}
</style>
