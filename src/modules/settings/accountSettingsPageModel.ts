import type { AccountSessionDto } from '../../lib/api/types';

export function formatSettingsDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getRoleLabel(role: 'admin' | 'member') {
  return role === 'admin' ? '管理员' : '成员';
}

export function splitSessions(sessions: AccountSessionDto[]) {
  return {
    current: sessions.find((session) => session.isCurrent),
    others: sessions.filter((session) => !session.isCurrent),
  };
}
