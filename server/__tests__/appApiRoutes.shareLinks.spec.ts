// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('private share links', () => {
  it('supports authenticated share-link governance routes', async () => {
    const link = {
      id: 'share-1',
      resourceType: 'memory_capsule',
      resourceId: 'capsule-1',
      title: '京都胶囊',
      status: 'active',
      tokenPreview: 'abcd1234',
      passwordProtected: true,
      accessCount: 0,
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
    };
    mocks.listAccountPrivateShareLinksMock.mockResolvedValue({ links: [link] });
    mocks.createAccountPrivateShareLinkMock.mockResolvedValue({ link: { ...link, url: '/share/raw-token' } });
    mocks.updateAccountPrivateShareLinkMock.mockResolvedValue({ link: { ...link, title: '新的标题' } });
    mocks.revokeAccountPrivateShareLinkMock.mockResolvedValue({ link: { ...link, status: 'revoked' } });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/share-links' });
      expect(listResponse.statusCode).toBe(200);
      expect(mocks.listAccountPrivateShareLinksMock).toHaveBeenCalledWith(currentAccount);

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/share-links',
        payload: {
          resourceType: 'memory_capsule',
          resourceId: 'capsule-1',
          password: 'open-sesame',
          maxAccessCount: 12,
        },
      });
      expect(createResponse.statusCode).toBe(200);
      expect(mocks.createAccountPrivateShareLinkMock).toHaveBeenCalledWith(currentAccount, {
        resourceType: 'memory_capsule',
        resourceId: 'capsule-1',
        password: 'open-sesame',
        maxAccessCount: 12,
      });

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/share-links/share-1',
        payload: { title: '新的标题', password: null },
      });
      expect(updateResponse.statusCode).toBe(200);
      expect(mocks.updateAccountPrivateShareLinkMock).toHaveBeenCalledWith(currentAccount, 'share-1', {
        title: '新的标题',
        password: null,
      });

      const revokeResponse = await app.inject({ method: 'POST', url: '/api/share-links/share-1/revoke' });
      expect(revokeResponse.statusCode).toBe(200);
      expect(mocks.revokeAccountPrivateShareLinkMock).toHaveBeenCalledWith(currentAccount, 'share-1');
    } finally {
      await app.close();
    }
  });

  it('supports anonymous public share access without authentication', async () => {
    mocks.requireAuthenticatedAccountMock.mockRejectedValue(new Error('should not authenticate public share'));
    mocks.accessPublicPrivateShareLinkMock.mockResolvedValue({
      resource: {
        kind: 'memory_capsule',
        title: '京都胶囊',
        generatedAt: '2026-05-12T00:00:00.000Z',
        memoryCapsule: {
          capsule: {
            id: 'capsule-1',
            type: 'trip',
            targetId: 'trip-1',
            targetLabel: '京都',
            title: '京都胶囊',
            template: 'editorial',
            status: 'ready',
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
          },
          config: { exportPreset: 'balanced', sections: [], photos: [], badges: [] },
          content: {
            hero: { eyebrow: 'Capsule', title: '京都胶囊' },
            metrics: [],
            badges: [],
            sections: [],
            route: [],
            timeline: [],
            photos: [],
            guides: [],
            checklist: [],
            achievements: [],
            sourceLinks: [],
            emptyStates: [],
          },
        },
      },
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/public/share-links/raw-share-token-123/access',
        payload: { password: 'open-sesame' },
        headers: { 'user-agent': 'Vitest Browser' },
      });
      expect(response.statusCode).toBe(200);
      expect(mocks.accessPublicPrivateShareLinkMock).toHaveBeenCalledWith(
        'raw-share-token-123',
        { password: 'open-sesame' },
        expect.objectContaining({ userAgent: 'Vitest Browser' }),
      );
      expect(mocks.requireAuthenticatedAccountMock).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
