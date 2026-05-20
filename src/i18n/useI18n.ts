import { useMemo } from 'react';
import { t, type Locale } from './index';

export function useI18n(locale: Locale = 'zh-CN') {
  return useMemo(() => ({ locale, t: (key: Parameters<typeof t>[1]) => t(locale, key) }), [locale]);
}
