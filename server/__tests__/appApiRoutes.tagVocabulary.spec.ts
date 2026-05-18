// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('tag vocabulary', () => {
  it('supports marker tag vocabulary governance routes', async () => {
    const payload = {
      items: [],
      visibleItems: [],
      systemCount: 10,
      customCount: 0,
    };
    mocks.listMarkerTagVocabularyMock.mockResolvedValue(payload);
    mocks.createMarkerTagVocabularyMock.mockResolvedValue(payload);
    mocks.updateMarkerTagVocabularyMock.mockResolvedValue(payload);
    mocks.deleteMarkerTagVocabularyMock.mockResolvedValue(payload);

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/marker-tags/vocabulary' });
      expect(listResponse.statusCode).toBe(200);
      expect(mocks.listMarkerTagVocabularyMock).toHaveBeenCalledWith(currentAccount.id);

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/marker-tags/vocabulary',
        payload: { label: '温泉', value: 'onsen' },
      });
      expect(createResponse.statusCode).toBe(200);
      expect(mocks.createMarkerTagVocabularyMock).toHaveBeenCalledWith(currentAccount.id, { label: '温泉', value: 'onsen' });

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/marker-tags/vocabulary/onsen',
        payload: { isHidden: true, sortOrder: 80 },
      });
      expect(updateResponse.statusCode).toBe(200);
      expect(mocks.updateMarkerTagVocabularyMock).toHaveBeenCalledWith(currentAccount.id, 'onsen', {
        isHidden: true,
        sortOrder: 80,
      });

      const deleteResponse = await app.inject({ method: 'DELETE', url: '/api/marker-tags/vocabulary/onsen' });
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.deleteMarkerTagVocabularyMock).toHaveBeenCalledWith(currentAccount.id, 'onsen');
    } finally {
      await app.close();
    }
  });
});
