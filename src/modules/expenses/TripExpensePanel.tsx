import { useMemo, useState } from 'react';
import type {
  CreateTripExpenseInputDto,
  TripDetailCompanionItemDto,
  TripExpenseCategoryDto,
  TripExpenseDto,
  TripExpenseListResponseDto,
  UpdateTripExpenseInputDto,
} from '../../lib/api/types';
import {
  TRIP_EXPENSE_CATEGORY_OPTIONS,
  buildExpensePanelNarrative,
  buildExpenseSummaryLines,
  formatExpenseMoney,
  getExpenseStatusLabel,
  getTripExpenseCategoryLabel,
  parseExpenseAmountToCents,
} from './expenseModel';

interface TripExpensePanelProps {
  tripId: string;
  expenses: TripExpenseListResponseDto;
  companions: TripDetailCompanionItemDto[];
  busy?: boolean;
  onCreateExpense: (input: CreateTripExpenseInputDto) => Promise<void> | void;
  onUpdateExpense: (expenseId: string, input: UpdateTripExpenseInputDto) => Promise<void> | void;
  onDeleteExpense: (expenseId: string) => Promise<void> | void;
}

function createToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function TripExpensePanel({
  tripId,
  expenses,
  companions,
  busy = false,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}: TripExpensePanelProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TripExpenseCategoryDto>('food');
  const [spentAt, setSpentAt] = useState(createToday);
  const [companionId, setCompanionId] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const summaryLines = useMemo(() => buildExpenseSummaryLines(expenses.summary), [expenses.summary]);
  const narrative = useMemo(() => buildExpensePanelNarrative(expenses), [expenses]);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('food');
    setSpentAt(createToday());
    setCompanionId('');
    setNote('');
    setEditingId(null);
  };

  const fillForm = (expense: TripExpenseDto) => {
    setTitle(expense.title);
    setAmount(String(expense.amountCents / 100));
    setCategory(expense.category);
    setSpentAt(expense.spentAt);
    setCompanionId(expense.companionId ?? '');
    setNote(expense.note ?? '');
    setEditingId(expense.id);
  };

  const handleSubmit = async () => {
    const amountCents = parseExpenseAmountToCents(amount);
    if (!title.trim() || amountCents === null || !spentAt) {
      return;
    }

    const payload = {
      companionId: companionId || null,
      title: title.trim(),
      category,
      amountCents,
      currency: expenses.summary.currency || 'CNY',
      spentAt,
      note: note.trim() || null,
      status: 'actual' as const,
    };

    if (editingId) {
      await onUpdateExpense(editingId, payload);
    } else {
      await onCreateExpense({ ...payload, tripId });
    }
    resetForm();
  };

  return (
    <section className="trip-expense-panel">
      <div className="trip-expense-heading">
        <div>
          <span className="hero-kicker">Budget Ledger</span>
          <h2>预算与消费</h2>
          <p>{narrative}</p>
        </div>
        <strong>{formatExpenseMoney(expenses.summary.totalAmountCents, expenses.summary.currency)}</strong>
      </div>

      <div className="trip-expense-summary">
        {summaryLines.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="trip-expense-composer" aria-label="新增或编辑费用">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="费用名称，例如 京都地铁一日券" />
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="金额" inputMode="decimal" />
        <select value={category} onChange={(event) => setCategory(event.target.value as TripExpenseCategoryDto)}>
          {TRIP_EXPENSE_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} />
        <select value={companionId} onChange={(event) => setCompanionId(event.target.value)}>
          <option value="">不分摊到旅伴</option>
          {companions.map((companion) => (
            <option key={companion.id} value={companion.id}>
              {companion.name}
            </option>
          ))}
        </select>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="备注，可选" />
        <button type="button" className="primary-button" onClick={() => void handleSubmit()} disabled={busy}>
          {editingId ? '保存费用' : '记录费用'}
        </button>
        {editingId ? (
          <button type="button" className="ghost-button" onClick={resetForm} disabled={busy}>
            取消编辑
          </button>
        ) : null}
      </div>

      <div className="trip-expense-content">
        <div className="trip-expense-category-list">
          {expenses.summary.categoryBreakdown.map((item) => (
            <article key={item.category}>
              <div>
                <strong>{item.label}</strong>
                <span>{item.itemCount} 笔 · {item.percentage}%</span>
              </div>
              <p>{formatExpenseMoney(item.amountCents, expenses.summary.currency)}</p>
            </article>
          ))}
        </div>

        <div className="trip-expense-list">
          {expenses.items.length === 0 ? (
            <div className="trip-expense-empty">暂无消费记录。</div>
          ) : (
            expenses.items.map((expense) => (
              <article key={expense.id} className={expense.status === 'draft' ? 'is-draft' : undefined}>
                <div>
                  <strong>{expense.title}</strong>
                  <span>
                    {getTripExpenseCategoryLabel(expense.category)} · {expense.spentAt} · {getExpenseStatusLabel(expense)}
                    {expense.companionName ? ` · ${expense.companionName}` : ''}
                  </span>
                  {expense.note ? <p>{expense.note}</p> : null}
                </div>
                <div className="trip-expense-item-actions">
                  <strong>{formatExpenseMoney(expense.amountCents, expense.currency)}</strong>
                  <button type="button" className="ghost-button" onClick={() => fillForm(expense)} disabled={busy}>
                    编辑
                  </button>
                  <button type="button" className="ghost-button" onClick={() => void onDeleteExpense(expense.id)} disabled={busy}>
                    删除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
