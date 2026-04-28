import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomersListView from '../components/CustomersListView';
import AllPaymentsView from '../components/AllPaymentsView';
import OutstandingView from '../components/OutstandingView';

type Tab = 'list' | 'payments' | 'outstanding';

const TAB_LABELS: Record<Tab, string> = {
  list: '👥 고객 목록',
  payments: '💰 입금 내역',
  outstanding: '⚠️ 미수금',
};

export default function CustomersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('list');

  // 다른 페이지(대시보드 등)에서 location.state.tab 으로 진입한 경우 해당 탭 선택
  useEffect(() => {
    const state = location.state as { tab?: Tab } | null;
    if (state?.tab) {
      setTab(state.tab);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const subtitle: Record<Tab, string> = {
    list: '고객 정보·문의 경로·컨택 이력을 관리합니다.',
    payments: '모든 고객의 입금 내역을 한곳에서 확인합니다.',
    outstanding: '입금 받지 못한 계약을 한눈에 봅니다.',
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
        <div className="mb-3">
          <h1 className="text-base sm:text-lg font-bold text-gray-800">고객 관리</h1>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle[tab]}</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {(['list', 'payments', 'outstanding'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t
                  ? 'text-primary-700 border-primary-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* 탭별 콘텐츠 */}
      {tab === 'list' && <CustomersListView />}
      {tab === 'payments' && <AllPaymentsView />}
      {tab === 'outstanding' && <OutstandingView />}
    </div>
  );
}
