import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EstimateForm from '../components/EstimateForm';
import EstimatePreview from '../components/EstimatePreview';
import { EstimateFormData, ClientType, CONTRACTOR_DISCOUNT_RATE } from '../types/estimate';
import { calculateEstimate } from '../utils/calculate';
import estimatesApi from '../api/estimates';

const today = new Date().toISOString().split('T')[0];

function makeDefaultForm(clientType: ClientType): EstimateFormData {
  return {
    customerName: '',
    projectName: '',
    pyeongsu: 30,
    region: 'main',
    serviceType: 'package',
    singleItems: {
      floorPlan: true,
      ceilingPlan: false,
      design3d: false,
    },
    meetingType: 'remote',
    brandingPlus: false,
    additionalItems: [],
    discount: 0,
    estimateDate: today,
    clientType,
  };
}

interface Props {
  clientType: ClientType;
}

export default function EstimatePage({ clientType }: Props) {
  const [form, setForm] = useState<EstimateFormData>(() => makeDefaultForm(clientType));
  const [savedId, setSavedId] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const result = useMemo(() => calculateEstimate(form), [form]);

  // 페이지 전환 시 (clientType 변경) 폼 초기화
  useEffect(() => {
    setForm(makeDefaultForm(clientType));
    setSavedId(null);
  }, [clientType]);

  // 견적 이력에서 "불러오기" 시 location.state.loadId 로 전달
  useEffect(() => {
    const state = location.state as { loadId?: number } | null;
    if (state?.loadId) {
      estimatesApi
        .get(state.loadId)
        .then((detail) => {
          setForm(detail.form);
          setSavedId(detail.id);
        })
        .catch((err) => {
          console.error(err);
          alert('견적 불러오기에 실패했습니다.');
        })
        .finally(() => {
          navigate(location.pathname, { replace: true, state: null });
        });
    }
  }, [location.state, location.pathname, navigate]);

  const handleNew = () => {
    setForm(makeDefaultForm(clientType));
    setSavedId(null);
  };

  const isContractor = form.clientType === 'contractor';
  const pageTitle = isContractor ? '시공사 견적서 자동 생성' : '견적서 자동 생성';
  const subTitle = isContractor
    ? `좌측에서 항목을 입력하면 우측에서 실시간으로 견적서를 확인할 수 있습니다. (모든 기본가 ${Math.round(
        CONTRACTOR_DISCOUNT_RATE * 100,
      )}% 할인 자동 적용 · 출장비 제외)`
    : '좌측에서 항목을 입력하면 우측에서 실시간으로 견적서를 확인할 수 있습니다.';

  return (
    <div className="h-full flex flex-col">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {pageTitle}
              {isContractor && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                  시공사 전용
                </span>
              )}
              {savedId !== null && (
                <span className="ml-2 text-xs font-normal text-primary-600">
                  (저장된 견적 #{savedId} 편집 중)
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{subTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {savedId !== null && (
              <button
                onClick={handleNew}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                새 견적 시작
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-gray-400">실시간 계산 중</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* 좌측: 입력 폼 */}
          <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <EstimateForm
                form={form}
                onChange={setForm}
                subtotal={result.subtotal}
                savedId={savedId}
                onSaved={(id) => setSavedId(id)}
              />
            </div>
          </div>

          {/* 우측: 미리보기 */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-xs text-gray-400 font-medium">실시간 견적서 미리보기</span>
              </div>
              <EstimatePreview form={form} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
