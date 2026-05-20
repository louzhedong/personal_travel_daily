import { useEffect, useMemo, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { HomeDashboardCardDto, HomeDashboardCardIdDto, HomeDashboardResponseDto } from '../../lib/api/types';
import { fetchHomeDashboard, updateHomeDashboardPreference } from '../../lib/api/homeDashboardApi';
import { getDashboardToneLabel } from './travelOsDashboardModel';

interface TravelOsDashboardProps {
  onNavigateToPath: (path: string) => void;
  onOpenAssistant: () => void;
  onOpenJourney: () => void;
  onOpenGuideSubscriptions: () => void;
}

export default function TravelOsDashboard({ onNavigateToPath, onOpenAssistant, onOpenJourney, onOpenGuideSubscriptions }: TravelOsDashboardProps) {
  const [dashboard, setDashboard] = useState<HomeDashboardResponseDto | null>(null);
  const [hiddenCardIds, setHiddenCardIds] = useState<HomeDashboardCardIdDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState('正在同步 Travel OS 总览。');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let cancelled = false;
    fetchHomeDashboard()
      .then((response) => {
        if (!cancelled) {
          setDashboard(response);
          setHiddenCardIds(response.preference.hiddenCardIds);
          setStatusText(`已同步 ${response.cards.length} 张卡片 · ${new Date(response.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboard(null);
          setStatusText('暂时无法连接总览服务，已保留地图与时间线主功能。');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCards = dashboard?.cards ?? [];
  const visibleCards = useMemo(() => allCards.filter((card) => !hiddenCardIds.includes(card.id)), [allCards, hiddenCardIds]);
  const hiddenCards = useMemo(() => allCards.filter((card) => hiddenCardIds.includes(card.id)), [allCards, hiddenCardIds]);

  const persistPreference = async (layout: HomeDashboardCardIdDto[], nextHiddenCardIds: HomeDashboardCardIdDto[]) => {
    setSaving(true);
    setStatusText('正在保存你的首页编排。');
    try {
      const response = await updateHomeDashboardPreference({ layout, hiddenCardIds: nextHiddenCardIds });
      setDashboard(response);
      setHiddenCardIds(response.preference.hiddenCardIds);
      setStatusText('首页编排已保存。');
    } catch {
      setStatusText('保存失败，请稍后再试。');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!dashboard || !over || active.id === over.id) return;
    const oldIndex = visibleCards.findIndex((card) => card.id === active.id);
    const newIndex = visibleCards.findIndex((card) => card.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reorderedVisibleIds = arrayMove(visibleCards, oldIndex, newIndex).map((card) => card.id);
    const hiddenIds = dashboard.preference.layout.filter((id) => hiddenCardIds.includes(id));
    void persistPreference([...reorderedVisibleIds, ...hiddenIds], hiddenCardIds);
  };

  const handleHideCard = (id: HomeDashboardCardIdDto) => {
    if (!dashboard) return;
    const nextHiddenCardIds = [...new Set([...hiddenCardIds, id])];
    setHiddenCardIds(nextHiddenCardIds);
    void persistPreference(dashboard.preference.layout, nextHiddenCardIds);
  };

  const handleRestoreCard = (id: HomeDashboardCardIdDto) => {
    if (!dashboard) return;
    const nextHiddenCardIds = hiddenCardIds.filter((cardId) => cardId !== id);
    setHiddenCardIds(nextHiddenCardIds);
    void persistPreference(dashboard.preference.layout, nextHiddenCardIds);
  };

  return (
    <section className="travel-os-dashboard" aria-label="Travel OS 总览">
      <div className="travel-os-dashboard-heading">
        <span className="hero-kicker">Travel OS · Product Console</span>
        <h2>今日旅行总览</h2>
        <p>把提醒、整理、计划、回看与表达收束到一个轻量入口。</p>
        <small className="travel-os-sync-state" aria-live="polite">{saving ? '保存中 · ' : ''}{statusText}</small>
        <div className="travel-os-dashboard-actions">
          <button type="button" className="ghost-button" onClick={onOpenAssistant}>AI 助手</button>
          <button type="button" className="ghost-button" onClick={onOpenGuideSubscriptions}>攻略订阅</button>
          <button type="button" className="ghost-button" onClick={onOpenJourney}>故事时间轴</button>
        </div>
      </div>

      <div className="travel-os-suggestions">
        {(dashboard?.suggestions ?? []).slice(0, 5).map((item) => (
          <button key={item.id} type="button" className={`travel-os-suggestion is-${item.tone}`} onClick={() => onNavigateToPath(item.path)}>
            <span>{getDashboardToneLabel(item.tone)}</span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </button>
        ))}
        {!dashboard ? <p className="travel-os-empty">总览正在准备中，仍可继续使用地图与时间线。</p> : null}
        {dashboard && dashboard.suggestions.length === 0 ? <p className="travel-os-empty">今天没有强提醒，适合继续整理照片或写一段旅途札记。</p> : null}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleCards.map((card) => card.id)} strategy={rectSortingStrategy}>
          <div className="travel-os-card-grid" aria-label="可拖拽总览卡片">
            {visibleCards.map((card) => (
              <SortableTravelOsCard key={card.id} card={card} onNavigateToPath={onNavigateToPath} onHideCard={handleHideCard} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hiddenCards.length ? (
        <div className="travel-os-hidden-tray" aria-label="隐藏的总览卡片">
          <span>隐藏卡片</span>
          {hiddenCards.map((card) => (
            <button key={card.id} type="button" className="ghost-button" onClick={() => handleRestoreCard(card.id)}>
              恢复 {card.eyebrow}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface SortableTravelOsCardProps {
  card: HomeDashboardCardDto;
  onNavigateToPath: (path: string) => void;
  onHideCard: (id: HomeDashboardCardIdDto) => void;
}

function SortableTravelOsCard({ card, onNavigateToPath, onHideCard }: SortableTravelOsCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article ref={setNodeRef} style={style} className={`travel-os-card${isDragging ? ' is-dragging' : ''}`}>
      <button type="button" className="travel-os-card-handle" aria-label={`拖动 ${card.title}`} {...attributes} {...listeners}>
        Drag
      </button>
      <span>{card.eyebrow}</span>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <div>
        <small>{card.metricLabel}</small>
        <strong>{card.metricValue}</strong>
      </div>
      <footer className="travel-os-card-footer">
        {card.path ? <button type="button" className="text-button" onClick={() => onNavigateToPath(card.path!)}>打开</button> : null}
        <button type="button" className="text-button" onClick={() => onHideCard(card.id)}>隐藏</button>
      </footer>
    </article>
  );
}
