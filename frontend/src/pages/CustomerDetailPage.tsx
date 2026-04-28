import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import customersApi from '../api/customers';
import CustomerFormModal from '../components/CustomerFormModal';
import {
  CustomerDetail,
  CustomerInput,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  INQUIRY_SOURCE_LABELS,
} from '../types/customer';

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // 새 컨택 입력
  const [newContent, setNewContent] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customersApi.get(customerId);
      setCustomer(data);
    } catch (err) {
      console.error(err);
      setError('고객 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(customerId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleEdit = async (input: CustomerInput) => {
    const updated = await customersApi.update(customerId, input);
    setCustomer(updated);
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!confirm(`고객 "${customer.name}" 을(를) 삭제하시겠습니까? 컨택 이력도 함께 삭제됩니다.`)) return;
    try {
      await customersApi.delete(customerId);
      navigate('/customers');
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddContact = async () => {
    if (!newContent.trim()) {
      alert('상담 내용을 입력해주세요.');
      return;
    }
    setAddingContact(true);
    try {
      const updated = await customersApi.addContact(customerId, { content: newContent.trim() });
      setCustomer(updated);
      setNewContent('');
    } catch (err) {
      console.error(err);
      alert('컨택 기록 추가 중 오류가 발생했습니다.');
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number, sequence: number) => {
    if (!confirm(`${sequence}차 컨택 기록을 삭제하시겠습니까?`)) return;
    try {
      const updated = await customersApi.deleteContact(customerId, contactId);
      setCustomer(updated);
    } catch (err) {
      console.error(err);
      alert('컨택 기록 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-400">불러오는 중...</div>;
  }
  if (error || !customer) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 mb-3">{error || '고객을 찾을 수 없습니다.'}</p>
        <button onClick={() => navigate('/customers')} className="btn-ghost">
          ← 고객 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => navigate('/customers')}
              className="text-xs text-gray-500 hover:text-gray-700 underline mb-1"
            >
              ← 고객 목록
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-800 flex flex-wrap items-center gap-2">
              {customer.name}
              {customer.companyName && (
                <span className="text-sm font-normal text-gray-500">· {customer.companyName}</span>
              )}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${CONTRACT_STATUS_COLORS[customer.contractStatus]}`}
              >
                {CONTRACT_STATUS_LABELS[customer.contractStatus]}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setEditOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              수정
            </button>
            <button onClick={handleDelete} className="btn-ghost text-red-500 hover:text-red-700">
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* 기본 정보 */}
          <section className="section-card">
            <h2 className="section-title">기본 정보</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label="이름" value={customer.name} />
              <Field label="회사명" value={customer.companyName} />
              <Field label="전화번호" value={customer.phone} />
              <Field label="이메일" value={customer.email} />
              <Field label="주소" value={customer.address} className="sm:col-span-2" />
              <Field label="담당자" value={customer.manager} />
              <Field label="문의 경로" value={INQUIRY_SOURCE_LABELS[customer.inquirySource]} />
              {customer.memo && (
                <Field label="메모" value={customer.memo} className="sm:col-span-2 whitespace-pre-wrap" />
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>등록: {formatDateTime(customer.createdAt)}</span>
              <span>수정: {formatDateTime(customer.updatedAt)}</span>
            </div>
          </section>

          {/* 컨택 이력 */}
          <section className="section-card">
            <h2 className="section-title">
              컨택 이력 ({customer.contacts.length}회)
            </h2>

            {/* 새 컨택 추가 */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">
                {customer.contacts.length + 1}차 컨택 추가
              </p>
              <textarea
                className="form-input min-h-[80px] mb-2"
                placeholder="상담 내용, 통화 요약, 다음 액션 등..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddContact}
                  disabled={addingContact || !newContent.trim()}
                  className="btn-primary"
                >
                  {addingContact ? '추가 중...' : '컨택 기록 추가'}
                </button>
              </div>
            </div>

            {/* 컨택 목록 */}
            {customer.contacts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">
                아직 컨택 기록이 없습니다. 위에서 첫 컨택을 기록해보세요.
              </p>
            ) : (
              <div className="space-y-3">
                {customer.contacts.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {c.sequence}차
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(c.contactedAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(c.id, c.sequence)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {c.content || <span className="text-gray-400 italic">(내용 없음)</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 견적/계약/입금 (Phase 2/3에서 채워질 자리) */}
          <section className="section-card opacity-60">
            <h2 className="section-title">견적 · 계약 · 입금 정보</h2>
            <p className="text-sm text-gray-400 text-center py-6">
              이 섹션은 Phase 2 (계약/결제 관리) 에서 추가됩니다.<br />
              지금은 견적 이력 페이지에서 별도로 관리해주세요.
            </p>
          </section>
        </div>
      </div>

      <CustomerFormModal
        open={editOpen}
        initial={customer}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </div>
  );
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value || <span className="text-gray-400">—</span>}</div>
    </div>
  );
}
