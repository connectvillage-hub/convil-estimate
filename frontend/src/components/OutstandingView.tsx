import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardApi, { OutstandingItem } from '../api/dashboard';

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;

export default function OutstandingView() {
  const [outstanding, setOutstanding] = useState<OutstandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const totalOutstanding = useMemo(
    () => outstanding.reduce((s, o) => s + o.remainingAmount, 0),
    [outstanding],
  );

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
                <SmallKpi label="총 미수금" value={fmt(totalOutstanding)} />
                <SmallKpi label="대상 계약" value={`${outstanding.length}건`} />
              </div>
              <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline">
                새로고침
              </button>
            </div>

            {outstanding.length === 0 ? (
              <div className="text-center text-gray-400 py-10">미수금이 없습니다 ✓</div>
            ) : (
              <>
                <div className="md:hidden space-y-2">
                  {outstanding.map((o) => {
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
                              {o.contractTitle || `계약 #${o.contractId}`} · {o.contractDate}
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

                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">고객</th>
                          <th className="px-4 py-3">계약</th>
                          <th className="px-4 py-3 w-28">계약일</th>
                          <th className="px-4 py-3 text-right w-32">계약금액</th>
                          <th className="px-4 py-3 text-right w-32">입금</th>
                          <th className="px-4 py-3 text-right w-36">미수금</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {outstanding.map((o) => (
                          <tr
                            key={o.contractId}
                            onClick={() => navigate(`/customers/${o.customerId}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {o.customerName}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-xs">
                              {o.contractTitle || `#${o.contractId}`}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{o.contractDate}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {fmt(o.contractAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {fmt(o.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-700">
                              {fmt(o.remainingAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
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
