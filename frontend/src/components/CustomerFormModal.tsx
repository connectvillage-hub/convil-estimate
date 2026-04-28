import { useEffect, useState } from 'react';
import {
  CustomerInput,
  CustomerDetail,
  emptyCustomer,
  INQUIRY_SOURCE_LABELS,
  INQUIRY_SOURCE_OPTIONS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_OPTIONS,
  InquirySource,
  ContractStatus,
} from '../types/customer';

interface Props {
  open: boolean;
  initial?: CustomerDetail | null;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => Promise<void>;
}

export default function CustomerFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CustomerInput>(emptyCustomer);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          companyName: initial.companyName,
          phone: initial.phone,
          email: initial.email,
          address: initial.address,
          manager: initial.manager,
          memo: initial.memo,
          inquirySource: initial.inquirySource,
          contractStatus: initial.contractStatus,
        });
      } else {
        setForm(emptyCustomer());
      }
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (patch: Partial<CustomerInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('이름은 필수입니다.');
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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {initial ? '고객 정보 수정' : '새 고객 등록'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">이름 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">회사명</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="○○건설"
                  value={form.companyName}
                  onChange={(e) => update({ companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">전화번호</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">이메일</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">주소</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="서울시 ..."
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">담당자</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="고객측 담당자명"
                  value={form.manager}
                  onChange={(e) => update({ manager: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">문의 경로</label>
                <select
                  className="form-select"
                  value={form.inquirySource}
                  onChange={(e) => update({ inquirySource: e.target.value as InquirySource })}
                >
                  {INQUIRY_SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_SOURCE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">계약 상태</label>
                <select
                  className="form-select"
                  value={form.contractStatus}
                  onChange={(e) => update({ contractStatus: e.target.value as ContractStatus })}
                >
                  {CONTRACT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {CONTRACT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">메모</label>
                <textarea
                  className="form-input min-h-[80px]"
                  placeholder="기타 메모..."
                  value={form.memo}
                  onChange={(e) => update({ memo: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={submitting}
            >
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '저장 중...' : initial ? '수정 저장' : '고객 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
