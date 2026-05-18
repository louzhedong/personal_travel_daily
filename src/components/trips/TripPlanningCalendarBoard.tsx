import { useMemo, useState } from 'react';
import FancySelect from '../ui/FancySelect';
import type { TripPlanningSchedule, WishlistItem } from '../../types';
import {
  buildScheduleWishlistOptions,
  buildTripPlanningCalendarStats,
  collectScheduledWishlistIds,
} from '../../modules/trips/tripPlanningCalendarModel';

interface TripPlanningCalendarBoardProps {
  schedule: TripPlanningSchedule | null;
  wishlistItems: WishlistItem[];
  busy?: boolean;
  onScheduleItem: (itemId: string, plannedDate: string | null) => Promise<void> | void;
  onImportWishlistItems: (wishlistIds: string[], plannedDate: string) => Promise<void> | void;
}

export default function TripPlanningCalendarBoard({
  schedule,
  wishlistItems,
  busy = false,
  onScheduleItem,
  onImportWishlistItems,
}: TripPlanningCalendarBoardProps) {
  const stats = useMemo(() => buildTripPlanningCalendarStats(schedule), [schedule]);
  const [selectedWishlistId, setSelectedWishlistId] = useState('');
  const [selectedImportDate, setSelectedImportDate] = useState(schedule?.days[0]?.date ?? '');
  const importDate = selectedImportDate || schedule?.days[0]?.date || '';
  const wishlistOptions = useMemo(
    () => buildScheduleWishlistOptions(wishlistItems, collectScheduledWishlistIds(schedule)),
    [schedule, wishlistItems],
  );

  if (!schedule) {
    return <div className="trip-detail-empty">日程视图加载中。</div>;
  }

  return (
    <div className="trip-planning-calendar-board">
      <div className="trip-planning-calendar-summary" aria-label="行前规划日程摘要">
        <span>{stats.dayCount} 天行程</span>
        <span>{stats.scheduledCount} 项已排期</span>
        <span>{stats.unscheduledCount} 项未排期</span>
        <span>{stats.checklistHintCount} 条清单提示</span>
      </div>

      <section className="trip-planning-calendar-import" aria-label="按日期导入愿望地图">
        <div>
          <strong>愿望地图批量排期</strong>
          <p>选择愿望地点和日期，直接放入当天行程草稿。</p>
        </div>
        <div className="trip-planning-calendar-import-controls">
          <FancySelect
            value={selectedWishlistId}
            onChange={setSelectedWishlistId}
            options={wishlistOptions}
            placeholder={wishlistOptions.length > 0 ? '选择愿望地点' : '暂无可导入愿望'}
            ariaLabel="选择要排期的愿望地点"
            disabled={busy || wishlistOptions.length === 0}
            triggerClassName="trip-planning-select"
          />
          <FancySelect
            value={importDate}
            onChange={setSelectedImportDate}
            options={schedule.days.map((day) => ({ value: day.date, label: `${day.title} · ${day.date}` }))}
            placeholder="选择排期日期"
            ariaLabel="选择愿望排期日期"
            disabled={busy || schedule.days.length === 0}
            triggerClassName="trip-planning-select"
          />
          <button
            type="button"
            className="ghost-button"
            disabled={busy || !selectedWishlistId || !importDate}
            onClick={() => {
              const wishlistId = selectedWishlistId;
              void Promise.resolve(onImportWishlistItems([wishlistId], importDate)).then(() => setSelectedWishlistId(''));
            }}
          >
            导入到当天
          </button>
        </div>
      </section>

      <section className="trip-planning-unscheduled" aria-label="未排期池">
        <div className="trip-planning-calendar-section-head">
          <strong>未排期池</strong>
          <span>{schedule.unscheduledItems.length} 项</span>
        </div>
        {schedule.unscheduledItems.length === 0 ? (
          <div className="trip-detail-empty">所有规划项都已经安排到具体日期。</div>
        ) : (
          <div className="trip-planning-calendar-pool">
            {schedule.unscheduledItems.map((item) => (
              <article key={item.id} className="trip-planning-calendar-pill">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.scopeName} · {item.city}</span>
                </div>
                <FancySelect
                  value=""
                  onChange={(date) => void onScheduleItem(item.id, date)}
                  options={schedule.days.map((day) => ({ value: day.date, label: `${day.title} · ${day.date}` }))}
                  placeholder="安排到日期"
                  ariaLabel={`安排 ${item.title} 到日期`}
                  disabled={busy}
                  triggerClassName="trip-planning-select"
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="trip-planning-calendar-days">
        {schedule.days.map((day) => (
          <section key={day.date} className="trip-planning-calendar-day">
            <header>
              <div>
                <span>{day.title}</span>
                <strong>{day.date}</strong>
              </div>
              <em>{day.items.length} 项规划</em>
            </header>

            <div className="trip-planning-calendar-day-items">
              {day.items.length === 0 ? (
                <div className="trip-detail-empty">这一天还没有安排地点。</div>
              ) : (
                day.items.map((item) => (
                  <article key={item.id} className="trip-planning-calendar-item">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.note || `${item.scopeName} · ${item.city}`}</p>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={busy || item.status === 'converted'}
                      onClick={() => void onScheduleItem(item.id, null)}
                    >
                      移回未排期
                    </button>
                  </article>
                ))
              )}
            </div>

            {day.checklistGroups.length > 0 ? (
              <aside className="trip-planning-calendar-checklist">
                <strong>当天辅助清单</strong>
                {day.checklistGroups.map((group) => (
                  <span key={group.stage}>{group.title} · {group.itemCount} 项</span>
                ))}
              </aside>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
