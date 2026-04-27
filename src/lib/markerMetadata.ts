import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TAGS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
} from '../../shared/markerMetadata';

export {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TAGS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
};

/**
 * Label dictionaries shared by form, detail panel, timeline, and stats UI.
 * 表单、详情、时间线和统计页共用的元数据文案映射。
 */
export const MARKER_TAG_LABELS: Record<MarkerTag, { zh: string; en: string }> = {
  food: { zh: '美食', en: 'Food' },
  hiking: { zh: '徒步', en: 'Hiking' },
  beach: { zh: '海边', en: 'Beach' },
  museum: { zh: '博物馆', en: 'Museum' },
  photography: { zh: '摄影', en: 'Photography' },
  family: { zh: '亲子', en: 'Family' },
  weekend: { zh: '周末', en: 'Weekend' },
  business: { zh: '出差', en: 'Business' },
  nature: { zh: '自然风景', en: 'Nature' },
  citywalk: { zh: '城市漫游', en: 'Citywalk' },
};

export const MARKER_MOOD_LABELS: Record<MarkerMood, { zh: string; en: string }> = {
  relaxed: { zh: '放松', en: 'Relaxed' },
  excited: { zh: '兴奋', en: 'Excited' },
  tired: { zh: '疲惫', en: 'Tired' },
  surprised: { zh: '惊喜', en: 'Surprised' },
  peaceful: { zh: '平静', en: 'Peaceful' },
};

export const MARKER_WEATHER_LABELS: Record<MarkerWeather, { zh: string; en: string }> = {
  sunny: { zh: '晴', en: 'Sunny' },
  cloudy: { zh: '多云', en: 'Cloudy' },
  rainy: { zh: '雨', en: 'Rainy' },
  snowy: { zh: '雪', en: 'Snowy' },
  windy: { zh: '大风', en: 'Windy' },
};

export const MARKER_TRANSPORT_LABELS: Record<MarkerTransport, { zh: string; en: string }> = {
  walk: { zh: '步行', en: 'Walk' },
  car: { zh: '自驾', en: 'Car' },
  train: { zh: '火车', en: 'Train' },
  plane: { zh: '飞机', en: 'Plane' },
  metro: { zh: '地铁', en: 'Metro' },
  bus: { zh: '公交/大巴', en: 'Bus' },
};

export const MARKER_BUDGET_LEVEL_LABELS: Record<MarkerBudgetLevel, { zh: string; en: string }> = {
  low: { zh: '低预算', en: 'Low' },
  medium: { zh: '中预算', en: 'Medium' },
  high: { zh: '高预算', en: 'High' },
};

export const MARKER_TAG_OPTIONS = MARKER_TAGS.map((value) => ({
  value,
  label: MARKER_TAG_LABELS[value].zh,
}));

export const MARKER_MOOD_OPTIONS = MARKER_MOODS.map((value) => ({
  value,
  label: MARKER_MOOD_LABELS[value].zh,
}));

export const MARKER_WEATHER_OPTIONS = MARKER_WEATHERS.map((value) => ({
  value,
  label: MARKER_WEATHER_LABELS[value].zh,
}));

export const MARKER_TRANSPORT_OPTIONS = MARKER_TRANSPORTS.map((value) => ({
  value,
  label: MARKER_TRANSPORT_LABELS[value].zh,
}));

export const MARKER_BUDGET_LEVEL_OPTIONS = MARKER_BUDGET_LEVELS.map((value) => ({
  value,
  label: MARKER_BUDGET_LEVEL_LABELS[value].zh,
}));
