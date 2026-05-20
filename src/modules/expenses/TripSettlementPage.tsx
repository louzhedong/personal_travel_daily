import { useEffect, useState } from 'react';
import type { AuthAccount } from '../../types';
import type { TripSettlementResponseDto } from '../../lib/api/types';
import { fetchTripSettlement } from '../../lib/api/expensesApi';
import { buildSettlementLines } from './settlementModel';

interface TripSettlementPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

export default function TripSettlementPage({ account, tripId, onNavigateBack, onLogout }: TripSettlementPageProps) {
  const [settlement, setSettlement] = useState<TripSettlementResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  useEffect(() => {
    setLoading(true);
    setErrorText('');
    fetchTripSettlement(tripId)
      .then(setSettlement)
      .catch(() => {
        setSettlement(null);
        setErrorText('结算数据暂时不可用。');
      })
      .finally(() => setLoading(false));
  }, [tripId]);
  const lines = settlement ? buildSettlementLines(settlement) : [];
  const handleDownloadCsv = () => {
    if (!settlement) return;
    const blob = new Blob([settlement.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip-${tripId}-settlement.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="live-trip-shell">
      <div className="live-trip-topbar"><button className="ghost-button" onClick={onNavigateBack}>返回</button><button className="ghost-button" onClick={() => void onLogout()}>退出登录</button></div>
      <section className="live-trip-hero"><span className="hero-kicker">Settlement · @{account.username}</span><h1>AA 结算</h1><p>用最小转账方案收束多币种旅行账本。</p></section>
      <section className="live-trip-grid" aria-busy={loading}>
        {(settlement?.balances ?? []).map((item) => <article key={item.companionId ?? item.companionName}><span>{item.companionName}</span><strong>{(item.balanceCents / 100).toFixed(2)}</strong><p>{item.currency}</p></article>)}
        {loading ? <article><span>同步中</span><strong>...</strong><p>正在计算最小转账方案。</p></article> : null}
      </section>
      <section className="guide-subscription-panel">
        <h2>建议转账</h2>
        {errorText ? <p role="alert">{errorText}</p> : null}
        {lines.length ? lines.map((line) => <p key={line}>{line}</p>) : <p>当前无需转账。</p>}
        <button type="button" className="ghost-button" disabled={!settlement} onClick={handleDownloadCsv}>下载 CSV</button>
        <pre>{settlement?.csv}</pre>
      </section>
    </main>
  );
}
