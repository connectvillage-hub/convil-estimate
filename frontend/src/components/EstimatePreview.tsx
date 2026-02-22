import { EstimateFormData, EstimateResult } from '../types/estimate';
import { formatCurrency } from '../utils/calculate';

interface Props {
  form: EstimateFormData;
  result: EstimateResult;
}

export default function EstimatePreview({ form, result }: Props) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-sm">
      {/* ── 헤더 ── */}
      <div className="bg-[#2E75B6] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl tracking-wide">견 적 서</h2>
          <p className="text-blue-200 text-xs mt-0.5">ESTIMATE / QUOTATION</p>
        </div>
        <div className="text-right text-white">
          <div className="font-bold text-lg">컨빌디자인</div>
          <div className="text-blue-200 text-xs">www.convil.net</div>
          <div className="text-blue-200 text-xs">대표자 박진하 (인)</div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">

        {/* ── 기본 정보 행 ── */}
        <div className="flex justify-between items-start pb-3 border-b border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">견적일자</span>
              <span className="text-sm font-medium">{form.estimateDate || today}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">고객명</span>
              <span className="text-sm font-medium">{form.customerName || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20">프로젝트명</span>
              <span className="text-sm font-medium">{form.projectName || '—'}</span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-gray-400">평수 / 구간</div>
            <div className="text-sm font-medium">{form.pyeongsu}평 ({result.pyeongRange})</div>
            <div className="text-xs text-gray-400">
              {form.serviceType === 'single' ? '단건 의뢰' : '패키지'} ·{' '}
              {form.meetingType === 'remote' ? '비대면' : '출장'}
            </div>
          </div>
        </div>

        {/* ── 항목 테이블 ── */}
        <div>
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-white bg-[#2E75B6] rounded-t-lg px-3 py-2">
            <div className="col-span-3">Scope</div>
            <div className="col-span-5">Item</div>
            <div className="col-span-1 text-center">QTY</div>
            <div className="col-span-2 text-right">Unit Cost</div>
            <div className="col-span-1 text-right">Cost</div>
          </div>

          {/* 항목 행 */}
          {result.itemDetails.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-6 border border-t-0 border-gray-200 rounded-b-lg">
              항목을 선택하면 여기에 표시됩니다
            </div>
          ) : (
            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
              {result.itemDetails.map((item, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-12 gap-1 px-3 py-2 text-xs ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="col-span-3 text-gray-500">{item.scope}</div>
                  <div className="col-span-5 text-gray-800 font-medium leading-snug">{item.item}</div>
                  <div className="col-span-1 text-center text-gray-600">{item.quantity}</div>
                  <div className="col-span-2 text-right text-gray-600">
                    {formatCurrency(item.unitCost)}
                  </div>
                  <div className="col-span-1 text-right font-medium text-gray-800">
                    {formatCurrency(item.cost)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 합계 섹션 ── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100">
            <SummaryRow label="Subtotal" value={result.subtotal} />
            {result.discount > 0 && (
              <SummaryRow label="Discount" value={-result.discount} isNegative />
            )}
            <SummaryRow label="Total" value={result.total} />
            <SummaryRow label="VAT (10%)" value={result.vat} />
          </div>
          {/* 최종 합계 */}
          <div className="bg-[#2E75B6] px-4 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">최종 합계금액</span>
            <span className="text-white font-bold text-lg">
              ₩ {formatCurrency(result.finalAmount)}
            </span>
          </div>
        </div>

        {/* ── 안내 문구 ── */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
          <p className="text-xs text-gray-600">
            ※ 본 견적서는 발행일로부터 30일간 유효합니다.
          </p>
          <p className="text-xs text-gray-600">
            ※ 계약금 입금 후 작업이 시작되며, 작업 완료 후 잔금을 납부하여 주시기 바랍니다.
          </p>
        </div>

        {/* ── 연락처 ── */}
        <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span>컨빌디자인 | 대표 박진하</span>
          <span>www.convil.net</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  isNegative = false,
}: {
  label: string;
  value: number;
  isNegative?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span
        className={`text-sm font-semibold ${
          isNegative ? 'text-red-600' : 'text-gray-800'
        }`}
      >
        {isNegative ? '- ' : ''}₩ {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
