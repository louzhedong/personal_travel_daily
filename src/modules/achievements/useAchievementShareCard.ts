import { useCallback } from 'react';
import type { AppToastTone } from '../../components/ui/AppToast';
import type { StatsAchievementDto } from '../../lib/api/types';
import {
  buildAchievementShareCardFilename,
  buildAchievementShareCardSvg,
  downloadAchievementShareCard,
} from './achievementShareCard';

interface UseAchievementShareCardOptions {
  accountName: string;
  showToast?: (message: string, tone?: AppToastTone) => void;
}

export function useAchievementShareCard({ accountName, showToast }: UseAchievementShareCardOptions) {
  return useCallback(
    (achievement: StatsAchievementDto) => {
      if (achievement.status === 'locked') {
        showToast?.('达成后可解锁分享卡 / Unlock the achievement to save its share card', 'info');
        return false;
      }

      try {
        const svg = buildAchievementShareCardSvg(achievement, accountName);
        downloadAchievementShareCard(svg, buildAchievementShareCardFilename(achievement));
        showToast?.('分享卡已保存到本地 / Share card saved locally', 'success');
        return true;
      } catch (error) {
        showToast?.(
          error instanceof Error ? error.message : '分享卡导出失败 / Failed to export share card',
          'error',
        );
        return false;
      }
    },
    [accountName, showToast],
  );
}
