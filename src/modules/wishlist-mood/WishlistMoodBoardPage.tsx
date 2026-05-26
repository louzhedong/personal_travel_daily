import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthAccount } from '../../types';
import {
  buildWishlistMoodCardImageUrl,
  createWishlistMoodCard,
  deleteWishlistMoodCard,
  fetchWishlistMoodBoard,
  updateWishlistMoodCard,
} from '../../lib/api/wishlistMoodApi';
import { fetchWishlistItems } from '../../lib/api/wishlistApi';
import type {
  CreateWishlistMoodCardBodyDto,
  WishlistMoodBoardDto,
  WishlistMoodCardDto,
  WishlistMoodCardKindDto,
} from '../../lib/api/dto/wishlistMood';
import type { WishlistItem } from '../../types';
import FancySelect from '../../components/ui/FancySelect';

/**
 * G1 · WishlistMoodBoardPage / 愿望灵感板页面
 * Visual cards (image / quote / note / season / budget) per wishlist item.
 */
interface Props {
  account: AuthAccount;
  onLogout: () => Promise<void> | void;
  onNavigateBack: () => void;
}

const KIND_OPTIONS: { value: WishlistMoodCardKindDto; label: string }[] = [
  { value: 'note', label: '便签 / Note' },
  { value: 'quote', label: '语录 / Quote' },
  { value: 'image', label: '图片 / Image' },
  { value: 'season', label: '季节窗口 / Season' },
  { value: 'budget', label: '预算 / Budget' },
];

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

export default function WishlistMoodBoardPage({ account, onLogout, onNavigateBack }: Props) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<string>('');
  const [board, setBoard] = useState<WishlistMoodBoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftKind, setDraftKind] = useState<WishlistMoodCardKindDto>('note');
  const [draftText, setDraftText] = useState('');
  const [draftSeason, setDraftSeason] = useState('');
  const [draftBudget, setDraftBudget] = useState('');
  const [draftCurrency, setDraftCurrency] = useState('CNY');
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchWishlistItems()
      .then((response) => {
        const list = response.items.filter((entry) => entry.companionId === account.id);
        setItems(list);
        if (list.length > 0) setActiveWishlistId(list[0].id);
      })
      .catch(() => setError('愿望列表加载失败'));
  }, [account.id]);

  const loadBoard = useCallback(async (wishlistId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlistMoodBoard(wishlistId);
      setBoard(data);
    } catch {
      setError('灵感板加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeWishlistId) void loadBoard(activeWishlistId);
  }, [activeWishlistId, loadBoard]);

  const wishlistOptions = useMemo(
    () => items.map((item) => ({ value: item.id, label: `${item.title} · ${item.city}` })),
    [items],
  );

  const handleAddCard = async () => {
    if (!activeWishlistId) return;
    setBusy(true);
    try {
      const body: CreateWishlistMoodCardBodyDto = { kind: draftKind };
      if (draftKind === 'note') body.noteText = draftText.trim();
      if (draftKind === 'quote') body.quoteText = draftText.trim();
      if (draftKind === 'season') body.seasonWindow = draftSeason.trim();
      if (draftKind === 'budget') {
        const amount = Number(draftBudget);
        if (Number.isFinite(amount)) body.budgetCents = Math.round(amount * 100);
        body.currency = draftCurrency.trim() || 'CNY';
      }
      if (draftKind === 'image' && draftFile) {
        body.imageDataUrl = await readFileAsDataUrl(draftFile);
      }
      await createWishlistMoodCard(activeWishlistId, body);
      setDraftText('');
      setDraftSeason('');
      setDraftBudget('');
      setDraftFile(null);
      await loadBoard(activeWishlistId);
    } catch {
      setError('新增灵感卡失败');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (card: WishlistMoodCardDto) => {
    setBusy(true);
    try {
      await deleteWishlistMoodCard(card.id);
      await loadBoard(activeWishlistId);
    } finally {
      setBusy(false);
    }
  };

  const handleColorTag = async (card: WishlistMoodCardDto, color: string) => {
    setBusy(true);
    try {
      await updateWishlistMoodCard(card.id, { colorTag: color });
      await loadBoard(activeWishlistId);
    } finally {
      setBusy(false);
    }
  };

  const renderCardBody = (card: WishlistMoodCardDto) => {
    if (card.kind === 'image') {
      return <img src={buildWishlistMoodCardImageUrl(card.id)} alt="灵感图" style={{ maxWidth: '100%', borderRadius: 8 }} />;
    }
    if (card.kind === 'quote') return <blockquote>"{card.quoteText}"</blockquote>;
    if (card.kind === 'note') return <p>{card.noteText}</p>;
    if (card.kind === 'season') return <p>季节窗口：{card.seasonWindow}</p>;
    if (card.kind === 'budget') {
      const yuan = card.budgetCents != null ? (card.budgetCents / 100).toFixed(2) : '—';
      return <p>预算：{card.currency ?? 'CNY'} {yuan}</p>;
    }
    return null;
  };

  return (
    <main className="wishlist-mood-shell">
      <div className="journey-topbar">
        <button className="ghost-button" onClick={onNavigateBack}>返回</button>
        <button className="ghost-button" onClick={() => void onLogout()}>退出登录</button>
      </div>
      <section className="card panel-card">
        <span className="hero-kicker">Wishlist Mood Board · @{account.username}</span>
        <h1>愿望灵感板</h1>
        <p>把图片、语录、便签、季节窗口、预算贴在一起，让一个愿望长出味道。</p>
        <div style={{ marginTop: 16 }}>
          <FancySelect
            value={activeWishlistId}
            onChange={setActiveWishlistId}
            options={wishlistOptions}
            placeholder="选择一个愿望"
            ariaLabel="选择愿望"
            triggerClassName="wishlist-select"
          />
        </div>
      </section>

      {error ? <section className="card panel-card"><p>{error}</p></section> : null}

      <section className="card panel-card">
        <h3>新增灵感卡</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <FancySelect
            value={draftKind}
            onChange={(v) => setDraftKind(v as WishlistMoodCardKindDto)}
            options={KIND_OPTIONS}
            placeholder="卡片类型"
            ariaLabel="卡片类型"
            triggerClassName="wishlist-select"
          />
          {(draftKind === 'note' || draftKind === 'quote') ? (
            <textarea
              className="field-control"
              rows={3}
              placeholder={draftKind === 'note' ? '便签内容' : '一句话语录'}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
            />
          ) : null}
          {draftKind === 'season' ? (
            <input
              className="field-control"
              placeholder="例如：2026 春末"
              value={draftSeason}
              onChange={(e) => setDraftSeason(e.target.value)}
            />
          ) : null}
          {draftKind === 'budget' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
              <input
                className="field-control"
                placeholder="预算金额"
                inputMode="decimal"
                value={draftBudget}
                onChange={(e) => setDraftBudget(e.target.value)}
              />
              <input
                className="field-control"
                placeholder="币种"
                value={draftCurrency}
                onChange={(e) => setDraftCurrency(e.target.value)}
              />
            </div>
          ) : null}
          {draftKind === 'image' ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setDraftFile(e.target.files?.[0] ?? null)}
            />
          ) : null}
          <button className="primary-button" disabled={busy || !activeWishlistId} onClick={() => void handleAddCard()}>
            添加灵感卡
          </button>
        </div>
      </section>

      <section className="card panel-card" aria-busy={loading}>
        <h3>{board?.wishlistTitle ?? '灵感板'}</h3>
        {loading ? <p>加载中…</p> : null}
        {!loading && (board?.cards.length ?? 0) === 0 ? <p>还没有灵感卡，加几张试试。</p> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
          {(board?.cards ?? []).map((card) => (
            <article
              key={card.id}
              className="panel-card"
              style={{ padding: 16, borderRadius: 12, background: card.colorTag ?? undefined }}
            >
              <small>{KIND_OPTIONS.find((o) => o.value === card.kind)?.label}</small>
              <div style={{ marginTop: 8 }}>{renderCardBody(card)}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['#fffbe9', '#fde2e4', '#dbeafe', '#dcfce7'].map((c) => (
                  <button key={c} className="ghost-button" style={{ background: c, padding: '2px 8px' }} onClick={() => void handleColorTag(card, c)}>
                    色
                  </button>
                ))}
                <button className="ghost-button" disabled={busy} onClick={() => void handleDelete(card)}>移除</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
