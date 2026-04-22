import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataSync from '../DataSync';
import type { TravelStore } from '../../types';

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('读取 Blob 失败'));
    reader.readAsText(blob);
  });
}

describe('DataSync', () => {
  it('exports current snapshot and shows cloud mode notes', async () => {
    const user = userEvent.setup();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURLSpy = vi.fn((_: Blob | MediaSource) => 'blob:preview');
    const revokeObjectURLSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectURLSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURLSpy,
    });
    let exportedFilename = '';
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function mockAnchorClick(this: HTMLAnchorElement) {
        exportedFilename = this.download;
      });

    const store: TravelStore = {
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
      savedGuides: [],
      guideSearchHistory: [
        {
          id: 'history-1',
          keyword: '京都',
          scope: 'international',
          createdAt: '2026-04-22T00:00:00.000Z',
        },
      ],
    };

    render(<DataSync store={store} />);

    expect(screen.getByText('当前版本以云端主数据为准。这里保留导出当前聚合快照的能力，用于手动备份；本地 JSON 导入恢复已暂停开放。')).toBeInTheDocument();
    expect(screen.getByText('云端版说明')).toBeInTheDocument();
    expect(screen.getByText('当前主数据默认从主业务 API 加载，并写入 MySQL。')).toBeInTheDocument();
    expect(screen.getByText('导出的 JSON 仅作为人工备份快照，不再作为应用内恢复入口。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '导出备份' }));

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(exportedFilename).toContain('voyage-atlas-backup-');
    const createObjectUrlCall = createObjectURLSpy.mock.calls[0];
    expect(createObjectUrlCall).toBeDefined();
    const exportedBlob = createObjectUrlCall[0] as Blob;
    const exportedText = await readBlobAsText(exportedBlob);
    expect(exportedText).toContain('"activeUserId": "u1"');
    expect(exportedText).toContain('"guideSearchHistory"');
    expect(exportedText).toContain('"keyword": "京都"');

    anchorClickSpy.mockRestore();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: originalRevokeObjectURL,
    });
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:preview');
  });
});
