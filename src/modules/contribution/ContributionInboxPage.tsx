import { useCallback, useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import {
  acceptContributionInboxItem,
  buildContributionInboxImageUrl,
  createContributionDropBox,
  listContributionDropBoxes,
  listContributionInbox,
  rejectContributionInboxItem,
  revokeContributionDropBox,
} from '../../lib/api/contributionApi';
import type {
  AcceptContributionInboxBodyDto,
  ContributionAcceptKindDto,
  ContributionAcceptedAsTypeDto,
  ContributionDropBoxDto,
  ContributionDropBoxWithTokenDto,
  ContributionInboxItemDto,
  CreateContributionDropBoxBodyDto,
} from '../../lib/api/dto/contribution';
import FancySelect from '../../components/ui/FancySelect';

/**
 * G4 · ContributionInboxPage / 旅伴匿名贡献收件箱
 * Manage drop-box links + review submitted photos / notes.
 */
interface Props {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

const ACCEPT_KIND_OPTIONS: { value: ContributionAcceptKindDto; label: string }[] = [
  { value: 'both', label: '照片 + 文字' },
  { value: 'photo', label: '仅照片' },
  { value: 'note', label: '仅文字' },
];

const ACCEPT_AS_OPTIONS: { value: ContributionAcceptedAsTypeDto; label: string }[] = [
  { value: 'photo', label: '收为照片' },
  { value: 'marker', label: '收为足迹' },
  { value: 'journal', label: '收为日记' },
];

export default function ContributionInboxPage({ account, onLogout, onNavigateBack }: Props) {
  const [boxes, setBoxes] = useState<ContributionDropBoxDto[]>([]);
  const [inbox, setInbox] = useState<ContributionInboxItemDto[]>([]);
  const [tokenReveal, setTokenReveal] = useState<ContributionDropBoxWithTokenDto | null>(null);
  const [draft, setDraft] = useState<CreateContributionDropBoxBodyDto>({ title: '', acceptKind: 'both', expiresInDays: 14 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [b, i] = await Promise.all([listContributionDropBoxes(), listContributionInbox()]);
      setBoxes(b.dropBoxes);
      setInbox(i.items);
      setError(null);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async () => {
    if (!draft.title.trim()) return;
    setBusy(true);
    try {
      const created = await createContributionDropBox(draft);
      setTokenReveal(created);
      setDraft({ title: '', acceptKind: 'both', expiresInDays: 14 });
      await reload();
    } catch {
      setError('创建链接失败');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusy(true);
    try {
      await revokeContributionDropBox(id);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (item: ContributionInboxItemDto, asType: ContributionAcceptedAsTypeDto) => {
    setBusy(true);
    try {
      const body: AcceptContributionInboxBodyDto = { acceptedAsType: asType };
      await acceptContributionInboxItem(item.id, body);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (item: ContributionInboxItemDto) => {
    setBusy(true);
    try {
      await rejectContributionInboxItem(item.id);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="contribution-inbox-shell">
      <div className="journey-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>

      <section className="card panel-card">
        <span className="hero-kicker">Companion Drop-Box · @{account.username}</span>
        <h1>旅伴投稿链接</h1>
        <p>给旅伴一个一次性链接，他们只能写、不能看你的旅程。无须账号，token 单向 hash。</p>
      </section>

      {error ? <section className="card panel-card"><p>{error}</p></section> : null}

      <section className="card panel-card">
        <h3>创建新链接</h3>
        <div className="batch2-stack-tight">
          <input
            className="field-control"
            placeholder="标题，如：东京三日游 · 旅伴投稿"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <FancySelect
            value={draft.acceptKind ?? 'both'}
            onChange={(v) => setDraft({ ...draft, acceptKind: v as ContributionAcceptKindDto })}
            options={ACCEPT_KIND_OPTIONS}
            placeholder="接收类型"
            ariaLabel="接收类型"
            triggerClassName="wishlist-select"
          />
          <div className="batch2-grid-2">
            <input
              className="field-control"
              placeholder="有效期（天）"
              inputMode="numeric"
              value={String(draft.expiresInDays ?? '')}
              onChange={(e) => setDraft({ ...draft, expiresInDays: Number(e.target.value) || undefined })}
            />
            <input
              className="field-control"
              placeholder="最多投稿数"
              inputMode="numeric"
              value={String(draft.maxUploads ?? '')}
              onChange={(e) => setDraft({ ...draft, maxUploads: Number(e.target.value) || undefined })}
            />
          </div>
          <textarea
            className="field-control"
            placeholder="给旅伴的便签（可选）"
            rows={2}
            value={draft.note ?? ''}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
          <button className="primary-button" disabled={busy} onClick={() => void handleCreate()}>生成链接</button>
        </div>
        {tokenReveal ? (
          <div className="panel-card batch2-token-reveal">
            <small>仅本次显示完整 token，关闭后无法再次查看</small>
            <p>
              <strong>链接：</strong>{tokenReveal.publicUrl}
            </p>
            <p>
              <strong>token：</strong>{tokenReveal.token}
            </p>
            <button className="ghost-button" onClick={() => setTokenReveal(null)}>我已保存</button>
          </div>
        ) : null}
      </section>

      <section className="card panel-card">
        <h3>已发出的链接</h3>
        {boxes.length === 0 ? <p>还没有创建任何投稿链接。</p> : null}
        <ul className="batch2-empty-list">
          {boxes.map((box) => (
            <li key={box.id} className="panel-card batch2-mini-panel">
              <strong>{box.title}</strong>
              <div><small>{box.publicUrl}</small></div>
              <small>
                {box.tripName ? `行程：${box.tripName} · ` : ''}
                token: {box.tokenPreview} · 已用 {box.usedCount}/{box.maxUploads} ·
                {box.revokedAt ? ' 已撤销' : ` 待审核 ${box.pendingInboxCount} 条`}
              </small>
              {!box.revokedAt ? (
                <div className="batch2-row">
                  <button className="ghost-button" disabled={busy} onClick={() => void handleRevoke(box.id)}>撤销链接</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card panel-card" aria-busy={loading}>
        <h3>待审核投稿 · {inbox.filter((i) => i.status === 'pending').length}</h3>
        {loading ? <p>加载中…</p> : null}
        <ul className="batch2-empty-list">
          {inbox.map((item) => (
            <li key={item.id} className="panel-card batch2-mini-panel">
              <small>
                {new Date(item.submittedAt).toLocaleString()} · {item.kind === 'photo' ? '照片' : '文字'} ·
                {item.submitterDisplayName ? ` ${item.submitterDisplayName}` : ' 匿名'} · {item.dropBoxTitle}
              </small>
              {item.kind === 'photo' && item.imageUrl ? (
                <div><img src={buildContributionInboxImageUrl(item.id)} alt="投稿" className="batch2-contrib-photo-preview" /></div>
              ) : null}
              {item.noteText ? <p>{item.noteText}</p> : null}
              {item.eventDate ? <small>事件日期：{item.eventDate}</small> : null}
              <div className="batch2-row">
                {item.status === 'pending' ? (
                  <>
                    {ACCEPT_AS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className="ghost-button"
                        disabled={busy}
                        onClick={() => void handleAccept(item, opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button className="ghost-button" disabled={busy} onClick={() => void handleReject(item)}>退回</button>
                  </>
                ) : (
                  <small>状态：{item.status}{item.acceptedAsType ? ` · ${item.acceptedAsType}` : ''}</small>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
