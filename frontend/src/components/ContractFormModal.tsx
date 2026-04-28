import { useEffect, useState } from 'react';
import {
  ContractInput,
  ContractDetail,
  emptyContract,
  CONTRACT_STATE_LABELS,
  CONTRACT_STATE_OPTIONS,
  ContractState,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
} from '../types/contract';

interface Props {
  open: boolean;
  initial?: ContractDetail | null;
  onClose: () => void;
  onSubmit: (input: ContractInput) => Promise<void>;
}

type PaymentStatus = 'unpaid' | 'partial' | 'completed';

export default function ContractFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ContractInput>(emptyContract);
  const [submitting, setSubmitting] = useState(false);

  // 신규 계약일 때만 보이는 입금 상태
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  const isEdit = !!initial;

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          title: initial.title,
          contractAmount: initial.contractAmount,
          contractDate: initial.contractDate || new Date().toISOString().split('T')[0],
          estimateId: initial.estimateId ?? null,
          state: initial.state,
          taxInvoiceIssued: initial.taxInvoiceIssued || false,
          memo: initial.memo,
        });
      } else {
        setForm(emptyContract());
        setPaymentStatus('unpaid');
        setPartialAmount(0);
        setPaymentMethod('bank_transfer');
      }
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (patch: Partial<ContractInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.contractAmount <= 0) {
      alert('계약 금액을 입력해주세요.');
      return;
    }

    let payload: ContractInput = { ...form };

    // 신규 계약일 때 입금 상태 처리
    if (!isEdit) {
      if (paymentStatus === 'completed') {
        payload.initialPayment = {
          amount: form.contractAmount,
          method: paymentMethod,
        };
        payload.state = 'completed';
      } else if (paymentStatus === 'partial') {
        if (partialAmount <= 0 || partialAmount >= form.contractAmount) {
          alert('일부 입금 금액은 계약금액보다 작아야 합니다.');
          return;
        }
        payload.initialPayment = {
          amount: partialAmount,
          method: paymentMethod,
        };
        payload.state = 'active';
      }
    }

    setSubmitting(true);
    try {
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
        className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? '계약 수정' : '새 계약 추가'}
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

          <div className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* 기본 정보 */}
            <div>
              <label className="form-label">계약 제목</label>
              <input
                type="text"
                className="form-input"
                placeholder="예: 30평 아파트 인테리어 패키지"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">계약 금액 (원) *</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={10000}
                  value={form.contractAmount || ''}
                  onChange={(e) => update({ contractAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="form-label">계약일</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.contractDate}
                  onChange={(e) => update({ contractDate: e.target.value })}
                />
              </div>
            </div>

            {/* 입금 상태 — 신규 계약일 때만 표시 */}
            {!isEdit && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-700">💰 입금 상태</p>
                <div className="space-y-2">
                  {[
                    { value: 'unpaid' as PaymentStatus, label: '아직 미입금' },
                    { value: 'partial' as PaymentStatus, label: '일부 입금 받음' },
                    { value: 'completed' as PaymentStatus, label: '✅ 전액 완료' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="paymentStatus"
                        checked={paymentStatus === opt.value}
                        onChange={() => setPaymentStatus(opt.value)}
                        className="accent-primary-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {paymentStatus !== 'unpaid' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    {paymentStatus === 'partial' && (
                      <div>
                        <label className="form-label">받은 금액 (원)</label>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          step={10000}
                          value={partialAmount || ''}
                          onChange={(e) => setPartialAmount(Number(e.target.value))}
                          placeholder="예: 1,000,000"
                        />
                      </div>
                    )}
                    <div className={paymentStatus === 'completed' ? 'col-span-2' : ''}>
                      <label className="form-label">결제 수단</label>
                      <select
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((m) => (
                          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 상태 — 수정 모드에서만 표시 */}
            {isEdit && (
              <div>
                <label className="form-label">상태</label>
                <select
                  className="form-select"
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value as ContractState })}
                >
                  {CONTRACT_STATE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{CONTRACT_STATE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 세금계산서 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.taxInvoiceIssued}
                  onChange={(e) => update({ taxInvoiceIssued: e.target.checked })}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm font-medium text-gray-800">📋 세금계산서 발행 완료</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                미발행 상태로 두면 나중에 수정에서 체크할 수 있습니다.
              </p>
            </div>

            {/* 메모 */}
            <div>
              <label className="form-label">메모</label>
              <textarea
                className="form-input min-h-[60px]"
                placeholder="계약 관련 메모..."
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
              {submitting ? '저장 중...' : isEdit ? '수정 저장' : '계약 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
