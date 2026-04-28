import { useEffect, useState } from 'react';
import contractsApi from '../api/contracts';
import ContractFormModal from './ContractFormModal';
import PaymentFormModal from './PaymentFormModal';
import {
  ContractDetail,
  ContractInput,
  Payment,
  PaymentInput,
  CONTRACT_STATE_LABELS,
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

export default function ContractsSection({ customerId }: Props) {
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractDetail | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetContract, setPaymentTargetContract] = useState<ContractDetail | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractsApi.listForCustomer(customerId);
      setContracts(data);
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

  const handleContractSubmit = async (input: ContractInput) => {
    if (editingContract) {
      const updated = await contractsApi.update(editingContract.id, input);
      setContracts((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const created = await contractsApi.create(customerId, input);
      setContracts((cs) => [created, ...cs]);
    }
  };

  const handleDeleteContract = async (c: ContractDetail) => {
    if (!confirm(`계약 #${c.id} (${fmt(c.contractAmount)}) 을(를) 삭제하시겠습니까? 입금 내역도 함께 삭제됩니다.`)) {
      return;
    }
    try {
      await contractsApi.delete(c.id);
      setContracts((cs) => cs.filter((x) => x.id !== c.id));
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
          onClick={() => {
            setEditingContract(null);
            setContractModalOpen(true);
          }}
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
            const progress = c.contractAmount > 0 ? (c.paidAmount / c.contractAmount) * 100 : 0;
            return (
              <div key={c.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                {/* 계약 헤더 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-500">#{c.id}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CONTRACT_STATE_COLORS[c.state]}`}
                      >
                        {CONTRACT_STATE_LABELS[c.state]}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(c.contractDate)}</span>
                    </div>
                    {c.title && (
                      <div className="text-sm font-medium text-gray-800 mt-1">{c.title}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-primary-700">{fmt(c.contractAmount)}</div>
                  </div>
                </div>

                {/* 진행 바 */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>
                      입금: <span className="text-green-700 font-semibold">{fmt(c.paidAmount)}</span>
                    </span>
                    <span>
                      미수: <span className="text-amber-700 font-semibold">{fmt(c.remainingAmount)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {/* 입금 내역 */}
                {c.payments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {c.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-semibold text-gray-500">
                            {PAYMENT_METHOD_LABELS[p.method]}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{formatDateTime(p.paidAt)}</span>
                          {p.memo && (
                            <>
                              <span className="text-gray-400 hidden sm:inline">·</span>
                              <span className="text-gray-500 truncate hidden sm:inline">{p.memo}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-gray-800">{fmt(p.amount)}</span>
                          <button
                            onClick={() => openPaymentModal(c, p)}
                            className="text-gray-400 hover:text-primary-600 text-[10px]"
                            title="수정"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeletePayment(c, p)}
                            className="text-gray-400 hover:text-red-600 text-[10px]"
                            title="삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 액션 */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => openPaymentModal(c, null)}
                    className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded font-medium"
                  >
                    + 입금 추가
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingContract(c);
                        setContractModalOpen(true);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                    >
                      계약 수정
                    </button>
                    <button
                      onClick={() => handleDeleteContract(c)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      계약 삭제
                    </button>
                  </div>
                </div>

                {c.memo && (
                  <p className="mt-2 text-[11px] text-gray-500 whitespace-pre-wrap bg-gray-50 rounded p-2">
                    {c.memo}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ContractFormModal
        open={contractModalOpen}
        initial={editingContract}
        onClose={() => {
          setContractModalOpen(false);
          setEditingContract(null);
        }}
        onSubmit={handleContractSubmit}
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
