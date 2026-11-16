import { onMounted, onUnmounted } from 'vue';

/**
 * 统一的 Escape 关闭行为。
 * 在捕获阶段监听，避免被输入框或内部组件的 keydown 拦截。
 */
export function useEscapeKey(handler: () => void) {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') handler();
  };

  onMounted(() => window.addEventListener('keydown', onKeydown, true));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown, true));
}
