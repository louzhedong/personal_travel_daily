import type { AdminAccountNodeDto } from '../../lib/api/types';
import type { AdminDetailTab, AdminTabItem } from '../../modules/admin/adminPageModel';

interface AdminFiltersSidebarProps {
  variant: 'sidebar';
  accounts: AdminAccountNodeDto[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
}

interface AdminFiltersTabsProps {
  variant: 'tabs';
  activeTab: AdminDetailTab;
  tabItems: AdminTabItem[];
  onTabChange: (tab: AdminDetailTab) => void;
}

type AdminFiltersBarProps = AdminFiltersSidebarProps | AdminFiltersTabsProps;

export default function AdminFiltersBar(props: AdminFiltersBarProps) {
  if (props.variant === 'sidebar') {
    const { accounts, selectedAccountId, onSelectAccount } = props;

    return (
      <aside className="card admin-sidebar">
        <div className="admin-sidebar-header">
          <div>
            <h2>用户列表</h2>
            <p>选择一个账号，在右侧查看完整明细。</p>
          </div>
          <span className="admin-sidebar-count">{accounts.length}</span>
        </div>

        {accounts.length === 0 ? (
          <div className="admin-empty-block">当前还没有系统用户。</div>
        ) : (
          <div className="admin-user-list">
            {accounts.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === selectedAccountId ? 'admin-user-row is-active' : 'admin-user-row'}
                onClick={() => onSelectAccount(item.id)}
              >
                <div className="admin-user-row-main">
                  <div className="admin-user-row-top">
                    <strong>{item.name}</strong>
                    <span className={`admin-role-badge admin-role-badge-${item.role}`}>
                      {item.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </div>
                  <p>@{item.username}</p>
                </div>
                <div className="admin-user-row-meta">
                  <span>同行 {item.stats.companionCount}</span>
                  <span>行程 {item.stats.tripCount}</span>
                  <span>记录 {item.stats.markerCount}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>
    );
  }

  const { activeTab, tabItems, onTabChange } = props;

  // Tabs stay in a dedicated branch so accessibility attributes remain identical.
  // 标签页单独分支渲染，确保可访问性属性与原实现完全一致。
  return (
    <div className="admin-tab-row" role="tablist" aria-label="后台详情切换">
      {tabItems.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={activeTab === item.key}
          className={activeTab === item.key ? 'admin-tab-button is-active' : 'admin-tab-button'}
          onClick={() => onTabChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
