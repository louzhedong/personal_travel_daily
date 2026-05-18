export interface GuideQualityInput {
  keyword: string;
  resultCount: number;
  status: 'success' | 'empty' | 'error';
  durationMs: number;
  sourceSuccessCount: number;
  sourceFailureCount: number;
  priorityWeight?: number;
}

export interface GuideQualityScore {
  score: number;
  level: 'high' | 'medium' | 'low';
  relevanceScore: number;
  completenessScore: number;
  readabilityScore: number;
  sourceStabilityScore: number;
  saveRateScore: number;
  priorityWeight: number;
  reasons: string[];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getLevel(score: number): GuideQualityScore['level'] {
  if (score >= 78) return 'high';
  if (score >= 52) return 'medium';
  return 'low';
}

export function buildGuideSourcePrioritySuggestion(input: {
  recentSuccess: number;
  recentFailure: number;
  priorityWeight?: number;
}) {
  const total = input.recentSuccess + input.recentFailure;
  const failureRate = total > 0 ? input.recentFailure / total : 0;
  const priorityWeight = input.priorityWeight ?? 0;

  if (input.recentSuccess >= 8 && failureRate <= 0.15 && priorityWeight < 2) {
    return {
      action: 'boost' as const,
      label: '建议升权',
      reason: '近期成功稳定，可提升排序权重。',
    };
  }

  if (input.recentFailure >= 3 && failureRate >= 0.45 && priorityWeight > -3) {
    return {
      action: 'demote' as const,
      label: '建议降权',
      reason: '近期失败率偏高，建议降低来源优先级。',
    };
  }

  return {
    action: 'keep' as const,
    label: '保持观察',
    reason: '来源表现处于可接受区间。',
  };
}

export function calculateGuideQualityScore(input: GuideQualityInput): GuideQualityScore {
  const priorityWeight = input.priorityWeight ?? 0;
  const totalSourceEvents = input.sourceSuccessCount + input.sourceFailureCount;
  const successRate = totalSourceEvents > 0 ? input.sourceSuccessCount / totalSourceEvents : 0.72;
  const keywordLength = input.keyword.trim().replace(/\s+/g, '').length;

  const relevanceScore = clampScore(input.status === 'error' ? 12 : Math.min(100, 42 + keywordLength * 6 + input.resultCount * 5));
  const completenessScore = clampScore(input.status === 'success' ? 58 + Math.min(input.resultCount, 8) * 5 : input.status === 'empty' ? 34 : 12);
  const readabilityScore = clampScore(input.durationMs <= 1200 ? 82 : input.durationMs <= 3200 ? 68 : 48);
  const sourceStabilityScore = clampScore(32 + successRate * 68);
  const saveRateScore = clampScore(input.resultCount > 0 ? 48 + Math.min(input.resultCount, 6) * 4 : 24);
  const priorityAdjustment = Math.max(-12, Math.min(12, priorityWeight * 4));
  const score = clampScore(
    relevanceScore * 0.28 +
      completenessScore * 0.24 +
      readabilityScore * 0.12 +
      sourceStabilityScore * 0.28 +
      saveRateScore * 0.08 +
      priorityAdjustment,
  );

  const reasons = [
    score >= 78 ? '高相关' : score >= 52 ? '相关性中等' : '相关性偏弱',
    completenessScore >= 72 ? '内容完整' : '内容完整度待观察',
    sourceStabilityScore >= 76 ? '来源稳定' : '来源波动',
    priorityWeight > 0 ? '后台升权来源' : priorityWeight < 0 ? '后台降权来源' : undefined,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    score,
    level: getLevel(score),
    relevanceScore,
    completenessScore,
    readabilityScore,
    sourceStabilityScore,
    saveRateScore,
    priorityWeight,
    reasons,
  };
}
