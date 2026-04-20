import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataSync from '../DataSync';
import type { TravelStore } from '../../types';

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!input) {
    throw new Error('Missing file input');
  }
  return input as HTMLInputElement;
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('读取 Blob 失败'));
    reader.readAsText(blob);
  });
}

describe('DataSync', () => {
  it('shows import preview details before confirming and then imports merged data', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
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
    };

    const importedPayload = {
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
      activeUserId: 'u2',
    };

    const onRestore = vi.fn();

    const { container } = render(<DataSync store={store} onRestore={onRestore} />);

    // Trigger upload by targeting the hidden input directly.
    const file = new File([JSON.stringify(importedPayload)], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue(JSON.stringify(importedPayload)),
    });
    await user.upload(getFileInput(container), file);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('确认后才会写入本地数据')).toBeInTheDocument();
    expect(screen.getByText('用户明细')).toBeInTheDocument();
    expect(screen.getByText('记录明细')).toBeInTheDocument();
    const userList = screen.getByLabelText('用户导入明细');
    const markerList = screen.getByLabelText('记录导入明细');
    expect(userList).toBeInTheDocument();
    expect(markerList).toBeInTheDocument();
    expect(within(userList).getByText('小悠（更新）')).toBeInTheDocument();
    expect(within(userList).getByText('阿泽')).toBeInTheDocument();
    expect(within(markerList).getByText('浙江 · 杭州')).toBeInTheDocument();
    expect(within(markerList).getByText('日本 · 大阪')).toBeInTheDocument();
    expect(within(markerList).getByText('未知用户 · 关联用户不存在')).toBeInTheDocument();
    expect(screen.getByText('有 1 条记录因缺少有效关联用户而将被跳过。')).toBeInTheDocument();
    expect(within(userList).getByText('新增')).toHaveClass('data-sync-preview-tag-add');
    expect(within(userList).getByText('更新')).toHaveClass('data-sync-preview-tag-update');
    expect(within(markerList).getByText('跳过')).toHaveClass('data-sync-preview-tag-skip');
    expect(onRestore).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: '跳过项' }));
    expect(screen.getByRole('tab', { name: '跳过项' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByLabelText('用户导入明细')).not.toBeInTheDocument();
    const skippedList = screen.getByLabelText('跳过项导入明细');
    expect(skippedList).toBeInTheDocument();
    expect(within(skippedList).getByText('福建 · 厦门')).toBeInTheDocument();
    expect(within(skippedList).queryByText('浙江 · 杭州')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '导出 CSV' }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(exportedFilename).toContain('voyage-atlas-import-preview-skipped-');
    const createObjectUrlCall = createObjectURLSpy.mock.calls[0];
    expect(createObjectUrlCall).toBeDefined();
    const exportedBlob = createObjectUrlCall[0] as Blob;
    const exportedText = await readBlobAsText(exportedBlob);
    expect(exportedText).toContain('category,action,id,name,color,userId,userName');
    expect(exportedText).toContain('skipped,skip,m-invalid');
    expect(exportedText).toContain('福建');
    expect(exportedText).not.toContain('m1');

    await user.click(screen.getByRole('tab', { name: '用户' }));
    expect(screen.getByRole('tab', { name: '用户' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('用户导入明细')).toBeInTheDocument();
    expect(screen.queryByLabelText('记录导入明细')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '全部' }));
    await user.click(screen.getByRole('button', { name: '确认导入' }));

    expect(onRestore).toHaveBeenCalledTimes(1);

    const mergedStore = onRestore.mock.calls[0][0] as TravelStore;
    expect(mergedStore.users).toEqual([
      { id: 'u1', name: '小悠（更新）', color: '#1d4ed8' },
      { id: 'u2', name: '阿泽', color: '#f97316' },
    ]);
    expect(mergedStore.markers).toEqual([
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
    ]);

    // Result modal should show merged summary after confirmation.
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('已按 ID 合并本地数据')).toBeInTheDocument();
    expect(screen.getByText('新增用户')).toBeInTheDocument();
    expect(screen.getByText('更新用户')).toBeInTheDocument();
    expect(screen.getByText('新增记录')).toBeInTheDocument();
    expect(screen.getByText('更新记录')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(4);
    expect(screen.getByText('有 1 条记录因缺少有效关联用户而被跳过。')).toBeInTheDocument();

    // No error alerts on success.
    expect(alertSpy).not.toHaveBeenCalled();

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
    alertSpy.mockRestore();
  });
});
