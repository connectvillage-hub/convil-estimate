from models.estimate import EstimateRequest, EstimateResult, ItemDetail

# 단건 단가표
SINGLE_PRICES = {
    '10평 미만': {'floorPlan': 99000,  'ceilingPlan': 178000, 'design3d': 450000},
    '10평대':    {'floorPlan': 149000, 'ceilingPlan': 268000, 'design3d': 550000},
    '20평대':    {'floorPlan': 169000, 'ceilingPlan': 320000, 'design3d': 850000},
    '30평대':    {'floorPlan': 189000, 'ceilingPlan': 366000, 'design3d': 1150000},
    '40평대':    {'floorPlan': 289000, 'ceilingPlan': 388000, 'design3d': 1550000},
    '50평대':    {'floorPlan': 359000, 'ceilingPlan': 456000, 'design3d': 2050000},
}

# 패키지 기본 가격
PACKAGE_PRICES = {
    '10평 미만': 743400,
    '10평대':    1004400,
    '20평대':    1357200,
    '30평대':    1704600,
    '40평대':    2264400,
    '50평대':    2901600,
}

BASE_50 = 2901600
BASE_90 = BASE_50 + 4 * 650000  # 5,501,600


def get_pyeong_range(pyeong: int) -> str:
    if pyeong < 10:  return '10평 미만'
    if pyeong < 20:  return '10평대'
    if pyeong < 30:  return '20평대'
    if pyeong < 40:  return '30평대'
    if pyeong < 50:  return '40평대'
    if pyeong < 60:  return '50평대'
    if pyeong < 70:  return '60평대'
    if pyeong < 80:  return '70평대'
    if pyeong < 90:  return '80평대'
    if pyeong < 100: return '90평대'
    return f'{(pyeong // 10) * 10}평대'


def get_package_price(pyeong: int) -> float:
    if pyeong < 10:  return PACKAGE_PRICES['10평 미만']
    if pyeong < 20:  return PACKAGE_PRICES['10평대']
    if pyeong < 30:  return PACKAGE_PRICES['20평대']
    if pyeong < 40:  return PACKAGE_PRICES['30평대']
    if pyeong < 50:  return PACKAGE_PRICES['40평대']
    if pyeong < 60:  return PACKAGE_PRICES['50평대']
    if pyeong < 100:
        # 60~90평: 50평대 기준 + 10평당 650,000
        decades = (pyeong // 10) - 5  # 60대→1, 70대→2, 80대→3, 90대→4
        return BASE_50 + decades * 650000
    # 100~200평: 90평대 기준 + 10평당 800,000
    decades = (pyeong // 10) - 9  # 100대→1, 110대→2, ...
    return BASE_90 + decades * 800000


def calculate(req: EstimateRequest) -> EstimateResult:
    items = []
    pyeong_range = get_pyeong_range(req.pyeongsu)

    # 1. 서비스 금액
    if req.serviceType == 'single':
        prices = SINGLE_PRICES.get(pyeong_range, SINGLE_PRICES['50평대'])
        if req.singleItems.floorPlan:
            items.append(ItemDetail(
                scope='단건 의뢰', item=f'평면도 ({pyeong_range})',
                quantity=1, unitCost=prices['floorPlan'], cost=prices['floorPlan']
            ))
        if req.singleItems.ceilingPlan:
            items.append(ItemDetail(
                scope='단건 의뢰', item=f'천장도 ({pyeong_range})',
                quantity=1, unitCost=prices['ceilingPlan'], cost=prices['ceilingPlan']
            ))
        if req.singleItems.design3d:
            items.append(ItemDetail(
                scope='단건 의뢰', item=f'3D 시안 ({pyeong_range})',
                quantity=1, unitCost=prices['design3d'], cost=prices['design3d']
            ))
    else:
        price = get_package_price(req.pyeongsu)
        items.append(ItemDetail(
            scope='패키지',
            item=f'평면도 + 천장도 + 3D 시안 + 마감재리스트 ({pyeong_range})',
            quantity=1, unitCost=price, cost=price
        ))

    # 2. 출장비
    if req.meetingType == 'visit':
        visit_fee = 250000 if req.region == 'main' else 340000
        region_label = '서울/인천/대전/경남' if req.region == 'main' else '그 외 지역'
        items.append(ItemDetail(
            scope='출장/실측', item=f'출장비 ({region_label})',
            quantity=1, unitCost=visit_fee, cost=visit_fee
        ))

    # 3. 브랜딩 플러스
    if req.brandingPlus:
        items.append(ItemDetail(
            scope='브랜딩 플러스', item='브랜딩 패키지',
            quantity=1, unitCost=2000000, cost=2000000
        ))

    # 4. 추가 항목
    for add_item in req.additionalItems:
        if add_item.name and add_item.quantity > 0:
            cost = add_item.quantity * add_item.unitPrice
            items.append(ItemDetail(
                scope='추가 항목', item=add_item.name,
                quantity=add_item.quantity, unitCost=add_item.unitPrice, cost=cost
            ))

    # 5. 최종 계산
    subtotal = sum(i.cost for i in items)
    discount = req.discount or 0
    total = max(0, subtotal - discount)
    vat = round(total * 0.1)
    final_amount = total + vat

    return EstimateResult(
        itemDetails=items,
        subtotal=subtotal,
        discount=discount,
        total=total,
        vat=vat,
        finalAmount=final_amount,
        pyeongRange=pyeong_range,
    )
