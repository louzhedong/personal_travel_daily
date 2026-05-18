// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('memory capsules', () => {
  it('supports memory capsule routes for authenticated accounts', async () => {
    const capsuleResponse = {
      capsule: {
        capsule: {
          id: 'capsule-1',
          type: 'trip',
          targetId: 'trip-1',
          targetLabel: '江南春游',
          title: '江南春游',
          template: 'editorial',
          status: 'draft',
          createdAt: '2026-05-11T00:00:00.000Z',
          updatedAt: '2026-05-11T00:00:00.000Z',
        },
        config: {
          exportPreset: 'balanced',
          sections: [],
          photos: [],
          badges: [],
        },
        content: {
          hero: { eyebrow: 'Trip Capsule', title: '江南春游' },
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
    };
    mocks.listAccountMemoryCapsulesMock.mockResolvedValue({ capsules: [capsuleResponse.capsule.capsule] });
    mocks.createAccountMemoryCapsuleMock.mockResolvedValue(capsuleResponse);
    mocks.getAccountMemoryCapsuleMock.mockResolvedValue(capsuleResponse);
    mocks.updateAccountMemoryCapsuleMock.mockResolvedValue(capsuleResponse);
    mocks.duplicateAccountMemoryCapsuleMock.mockResolvedValue({
      capsule: {
        ...capsuleResponse.capsule,
        capsule: { ...capsuleResponse.capsule.capsule, id: 'capsule-copy', title: '江南春游 副本' },
      },
    });
    mocks.archiveAccountMemoryCapsuleMock.mockResolvedValue({ success: true });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/memory-capsules' });
      expect(listResponse.statusCode).toBe(200);
      expect(mocks.listAccountMemoryCapsulesMock).toHaveBeenCalledWith(currentAccount, { includeArchived: false });

      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/memory-capsules',
        payload: { type: 'trip', targetId: 'trip-1' },
      });
      expect(createResponse.statusCode).toBe(200);
      expect(mocks.createAccountMemoryCapsuleMock).toHaveBeenCalledWith(currentAccount, {
        type: 'trip',
        targetId: 'trip-1',
      });

      const detailResponse = await app.inject({ method: 'GET', url: '/api/memory-capsules/capsule-1' });
      expect(detailResponse.statusCode).toBe(200);
      expect(mocks.getAccountMemoryCapsuleMock).toHaveBeenCalledWith(currentAccount, 'capsule-1');

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/memory-capsules/capsule-1',
        payload: { title: '新的胶囊标题' },
      });
      expect(updateResponse.statusCode).toBe(200);
      expect(mocks.updateAccountMemoryCapsuleMock).toHaveBeenCalledWith(currentAccount, 'capsule-1', {
        title: '新的胶囊标题',
      });

      const duplicateResponse = await app.inject({ method: 'POST', url: '/api/memory-capsules/capsule-1/duplicate' });
      expect(duplicateResponse.statusCode).toBe(200);
      expect(mocks.duplicateAccountMemoryCapsuleMock).toHaveBeenCalledWith(currentAccount, 'capsule-1');

      const archiveResponse = await app.inject({ method: 'POST', url: '/api/memory-capsules/capsule-1/archive' });
      expect(archiveResponse.statusCode).toBe(200);
      expect(mocks.archiveAccountMemoryCapsuleMock).toHaveBeenCalledWith(currentAccount, 'capsule-1');
    } finally {
      await app.close();
    }
  });
});
