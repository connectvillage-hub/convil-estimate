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
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}명의 고객을 삭제하시겠습니까?\n관련된 컨택 이력 · 견적 · 계약 · 입금 내역도 함께 삭제됩니다.`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      const result = await customersApi.bulkDelete(Array.from(selected));
      alert(`${result.deleted}명 삭제 완료`);
      exitEditMode();
      await load();
    } catch (err) {
      console.error(err);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    } finally {
      setBulkDeleting(false);
    }
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
            {!editMode ? (
              <>
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
                <button
                  onClick={() => setEditMode(true)}
                  className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1.5 rounded font-medium border border-gray-300"
                >
                  ✏️ 편집
                </button>
                <button onClick={load} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  새로고침
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-gray-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                  편집 모드 · {selected.size}명 선택됨
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1.5 rounded font-medium border border-gray-300"
                >
                  {allFilteredSelected ? '전체 해제' : '전체 선택'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selected.size === 0 || bulkDeleting}
                  className="text-xs bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  🗑️ 삭제 ({selected.size})
                </button>
                <button
                  onClick={exitEditMode}
                  disabled={bulkDeleting}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  취소
                </button>
              </>
            )}
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
                <div
                  key={c.id}
                  onClick={() => editMode ? toggleSelect(c.id) : navigate(`/customers/${c.id}`)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm border p-4 transition-colors cursor-pointer ${
                    editMode && selected.has(c.id)
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editMode && (
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 accent-primary-500 flex-shrink-0"
                      />
                    )}
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
                  {c.contractCount > 0 && (
                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-gray-100 text-[10px]">
                      <div className="text-center">
                        <div className="text-gray-400">계약</div>
                        <div className="font-semibold text-gray-800">
                          ₩{c.contractTotal.toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">입금</div>
                        <div className="font-semibold text-green-700">
                          ₩{c.paidTotal.toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400">미수</div>
                        <div className={`font-semibold ${c.outstandingTotal > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          ₩{c.outstandingTotal.toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  )}
                  {c.taxInvoicePending > 0 && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-2 text-center">
                      📋 세금계산서 미발행 {c.taxInvoicePending}건
                    </div>
                  )}
                  {c.memo && (
                    <div className="text-[11px] text-gray-600 mt-2 pt-2 border-t border-gray-100 whitespace-pre-wrap leading-snug">
                      {c.memo}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
                    <span>📍 {INQUIRY_SOURCE_LABELS[c.inquirySource]}</span>
                    <span>컨택 {c.contactCount}회</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      {editMode && (
                        <th className="px-3 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 accent-primary-500"
                            title={allFilteredSelected ? '전체 해제' : '전체 선택'}
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 w-16">#</th>
                      <th className="px-4 py-3 w-36">이름 / 회사</th>
                      <th className="px-4 py-3 w-44">연락처</th>
                      <th className="px-4 py-3 w-44">계약 / 입금 / 미수</th>
                      <th className="px-4 py-3 hidden lg:table-cell min-w-[220px]">메모</th>
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
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          editMode && selected.has(c.id) ? 'bg-primary-50' : ''
                        }`}
                        onClick={() =>
                          editMode ? toggleSelect(c.id) : navigate(`/customers/${c.id}`)
                        }
                      >
                        {editMode && (
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="w-4 h-4 accent-primary-500"
                            />
                          </td>
                        )}
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
                        <td className="px-4 py-3 text-xs">
                          {c.contractCount === 0 ? (
                            <span className="text-gray-300">계약 없음</span>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-500">계약</span>
                                <span className="font-semibold text-gray-800">
                                  ₩{c.contractTotal.toLocaleString('ko-KR')}
                                </span>
                              </div>
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-500">입금</span>
                                <span className="font-semibold text-green-700">
                                  ₩{c.paidTotal.toLocaleString('ko-KR')}
                                </span>
                              </div>
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-500">미수</span>
                                <span className={`font-semibold ${c.outstandingTotal > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                                  ₩{c.outstandingTotal.toLocaleString('ko-KR')}
                                </span>
                              </div>
                              {c.taxInvoicePending > 0 && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block mt-0.5">
                                  📋 세금계산서 미발행 {c.taxInvoicePending}건
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell align-top min-w-[220px]">
                          {c.memo ? (
                            <div className="whitespace-pre-wrap leading-snug break-keep">
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
