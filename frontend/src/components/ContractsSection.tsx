import { useEffect, useState } from 'react';
import contractsApi from '../api/contracts';
import ContractFormModal from './ContractFormModal';
import PaymentFormModal from './PaymentFormModal';
import {
  ContractDetail,
  ContractInput,
  Payment,
  PaymentInput,
  ContractState,
  CONTRACT_STATE_LABELS,
  CONTRACT_STATE_OPTIONS,
  CONTRACT_STATE_COLORS,
  PAYMENT_METHOD_LABELS,
} from '../types/contract';

interface Props {
  customerId: number;
}

function formatDate(s: string): string {
  if (!s) return '—';
  return s;
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
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

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;

// 인라인 편집 폼 상태
interface EditDraft {
  title: string;
  contractAmount: number;
  contractDate: string;
  state: ContractState;
  taxInvoiceIssued: boolean;
  memo: string;
}

function draftFrom(c: ContractDetail): EditDraft {
  return {
    title: c.title,
    contractAmount: c.contractAmount,
    contractDate: c.contractDate || new Date().toISOString().split('T')[0],
    state: c.state,
    taxInvoiceIssued: c.taxInvoiceIssued,
    memo: c.memo,
  };
}

export default function ContractsSection({ customerId }: Props) {
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 신규 계약 모달
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // 입금 모달
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetContract, setPaymentTargetContract] = useState<ContractDetail | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setContracts(await contractsApi.listForCustomer(customerId));
    } catch (err) {
      console.error(err);
      setError('계약 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  // ── Contract handlers ──

  const handleCreateContract = async (input: ContractInput) => {
    const created = await contractsApi.create(customerId, input);
    setContracts((cs) => [created, ...cs]);
  };

  const startEdit = (c: ContractDetail) => {
    setEditingId(c.id);
    setEditDraft(draftFrom(c));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (c: ContractDetail) => {
    if (!editDraft) return;
    setSavingEdit(true);
    try {
      const input: ContractInput = {
        title: editDraft.title,
        contractAmount: editDraft.contractAmount,
        contractDate: editDraft.contractDate,
        estimateId: c.estimateId,
        state: editDraft.state,
        taxInvoiceIssued: editDraft.taxInvoiceIssued,
        memo: editDraft.memo,
      };
      const updated = await contractsApi.update(c.id, input);
      setContracts((cs) => cs.map((x) => (x.id === updated.id ? updated : x)));
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteContract = async (c: ContractDetail) => {
    if (!confirm(`계약 #${c.id} (${fmt(c.contractAmount)}) 을(를) 삭제하시겠습니까? 입금 내역도 함께 삭제됩니다.`)) {
      return;
    }
    try {
      await contractsApi.delete(c.id);
      setContracts((cs) => cs.filter((x) => x.id !== c.id));
      if (editingId === c.id) cancelEdit();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // ── Payment handlers ──

  const openPaymentModal = (contract: ContractDetail, payment: Payment | null) => {
    setPaymentTargetContract(contract);
    setEditingPayment(payment);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (input: PaymentInput) => {
    if (!paymentTargetContract) return;
    let updated: ContractDetail;
    if (editingPayment) {
      updated = await contractsApi.updatePayment(paymentTargetContract.id, editingPayment.id, input);
    } else {
      updated = await contractsApi.addPayment(paymentTargetContract.id, input);
    }
    setContracts((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeletePayment = async (contract: ContractDetail, payment: Payment) => {
    if (!confirm(`${fmt(payment.amount)} 입금 내역을 삭제하시겠습니까?`)) return;
    try {
      const updated = await contractsApi.deletePayment(contract.id, payment.id);
      setContracts((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // ── 합계 ──

  const totalContractAmount = contracts.reduce((s, c) => s + (c.contractAmount || 0), 0);
  const totalPaid = contracts.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const totalRemaining = totalContractAmount - totalPaid;

  return (
    <section className="section-card">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          계약 · 입금 관리
        </h2>
        <button
          onClick={() => setContractModalOpen(true)}
          className="btn-primary text-xs py-1.5 px-3"
        >
          + 새 계약
        </button>
      </div>

      {/* 합계 카드 */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
            <div className="text-[10px] text-gray-400 mb-0.5">총 계약</div>
            <div className="text-sm font-bold text-gray-800">{fmt(totalContractAmount)}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <div className="text-[10px] text-green-700 mb-0.5">입금 완료</div>
            <div className="text-sm font-bold text-green-700">{fmt(totalPaid)}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
            <div className="text-[10px] text-amber-700 mb-0.5">미수금</div>
            <div className="text-sm font-bold text-amber-700">{fmt(totalRemaining)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-6">불러오는 중...</p>
      ) : error ? (
        <p className="text-center text-sm text-red-500 py-6">{error}</p>
      ) : contracts.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">
          아직 등록된 계약이 없습니다. 위 "+ 새 계약" 버튼으로 추가하세요.
        </p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const isEditing = editingId === c.id;
            const isFullyPaid = c.remainingAmount <= 0 && c.contractAmount > 0;
            const methodsUsed = Array.from(new Set(c.payments.map((p) => p.method)));
            const methodsLabel = methodsUsed.length === 0
              ? '—'
              : methodsUsed.map((m) => PAYMENT_METHOD_LABELS[m]).join(' / ');

            return (
              <div
                key={c.id}
                className={`border rounded-lg overflow-hidden ${
                  isEditing ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200'
                }`}
              >
                {/* 헤더: ID + 상태 + 날짜 + 제목 + 금액 */}
                <div className="px-3 sm:px-4 py-3 flex items-start justify-between gap-2 bg-gray-50 border-b border-gray-200">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-gray-500">#{c.id}</span>
                      {!isEditing && (
                        <>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CONTRACT_STATE_COLORS[c.state]}`}
                          >
                            {isFullyPaid && c.state === 'completed' ? '✅ 완료' : CONTRACT_STATE_LABELS[c.state]}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(c.contractDate)}</span>
                        </>
                      )}
                    </div>
                    {isEditing && editDraft ? (
                      <input
                        type="text"
                        className="form-input text-sm font-semibold"
                        placeholder="계약 제목"
                        value={editDraft.title}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {c.title || '(제목 없음)'}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isEditing && editDraft ? (
                      <input
                        type="number"
                        className="form-input text-right text-base font-bold w-36"
                        min={0}
                        step={10000}
                        value={editDraft.contractAmount || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, contractAmount: Number(e.target.value) })}
                      />
                    ) : (
                      <div className="text-base font-bold text-primary-700">{fmt(c.contractAmount)}</div>
                    )}
                  </div>
                </div>

                {/* 정의 리스트 */}
                <div className="px-3 sm:px-4 py-3 space-y-2 text-sm">
                  {/* 입금완료 / 미입금 */}
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 flex-shrink-0">입금완료</span>
                    <span className="font-semibold text-green-700">{fmt(c.paidAmount)}</span>
                    <span className="text-gray-300 mx-2">/</span>
                    <span className="text-gray-500">미입금</span>
                    <span className={`font-semibold ml-1 ${c.remainingAmount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {fmt(c.remainingAmount)}
                    </span>
                  </div>

                  {/* 입금방법 */}
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 flex-shrink-0">입금방법</span>
                    <span className="font-medium text-gray-700">{methodsLabel}</span>
                  </div>

                  {/* 세금계산서 (편집 모드에선 토글) */}
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24 flex-shrink-0">세금계산서</span>
                    {isEditing && editDraft ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditDraft({ ...editDraft, taxInvoiceIssued: false })}
                          className={`text-xs px-2 py-1 rounded border ${
                            !editDraft.taxInvoiceIssued
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-white text-gray-500 border-gray-300'
                          }`}
                        >
                          미발행
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditDraft({ ...editDraft, taxInvoiceIssued: true })}
                          className={`text-xs px-2 py-1 rounded border ${
                            editDraft.taxInvoiceIssued
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-white text-gray-500 border-gray-300'
                          }`}
                        >
                          발행
                        </button>
                      </div>
                    ) : c.taxInvoiceIssued ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                        ✅ 발행
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        ⚠️ 미발행
                      </span>
                    )}
                  </div>

                  {/* 계약 상태 (편집 모드만) */}
                  {isEditing && editDraft && (
                    <>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24 flex-shrink-0">계약 상태</span>
                        <div className="flex gap-1 flex-wrap">
                          {CONTRACT_STATE_OPTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditDraft({ ...editDraft, state: s })}
                              className={`text-xs px-2 py-1 rounded border ${
                                editDraft.state === s
                                  ? CONTRACT_STATE_COLORS[s]
                                  : 'bg-white text-gray-500 border-gray-300'
                              }`}
                            >
                              {CONTRACT_STATE_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 w-24 flex-shrink-0">계약일</span>
                        <input
                          type="date"
                          className="form-input text-sm w-44"
                          value={editDraft.contractDate}
                          onChange={(e) => setEditDraft({ ...editDraft, contractDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* 메모 */}
                  <div className="flex items-start">
                    <span className="text-gray-500 w-24 flex-shrink-0 pt-1">메모</span>
                    {isEditing && editDraft ? (
                      <textarea
                        className="form-input min-h-[60px] flex-1 text-sm"
                        placeholder="계약 관련 메모..."
                        value={editDraft.memo}
                        onChange={(e) => setEditDraft({ ...editDraft, memo: e.target.value })}
                      />
                    ) : c.memo ? (
                      <span className="text-gray-700 whitespace-pre-wrap flex-1">{c.memo}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                </div>

                {/* 입금 진행 바 (display mode 만, 미수금 있을 때만) */}
                {!isEditing && c.contractAmount > 0 && !isFullyPaid && (
                  <div className="px-3 sm:px-4 py-2 border-t border-gray-100">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${Math.min(100, (c.paidAmount / c.contractAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 입금 내역 (display mode 만) */}
                {!isEditing && c.payments.length > 0 && (
                  <div className="px-3 sm:px-4 py-2 space-y-1 border-t border-gray-100 bg-gray-50/50">
                    {c.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-[11px] gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-semibold text-gray-600 flex-shrink-0">
                            {PAYMENT_METHOD_LABELS[p.method]}
                          </span>
                          <span className="text-gray-400 truncate">{formatDateTime(p.paidAt)}</span>
                        </div>
                        <span className="font-semibold text-gray-700 flex-shrink-0">{fmt(p.amount)}</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openPaymentModal(c, p)}
                            className="text-gray-400 hover:text-primary-600 text-[10px]"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeletePayment(c, p)}
                            className="text-gray-400 hover:text-red-600 text-[10px]"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 액션 */}
                <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-white border-t border-gray-100">
                  {isEditing ? (
                    <>
                      <span className="text-xs text-primary-600 font-medium">편집 모드</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => saveEdit(c)}
                          disabled={savingEdit}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          {savingEdit ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {!isFullyPaid && (
                        <button
                          onClick={() => openPaymentModal(c, null)}
                          className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded font-medium"
                        >
                          + 잔금 입금
                        </button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleDeleteContract(c)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 신규 계약 모달 (수정은 인라인이라 사용 안 함) */}
      <ContractFormModal
        open={contractModalOpen}
        initial={null}
        onClose={() => setContractModalOpen(false)}
        onSubmit={handleCreateContract}
      />

      <PaymentFormModal
        open={paymentModalOpen}
        initial={editingPayment}
        remainingAmount={paymentTargetContract?.remainingAmount}
        onClose={() => {
          setPaymentModalOpen(false);
          setEditingPayment(null);
          setPaymentTargetContract(null);
        }}
        onSubmit={handlePaymentSubmit}
      />
    </section>
  );
}
