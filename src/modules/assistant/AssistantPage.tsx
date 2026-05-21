import { useEffect, useMemo, useState } from 'react';
import type { AssistantSuggestionDto } from '../../lib/api/types';
import {
  confirmAssistantSuggestion,
  createAssistantSuggestion,
  dismissAssistantSuggestion,
  fetchAssistantSuggestions,
} from '../../lib/api/assistantApi';
import { getAssistantActionSummary } from './assistantModel';

interface AssistantPageProps {
  contextType?: 'home' | 'trip' | 'photos' | 'journey';
  contextId?: string;
  onNavigateBack: () => void;
}

const PAGE_SIZE = 6;

export default function AssistantPage({
  contextType = 'home',
  contextId,
  onNavigateBack,
}: AssistantPageProps) {
  const [suggestion, setSuggestion] = useState<AssistantSuggestionDto | null>(null);
  const [history, setHistory] = useState<AssistantSuggestionDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('助手只生成建议，确认后才会进入正式整理流程。');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchAssistantSuggestions()
      .then((response) => {
        if (!cancelled) setHistory(response.suggestions);
      })
      .catch(() => {
        if (!cancelled) setStatusText('历史建议暂时不可用，但仍可生成新建议。');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visibleHistory = useMemo(
    () => history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [history, page],
  );

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const response = await createAssistantSuggestion({ contextType, contextId });
      setSuggestion(response.suggestion);
      setHistory((current) =>
        [response.suggestion, ...current.filter((item) => item.id !== response.suggestion.id)].slice(0, 24),
      );
      setStatusText('已生成建议，请逐条确认或驳回。');
    } catch {
      setStatusText('生成失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!suggestion) return;
    setBusy(true);
    try {
      const response = await confirmAssistantSuggestion(suggestion.id);
      setSuggestion(response.suggestion);
      setHistory((current) => current.map((item) => (item.id === response.suggestion.id ? response.suggestion : item)));
      setStatusText('建议已确认，系统已记录审计状态。');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = async () => {
    if (!suggestion) return;
    setBusy(true);
    try {
      const response = await dismissAssistantSuggestion(suggestion.id);
      setSuggestion(response.suggestion);
      setHistory((current) => current.map((item) => (item.id === response.suggestion.id ? response.suggestion : item)));
      setStatusText('建议已驳回，不会进入正式业务数据。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="assistant-shell" aria-label="私密 AI 旅行助手">
      <div className="topbar assistant-topbar">
        <button type="button" className="ghost-button" onClick={onNavigateBack}>
          返回
        </button>
        <div className="topbar-actions">
          <button type="button" className="primary-button" disabled={busy} onClick={handleGenerate}>
            生成整理建议
          </button>
        </div>
      </div>

      <header className="hero assistant-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Private Assistant</span>
          <h1>私密 AI 旅行助手</h1>
          <p>{getAssistantActionSummary(suggestion)}</p>
          <small className="assistant-status" aria-live="polite">
            {statusText}
          </small>
        </div>
      </header>

      {suggestion ? (
        <section className="assistant-suggestion-panel">
          <div className="panel-heading">
            <span className="hero-kicker">Current Suggestion</span>
            <h2>本次建议动作</h2>
            <p>逐条审阅后再确认采用，确认后才会写入业务数据。</p>
          </div>
          <div className="assistant-action-list">
            {suggestion.actions.map((action) => (
              <article key={action.id}>
                <span className="assistant-action-type">{action.type}</span>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </article>
            ))}
          </div>
          <div className="assistant-action-actions">
            <button
              type="button"
              className="ghost-button"
              disabled={busy || suggestion.status === 'confirmed'}
              onClick={handleConfirm}
            >
              确认采用
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={busy || suggestion.status !== 'draft'}
              onClick={handleDismiss}
            >
              驳回建议
            </button>
          </div>
        </section>
      ) : null}

      <section className="assistant-history" aria-label="助手建议历史">
        <div className="panel-heading">
          <span className="hero-kicker">History</span>
          <h2>最近建议</h2>
          <p>查看并复用历史建议草稿。</p>
        </div>
        {history.length === 0 ? (
          <p className="assistant-history-empty">还没有建议历史。</p>
        ) : (
          <>
            <div className="assistant-history-list">
              {visibleHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`assistant-history-item is-${item.status}`}
                  onClick={() => setSuggestion(item)}
                >
                  <span className={`assistant-history-status is-${item.status}`}>{item.status}</span>
                  <strong>{item.promptSummary}</strong>
                  <small>{new Date(item.createdAt).toLocaleString('zh-CN')}</small>
                </button>
              ))}
            </div>
            {pageCount > 1 ? (
              <nav className="assistant-pagination" aria-label="建议历史分页">
                <button
                  type="button"
                  className="ghost-button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  上一页
                </button>
                <span>
                  第 {page} / {pageCount} 页 · 共 {history.length} 条
                </span>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  下一页
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
