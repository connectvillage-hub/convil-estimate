import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardApi, { DashboardSummary, ActivityItem } from '../api/dashboard';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  INQUIRY_SOURCE_LABELS,
} from '../types/customer';

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;
const fmtShort = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
};

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function activityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'customer_created':
      return '👤';
    case 'contact_logged':
      return '📞';
    case 'contract_created':
      return '📝';
    case 'payment_received':
      return '💰';
    default:
      return '•';
  }
}

function activityLabel(a: ActivityItem): string {
  switch (a.type) {
    case 'customer_created':
      return `새 고객 등록: ${a.customerName || '—'}`;
    case 'contact_logged':
      return `${a.customerName || '—'} ${a.description || '컨택'}`;
    case 'contract_created':
      return `${a.customerName || '—'} 계약 (${a.amount ? fmt(a.amount) : '—'})`;
    case 'payment_received':
      return `${a.customerName || '—'} 입금 ${a.amount ? fmt(a.amount) : ''}`;
    default:
      return '';
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await dashboardApi.summary());
    } catch (err) {
      console.error(err);
      setError('대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const monthlyMax = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, ...data.monthlyRevenue.map((m) => m.amount));
  }, [data]);

  const revenueGrowth = useMemo(() => {
    if (!data) return 0;
    if (data.lastMonthRevenue === 0) return data.thisMonthRevenue > 0 ? 100 : 0;
    return Math.round(((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100);
  }, [data]);

  if (loading) {
    return <div className="p-10 text-center text-gray-400">불러오는 중...</div>;
  }
  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 mb-3">{error || '데이터 없음'}</p>
        <button onClick={load} className="btn-primary">다시 시도</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-800">대시보드</h1>
            <p className="text-xs text-gray-400 mt-0.5">전체 현황을 한눈에</p>
          </div>
          <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline">
            새로고침
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="이번 달 매출"
              value={fmt(data.thisMonthRevenue)}
              sub={
                <span className={revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth)}% (지난달 대비)
                </span>
              }
              accent="blue"
            />
            <KpiCard
              label="미수금 총액"
              value={fmt(data.totalOutstanding)}
              sub={`진행 중 계약 ${data.activeContracts}건`}
              accent="amber"
            />
            <KpiCard
              label="총 누적 매출"
              value={fmt(data.totalRevenue)}
              sub={`완료 계약 ${data.completedContracts}건`}
              accent="green"
            />
            <KpiCard
              label="총 고객 수"
              value={`${data.totalCustomers}명`}
              sub={`이번 달 신규 ${data.newCustomersThisMonth}명`}
              accent="purple"
            />
          </div>

          {/* 월별 매출 차트 */}
          <section className="section-card">
            <h2 className="section-title">월별 매출 (최근 12개월)</h2>
            <div className="flex items-end gap-1 h-32 sm:h-40">
              {data.monthlyRevenue.map((m) => {
                const heightPct = monthlyMax > 0 ? (m.amount / monthlyMax) * 100 : 0;
                const isCurrent = m.month === data.monthlyRevenue[data.monthlyRevenue.length - 1]?.month;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
                      {m.amount > 0 ? fmtShort(m.amount) : ''}
                    </div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isCurrent ? 'bg-primary-500' : 'bg-primary-300'
                        }`}
                        style={{ height: `${Math.max(2, heightPct)}%` }}
                        title={`${m.month}: ${fmt(m.amount)}`}
                      />
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-gray-400 -rotate-45 origin-top-right h-6 sm:h-8 flex items-start justify-end pr-1 w-full">
                      {m.month.slice(-2)}월
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 분포 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 계약 상태별 */}
            <section className="section-card">
              <h2 className="section-title">고객 계약 상태 분포</h2>
              <DistributionList
                data={data.customersByStatus as Record<string, number>}
                labelMap={CONTRACT_STATUS_LABELS as Record<string, string>}
                colorMap={CONTRACT_STATUS_COLORS as Record<string, string>}
              />
            </section>

            {/* 문의 경로별 */}
            <section className="section-card">
              <h2 className="section-title">문의 경로 분포</h2>
              <DistributionList
                data={data.customersBySource as Record<string, number>}
                labelMap={INQUIRY_SOURCE_LABELS as Record<string, string>}
              />
            </section>
          </div>

          {/* 미수금 TOP + 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="section-card">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">미수금 TOP</h2>
                <button
                  onClick={() => navigate('/payments')}
                  className="text-xs text-primary-600 hover:underline"
                >
                  전체 보기 →
                </button>
              </div>
              {data.outstandingTop.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">미수금 없음 ✓</p>
              ) : (
                <div className="space-y-2">
                  {data.outstandingTop.slice(0, 5).map((o) => (
                    <button
                      key={o.contractId}
                      onClick={() => navigate(`/customers/${o.customerId}`)}
                      className="w-full text-left flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{o.customerName}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {o.contractTitle || `계약 #${o.contractId}`} · {o.contractDate}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-sm font-bold text-amber-700">{fmt(o.remainingAmount)}</div>
                        <div className="text-[10px] text-gray-400">/ {fmt(o.contractAmount)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="section-card">
              <h2 className="section-title">최근 활동</h2>
              {data.recentActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">활동 없음</p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {data.recentActivities.slice(0, 15).map((a, idx) => (
                    <button
                      key={idx}
                      onClick={() => a.customerId && navigate(`/customers/${a.customerId}`)}
                      className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base flex-shrink-0">{activityIcon(a.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-700 truncate">{activityLabel(a)}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatDateTime(a.at)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent: 'blue' | 'amber' | 'green' | 'purple';
}) {
  const accentMap = {
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
  };
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${accentMap[accent]} shadow-sm p-3 sm:p-4`}>
      <div className="text-[10px] sm:text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg sm:text-xl font-bold text-gray-800 break-keep">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function DistributionList({
  data,
  labelMap,
  colorMap,
}: {
  data: Record<string, number>;
  labelMap: Record<string, string>;
  colorMap?: Record<string, string>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">데이터 없음</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        const colorClass = colorMap?.[key] || 'bg-primary-100 text-primary-700 border-primary-200';
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {colorMap ? (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${colorClass}`}>
                    {labelMap[key] || key}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-700">
                    {labelMap[key] || key}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {count}명 <span className="text-gray-400">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
