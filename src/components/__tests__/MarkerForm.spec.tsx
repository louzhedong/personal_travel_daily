import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarkerForm from '../MarkerForm';

const { uploadImageToImgBBMock } = vi.hoisted(() => ({
  uploadImageToImgBBMock: vi.fn(),
}));

vi.mock('../ui/FancySelect', () => ({
  default: ({
    value,
    onChange,
    options,
    ariaLabel,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
    disabled?: boolean;
  }) => (
    <select
      aria-label={ariaLabel ?? `select-${options[0]?.label ?? 'option'}`}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">__empty__</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../ui/DateField', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
  }) => <input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} />,
}));

vi.mock('../../lib/imageUpload', () => ({
  uploadImageToImgBB: uploadImageToImgBBMock,
}));

const regions = [
  { id: 'zhejiang', name: '浙江', cities: ['杭州', '宁波'] },
  { id: 'japan', name: '日本', cities: [] },
];

describe('MarkerForm', () => {
  beforeEach(() => {
    uploadImageToImgBBMock.mockReset();
  });

  it('submits a fully populated domestic form with trimmed values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <MarkerForm
        scope="domestic"
        regions={regions}
        trips={[
          {
            id: 'trip-1',
            name: '京都春游',
            note: '',
            startsAt: '2026-04-01',
            endsAt: '2026-04-05',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        ]}
        initialValue={{
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-02',
        }}
        submitText="保存到档案"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    await user.selectOptions(screen.getByLabelText('select-浙江'), 'zhejiang');
    await user.selectOptions(screen.getByLabelText('select-杭州'), '杭州');
    await user.clear(screen.getByLabelText('游玩开始日期'));
    await user.type(screen.getByLabelText('游玩开始日期'), '2026-04-01');
    await user.clear(screen.getByLabelText('游玩结束日期'));
    await user.type(screen.getByLabelText('游玩结束日期'), '2026-04-03');
    await user.selectOptions(screen.getByLabelText('所属行程'), 'trip-1');
    await user.type(screen.getByPlaceholderText('记录这次旅行的亮点、美食、路线或特别感受'), '  西湖散步和龙井茶  ');
    await user.click(screen.getByRole('button', { name: '美食' }));
    await user.click(screen.getByRole('button', { name: '城市漫游' }));
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[3], 'relaxed');
    await user.selectOptions(selects[4], 'sunny');
    await user.selectOptions(selects[5], 'walk');
    await user.selectOptions(selects[6], 'medium');
    await user.click(screen.getByRole('button', { name: '取消' }));
    await user.click(screen.getByRole('button', { name: '保存到档案' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({
      scope: 'domestic',
      scopeId: 'zhejiang',
      scopeName: '浙江',
      city: '杭州',
      note: '西湖散步和龙井茶',
      tags: ['food', 'citywalk'],
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
      imageUrls: undefined,
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-03',
      tripId: 'trip-1',
    });
  });

  it('validates required city, date range, and note length', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MarkerForm
        scope="domestic"
        regions={regions}
        initialValue={{
          scopeId: 'zhejiang',
          city: '上海',
          visitedStartAt: '2026-04-03',
          visitedEndAt: '2026-04-01',
          note: 'a'.repeat(501),
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: '保存标记' }));

    expect(screen.getByText('请选择或输入城市')).toBeInTheDocument();
    expect(screen.getByText('结束日期不能早于开始日期')).toBeInTheDocument();
    expect(screen.getByText('游玩描述不能超过 500 个字符')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('supports manual city input for regions without preset cities and uploads/deletes images', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    uploadImageToImgBBMock.mockResolvedValueOnce('https://example.com/a.jpg').mockResolvedValueOnce('https://example.com/b.jpg');

    render(
      <MarkerForm
        scope="international"
        regions={regions}
        initialValue={{
          scopeId: 'japan',
          city: '京都',
          visitedStartAt: '2026-05-01',
          visitedEndAt: '2026-05-02',
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByPlaceholderText('请输入城市/地区')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('请输入城市/地区'));
    await user.type(screen.getByPlaceholderText('请输入城市/地区'), '东京');

    const fileInput = screen.getByLabelText('上传图片', { selector: 'input' });
    await user.upload(fileInput, [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.png', { type: 'image/png' })]);

    await waitFor(() => {
      expect(screen.getByText('已上传 2 张图片')).toBeInTheDocument();
    });
    expect(uploadImageToImgBBMock).toHaveBeenCalledTimes(2);

    await user.click(screen.getByLabelText('删除第 1 张图片'));
    expect(screen.getByText('已上传 1 张图片')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('记录这次旅行的亮点、美食、路线或特别感受'), '涩谷夜景');
    await user.click(screen.getByRole('button', { name: '保存标记' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'international',
        scopeId: 'japan',
        scopeName: '日本',
        city: '东京',
        imageUrls: ['https://example.com/b.jpg'],
      }),
    );
  });

  it('shows upload errors and blocks submission while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    uploadImageToImgBBMock.mockRejectedValueOnce(new Error('上传失败'));

    const { rerender } = render(
      <MarkerForm
        scope="domestic"
        regions={regions}
        initialValue={{
          scopeId: 'zhejiang',
          city: '杭州',
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-01',
        }}
        onSubmit={onSubmit}
      />,
    );

    const fileInput = screen.getByLabelText('上传图片', { selector: 'input' });
    await user.upload(fileInput, new File(['a'], 'a.png', { type: 'image/png' }));

    await waitFor(() => {
      expect(screen.getByText('上传失败')).toBeInTheDocument();
    });

    rerender(
      <MarkerForm
        scope="domestic"
        regions={regions}
        submitting
        initialValue={{
          scopeId: 'zhejiang',
          city: '杭州',
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-01',
        }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled();
  });
});
