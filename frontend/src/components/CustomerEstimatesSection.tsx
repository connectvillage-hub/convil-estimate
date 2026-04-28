import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import estimatesApi, { SavedEstimateListItem } from '../api/estimates';
import contractsApi from '../api/contracts';

interface Props {
  customerId: number;
  customerName: string;
  onContractCreated?: () => void;
}

const fmt = (n: number) => `₩${(n || 0).toLocaleString('ko-KR')}`;

export default function CustomerEstimatesSection({
  customerId,
  customerName,
  onContractCreated,
}: Props) {
  const [items, setItems] = useState<SavedEstimateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await estimatesApi.listByCustomer(customerId));
    } catch (err) {
      console.error(err);
      setError('견적 이력을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleNewEstimate = (clientType: 'customer' | 'contractor') => {
    const path = clientType === 'contractor' ? '/contractor-estimate' : '/estimate';
    navigate(path, { state: { customerId, customerName } });
  };

  const handleConvertToContract = async (estimateId: number) => {
    if (!confirm(`견적 #${estimateId} 을(를) 계약으로 변환하시겠습니까?`)) return;
    setConvertingId(estimateId);
    try {
      await contractsApi.createFromEstimate(customerId, estimateId);
      alert('계약이 생성되었습니다.');
      onContractCreated?.();
    } catch (err) {
      console.error(err);
      alert('계약 생성 중 오류가 발생했습니다.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <section className="section-card">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          견적 이력 ({items.length}건)
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => handleNewEstimate('customer')}
            className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded font-medium"
          >
            + 고객 견적
          </button>
          <button
            onClick={() => handleNewEstimate('contractor')}
            className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded font-medium"
          >
            + 시공사 견적
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-6">불러오는 중...</p>
      ) : error ? (
        <p className="text-center text-sm text-red-500 py-6">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-6">
          이 고객에 대한 견적이 없습니다. 위 "+" 버튼으로 새 견적을 작성하세요.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500">#{it.id}</span>
                    {it.clientType === 'contractor' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                        시공사
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        고객
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{it.estimateDate || '—'}</span>
                  </div>
                  {it.projectName && (
                    <div className="text-sm font-medium text-gray-800 mt-1 truncate">
                      {it.projectName}
                    </div>
                  )}
                </div>
                <div className="text-sm font-bold text-primary-700 flex-shrink-0">
                  {fmt(it.finalAmount)}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    const path = it.clientType === 'contractor' ? '/contractor-estimate' : '/estimate';
                    navigate(path, { state: { loadId: it.id } });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                >
                  열기
                </button>
                <button
                  onClick={() => handleConvertToContract(it.id)}
                  disabled={convertingId === it.id}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded font-medium disabled:opacity-50"
                >
                  {convertingId === it.id ? '변환 중...' : '계약으로 변환'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
