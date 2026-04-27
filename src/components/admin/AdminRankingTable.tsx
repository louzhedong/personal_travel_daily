import TravelIcon from '../ui/TravelIcon';
import type { AdminDetailCollections, AdminDetailTab } from '../../modules/admin/adminPageModel';
import {
  formatAdminDate,
  formatAdminDateOnly,
  formatAdminScope,
} from '../../modules/admin/adminPageModel';

interface AdminRankingTableProps {
  activeTab: AdminDetailTab;
  detailCollections: AdminDetailCollections;
}

export default function AdminRankingTable({ activeTab, detailCollections }: AdminRankingTableProps) {
  if (activeTab === 'trips') {
    return (
      <section className="admin-data-card">
        <div className="admin-section-title">
          <span className="travel-icon-badge travel-icon-badge-blue">
            <TravelIcon name="route" size={14} />
          </span>
          <h3>行程</h3>
        </div>
        {detailCollections.trips.length === 0 ? (
          <div className="admin-empty-block">暂无行程。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>行程</th>
                  <th>时间</th>
                  <th>记录</th>
                  <th>备注</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {detailCollections.trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <strong>{trip.name}</strong>
                    </td>
                    <td>
                      {formatAdminDateOnly(trip.startsAt)} 至 {formatAdminDateOnly(trip.endsAt)}
                    </td>
                    <td>{trip.markerCount}</td>
                    <td className="admin-note-cell">{trip.note || '暂无备注'}</td>
                    <td>{formatAdminDate(trip.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'markers') {
    return (
      <section className="admin-data-card">
        <div className="admin-section-title">
          <span className="travel-icon-badge travel-icon-badge-orange">
            <TravelIcon name="route" size={14} />
          </span>
          <h3>旅行记录</h3>
        </div>
        {detailCollections.markers.length === 0 ? (
          <div className="admin-empty-block">暂无旅行记录。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>同行人</th>
                  <th>行程</th>
                  <th>目的地</th>
                  <th>时间</th>
                  <th>范围</th>
                  <th>图片</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {detailCollections.markers.map((marker) => (
                  <tr key={marker.id}>
                    <td>{marker.companionName}</td>
                    <td>{marker.tripName}</td>
                    <td>
                      <strong>{marker.scopeName}</strong>
                      <div>{marker.city}</div>
                    </td>
                    <td>
                      {formatAdminDateOnly(marker.visitedStartAt)} 至 {formatAdminDateOnly(marker.visitedEndAt)}
                    </td>
                    <td>{marker.scope === 'domestic' ? '国内' : '国际'}</td>
                    <td>{marker.imageUrls?.length ?? 0}</td>
                    <td className="admin-note-cell">{marker.note || '暂无备注'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'savedGuides') {
    return (
      <section className="admin-data-card">
        <div className="admin-section-title">
          <span className="travel-icon-badge travel-icon-badge-blue">
            <TravelIcon name="globe" size={14} />
          </span>
          <h3>收藏攻略</h3>
        </div>
        {detailCollections.savedGuides.length === 0 ? (
          <div className="admin-empty-block">暂无收藏攻略。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>同行人</th>
                  <th>标题</th>
                  <th>关键词</th>
                  <th>来源</th>
                  <th>收藏时间</th>
                </tr>
              </thead>
              <tbody>
                {detailCollections.savedGuides.map((guide) => (
                  <tr key={guide.id}>
                    <td>{guide.companionName}</td>
                    <td className="admin-note-cell">{guide.result.title}</td>
                    <td>{guide.keyword}</td>
                    <td>{guide.result.sourceName}</td>
                    <td>{formatAdminDate(guide.savedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'guideSearchHistory') {
    return (
      <section className="admin-data-card">
        <div className="admin-section-title">
          <span className="travel-icon-badge travel-icon-badge-teal">
            <TravelIcon name="spark" size={14} />
          </span>
          <h3>攻略搜索</h3>
        </div>
        {detailCollections.guideSearchHistory.length === 0 ? (
          <div className="admin-empty-block">暂无攻略搜索历史。</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>同行人</th>
                  <th>关键词</th>
                  <th>范围</th>
                  <th>搜索时间</th>
                </tr>
              </thead>
              <tbody>
                {detailCollections.guideSearchHistory.map((history) => (
                  <tr key={history.id}>
                    <td>{history.companionName}</td>
                    <td>{history.keyword}</td>
                    <td>{formatAdminScope(history.scope)}</td>
                    <td>{formatAdminDate(history.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  // Fall through to the last tab to keep render branching explicit.
  // 显式兜底到最后一个标签页，便于拆分后继续保持原始分支语义。
  return (
    <section className="admin-data-card">
      <div className="admin-section-title">
        <span className="travel-icon-badge travel-icon-badge-blue">
          <TravelIcon name="spark" size={14} />
        </span>
        <h3>记录搜索</h3>
      </div>
      {detailCollections.markerSearchEvents.length === 0 ? (
        <div className="admin-empty-block">暂无记录搜索行为。</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>旅伴筛选</th>
                <th>关键词</th>
                <th>范围</th>
                <th>年份</th>
                <th>结果数</th>
                <th>分页</th>
                <th>搜索时间</th>
              </tr>
            </thead>
            <tbody>
              {detailCollections.markerSearchEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.companionName}</td>
                  <td>{event.keyword || '空关键词'}</td>
                  <td>{formatAdminScope(event.scope)}</td>
                  <td>{event.year ?? '全部年份'}</td>
                  <td>{event.resultCount}</td>
                  <td>
                    第 {event.page} 页 / 每页 {event.pageSize}
                  </td>
                  <td>{formatAdminDate(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
