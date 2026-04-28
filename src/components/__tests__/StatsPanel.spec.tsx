import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatsPanel from '../StatsPanel';

describe('StatsPanel', () => {
  it('renders summary cards for domestic travel with populated markers', () => {
    render(
      <StatsPanel
        scope="domestic"
        users={[
          { id: 'u1', name: '小悠', color: '#2563eb' },
          { id: 'u2', name: '阿泽', color: '#f97316' },
        ]}
        markers={[
          {
            id: 'm1',
            userId: 'u1',
            scope: 'domestic',
            scopeId: 'zj',
            scopeName: '浙江',
            city: '杭州',
            note: '西湖',
            visitedStartAt: '2026-04-01',
            visitedEndAt: '2026-04-01',
            createdAt: '2026-04-01T00:00:00.000Z',
          },
          {
            id: 'm2',
            userId: 'u2',
            scope: 'domestic',
            scopeId: 'js',
            scopeName: '江苏',
            city: '苏州',
            note: '平江路',
            visitedStartAt: '2026-04-02',
            visitedEndAt: '2026-04-02',
            createdAt: '2026-04-02T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('国内旅行')).toBeInTheDocument();
    expect(within(screen.getByText('总标记数').closest('article')!).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByText('已点亮地区').closest('article')!).getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('适合梳理省市周游与周末短途记忆')).toBeInTheDocument();
    expect(screen.getByText('这些地区已被点亮，成为旅途记忆的一部分')).toBeInTheDocument();
  });

  it('renders empty-state captions for international mode without markers', () => {
    render(<StatsPanel scope="international" users={[{ id: 'u1', name: '小悠', color: '#2563eb' }]} markers={[]} />);

    expect(screen.getByText('国际旅行')).toBeInTheDocument();
    expect(screen.getByText('从第一条记录开始，慢慢铺开自己的旅行版图')).toBeInTheDocument();
    expect(screen.getByText('还没有点亮地区，下一次出发就从这里开始')).toBeInTheDocument();
    expect(screen.getByText('一个人的旅行地图，也能慢慢长成完整档案')).toBeInTheDocument();
  });
});
