// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildGuideSourcePrioritySuggestion,
  calculateGuideQualityScore,
} from '../appApi/services/guideQualityService.js';

describe('guideQualityService', () => {
  it('scores successful stable sources as high quality', () => {
    const score = calculateGuideQualityScore({
      keyword: '京都 樱花 攻略',
      resultCount: 6,
      status: 'success',
      durationMs: 900,
      sourceSuccessCount: 12,
      sourceFailureCount: 1,
      priorityWeight: 1,
    });

    expect(score.level).toBe('high');
    expect(score.score).toBeGreaterThanOrEqual(78);
    expect(score.reasons).toContain('来源稳定');
    expect(score.reasons).toContain('后台升权来源');
  });

  it('penalizes error logs and degraded sources', () => {
    const score = calculateGuideQualityScore({
      keyword: 'x',
      resultCount: 0,
      status: 'error',
      durationMs: 5200,
      sourceSuccessCount: 1,
      sourceFailureCount: 5,
      priorityWeight: -2,
    });

    expect(score.level).toBe('low');
    expect(score.score).toBeLessThan(52);
    expect(score.reasons).toContain('来源波动');
    expect(score.reasons).toContain('后台降权来源');
  });

  it('suggests source priority actions from health metrics', () => {
    expect(buildGuideSourcePrioritySuggestion({ recentSuccess: 10, recentFailure: 1 }).action).toBe('boost');
    expect(buildGuideSourcePrioritySuggestion({ recentSuccess: 2, recentFailure: 5 }).action).toBe('demote');
    expect(buildGuideSourcePrioritySuggestion({ recentSuccess: 2, recentFailure: 1 }).action).toBe('keep');
  });
});
