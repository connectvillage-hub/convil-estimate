import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  EstimateFormData,
  AdditionalItem,
  Region,
  ServiceType,
  MeetingType,
} from '../types/estimate';
import { getPyeongRange, formatCurrency } from '../utils/calculate';
import estimatesApi from '../api/estimates';
import customersApi from '../api/customers';
import type { CustomerListItem } from '../types/customer';

interface Props {
  form: EstimateFormData;
  onChange: (form: EstimateFormData) => void;
  subtotal: number;
  savedId: number | null;
  onSaved: (id: number) => void;
}

let itemIdCounter = 1;
function newId() {
  return `item-${itemIdCounter++}`;
}

export default function EstimateForm({ form, onChange, subtotal, savedId, onSaved }: Props) {
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);
  const [saving, setSaving] = useState(false);
  const [customerList, setCustomerList] = useState<CustomerListItem[]>([]);

  useEffect(() => {
    customersApi.list().then(setCustomerList).catch(() => setCustomerList([]));
  }, []);

  const handleCustomerSelect = (idStr: string) => {
    if (idStr === '') {
      onChange({ ...form, customerId: null });
      return;
    }
    const id = Number(idStr);
    const c = customerList.find((x) => x.id === id);
    if (c) {
      onChange({
        ...form,
        customerId: c.id,
        customerName: c.name,
      });
    }
  };

  // 할인 % (소수 1자리). subtotal 이 0 이면 0 으로 표시.
  const discountPercent =
    subtotal > 0 ? Math.round(((form.discount || 0) / subtotal) * 1000) / 10 : 0;

  const handleDiscountAmountChange = (amount: number) => {
    const safe = Math.max(0, Math.min(amount, subtotal || amount));
    onChange({ ...form, discount: safe });
  };

  const handleDiscountPercentChange = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, isFinite(pct) ? pct : 0));
    const amount = Math.round((subtotal * clamped) / 100);
    onChange({ ...form, discount: amount });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (savedId !== null) {
        const updated = await estimatesApi.update(savedId, form);
        onSaved(updated.id);
        alert('견적이 업데이트되었습니다.');
      } else {
        const created = await estimatesApi.create(form);
        onSaved(created.id);
        alert(`견적이 저장되었습니다. (#${created.id})`);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('견적 저장 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<EstimateFormData>) => {
    onChange({ ...form, ...patch });
  };

  const updateSingleItems = (key: keyof typeof form.singleItems, value: boolean) => {
    onChange({ ...form, singleItems: { ...form.singleItems, [key]: value } });
  };

  const addItem = () => {
    onChange({
      ...form,
      additionalItems: [
        ...form.additionalItems,
        { id: newId(), name: '', quantity: 1, unitPrice: 0 },
      ],
    });
  };

  const updateItem = (id: string, patch: Partial<AdditionalItem>) => {
    onChange({
      ...form,
      additionalItems: form.additionalItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    onChange({
      ...form,
      additionalItems: form.additionalItems.filter((item) => item.id !== id),
    });
  };

  const handleDownload = async (type: 'excel' | 'pdf') => {
    setDownloading(type);
    try {
      const apiBase = window.location.hostname === 'localhost' ? '' : 'https://convil-estimate.onrender.com';
      const endpoint = apiBase + (type === 'excel' ? '/api/estimate/generate-excel' : '/api/estimate/generate-pdf');
      const mimeType =
        type === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf';
      const ext = type === 'excel' ? 'xlsx' : 'pdf';

      const response = await axios.post(endpoint, form, {
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' },
      });

      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const docLabel = form.clientType === 'contractor' ? '시공사견적서' : '견적서';
      const fallbackName = form.clientType === 'contractor' ? '시공사' : '고객';
      a.download = `컨빌디자인_${docLabel}_${form.customerName || fallbackName}_${form.estimateDate}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('파일 생성 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    } finally {
      setDownloading(null);
    }
  };

  const pyeongRange = getPyeongRange(form.pyeongsu);

  return (
    <div className="space-y-4">

      {/* ── 기본 정보 ── */}
      <div className="section-card">
        <h3 className="section-title">기본 정보</h3>
        <div className="grid grid-cols-1 gap-3 mb-3">
          <div>
            <label className="form-label">고객 연결 (선택)</label>
            <select
              className="form-select"
              value={form.customerId ?? ''}
              onChange={(e) => handleCustomerSelect(e.target.value)}
            >
              <option value="">— 연결 안 함 (직접 입력) —</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.companyName ? ` · ${c.companyName}` : ''}{c.phone ? ` (${c.phone})` : ''}
                </option>
              ))}
            </select>
            {form.customerId && (
              <p className="mt-1 text-[11px] text-primary-600">
                ✓ 이 견적은 고객 #{form.customerId} 에 연결됩니다.
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">{form.clientType === 'contractor' ? '시공사명' : '고객명'}</label>
            <input
              type="text"
              className="form-input"
              placeholder={form.clientType === 'contractor' ? '○○건설' : '홍길동'}
              value={form.customerName}
              onChange={(e) => update({ customerName: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">견적 날짜</label>
            <input
              type="date"
              className="form-input"
              value={form.estimateDate}
              onChange={(e) => update({ estimateDate: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="form-label">프로젝트명</label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 서울 마포구 아파트 인테리어"
              value={form.projectName}
              onChange={(e) => update({ projectName: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ── 프로젝트 정보 ── */}
      <div className="section-card">
        <h3 className="section-title">프로젝트 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">평수</label>
            <div className="relative">
              <input
                type="number"
                className="form-input pr-10"
                min={1}
                max={200}
                value={form.pyeongsu}
                onChange={(e) => update({ pyeongsu: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">평</span>
            </div>
            <div className="mt-1 text-xs text-primary-600 font-medium">
              구간: {pyeongRange}
            </div>
          </div>
          <div>
            <label className="form-label">지역</label>
            <select
              className="form-select"
              value={form.region}
              onChange={(e) => update({ region: e.target.value as Region })}
            >
              <option value="main">서울/인천/대전/경남</option>
              <option value="other">그 외 지역</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 서비스 유형 ── */}
      <div className="section-card">
        <h3 className="section-title">서비스 유형</h3>
        <div className="flex gap-6 mb-3">
          {[
            { value: 'single', label: '단건 의뢰' },
            { value: 'package', label: '패키지' },
          ].map((opt) => (
            <label key={opt.value} className="radio-option">
              <input
                type="radio"
                name="serviceType"
                value={opt.value}
                checked={form.serviceType === opt.value}
                onChange={() => update({ serviceType: opt.value as ServiceType })}
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>

        {form.serviceType === 'single' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-700 font-medium mb-2">도면 선택 (복수 선택 가능)</p>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'floorPlan', label: '평면도' },
                { key: 'ceilingPlan', label: '천장도' },
                { key: 'design3d', label: '3D 시안' },
              ].map((opt) => (
                <label key={opt.key} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={form.singleItems[opt.key as keyof typeof form.singleItems]}
                    onChange={(e) =>
                      updateSingleItems(opt.key as keyof typeof form.singleItems, e.target.checked)
                    }
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            {form.pyeongsu >= 60 && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                ⚠ 60평 이상 단건 단가는 등록되어 있지 않아 견적서에 <b>'데이터 없음'</b> 으로 표시됩니다.
              </p>
            )}
          </div>
        )}

        {form.serviceType === 'package' && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <p className="text-xs text-green-700 font-medium">
              ✓ 패키지: 평면도 + 천장도 + 3D 시안 + 마감재리스트 (10% 할인 적용)
            </p>
          </div>
        )}
      </div>

      {/* ── 방문 방법 ── */}
      <div className="section-card">
        <h3 className="section-title">방문 방법</h3>
        <div className="flex gap-6">
          {[
            { value: 'remote', label: '비대면', desc: '추가 비용 없음' },
            { value: 'visit', label: '출장 포함', desc: form.region === 'main' ? '+250,000원' : '+340,000원' },
          ].map((opt) => (
            <label key={opt.value} className="radio-option">
              <input
                type="radio"
                name="meetingType"
                value={opt.value}
                checked={form.meetingType === opt.value}
                onChange={() => update({ meetingType: opt.value as MeetingType })}
              />
              <div>
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="ml-2 text-xs text-gray-400">{opt.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── 옵션 ── */}
      <div className="section-card">
        <h3 className="section-title">추가 옵션</h3>
        <label className="checkbox-option">
          <input
            type="checkbox"
            checked={form.brandingPlus}
            onChange={(e) => update({ brandingPlus: e.target.checked })}
          />
          <div>
            <span className="text-sm font-medium">브랜딩 플러스</span>
            <span className="ml-2 text-xs text-primary-600 font-semibold">+2,000,000원</span>
          </div>
        </label>
      </div>

      {/* ── 추가 항목 ── */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0 pb-0 border-0">추가 항목</h3>
          <button
            type="button"
            onClick={addItem}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            행 추가
          </button>
        </div>

        {form.additionalItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            추가 항목이 없습니다. '행 추가'를 눌러 추가하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-5">항목명</div>
              <div className="col-span-2 text-center">수량</div>
              <div className="col-span-4">단가 (원)</div>
              <div className="col-span-1"></div>
            </div>
            {form.additionalItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="항목명"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="form-input text-xs text-center"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    className="form-input text-xs"
                    min={0}
                    step={1000}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="btn-danger"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {/* 소계 표시 */}
                {item.name && item.unitPrice > 0 && (
                  <div className="col-span-11 text-right text-xs text-gray-400">
                    소계: ₩{formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 할인 ── */}
      <div className="section-card">
        <h3 className="section-title">할인</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">할인율 (%)</label>
            <div className="relative">
              <input
                type="number"
                className="form-input pr-8"
                min={0}
                max={100}
                step={1}
                placeholder="0"
                value={discountPercent || ''}
                onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                disabled={subtotal <= 0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="form-label">할인 금액</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
              <input
                type="number"
                className="form-input pl-7"
                min={0}
                step={10000}
                placeholder="0"
                value={form.discount || ''}
                onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        {subtotal > 0 && form.discount > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            합계 ₩{formatCurrency(subtotal)} 중 ₩{formatCurrency(form.discount)} ({discountPercent}%) 할인
          </p>
        )}
      </div>

      {/* ── 저장 / 다운로드 버튼 ── */}
      <div className="section-card bg-gray-50">
        <h3 className="section-title">견적서 저장 및 출력</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full justify-center mb-3"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              저장 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              {savedId !== null ? '견적 업데이트' : '견적 저장'}
            </>
          )}
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleDownload('excel')}
            disabled={downloading !== null}
            className="btn-primary flex-1 justify-center"
          >
            {downloading === 'excel' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel 다운로드
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleDownload('pdf')}
            disabled={downloading !== null}
            className="btn-secondary flex-1 justify-center"
          >
            {downloading === 'pdf' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF 다운로드
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
