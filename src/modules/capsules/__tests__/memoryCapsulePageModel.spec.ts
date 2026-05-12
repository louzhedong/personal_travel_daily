import { describe, expect, it } from 'vitest';
import { moveSectionConfig, summarizeCapsuleMetrics } from '../memoryCapsulePageModel';

const sections = [
  { id: 'brief', enabled: true, sortOrder: 0 },
  { id: 'route', enabled: true, sortOrder: 1 },
  { id: 'photos', enabled: true, sortOrder: 2 },
];

describe('memoryCapsulePageModel', () => {
  it('limits summary metrics to four items', () => {
    expect(
      summarizeCapsuleMetrics([
        { label: 'a', value: '1' },
        { label: 'b', value: '2' },
        { label: 'c', value: '3' },
        { label: 'd', value: '4' },
        { label: 'e', value: '5' },
      ]),
    ).toHaveLength(4);
  });

  it('moves section config without mutating the original order', () => {
    const next = moveSectionConfig(sections, 'route', 'up');

    expect(next.map((item) => `${item.id}:${item.sortOrder}`)).toEqual(['route:0', 'brief:1', 'photos:2']);
    expect(sections.map((item) => `${item.id}:${item.sortOrder}`)).toEqual(['brief:0', 'route:1', 'photos:2']);
  });
});
