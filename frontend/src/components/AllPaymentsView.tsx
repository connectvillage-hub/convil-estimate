import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardApi, { PaymentRow } from '../api/dashboard';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS, PaymentMethod } from '../types/contract';

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function thisMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  // YYYY-MM → "2026년 4월"
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const [y, m] = monthKey.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

export default function AllPaymentsView() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await dashboardApi.listAllPayments());
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (filterMethod !== 'all') list = list.filter((p) => p.method === filterMethod);
    if (filterMonth) list = list.filter((p) => p.paidAt.startsWith(filterMonth));
    return list;
  }, [payments, filterMethod, filterMonth]);

  const filteredTotal = useMemo(
    () => filteredPayments.reduce((s, p) => s + (p.amount || 0), 0),
    [filteredPayments],
  );

  const methodTotals = useMemo(() => {
    const result: Record<PaymentMethod, number> = {
      bank_transfer: 0, card: 0, government_aid: 0,
    };
    filteredPayments.forEach((p) => {
      result[p.method] = (result[p.method] || 0) + (p.amount || 0);
    });
    return result;
  }, [filteredPayments]);

  // 월별 그룹화 (최신 순)
  const monthGroups = useMemo(() => {
    const groups = new Map<string, PaymentRow[]>();
    for (const p of filteredPayments) {
      const month = (p.paidAt || '').slice(0, 7); // YYYY-MM
      if (!groups.has(month)) groups.set(month, []);
      groups.get(month)!.push(p);
    }
    // 월별 키를 내림차순 정렬
    const sortedKeys = Array.from(groups.keys()).sort().reverse();
    return sortedKeys.map((key) => ({
      month: key,
      items: groups.get(key)!,
      total: groups.get(key)!.reduce((s, p) => s + (p.amount || 0), 0),
    }));
  }, [filteredPayments]);

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SmallKpi label="필터 합계" value={fmt(filteredTotal)} />
              <SmallKpi label="계좌이체" value={fmt(methodTotals.bank_transfer)} />
              <SmallKpi label="카드결제" value={fmt(methodTotals.card)} />
              <SmallKpi label="정부지원금" value={fmt(methodTotals.government_aid)} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
              <select
                className="form-select w-auto text-sm"
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value as PaymentMethod | 'all')}
              >
                <option value="all">전체 수단</option>
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </select>
              <input
                type="month"
                className="form-input w-auto text-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              <button
                onClick={() => setFilterMonth(thisMonthKey())}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                이번 달
              </button>
              {(filterMonth || filterMethod !== 'all') && (
                <button
                  onClick={() => {
                    setFilterMonth('');
                    setFilterMethod('all');
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  필터 해제
                </button>
              )}
              <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline ml-auto">
                새로고침
              </button>
            </div>

            {/* 월별 매출 한눈에 (필터 미적용일 때만) */}
            {!filterMonth && monthGroups.length > 1 && (
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="text-xs text-gray-500 mb-2 font-medium">📊 월별 입금 합계</div>
                <div className="flex items-end gap-2 h-20">
                  {(() => {
                    const recent = monthGroups.slice(0, 12).reverse();
                    const max = Math.max(1, ...recent.map((g) => g.total));
                    return recent.map((g) => {
                      const heightPct = (g.total / max) * 100;
                      return (
                        <button
                          key={g.month}
                          onClick={() => setFilterMonth(g.month)}
                          className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                          title={`${monthLabel(g.month)}: ${fmt(g.total)}`}
                        >
                          <div className="text-[9px] text-gray-500 group-hover:text-primary-600 font-medium">
                            {fmtShort(g.total)}
                          </div>
                          <div className="w-full flex-1 flex items-end">
                            <div
                              className="w-full bg-primary-300 group-hover:bg-primary-500 rounded-t transition-colors"
                              style={{ height: `${Math.max(2, heightPct)}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-gray-400 group-hover:text-primary-600">
                            {g.month.slice(-2)}월
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {monthGroups.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                {payments.length === 0
                  ? '아직 입금 내역이 없습니다. 고객 상세 페이지에서 입금을 등록해보세요.'
                  : '조건에 맞는 입금이 없습니다.'}
              </div>
            ) : (
              monthGroups.map((group) => (
                <div key={group.month} className="space-y-2">
                  {/* 월별 헤더 */}
                  <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-3 sm:px-4 py-2">
                    <span className="text-sm font-bold text-primary-700">
                      📅 {monthLabel(group.month)}
                    </span>
                    <span className="text-xs text-primary-700">
                      {group.items.length}건 · <span className="font-bold">{fmt(group.total)}</span>
                    </span>
                  </div>

                  {/* 모바일: 카드 */}
                  <div className="md:hidden space-y-2">
                    {group.items.map((p) => (
                      <button
                        key={p.paymentId}
                        onClick={() => navigate(`/customers/${p.customerId}`)}
                        className="w-full text-left bg-white rounded-xl border border-gray-200 p-3 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                              {p.customerName}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {p.contractTitle || `계약 #${p.contractId}`}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-700 flex-shrink-0 ml-2">
                            {fmt(p.amount)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span className="font-medium">{PAYMENT_METHOD_LABELS[p.method]}</span>
                          <span>{formatDateTime(p.paidAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 태블릿+ 테이블 */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-2">고객</th>
                            <th className="px-4 py-2">계약</th>
                            <th className="px-4 py-2 w-32">결제 수단</th>
                            <th className="px-4 py-2 text-right w-36">금액</th>
                            <th className="px-4 py-2 w-44">입금 일시</th>
                            <th className="px-4 py-2">메모</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map((p) => (
                            <tr
                              key={p.paymentId}
                              onClick={() => navigate(`/customers/${p.customerId}`)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-gray-800">{p.customerName}</td>
                              <td className="px-4 py-2 text-xs text-gray-600 truncate max-w-xs">
                                {p.contractTitle || `#${p.contractId}`}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {PAYMENT_METHOD_LABELS[p.method]}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-green-700">
                                {fmt(p.amount)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500">
                                {formatDateTime(p.paidAt)}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-xs">
                                {p.memo || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SmallKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <div className="text-sm sm:text-base font-bold text-gray-800 break-keep">{value}</div>
    </div>
  );
}

function fmtShort(n: number): string {
  if (!n) return '';
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString('ko-KR');
}
