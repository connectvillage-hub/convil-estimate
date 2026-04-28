import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardApi, { OutstandingItem } from '../api/dashboard';

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;

function thisMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey || '날짜 미정';
  const [y, m] = monthKey.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

export default function OutstandingView() {
  const [outstanding, setOutstanding] = useState<OutstandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setOutstanding(await dashboardApi.listOutstanding());
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // 월 필터 적용된 미수금
  const filteredOutstanding = useMemo(() => {
    if (!filterMonth) return outstanding;
    return outstanding.filter((o) => (o.contractDate || '').startsWith(filterMonth));
  }, [outstanding, filterMonth]);

  const totalOutstanding = useMemo(
    () => filteredOutstanding.reduce((s, o) => s + o.remainingAmount, 0),
    [filteredOutstanding],
  );

  // 월별 그룹화 (계약일 기준)
  const monthGroups = useMemo(() => {
    const groups = new Map<string, OutstandingItem[]>();
    for (const o of filteredOutstanding) {
      const month = (o.contractDate || '').slice(0, 7); // YYYY-MM 또는 ''
      const key = month || '미정';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(o);
    }
    // YYYY-MM 키만 내림차순, '미정' 은 마지막
    const keys = Array.from(groups.keys()).filter((k) => k !== '미정').sort().reverse();
    if (groups.has('미정')) keys.push('미정');
    return keys.map((key) => ({
      month: key,
      items: groups.get(key)!,
      total: groups.get(key)!.reduce((s, o) => s + o.remainingAmount, 0),
    }));
  }, [filteredOutstanding]);

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
                <SmallKpi label="총 미수금" value={fmt(totalOutstanding)} />
                <SmallKpi label="대상 계약" value={`${filteredOutstanding.length}건`} />
              </div>
              <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline">
                새로고침
              </button>
            </div>

            {/* 월 필터 */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">계약일 필터:</span>
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
              {filterMonth && (
                <button
                  onClick={() => setFilterMonth('')}
                  className="text-xs text-red-500 hover:underline"
                >
                  필터 해제
                </button>
              )}
            </div>

            {monthGroups.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                {outstanding.length === 0
                  ? '미수금이 없습니다 ✓'
                  : '조건에 맞는 미수금이 없습니다.'}
              </div>
            ) : (
              monthGroups.map((group) => (
                <div key={group.month} className="space-y-2">
                  {/* 월별 헤더 */}
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 sm:px-4 py-2">
                    <span className="text-sm font-bold text-amber-800">
                      📅 {monthLabel(group.month)}
                    </span>
                    <span className="text-xs text-amber-800">
                      {group.items.length}건 · <span className="font-bold">{fmt(group.total)}</span>
                    </span>
                  </div>

                  {/* 모바일: 카드 */}
                  <div className="md:hidden space-y-2">
                    {group.items.map((o) => {
                      const progress =
                        o.contractAmount > 0 ? (o.paidAmount / o.contractAmount) * 100 : 0;
                      return (
                        <button
                          key={o.contractId}
                          onClick={() => navigate(`/customers/${o.customerId}`)}
                          className="w-full text-left bg-white rounded-xl border border-gray-200 p-3 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-800 truncate">
                                {o.customerName}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">
                                {o.contractTitle || `계약 #${o.contractId}`} · {o.contractDate || '—'}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-sm font-bold text-amber-700">
                                {fmt(o.remainingAmount)}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                / {fmt(o.contractAmount)}
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 데스크톱 테이블 */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-2">고객</th>
                            <th className="px-4 py-2">계약</th>
                            <th className="px-4 py-2 w-28">계약일</th>
                            <th className="px-4 py-2 text-right w-32">계약금액</th>
                            <th className="px-4 py-2 text-right w-32">입금</th>
                            <th className="px-4 py-2 text-right w-36">미수금</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map((o) => (
                            <tr
                              key={o.contractId}
                              onClick={() => navigate(`/customers/${o.customerId}`)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-gray-800">
                                {o.customerName}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600 truncate max-w-xs">
                                {o.contractTitle || `#${o.contractId}`}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500">{o.contractDate || '—'}</td>
                              <td className="px-4 py-2 text-right text-gray-700">
                                {fmt(o.contractAmount)}
                              </td>
                              <td className="px-4 py-2 text-right text-green-700">
                                {fmt(o.paidAmount)}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-amber-700">
                                {fmt(o.remainingAmount)}
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
