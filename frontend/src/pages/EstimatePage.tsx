import { useState, useMemo } from 'react';
import EstimateForm from '../components/EstimateForm';
import EstimatePreview from '../components/EstimatePreview';
import { EstimateFormData } from '../types/estimate';
import { calculateEstimate } from '../utils/calculate';

const today = new Date().toISOString().split('T')[0];

const defaultForm: EstimateFormData = {
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
};

export default function EstimatePage() {
  const [form, setForm] = useState<EstimateFormData>(defaultForm);

  const result = useMemo(() => calculateEstimate(form), [form]);

  return (
    <div className="h-full flex flex-col">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">견적서 자동 생성</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              좌측에서 항목을 입력하면 우측에서 실시간으로 견적서를 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-400">실시간 계산 중</span>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* 좌측: 입력 폼 */}
          <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <EstimateForm form={form} onChange={setForm} />
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
