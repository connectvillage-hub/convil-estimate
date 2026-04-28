import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import customersApi from '../api/customers';
import CustomerFormModal from './CustomerFormModal';
import GoogleFormGuideModal from './GoogleFormGuideModal';
import {
  CustomerListItem,
  CustomerInput,
  ContractStatus,
  InquirySource,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_STATUS_COLORS,
  INQUIRY_SOURCE_LABELS,
  INQUIRY_SOURCE_OPTIONS,
} from '../types/customer';

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

export default function CustomersListView() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContractStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<InquirySource | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await customersApi.list());
    } catch (err) {
      console.error(err);
      setError('고객 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (filterStatus !== 'all') list = list.filter((c) => c.contractStatus === filterStatus);
    if (filterSource !== 'all') list = list.filter((c) => c.inquirySource === filterSource);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, filterStatus, filterSource, search]);

  const handleCreate = async (input: CustomerInput) => {
    const created = await customersApi.create(input);
    await load();
    navigate(`/customers/${created.id}`);
  };

  return (
    <>
      {/* 액션 바 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            className="form-input flex-1 min-w-[200px] max-w-md"
            placeholder="이름·회사명·전화번호·이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="form-select w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContractStatus | 'all')}
            >
              <option value="all">전체 상태</option>
              {CONTRACT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              className="form-select w-auto"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as InquirySource | 'all')}
            >
              <option value="all">전체 경로</option>
              {INQUIRY_SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{INQUIRY_SOURCE_LABELS[s]}</option>
              ))}
            </select>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-3 py-1.5">
              + 새 고객
            </button>
            <button
              onClick={() => setGuideOpen(true)}
              className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1.5 rounded font-medium"
              title="구글 폼 자동 등록 연동"
            >
              🔗 구글 폼 연동
            </button>
            <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline">
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            {items.length === 0
              ? '아직 등록된 고객이 없습니다. 우측 상단 "+ 새 고객" 을 눌러보세요.'
              : '조건에 맞는 고객이 없습니다.'}
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-800 truncate">
                        {c.name}
                        {c.companyName && (
                          <span className="text-xs text-gray-400 ml-1">· {c.companyName}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {c.phone || c.email || '연락처 없음'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex-shrink-0 ${CONTRACT_STATUS_COLORS[c.contractStatus]}`}
                    >
                      {CONTRACT_STATUS_LABELS[c.contractStatus]}
                    </span>
                  </div>
                  {c.memo && (
                    <div className="text-[11px] text-gray-600 mt-2 pt-2 border-t border-gray-100 line-clamp-3 whitespace-pre-wrap">
                      {c.memo}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
                    <span>📍 {INQUIRY_SOURCE_LABELS[c.inquirySource]}</span>
                    <span>컨택 {c.contactCount}회</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-16">#</th>
                      <th className="px-4 py-3 w-36">이름 / 회사</th>
                      <th className="px-4 py-3 w-44">연락처</th>
                      <th className="px-4 py-3 hidden xl:table-cell">메모</th>
                      <th className="px-4 py-3 w-28">문의 경로</th>
                      <th className="px-4 py-3 w-28">계약 상태</th>
                      <th className="px-4 py-3 text-center w-16">컨택</th>
                      <th className="px-4 py-3 w-40 hidden lg:table-cell">최종 수정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/customers/${c.id}`)}
                      >
                        <td className="px-4 py-3 text-gray-400">{c.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{c.name}</div>
                          {c.companyName && (
                            <div className="text-xs text-gray-400">{c.companyName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          <div>{c.phone || '—'}</div>
                          <div className="text-gray-400">{c.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs hidden xl:table-cell max-w-md">
                          {c.memo ? (
                            <div className="line-clamp-3 whitespace-pre-wrap leading-snug">
                              {c.memo}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {INQUIRY_SOURCE_LABELS[c.inquirySource]}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${CONTRACT_STATUS_COLORS[c.contractStatus]}`}
                          >
                            {CONTRACT_STATUS_LABELS[c.contractStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{c.contactCount}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {formatDateTime(c.updatedAt || c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      <GoogleFormGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
}
