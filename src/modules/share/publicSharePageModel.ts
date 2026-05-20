import type { PublicShareResourceDto } from '../../lib/api/types';

export function getPublicShareTemplate(resource: PublicShareResourceDto) {
  switch (resource.kind) {
    case 'annual_review':
      return { className: 'is-annual', label: 'Annual Review', rhythm: '年度巡礼' };
    case 'companion_memory':
      return { className: 'is-companion', label: 'Companion Memory', rhythm: '同行章节' };
    case 'memory_capsule':
      return { className: 'is-capsule', label: 'Memory Capsule', rhythm: '封存片段' };
    default:
      return { className: 'is-trip', label: 'Trip Story', rhythm: '行程故事' };
  }
}

export function buildPublicShareOgSvg(resource: PublicShareResourceDto) {
  const title = resource.title.replace(/[<>&]/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f6efe2"/><text x="90" y="180" fill="#2c241b" font-size="42" font-family="serif">Personal Travel Daily</text><text x="90" y="315" fill="#2c241b" font-size="76" font-family="serif">${title}</text><text x="90" y="430" fill="#7d6b55" font-size="30">Read-only private share</text></svg>`)}`;
}
