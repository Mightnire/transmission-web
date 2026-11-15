import { Directive } from 'vue';

export const vRipple: Directive = {
  mounted(el: HTMLElement) {
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.position = 'absolute';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'currentColor';
      ripple.style.opacity = '0.2';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-out';

      el.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)';
      });

      const removeRipple = () => {
        ripple.style.opacity = '0';
        setTimeout(() => {
          ripple.remove();
        }, 500);
        window.removeEventListener('pointerup', removeRipple);
        window.removeEventListener('pointercancel', removeRipple);
      };

      window.addEventListener('pointerup', removeRipple);
      window.addEventListener('pointercancel', removeRipple);
    });
  },
};
