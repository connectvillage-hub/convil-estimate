from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.customer import Customer, Contact
from models.contract import Contract, Payment

# 담당자 자동완성용 (별도 router 만들기는 과해서 dashboard 모듈 안에 추가)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# ── 응답 스키마 ──

class ActivityItem(BaseModel):
    type: str  # "customer_created" | "contract_created" | "payment_received" | "contact_logged"
    at: str
    customerId: Optional[int] = None
    customerName: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None


class MonthlyRevenue(BaseModel):
    month: str  # YYYY-MM
    amount: float


class OutstandingItem(BaseModel):
    contractId: int
    customerId: int
    customerName: str
    contractTitle: str
    contractAmount: float
    paidAmount: float
    remainingAmount: float
    contractDate: str


class DashboardSummary(BaseModel):
    thisMonthRevenue: float
    lastMonthRevenue: float
    totalOutstanding: float
    totalRevenue: float
    activeContracts: int
    completedContracts: int
    totalCustomers: int
    newCustomersThisMonth: int
    customersByStatus: Dict[str, int]
    customersBySource: Dict[str, int]
    contractsByState: Dict[str, int]
    monthlyRevenue: List[MonthlyRevenue]  # 최근 12개월
    outstandingTop: List[OutstandingItem]
    recentActivities: List[ActivityItem]


class PaymentRow(BaseModel):
    paymentId: int
    contractId: int
    customerId: int
    customerName: str
    contractTitle: str
    amount: float
    paidAt: str
    method: str
    memo: str
    handler: str = ""


# ── 헬퍼 ──

def _month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def _last_n_month_keys(n: int = 12) -> List[str]:
    """현재 달 포함 최근 n개월 키, 오름차순"""
    today = datetime.now(timezone.utc)
    keys: List[str] = []
    y, m = today.year, today.month
    for _ in range(n):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(keys))


def _start_of_month(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _start_of_prev_month(dt: datetime) -> datetime:
    first = _start_of_month(dt)
    if first.month == 1:
        return first.replace(year=first.year - 1, month=12)
    return first.replace(month=first.month - 1)


# ── 엔드포인트 ──

@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    this_month_start = _start_of_month(now)
    last_month_start = _start_of_prev_month(now)

    # 이번/지난달/전체 매출
    this_month_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.paid_at >= this_month_start)
        .scalar()
        or 0
    )
    last_month_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.paid_at >= last_month_start, Payment.paid_at < this_month_start)
        .scalar()
        or 0
    )
    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    )

    # 미수금 = sum(contract.contract_amount) - sum(payment.amount), 계약별 음수 0 처리
    contracts = db.query(Contract).all()
    paid_per_contract = dict(
        db.query(Payment.contract_id, func.coalesce(func.sum(Payment.amount), 0))
        .group_by(Payment.contract_id)
        .all()
    )
    total_outstanding = 0.0
    active_contracts = 0
    completed_contracts = 0
    contracts_by_state: Dict[str, int] = {}
    for c in contracts:
        contracts_by_state[c.state] = contracts_by_state.get(c.state, 0) + 1
        if c.state == "active":
            active_contracts += 1
            paid = paid_per_contract.get(c.id, 0) or 0
            remain = max(0, (c.contract_amount or 0) - paid)
            total_outstanding += remain
        elif c.state == "completed":
            completed_contracts += 1

    # 고객 통계
    customers = db.query(Customer).all()
    total_customers = len(customers)
    new_customers_this_month = sum(
        1 for c in customers if c.created_at and c.created_at >= this_month_start
    )
    customers_by_status: Dict[str, int] = {}
    customers_by_source: Dict[str, int] = {}
    for c in customers:
        customers_by_status[c.contract_status] = customers_by_status.get(c.contract_status, 0) + 1
        customers_by_source[c.inquiry_source] = customers_by_source.get(c.inquiry_source, 0) + 1

    # 월별 매출 (최근 12개월)
    monthly_keys = _last_n_month_keys(12)
    monthly_amounts: Dict[str, float] = {k: 0.0 for k in monthly_keys}
    twelve_months_ago = datetime.strptime(monthly_keys[0] + "-01", "%Y-%m-%d").replace(tzinfo=timezone.utc)
    payments_recent = (
        db.query(Payment).filter(Payment.paid_at >= twelve_months_ago).all()
    )
    for p in payments_recent:
        if p.paid_at:
            key = _month_key(p.paid_at)
            if key in monthly_amounts:
                monthly_amounts[key] += p.amount or 0
    monthly_revenue = [MonthlyRevenue(month=k, amount=monthly_amounts[k]) for k in monthly_keys]

    # 미수금 TOP (활성 계약만, 미수금 큰 순)
    customer_name_by_id = {c.id: c.name for c in customers}
    outstanding_items: List[OutstandingItem] = []
    for c in contracts:
        if c.state != "active":
            continue
        paid = paid_per_contract.get(c.id, 0) or 0
        remain = (c.contract_amount or 0) - paid
        if remain <= 0:
            continue
        outstanding_items.append(
            OutstandingItem(
                contractId=c.id,
                customerId=c.customer_id,
                customerName=customer_name_by_id.get(c.customer_id, ""),
                contractTitle=c.title or "",
                contractAmount=c.contract_amount or 0,
                paidAmount=paid,
                remainingAmount=remain,
                contractDate=c.contract_date or "",
            )
        )
    outstanding_items.sort(key=lambda x: x.remainingAmount, reverse=True)
    outstanding_top = outstanding_items[:10]

    # 최근 활동 (최근 30개)
    activities: List[ActivityItem] = []

    # 최근 고객 등록
    recent_customers = (
        db.query(Customer).order_by(Customer.created_at.desc()).limit(20).all()
    )
    for c in recent_customers:
        if c.created_at:
            activities.append(
                ActivityItem(
                    type="customer_created",
                    at=c.created_at.isoformat(),
                    customerId=c.id,
                    customerName=c.name,
                )
            )

    # 최근 컨택
    recent_contacts = (
        db.query(Contact).order_by(Contact.contacted_at.desc()).limit(20).all()
    )
    for ct in recent_contacts:
        if ct.contacted_at:
            activities.append(
                ActivityItem(
                    type="contact_logged",
                    at=ct.contacted_at.isoformat(),
                    customerId=ct.customer_id,
                    customerName=customer_name_by_id.get(ct.customer_id, ""),
                    description=f"{ct.sequence}차 컨택",
                )
            )

    # 최근 계약
    recent_contracts = (
        db.query(Contract).order_by(Contract.created_at.desc()).limit(20).all()
    )
    for c in recent_contracts:
        if c.created_at:
            activities.append(
                ActivityItem(
                    type="contract_created",
                    at=c.created_at.isoformat(),
                    customerId=c.customer_id,
                    customerName=customer_name_by_id.get(c.customer_id, ""),
                    amount=c.contract_amount,
                    description=c.title or "",
                )
            )

    # 최근 입금
    recent_payments = (
        db.query(Payment).order_by(Payment.paid_at.desc()).limit(20).all()
    )
    contract_to_customer = {c.id: c.customer_id for c in contracts}
    for p in recent_payments:
        if p.paid_at:
            cust_id = contract_to_customer.get(p.contract_id)
            activities.append(
                ActivityItem(
                    type="payment_received",
                    at=p.paid_at.isoformat(),
                    customerId=cust_id,
                    customerName=customer_name_by_id.get(cust_id or 0, ""),
                    amount=p.amount,
                    description=p.method,
                )
            )

    activities.sort(key=lambda a: a.at, reverse=True)
    activities = activities[:30]

    return DashboardSummary(
        thisMonthRevenue=this_month_revenue,
        lastMonthRevenue=last_month_revenue,
        totalRevenue=total_revenue,
        totalOutstanding=total_outstanding,
        activeContracts=active_contracts,
        completedContracts=completed_contracts,
        totalCustomers=total_customers,
        newCustomersThisMonth=new_customers_this_month,
        customersByStatus=customers_by_status,
        customersBySource=customers_by_source,
        contractsByState=contracts_by_state,
        monthlyRevenue=monthly_revenue,
        outstandingTop=outstanding_top,
        recentActivities=activities,
    )


@router.get("/payments", response_model=List[PaymentRow])
async def list_all_payments(
    db: Session = Depends(get_db),
    fromMonth: Optional[str] = Query(None, description="YYYY-MM 이상"),
    toMonth: Optional[str] = Query(None, description="YYYY-MM 이하"),
    method: Optional[str] = Query(None),
):
    q = db.query(Payment, Contract, Customer).join(
        Contract, Payment.contract_id == Contract.id
    ).join(
        Customer, Contract.customer_id == Customer.id
    )

    if fromMonth:
        try:
            start = datetime.strptime(fromMonth + "-01", "%Y-%m-%d").replace(tzinfo=timezone.utc)
            q = q.filter(Payment.paid_at >= start)
        except ValueError:
            pass
    if toMonth:
        try:
            year, mo = map(int, toMonth.split("-"))
            if mo == 12:
                end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(year, mo + 1, 1, tzinfo=timezone.utc)
            q = q.filter(Payment.paid_at < end)
        except (ValueError, AttributeError):
            pass
    if method:
        q = q.filter(Payment.method == method)

    rows = q.order_by(Payment.paid_at.desc()).all()
    return [
        PaymentRow(
            paymentId=p.id,
            contractId=c.id,
            customerId=cust.id,
            customerName=cust.name,
            contractTitle=c.title or "",
            amount=p.amount or 0,
            paidAt=p.paid_at.isoformat() if p.paid_at else "",
            method=p.method,
            memo=p.memo or "",
            handler=p.handler or "",
        )
        for p, c, cust in rows
    ]


@router.get("/outstanding", response_model=List[OutstandingItem])
async def list_outstanding(db: Session = Depends(get_db)):
    """미수금 있는 활성 계약 전체 (큰 순)"""
    contracts = db.query(Contract).filter(Contract.state == "active").all()
    paid_per_contract = dict(
        db.query(Payment.contract_id, func.coalesce(func.sum(Payment.amount), 0))
        .group_by(Payment.contract_id)
        .all()
    )
    customer_name_by_id = dict(
        db.query(Customer.id, Customer.name).all()
    )
    items: List[OutstandingItem] = []
    for c in contracts:
        paid = paid_per_contract.get(c.id, 0) or 0
        remain = (c.contract_amount or 0) - paid
        if remain <= 0:
            continue
        items.append(
            OutstandingItem(
                contractId=c.id,
                customerId=c.customer_id,
                customerName=customer_name_by_id.get(c.customer_id, ""),
                contractTitle=c.title or "",
                contractAmount=c.contract_amount or 0,
                paidAmount=paid,
                remainingAmount=remain,
                contractDate=c.contract_date or "",
            )
        )
    items.sort(key=lambda x: x.remainingAmount, reverse=True)
    return items
