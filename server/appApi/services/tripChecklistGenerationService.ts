import type { TripChecklistStage } from '@prisma/client';
import type { GenerateTripChecklistBody, } from '../schemas/tripChecklist.js';
import { getGuideDocumentBySourceUrl } from './guideDocumentService.js';

export interface GeneratedChecklistDraftItem {
  title: string;
  note?: string;
  stage: TripChecklistStage;
  sourceSnippet?: string;
}

function truncateText(value: string, max = 120) {
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function normalizeChecklistTitle(text: string) {
  return truncateText(text)
    .replace(/[。；;！!]+$/g, '')
    .replace(/^建议|^记得|^可以|^如果/g, '')
    .trim();
}

function createDraft(title: string, stage: TripChecklistStage, sourceSnippet?: string): GeneratedChecklistDraftItem | null {
  const normalizedTitle = normalizeChecklistTitle(title);
  if (!normalizedTitle) {
    return null;
  }

  return {
    title: normalizedTitle,
    stage,
    sourceSnippet: sourceSnippet ? truncateText(sourceSnippet, 240) : undefined,
  };
}

function draftFromAiSummary(input: Awaited<ReturnType<typeof getGuideDocumentBySourceUrl>>) {
  if (!input?.aiSummary) {
    return [];
  }

  const drafts: Array<GeneratedChecklistDraftItem | null> = [
    ...input.aiSummary.warnings.map((item) => createDraft(`提前确认：${item}`, 'pre_departure', item)),
    ...input.aiSummary.transportTips.map((item) => createDraft(`准备交通方案：${item}`, 'pre_departure', item)),
    ...input.aiSummary.routeTips.map((item) => createDraft(`路线上留意：${item}`, 'in_transit', item)),
    ...input.aiSummary.highlights.map((item) => createDraft(`别错过：${item}`, 'in_transit', item)),
  ];

  return drafts.filter(Boolean) as GeneratedChecklistDraftItem[];
}

function inferStageFromText(text: string): TripChecklistStage {
  if (/(预约|预订|酒店|门票|准备|确认|行李|带上|防晒|墨镜|保温|薄羽绒|预约方式)/.test(text)) {
    return 'pre_departure';
  }

  if (/(步行|路线|同一天|避开|现场|排队|到市区|转弯|夜间驾驶|机动时间|开放日期)/.test(text)) {
    return 'in_transit';
  }

  return 'pre_departure';
}

function draftFromBlocks(input: Awaited<ReturnType<typeof getGuideDocumentBySourceUrl>>) {
  if (!input?.blocks?.length) {
    return [];
  }

  return input.blocks
    .filter((block) => block.text.trim().length > 0)
    .slice(0, 10)
    .map((block) => {
      const text = block.text.trim();
      if (block.type === 'tips') {
        return createDraft(text, inferStageFromText(text), text);
      }

      if (block.type === 'bullet-list') {
        return createDraft(`把这条路线排进计划：${text}`, 'in_transit', text);
      }

      if (/(建议|提前|适合|准备|务必|最好|优先|避免)/.test(text)) {
        return createDraft(text, inferStageFromText(text), text);
      }

      return null;
    })
    .filter(Boolean) as GeneratedChecklistDraftItem[];
}

function draftFromSearchSummary(summary: string) {
  const trimmed = summary.trim();
  if (!trimmed) {
    return [];
  }

  return [
    createDraft(`先把这篇攻略的核心路线排进计划：${trimmed}`, 'pre_departure', trimmed),
    createDraft(`旅途中重点留意攻略提到的节奏与交通安排`, 'in_transit', trimmed),
  ].filter(Boolean) as GeneratedChecklistDraftItem[];
}

function dedupeDrafts(items: GeneratedChecklistDraftItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeChecklistTitle(item.title).toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function buildGeneratedTripChecklistDrafts(input: GenerateTripChecklistBody) {
  const document = await getGuideDocumentBySourceUrl(input.guide.sourceUrl);
  const drafts = dedupeDrafts([
    ...draftFromAiSummary(document),
    ...draftFromBlocks(document),
    ...draftFromSearchSummary(input.guide.summary),
  ]).slice(0, 8);

  return drafts.slice(0, 8).length >= 3
    ? drafts.slice(0, 8)
    : dedupeDrafts([...drafts, ...draftFromSearchSummary(input.guide.summary)]).slice(0, 3);
}
