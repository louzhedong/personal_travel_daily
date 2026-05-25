import { useCallback, useEffect, useState } from 'react';
import {
  fetchContributionPublicMeta,
  submitContributionPublic,
} from '../../lib/api/contributionApi';
import type {
  ContributionInboxKindDto,
  ContributionPublicMetaDto,
  ContributionPublicSubmitBodyDto,
} from '../../lib/api/dto/contribution';

/**
 * G4 · ContributionDropPage / 旅伴匿名投稿页（公开 /c/:slug）
 * Write-only: submit photo/note via token. No login. No read access.
 */
interface Props {
  slug: string;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  });
}

export default function ContributionDropPage({ slug }: Props) {
  const [meta, setMeta] = useState<ContributionPublicMetaDto | null>(null);
  const [kind, setKind] = useState<ContributionInboxKindDto>('photo');
  const [noteText, setNoteText] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ remaining: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const m = await fetchContributionPublicMeta(slug);
      setMeta(m);
    } catch {
      setError('链接不存在或已失效');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: ContributionPublicSubmitBodyDto = {
        kind,
        noteText: noteText.trim() || undefined,
        submitterDisplayName: submitterName.trim() || undefined,
        eventDate: eventDate.trim() || undefined,
      };
      if (kind === 'photo' && file) {
        body.imageDataUrl = await readFileAsDataUrl(file);
      }
      const response = await submitContributionPublic(slug, body);
      setDone({ remaining: response.remainingUploads });
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setBusy(false);
    }
  };

  if (!meta) {
    return (
      <main className="contribution-drop-shell">
        <section className="card">
          <h1>正在加载链接…</h1>
          {error ? <p>{error}</p> : null}
        </section>
      </main>
    );
  }

  if (!meta.active) {
    return (
      <main className="contribution-drop-shell">
        <section className="card">
          <h1>这个投稿入口已关闭</h1>
          <p>它可能已过期、被撤销，或额度已用完。</p>
        </section>
      </main>
    );
  }

  if (done) {
    return (
      <main className="contribution-drop-shell">
        <section className="card">
          <h1>谢谢你的投稿</h1>
          <p>主理人会稍后查看。本链接还可投稿 {done.remaining} 次。</p>
          <button className="ghost-button" onClick={() => setDone(null)}>继续投稿</button>
        </section>
      </main>
    );
  }

  return (
    <main className="contribution-drop-shell">
      <section className="card">
        <span className="hero-kicker">Travel Companion Drop-Box</span>
        <h1>{meta.title}</h1>
        <p>无需账号，匿名投稿。你的内容会进入主理人的审核队列，对方查阅后才会被纳入旅程。</p>
        {meta.note ? <p><em>主理人留言：{meta.note}</em></p> : null}
        <small>剩余额度：{meta.remainingUploads} · 截止：{new Date(meta.expiresAt).toLocaleString()}</small>
      </section>

      {error ? <section className="card"><p>{error}</p></section> : null}

      <section className="card">
        <h3>提交内容</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {meta.acceptKind !== 'note' ? (
              <button
                className="ghost-button"
                style={{ background: kind === 'photo' ? 'var(--accent-soft, #e9eef5)' : undefined }}
                onClick={() => setKind('photo')}
              >
                照片
              </button>
            ) : null}
            {meta.acceptKind !== 'photo' ? (
              <button
                className="ghost-button"
                style={{ background: kind === 'note' ? 'var(--accent-soft, #e9eef5)' : undefined }}
                onClick={() => setKind('note')}
              >
                文字
              </button>
            ) : null}
          </div>
          {kind === 'photo' ? (
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          ) : null}
          <textarea
            className="field-control"
            rows={3}
            placeholder={kind === 'note' ? '想说点什么？' : '附言（可选）'}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <input
            className="field-control"
            placeholder="留个昵称（可选，纯展示）"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
          />
          <input
            className="field-control"
            placeholder="事件日期 YYYY-MM-DD（可选）"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <button className="primary-button" disabled={busy} onClick={() => void submit()}>提交</button>
        </div>
      </section>
    </main>
  );
}
