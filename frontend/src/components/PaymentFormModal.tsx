import { useEffect, useState } from 'react';
import {
  Payment,
  PaymentInput,
  PaymentMethod,
  emptyPayment,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from '../types/contract';
import HandlerInput from './HandlerInput';

interface Props {
  open: boolean;
  initial?: Payment | null;
  remainingAmount?: number;  // 미수금 표시용
  onClose: () => void;
  onSubmit: (input: PaymentInput) => Promise<void>;
}

function toLocalDateTimeInput(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 16);
  try {
    const d = new Date(iso);
    const tzOffsetMinutes = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffsetMinutes * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}

export default function PaymentFormModal({
  open,
  initial,
  remainingAmount,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PaymentInput>(emptyPayment);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          amount: initial.amount,
          paidAt: toLocalDateTimeInput(initial.paidAt),
          method: initial.method,
          memo: initial.memo,
          handler: initial.handler || '',
        });
      } else {
        setForm({
          ...emptyPayment(),
          paidAt: toLocalDateTimeInput(),
        });
      }
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (patch: Partial<PaymentInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) {
      alert('입금 금액을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: PaymentInput = {
        ...form,
        // datetime-local 을 ISO 로 보내려면 그대로 보내도 백엔드 datetime 파싱됨
        paidAt: form.paidAt,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {initial ? '입금 내역 수정' : '새 입금 내역 추가'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-3">
            {remainingAmount !== undefined && remainingAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                남은 미수금: ₩{remainingAmount.toLocaleString('ko-KR')}
                <button
                  type="button"
                  className="ml-2 text-amber-700 underline hover:text-amber-900"
                  onClick={() => update({ amount: remainingAmount })}
                >
                  잔금 전체 입력
                </button>
              </div>
            )}
            <div>
              <label className="form-label">입금 금액 (원) *</label>
              <input
                type="number"
                className="form-input"
                min={0}
                step={10000}
                value={form.amount || ''}
                onChange={(e) => update({ amount: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="form-label">입금 일시</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.paidAt || ''}
                onChange={(e) => update({ paidAt: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">결제 수단</label>
              <select
                className="form-select"
                value={form.method}
                onChange={(e) => update({ method: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">담당자 (입금 받은 사람)</label>
              <HandlerInput
                value={form.handler || ''}
                onChange={(v) => update({ handler: v })}
                placeholder="예: 이아연"
                listId="payment-handler-options"
              />
            </div>
            <div>
              <label className="form-label">메모</label>
              <textarea
                className="form-input min-h-[60px]"
                placeholder="입금자명, 비고 등..."
                value={form.memo}
                onChange={(e) => update({ memo: e.target.value })}
              />
            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost" disabled={submitting}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '저장 중...' : initial ? '수정 저장' : '입금 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
