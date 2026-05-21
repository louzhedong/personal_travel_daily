import { enUSMessages } from './messages.en-US';
import { zhCNMessages } from './messages.zh-CN';

export type Locale = 'zh-CN' | 'en-US';
export const messages = { 'zh-CN': zhCNMessages, 'en-US': enUSMessages };
export function t(locale: Locale, key: keyof typeof zhCNMessages) {
  return messages[locale][key] ?? zhCNMessages[key];
}
