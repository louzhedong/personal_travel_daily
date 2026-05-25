import type { RhythmPortraitDto, RhythmThemeMixDto } from '../dto/rhythmPortrait.js';

/**
 * G5 · Rhythm Portrait SVG renderer / 节奏画像 SVG 分享卡渲染器
 * 1080×1080，纯手写 SVG，沿用 tripStoryExport / memoryCapsuleExport 模式（无外部 chart 依赖）。
 */

const SIZE = 1080;
const CENTER = SIZE / 2;
const RADAR_RADIUS = 320;
const THEME_KEYS: Array<keyof RhythmThemeMixDto> = [
  'food',
  'scenery',
  'history',
  'healing',
  'nature',
];
const THEME_LABELS: Record<keyof RhythmThemeMixDto, string> = {
  food: '食 Food',
  scenery: '景 Scenery',
  history: '史 History',
  healing: '愈 Healing',
  nature: '然 Nature',
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function radarPolygon(values: number[], radius: number): string {
  const angleStep = (Math.PI * 2) / values.length;
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + angleStep * i;
      const r = Math.max(0, Math.min(1, v)) * radius;
      const x = CENTER + Math.cos(angle) * r;
      const y = CENTER + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function radarAxis(radius: number): string {
  const angleStep = (Math.PI * 2) / THEME_KEYS.length;
  return THEME_KEYS.map((_, i) => {
    const angle = -Math.PI / 2 + angleStep * i;
    const x = CENTER + Math.cos(angle) * radius;
    const y = CENTER + Math.sin(angle) * radius;
    return `<line x1="${CENTER}" y1="${CENTER}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(120,90,60,0.18)" stroke-width="1" />`;
  }).join('\n');
}

function radarRing(scale: number): string {
  return `<circle cx="${CENTER}" cy="${CENTER}" r="${(RADAR_RADIUS * scale).toFixed(1)}" fill="none" stroke="rgba(120,90,60,0.16)" stroke-width="1" />`;
}

function radarLabels(): string {
  const angleStep = (Math.PI * 2) / THEME_KEYS.length;
  return THEME_KEYS.map((key, i) => {
    const angle = -Math.PI / 2 + angleStep * i;
    const radius = RADAR_RADIUS + 36;
    const x = CENTER + Math.cos(angle) * radius;
    const y = CENTER + Math.sin(angle) * radius;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#5a4a36" font-size="22" font-family="serif">${escapeXml(THEME_LABELS[key])}</text>`;
  }).join('\n');
}

function sparkLine(months: Array<{ month: number; share: number }>, baseY: number): string {
  if (months.length === 0) return '';
  const startX = 140;
  const endX = SIZE - 140;
  const width = endX - startX;
  const stepX = width / 11;
  const fullMonths = new Array(12).fill(0);
  for (const m of months) fullMonths[m.month - 1] = m.share;
  const max = Math.max(...fullMonths, 0.0001);
  const points = fullMonths
    .map((share, idx) => {
      const x = startX + idx * stepX;
      const y = baseY - (share / max) * 60;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return `<polyline points="${points}" fill="none" stroke="#7a5a3a" stroke-width="2.4" />`;
}

export function renderRhythmPortraitSvg(portrait: RhythmPortraitDto): string {
  const themeValues = THEME_KEYS.map((key) => portrait.themeMix[key] ?? 0);
  const monthsLine = sparkLine(
    portrait.topMonths.map((m) => ({ month: m.month, share: m.share })),
    SIZE - 140,
  );

  const headerTitle = portrait.available
    ? '旅行节奏画像 / Travel Rhythm Portrait'
    : '指纹尚未成形 / Rhythm not ready';
  const headerSub = portrait.available
    ? `${escapeXml(portrait.windowYears)} · ${portrait.totalTripCount} trips · ${portrait.avgTripDays.toFixed(1)} days avg`
    : '再多走一段就能看到指纹 / Take a few more trips';

  const transports = portrait.topTransports
    .slice(0, 3)
    .map(
      (t, idx) =>
        `<text x="140" y="${980 + idx * 28}" fill="#5a4a36" font-size="22" font-family="serif">${escapeXml(t.label)} · ${(t.share * 100).toFixed(0)}%</text>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="paperBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5ecdf" />
      <stop offset="1" stop-color="#ece1cf" />
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#paperBg)" />

  <text x="${CENTER}" y="120" text-anchor="middle" fill="#3a2a18" font-size="44" font-family="serif" font-weight="600">${escapeXml(headerTitle)}</text>
  <text x="${CENTER}" y="170" text-anchor="middle" fill="#7a5a3a" font-size="24" font-family="serif">${escapeXml(headerSub)}</text>

  ${radarRing(0.33)}
  ${radarRing(0.66)}
  ${radarRing(1)}
  ${radarAxis(RADAR_RADIUS)}
  <polygon points="${radarPolygon(themeValues, RADAR_RADIUS)}" fill="rgba(180,120,60,0.32)" stroke="#7a4a20" stroke-width="2" />
  ${radarLabels()}

  <text x="140" y="900" fill="#3a2a18" font-size="28" font-family="serif" font-weight="600">常去月份 · Top months</text>
  ${monthsLine}

  <text x="140" y="960" fill="#3a2a18" font-size="28" font-family="serif" font-weight="600">偏好交通 · Top transports</text>
  ${transports}

  <text x="${SIZE - 60}" y="${SIZE - 50}" text-anchor="end" fill="rgba(120,90,60,0.6)" font-size="18" font-family="serif">${escapeXml(`Generated ${portrait.generatedAt ? portrait.generatedAt.slice(0, 10) : 'now'}`)}</text>
</svg>`;
}
