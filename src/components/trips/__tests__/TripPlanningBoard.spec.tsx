import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TripPlanningBoard from '../TripPlanningBoard';
import type { TripPlanningSummary } from '../../../types';

const summary: TripPlanningSummary = {
  total: 0,
  plannedCount: 0,
  convertedCount: 0,
  highPriorityCount: 0,
};

describe('TripPlanningBoard', () => {
  it('keeps the wishlist import entry visible when the wishlist is empty', () => {
    render(
      <TripPlanningBoard
        activeCompanionId="u1"
        summary={summary}
        items={[]}
        wishlistItems={[]}
        onCreateItem={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onConvertItem={vi.fn()}
        onImportWishlistItem={vi.fn()}
      />,
    );

    expect(screen.getByRole('region', { name: '愿望地图导入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '选择愿望地图地点' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '导入到行前规划' })).toBeDisabled();
    expect(screen.getByText('愿望地图暂无地点')).toBeInTheDocument();
    expect(screen.getByText('先在地图或攻略里加入愿望。')).toBeInTheDocument();
  });
});
