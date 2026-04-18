import { describe, expect, it } from 'vitest';
import { listAdapterEntries } from '../adapters/index.mjs';
import { findGuideDocumentBySourceUrl, searchGuideDocuments } from '../guideSearchEngine.mjs';
import { GUIDE_SEED_DOCUMENTS } from '../guideSeedData.mjs';

describe('guideSearchEngine', () => {
  it('filters by scope and ranks matched guides', () => {
    const response = searchGuideDocuments([...GUIDE_SEED_DOCUMENTS, ...listAdapterEntries()], {
      keyword: '青海 西宁 攻略',
      scope: 'domestic',
      page: 1,
      pageSize: 8,
    });

    expect(response.items[0]?.title).toBe('青海湖环线旅行攻略：西宁出发 4 天节奏版');
    expect(response.items.every((item) => item.destinationLabel !== '京都')).toBe(true);
  });

  it('includes all-scope Chinese entries during scoped searches', () => {
    const response = searchGuideDocuments(
      [
        {
          id: 'zh-wikivoyage-kyoto',
          scope: 'all',
          title: '京都 | 维基导游',
          summary: '京都的中文旅行指南',
          sourceName: '维基导游',
          sourceUrl: 'https://zh.wikivoyage.org/wiki/%E4%BA%AC%E9%83%BD',
          destinationLabel: '京都',
          tags: ['中文攻略'],
          searchableText: '京都 中文 攻略 维基导游',
        },
      ],
      {
        keyword: '京都 中文',
        scope: 'international',
        page: 1,
        pageSize: 8,
      },
    );

    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.sourceName).toBe('维基导游');
  });

  it('returns full document by source url', () => {
    const document = findGuideDocumentBySourceUrl(
      GUIDE_SEED_DOCUMENTS,
      'https://guide-api.local/sources/kyoto-spring',
    );

    expect(document?.blocks[0]?.text).toBe('最佳季节');
    expect(document?.title).toBe('京都春日赏樱旅行攻略');
  });
});
