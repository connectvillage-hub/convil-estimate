import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import estimatesApi, { SavedEstimateListItem } from '../api/estimates';
import { ClientType } from '../types/estimate';
import { formatCurrency } from '../utils/calculate';

type Filter = 'all' | ClientType;

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

export default function EstimateHistoryPage() {
  const [items, setItems] = useState<SavedEstimateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.clientType === filter)),
    [items, filter],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await estimatesApi.list();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('견적 목록을 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleLoad = (id: number, clientType: ClientType) => {
    const path = clientType === 'contractor' ? '/contractor-estimate' : '/estimate';
    navigate(path, { state: { loadId: id } });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`견적 #${id} 을(를) 삭제하시겠습니까?`)) return;
    try {
      await estimatesApi.delete(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-800">저장된 견적</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              지금까지 저장한 견적을 불러오거나 삭제할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
              {([
                { key: 'all', label: '전체' },
                { key: 'customer', label: '고객' },
                { key: 'contractor', label: '시공사' },
              ] as { key: Filter; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`px-3 py-1.5 transition-colors ${
                    filter === opt.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            {items.length === 0
              ? '저장된 견적이 없습니다. 견적서 생성 페이지에서 견적을 저장해보세요.'
              : '해당 구분에 해당하는 견적이 없습니다.'}
          </div>
        ) : (
          <>
            {/* 모바일: 카드 리스트 */}
            <div className="md:hidden space-y-3">
              {filtered.map((it) => (
                <div
                  key={it.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {it.clientType === 'contractor' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                            시공사
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            고객
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">#{it.id}</span>
                      </div>
                      <div className="font-semibold text-sm text-gray-800 truncate">
                        {it.customerName || '—'}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {it.projectName || '프로젝트명 없음'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-primary-700">
                        ₩{formatCurrency(it.finalAmount)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {it.estimateDate || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(it.updatedAt || it.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLoad(it.id, it.clientType)}
                        className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded transition-colors font-medium"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 태블릿/데스크톱: 테이블 */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-16">#</th>
                      <th className="px-4 py-3 w-20">구분</th>
                      <th className="px-4 py-3">고객/시공사명</th>
                      <th className="px-4 py-3">프로젝트명</th>
                      <th className="px-4 py-3 w-32">견적일자</th>
                      <th className="px-4 py-3 text-right w-40">최종 금액</th>
                      <th className="px-4 py-3 w-44 hidden lg:table-cell">최종 수정</th>
                      <th className="px-4 py-3 w-36 text-center">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{it.id}</td>
                        <td className="px-4 py-3">
                          {it.clientType === 'contractor' ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                              시공사
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              고객
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{it.customerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{it.projectName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{it.estimateDate || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary-700">
                          ₩{formatCurrency(it.finalAmount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {formatDateTime(it.updatedAt || it.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleLoad(it.id, it.clientType)}
                              className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-colors font-medium"
                            >
                              불러오기
                            </button>
                            <button
                              onClick={() => handleDelete(it.id)}
                              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors font-medium"
                            >
                              삭제
                            </button>
                          </div>
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
    </div>
  );
}
