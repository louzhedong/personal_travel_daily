import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuideSearchPanel from '../GuideSearchPanel';

describe('GuideSearchPanel', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
  });

  it('searches and renders guide result details', async () => {
    render(
      <GuideSearchPanel
        open
        initialQuery="Kyoto"
        initialScope="international"
        onClose={() => {}}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByText('Kyoto Spring Cherry Blossom Guide')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '查看片段' }));

    expect(await screen.findByText('Best Season')).toBeInTheDocument();
    expect(screen.getByText(/Late March to early April/i)).toBeInTheDocument();
  });
});
