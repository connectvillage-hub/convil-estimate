import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import estimatesApi, { SavedEstimateListItem } from '../api/estimates';
import { formatCurrency } from '../utils/calculate';

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
  const navigate = useNavigate();

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

  const handleLoad = (id: number) => {
    navigate('/estimate', { state: { loadId: id } });
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">저장된 견적</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              지금까지 저장한 견적을 불러오거나 삭제할 수 있습니다.
            </p>
          </div>
          <button
            onClick={load}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-10">불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            저장된 견적이 없습니다. 견적서 생성 페이지에서 견적을 저장해보세요.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-16">#</th>
                  <th className="px-4 py-3">고객명</th>
                  <th className="px-4 py-3">프로젝트명</th>
                  <th className="px-4 py-3 w-32">견적일자</th>
                  <th className="px-4 py-3 text-right w-40">최종 금액</th>
                  <th className="px-4 py-3 w-44">최종 수정</th>
                  <th className="px-4 py-3 w-36 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{it.id}</td>
                    <td className="px-4 py-3 font-medium">{it.customerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{it.projectName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{it.estimateDate || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-700">
                      ₩{formatCurrency(it.finalAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDateTime(it.updatedAt || it.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleLoad(it.id)}
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
        )}
      </div>
    </div>
  );
}
