import { describe, expect, it } from 'vitest';
import type { TravelStore } from '../../types';
import {
  createTravelStoreImportPreview,
  isTravelStoreImportPayload,
  mergeTravelStoreById,
  mergeTravelStoreByIdWithStats,
  normalizeImportedStore,
} from '../storage';

describe('storage import merge', () => {
  it('merges imported users and markers by id while keeping current activeUserId', () => {
    const currentStore: TravelStore = {
      users: [
        { id: 'u1', name: '小悠', color: '#2563eb' },
        { id: 'u2', name: '阿泽', color: '#f97316' },
      ],
      markers: [
        {
          id: 'm1',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'zhejiang',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖散步',
          visitedStartAt: '2026-03-01',
          visitedEndAt: '2026-03-02',
          createdAt: '2026-03-03T00:00:00.000Z',
        },
        {
          id: 'm2',
          userId: 'u2',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '东京',
          note: '旧记录',
          visitedStartAt: '2026-01-01',
          visitedEndAt: '2026-01-03',
          createdAt: '2026-01-04T00:00:00.000Z',
        },
      ],
      activeUserId: 'u1',
    };

    const importedStore = normalizeImportedStore({
      users: [
        { id: 'u2', name: '阿泽（更新）', color: '#ea580c' },
        { id: 'u3', name: '小周', color: '#14b8a6' },
      ],
      markers: [
        {
          id: 'm2',
          userId: 'u2',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '京都',
          note: '更新后的记录',
          visitedStartAt: '2026-02-01',
          visitedEndAt: '2026-02-05',
          createdAt: '2026-02-06T00:00:00.000Z',
        },
        {
          id: 'm3',
          userId: 'u3',
          scope: 'domestic',
          scopeId: 'guangdong',
          scopeName: '广东',
          city: '广州',
          note: '新增记录',
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-02',
          createdAt: '2026-04-03T00:00:00.000Z',
        },
        {
          id: 'm-invalid',
          userId: 'ghost',
          scope: 'domestic',
          scopeId: 'fujian',
          scopeName: '福建',
          city: '厦门',
          note: '无效用户',
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-02',
          createdAt: '2026-05-03T00:00:00.000Z',
        },
      ],
      activeUserId: 'u3',
    });

    const mergedStore = mergeTravelStoreById(currentStore, importedStore);

    expect(mergedStore.users).toEqual([
      { id: 'u1', name: '小悠', color: '#2563eb' },
      { id: 'u2', name: '阿泽（更新）', color: '#ea580c' },
      { id: 'u3', name: '小周', color: '#14b8a6' },
    ]);
    expect(mergedStore.markers).toEqual([
      currentStore.markers[0],
      {
        id: 'm2',
        userId: 'u2',
        scope: 'international',
        scopeId: 'japan',
        scopeName: '日本',
        city: '京都',
        note: '更新后的记录',
        visitedStartAt: '2026-02-01',
        visitedEndAt: '2026-02-05',
        createdAt: '2026-02-06T00:00:00.000Z',
      },
      {
        id: 'm3',
        userId: 'u3',
        scope: 'domestic',
        scopeId: 'guangdong',
        scopeName: '广东',
        city: '广州',
        note: '新增记录',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-02',
        createdAt: '2026-04-03T00:00:00.000Z',
      },
    ]);
    expect(mergedStore.activeUserId).toBe('u1');
  });

  it('validates import payload shape before merge', () => {
    expect(isTravelStoreImportPayload({ users: [], markers: [], activeUserId: null })).toBe(true);
    expect(isTravelStoreImportPayload({ users: 'not-array' })).toBe(false);
    expect(isTravelStoreImportPayload({ foo: 'bar' })).toBe(false);
    expect(isTravelStoreImportPayload(null)).toBe(false);
  });

  it('returns merge stats for added and updated records', () => {
    const currentStore: TravelStore = {
      users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
      markers: [
        {
          id: 'm1',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'zhejiang',
          scopeName: '浙江',
          city: '杭州',
          note: '旧内容',
          visitedStartAt: '2026-03-01',
          visitedEndAt: '2026-03-02',
          createdAt: '2026-03-03T00:00:00.000Z',
        },
      ],
      activeUserId: 'u1',
    };

    const importedStore = normalizeImportedStore({
      users: [
        { id: 'u1', name: '小悠（更新）', color: '#1d4ed8' },
        { id: 'u2', name: '阿泽', color: '#f97316' },
      ],
      markers: [
        {
          id: 'm1',
          userId: 'u1',
          scope: 'domestic',
          scopeId: 'zhejiang',
          scopeName: '浙江',
          city: '杭州',
          note: '新内容',
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-02',
          createdAt: '2026-04-03T00:00:00.000Z',
        },
        {
          id: 'm2',
          userId: 'u2',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '大阪',
          note: '新增记录',
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-02',
          createdAt: '2026-05-03T00:00:00.000Z',
        },
      ],
    });

    const result = mergeTravelStoreByIdWithStats(currentStore, importedStore);

    expect(result.store.users).toHaveLength(2);
    expect(result.store.markers).toHaveLength(2);
    expect(result.stats).toEqual({
      usersAdded: 1,
      usersUpdated: 1,
      markersAdded: 1,
      markersUpdated: 1,
      markersSkippedInvalidUser: 0,
    });
  });

  it('creates import preview detail lists before applying merge', () => {
    const currentStore: TravelStore = {
      users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
      markers: [],
      activeUserId: 'u1',
    };

    const importedStore = normalizeImportedStore({
      users: [
        { id: 'u1', name: '小悠（更新）', color: '#1d4ed8' },
        { id: 'u2', name: '阿泽', color: '#f97316' },
      ],
      markers: [
        {
          id: 'm1',
          userId: 'u2',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '大阪',
          note: '新增记录',
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-02',
          createdAt: '2026-05-03T00:00:00.000Z',
        },
        {
          id: 'm-invalid',
          userId: 'ghost',
          scope: 'domestic',
          scopeId: 'fujian',
          scopeName: '福建',
          city: '厦门',
          note: '无效记录',
          visitedStartAt: '2026-06-01',
          visitedEndAt: '2026-06-02',
          createdAt: '2026-06-03T00:00:00.000Z',
        },
      ],
    });

    const preview = createTravelStoreImportPreview(currentStore, importedStore);

    expect(preview.stats).toEqual({
      usersAdded: 1,
      usersUpdated: 1,
      markersAdded: 1,
      markersUpdated: 0,
      markersSkippedInvalidUser: 1,
    });
    expect(preview.users).toEqual([
      { id: 'u1', name: '小悠（更新）', color: '#1d4ed8', action: 'update' },
      { id: 'u2', name: '阿泽', color: '#f97316', action: 'add' },
    ]);
    expect(preview.markers).toEqual([
      {
        id: 'm1',
        userId: 'u2',
        userName: '阿泽',
        scope: 'international',
        scopeId: 'japan',
        scopeName: '日本',
        city: '大阪',
        note: '新增记录',
        visitedStartAt: '2026-05-01',
        visitedEndAt: '2026-05-02',
        createdAt: '2026-05-03T00:00:00.000Z',
        action: 'add',
      },
      {
        id: 'm-invalid',
        userId: 'ghost',
        userName: null,
        scope: 'domestic',
        scopeId: 'fujian',
        scopeName: '福建',
        city: '厦门',
        note: '无效记录',
        visitedStartAt: '2026-06-01',
        visitedEndAt: '2026-06-02',
        createdAt: '2026-06-03T00:00:00.000Z',
        action: 'skip',
        reason: '关联用户不存在',
      },
    ]);
    expect(preview.mergedStore.users).toHaveLength(2);
    expect(preview.mergedStore.markers).toHaveLength(1);
  });
});
