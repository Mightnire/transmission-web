import { ref, computed } from 'vue';
import zhCN from './zh-CN';
import enUS from './en-US';
import ruRU from './ru-RU';

export type LocaleKey = 'zh-CN' | 'en-US' | 'ru-RU';

const messages: Record<LocaleKey, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ru-RU': ruRU,
};

// 自动检测默认语言
function getDefaultLocale(): LocaleKey {
  const saved = localStorage.getItem('locale') as LocaleKey;
  if (saved && messages[saved]) return saved;

  const navLang = navigator.language.toLowerCase();
  if (navLang.startsWith('zh')) return 'zh-CN';
  if (navLang.startsWith('ru')) return 'ru-RU';
  return 'en-US';
}

export const currentLocale = ref<LocaleKey>(getDefaultLocale());

if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLocale.value;
}

export function setLocale(locale: LocaleKey) {
  if (messages[locale]) {
    currentLocale.value = locale;
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale;
  }
}

// 翻译函数，支持点路径如 t('common.name') 与插值替换 t('card.deleteConfirm', { name: 'xxx' })
export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  let res = messages[currentLocale.value];

  for (const k of keys) {
    if (res && typeof res === 'object' && k in res) {
      res = res[k];
    } else {
      // 回退至英文
      let fallback = messages['en-US'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return path;
        }
      }
      res = fallback;
      break;
    }
  }

  if (typeof res !== 'string') return path;

  if (params) {
    return res.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
  }

  return res;
}
