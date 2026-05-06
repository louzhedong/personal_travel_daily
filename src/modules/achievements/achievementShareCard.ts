import type { StatsAchievementDto } from '../../lib/api/types';
import { ACHIEVEMENT_CATEGORY_LABELS, ACHIEVEMENT_RARITY_LABELS, ACHIEVEMENT_STATUS_LABELS } from './achievementsPageModel';

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) {
    return [''];
  }

  const lines: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines;
}

function formatUnlockedAt(value?: string) {
  if (!value) {
    return '尚未留下首次解锁时间';
  }
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRarityColor(rarity: StatsAchievementDto['rarity']) {
  switch (rarity) {
    case 'legendary':
      return '#7c3aed';
    case 'epic':
      return '#2563eb';
    case 'rare':
      return '#0f766e';
    default:
      return '#475569';
  }
}

export function buildAchievementShareCardFilename(achievement: StatsAchievementDto) {
  return `${achievement.id}-achievement-card.svg`;
}

export function buildAchievementShareCardSvg(achievement: StatsAchievementDto, accountName: string) {
  const width = 1080;
  const height = 1920;
  const rarityColor = getRarityColor(achievement.rarity);
  const evidence = achievement.evidence?.slice(0, 4) ?? [];
  const descriptionLines = wrapText(achievement.description, 18);
  const hintLines = wrapText(achievement.nextHint ?? '继续记录，下一段旅途会把它点亮。', 18);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f8fafc" />
  <rect x="72" y="72" width="936" height="1776" rx="40" fill="#ffffff" stroke="#e2e8f0" />
  <rect x="72" y="72" width="936" height="280" rx="40" fill="${rarityColor}" />
  <text x="132" y="164" fill="#e2e8f0" font-size="30" font-weight="700" letter-spacing="6">ACHIEVEMENT CARD</text>
  <text x="132" y="246" fill="#ffffff" font-size="64" font-weight="800">${escapeSvgText(achievement.title)}</text>
  <text x="132" y="302" fill="#ede9fe" font-size="28">${escapeSvgText(accountName)} · ${escapeSvgText(
    ACHIEVEMENT_STATUS_LABELS[achievement.status],
  )}</text>

  <rect x="132" y="380" width="220" height="56" rx="28" fill="#f8fafc" />
  <text x="162" y="417" fill="#0f172a" font-size="24" font-weight="700">${escapeSvgText(
    ACHIEVEMENT_RARITY_LABELS[achievement.rarity],
  )}</text>

  <rect x="372" y="380" width="220" height="56" rx="28" fill="#eff6ff" />
  <text x="402" y="417" fill="#1d4ed8" font-size="24" font-weight="700">${escapeSvgText(
    ACHIEVEMENT_CATEGORY_LABELS[achievement.category],
  )}</text>

  <text x="132" y="520" fill="#0f172a" font-size="26" font-weight="700">进度</text>
  <text x="132" y="564" fill="#334155" font-size="48" font-weight="800">${achievement.progressValue}/${achievement.progressTarget} ${escapeSvgText(
    achievement.unit,
  )}</text>
  <rect x="132" y="600" width="816" height="18" rx="9" fill="#e2e8f0" />
  <rect x="132" y="600" width="${Math.max(
    24,
    Math.round((Math.min(achievement.progressValue, achievement.progressTarget) / Math.max(achievement.progressTarget, 1)) * 816),
  )}" height="18" rx="9" fill="${rarityColor}" />

  <text x="132" y="706" fill="#0f172a" font-size="26" font-weight="700">说明</text>
  ${descriptionLines
    .map(
      (line, index) =>
        `<text x="132" y="${754 + index * 40}" fill="#475569" font-size="28">${escapeSvgText(line)}</text>`,
    )
    .join('')}

  <text x="132" y="920" fill="#0f172a" font-size="26" font-weight="700">下一步</text>
  ${hintLines
    .map(
      (line, index) =>
        `<text x="132" y="${968 + index * 40}" fill="#475569" font-size="28">${escapeSvgText(line)}</text>`,
    )
    .join('')}

  <text x="132" y="1144" fill="#0f172a" font-size="26" font-weight="700">达成证据</text>
  ${
    evidence.length > 0
      ? evidence
          .map(
            (item, index) => `
  <rect x="132" y="${1188 + index * 130}" width="816" height="102" rx="22" fill="#f8fafc" stroke="#e2e8f0" />
  <text x="164" y="${1232 + index * 130}" fill="#64748b" font-size="22">${escapeSvgText(item.label)}</text>
  <text x="164" y="${1272 + index * 130}" fill="#0f172a" font-size="30" font-weight="700">${escapeSvgText(item.value)}</text>
  ${
    item.description
      ? `<text x="164" y="${1300 + index * 130}" fill="#94a3b8" font-size="18">${escapeSvgText(item.description)}</text>`
      : ''
  }`,
          )
          .join('')
      : `<text x="132" y="1196" fill="#94a3b8" font-size="26">当前还没有可展示的证据卡片。</text>`
  }

  <text x="132" y="1704" fill="#0f172a" font-size="24" font-weight="700">首次解锁</text>
  <text x="132" y="1744" fill="#475569" font-size="26">${escapeSvgText(formatUnlockedAt(achievement.firstUnlockedAt))}</text>
  <text x="132" y="1810" fill="#94a3b8" font-size="22">Voyage Atlas · 私有成就分享卡</text>
</svg>`;
}

export function downloadAchievementShareCard(svg: string, filename: string) {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('当前环境不支持本地导出');
  }
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
