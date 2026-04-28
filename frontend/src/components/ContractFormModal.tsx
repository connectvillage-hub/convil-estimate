import { useEffect, useState } from 'react';
import {
  ContractInput,
  ContractDetail,
  emptyContract,
  CONTRACT_STATE_LABELS,
  CONTRACT_STATE_OPTIONS,
  ContractState,
} from '../types/contract';

interface Props {
  open: boolean;
  initial?: ContractDetail | null;
  onClose: () => void;
  onSubmit: (input: ContractInput) => Promise<void>;
}

export default function ContractFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<ContractInput>(emptyContract);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          title: initial.title,
          contractAmount: initial.contractAmount,
          contractDate: initial.contractDate || new Date().toISOString().split('T')[0],
          estimateId: initial.estimateId ?? null,
          state: initial.state,
          memo: initial.memo,
        });
      } else {
        setForm(emptyContract());
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
    setSubmitting(true);
    try {
      await onSubmit(form);
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
              {initial ? '계약 수정' : '새 계약 추가'}
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
            <div>
              <label className="form-label">상태</label>
              <select
                className="form-select"
                value={form.state}
                onChange={(e) => update({ state: e.target.value as ContractState })}
              >
                {CONTRACT_STATE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {CONTRACT_STATE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
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
              {submitting ? '저장 중...' : initial ? '수정 저장' : '계약 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
