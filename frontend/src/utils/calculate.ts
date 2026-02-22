import { EstimateFormData, EstimateResult, ItemDetail } from '../types/estimate';

// 평수 구간 판별
export function getPyeongRange(pyeong: number): string {
  if (pyeong < 10) return '10평 미만';
  if (pyeong < 20) return '10평대';
  if (pyeong < 30) return '20평대';
  if (pyeong < 40) return '30평대';
  if (pyeong < 50) return '40평대';
  if (pyeong < 60) return '50평대';
  if (pyeong < 70) return '60평대';
  if (pyeong < 80) return '70평대';
  if (pyeong < 90) return '80평대';
  if (pyeong < 100) return '90평대';
  return `${Math.floor(pyeong / 10) * 10}평대`;
}

// 단건 의뢰 단가표 (50평대까지)
const SINGLE_PRICES: Record<string, { floorPlan: number; ceilingPlan: number; design3d: number }> = {
  '10평 미만': { floorPlan: 99000, ceilingPlan: 178000, design3d: 450000 },
  '10평대':    { floorPlan: 149000, ceilingPlan: 268000, design3d: 550000 },
  '20평대':    { floorPlan: 169000, ceilingPlan: 320000, design3d: 850000 },
  '30평대':    { floorPlan: 189000, ceilingPlan: 366000, design3d: 1150000 },
  '40평대':    { floorPlan: 289000, ceilingPlan: 388000, design3d: 1550000 },
  '50평대':    { floorPlan: 359000, ceilingPlan: 456000, design3d: 2050000 },
};

// 기본 패키지 가격표
const PACKAGE_BASE_PRICES: Record<string, number> = {
  '10평 미만': 743400,
  '10평대':    1004400,
  '20평대':    1357200,
  '30평대':    1704600,
  '40평대':    2264400,
  '50평대':    2901600,
};

const BASE_50 = 2901600;
const BASE_90 = BASE_50 + 4 * 650000; // 5,501,600

export function getPackagePrice(pyeong: number): number {
  if (pyeong < 10) return PACKAGE_BASE_PRICES['10평 미만'];
  if (pyeong < 20) return PACKAGE_BASE_PRICES['10평대'];
  if (pyeong < 30) return PACKAGE_BASE_PRICES['20평대'];
  if (pyeong < 40) return PACKAGE_BASE_PRICES['30평대'];
  if (pyeong < 50) return PACKAGE_BASE_PRICES['40평대'];
  if (pyeong < 60) return PACKAGE_BASE_PRICES['50평대'];
  if (pyeong < 100) {
    // 60~90평: 50평대 기준가 + 10평당 650,000 가산
    const decades = Math.floor(pyeong / 10) - 5; // 60대→1, 70대→2, 80대→3, 90대→4
    return BASE_50 + decades * 650000;
  }
  // 100~200평: 90평대 기준가 + 10평당 800,000 가산
  const decades = Math.floor(pyeong / 10) - 9; // 100대→1, 110대→2, ...
  return BASE_90 + decades * 800000;
}

function getSinglePrices(pyeong: number) {
  const range = getPyeongRange(pyeong);
  // 60평 이상은 50평대 단가 적용 (단건 단가표 미제공)
  return SINGLE_PRICES[range] ?? SINGLE_PRICES['50평대'];
}

export function calculateEstimate(form: EstimateFormData): EstimateResult {
  const items: ItemDetail[] = [];
  const pyeongRange = getPyeongRange(form.pyeongsu);

  // 1. 서비스 금액 계산
  if (form.serviceType === 'single') {
    const prices = getSinglePrices(form.pyeongsu);

    if (form.singleItems.floorPlan) {
      items.push({
        scope: '단건 의뢰',
        item: `평면도 (${pyeongRange})`,
        quantity: 1,
        unitCost: prices.floorPlan,
        cost: prices.floorPlan,
      });
    }
    if (form.singleItems.ceilingPlan) {
      items.push({
        scope: '단건 의뢰',
        item: `천장도 (${pyeongRange})`,
        quantity: 1,
        unitCost: prices.ceilingPlan,
        cost: prices.ceilingPlan,
      });
    }
    if (form.singleItems.design3d) {
      items.push({
        scope: '단건 의뢰',
        item: `3D 시안 (${pyeongRange})`,
        quantity: 1,
        unitCost: prices.design3d,
        cost: prices.design3d,
      });
    }
  } else {
    // 패키지
    const price = getPackagePrice(form.pyeongsu);
    items.push({
      scope: '패키지',
      item: `평면도 + 천장도 + 3D 시안 + 마감재리스트 (${pyeongRange})`,
      quantity: 1,
      unitCost: price,
      cost: price,
    });
  }

  // 2. 출장/실측비
  if (form.meetingType === 'visit') {
    const visitFee = form.region === 'main' ? 250000 : 340000;
    const regionLabel = form.region === 'main' ? '서울/인천/대전/경남' : '그 외 지역';
    items.push({
      scope: '출장/실측',
      item: `출장비 (${regionLabel})`,
      quantity: 1,
      unitCost: visitFee,
      cost: visitFee,
    });
  }

  // 3. 브랜딩 플러스
  if (form.brandingPlus) {
    items.push({
      scope: '브랜딩 플러스',
      item: '브랜딩 패키지',
      quantity: 1,
      unitCost: 2000000,
      cost: 2000000,
    });
  }

  // 4. 추가 항목
  form.additionalItems.forEach((addItem) => {
    if (addItem.name && addItem.quantity > 0) {
      const cost = addItem.quantity * addItem.unitPrice;
      items.push({
        scope: '추가 항목',
        item: addItem.name,
        quantity: addItem.quantity,
        unitCost: addItem.unitPrice,
        cost,
      });
    }
  });

  // 5. 합계 계산
  const subtotal = items.reduce((sum, item) => sum + item.cost, 0);
  const discount = form.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const vat = Math.round(total * 0.1);
  const finalAmount = total + vat;

  return {
    itemDetails: items,
    subtotal,
    discount,
    total,
    vat,
    finalAmount,
    pyeongRange,
  };
}

// 숫자 포맷 (천 단위 콤마)
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ko-KR');
}
