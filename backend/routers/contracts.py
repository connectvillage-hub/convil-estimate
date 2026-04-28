from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models.customer import Customer
from models.contract import Contract, Payment, PAYMENT_METHODS, CONTRACT_STATES
from models.contract_schemas import (
    ContractInput,
    ContractDetail,
    PaymentInput,
    PaymentResponse,
)

router = APIRouter(tags=["contracts"])


def _payment_to_response(p: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=p.id,
        amount=p.amount or 0,
        paidAt=p.paid_at.isoformat() if p.paid_at else "",
        method=p.method or "bank_transfer",
        memo=p.memo or "",
    )


def _contract_to_detail(c: Contract) -> ContractDetail:
    payments = list(c.payments or [])
    paid = sum((p.amount or 0) for p in payments)
    return ContractDetail(
        id=c.id,
        customerId=c.customer_id,
        estimateId=c.estimate_id,
        title=c.title or "",
        contractAmount=c.contract_amount or 0,
        contractDate=c.contract_date or "",
        state=c.state or "active",
        memo=c.memo or "",
        paidAmount=paid,
        remainingAmount=max(0, (c.contract_amount or 0) - paid),
        createdAt=c.created_at.isoformat() if c.created_at else "",
        updatedAt=c.updated_at.isoformat() if c.updated_at else "",
        payments=[_payment_to_response(p) for p in payments],
    )


def _validate_state(state: str) -> None:
    if state not in CONTRACT_STATES:
        raise HTTPException(status_code=400, detail=f"잘못된 계약 상태: {state}")


def _validate_method(method: str) -> None:
    if method not in PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail=f"잘못된 결제 수단: {method}")


# ── Contract: 고객별 ──

@router.get("/api/customers/{customer_id}/contracts", response_model=List[ContractDetail])
async def list_contracts_for_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    rows = (
        db.query(Contract)
        .options(selectinload(Contract.payments))
        .filter(Contract.customer_id == customer_id)
        .order_by(Contract.contract_date.desc(), Contract.created_at.desc())
        .all()
    )
    return [_contract_to_detail(r) for r in rows]


@router.post("/api/customers/{customer_id}/contracts", response_model=ContractDetail)
async def create_contract(
    customer_id: int, payload: ContractInput, db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    _validate_state(payload.state)
    row = Contract(
        customer_id=customer_id,
        estimate_id=payload.estimateId,
        title=payload.title,
        contract_amount=payload.contractAmount,
        contract_date=payload.contractDate,
        state=payload.state,
        memo=payload.memo,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _contract_to_detail(row)


# ── Contract: 단건 ──

@router.get("/api/contracts/{contract_id}", response_model=ContractDetail)
async def get_contract(contract_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Contract)
        .options(selectinload(Contract.payments))
        .filter(Contract.id == contract_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    return _contract_to_detail(row)


@router.put("/api/contracts/{contract_id}", response_model=ContractDetail)
async def update_contract(
    contract_id: int, payload: ContractInput, db: Session = Depends(get_db)
):
    row = db.query(Contract).filter(Contract.id == contract_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    _validate_state(payload.state)
    row.estimate_id = payload.estimateId
    row.title = payload.title
    row.contract_amount = payload.contractAmount
    row.contract_date = payload.contractDate
    row.state = payload.state
    row.memo = payload.memo
    db.commit()
    db.refresh(row)
    return _contract_to_detail(row)


@router.delete("/api/contracts/{contract_id}")
async def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    row = db.query(Contract).filter(Contract.id == contract_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Payment ──

@router.post("/api/contracts/{contract_id}/payments", response_model=ContractDetail)
async def add_payment(
    contract_id: int, payload: PaymentInput, db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    _validate_method(payload.method)
    payment = Payment(
        contract_id=contract_id,
        amount=payload.amount,
        paid_at=payload.paidAt or datetime.utcnow(),
        method=payload.method,
        memo=payload.memo,
    )
    db.add(payment)
    db.commit()
    db.refresh(contract)
    return _contract_to_detail(contract)


@router.put("/api/contracts/{contract_id}/payments/{payment_id}", response_model=ContractDetail)
async def update_payment(
    contract_id: int, payment_id: int, payload: PaymentInput, db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.contract_id == contract_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="입금 내역을 찾을 수 없습니다")
    _validate_method(payload.method)
    payment.amount = payload.amount
    if payload.paidAt is not None:
        payment.paid_at = payload.paidAt
    payment.method = payload.method
    payment.memo = payload.memo
    db.commit()
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    return _contract_to_detail(contract)


@router.delete("/api/contracts/{contract_id}/payments/{payment_id}", response_model=ContractDetail)
async def delete_payment(
    contract_id: int, payment_id: int, db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.contract_id == contract_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="입금 내역을 찾을 수 없습니다")
    db.delete(payment)
    db.commit()
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    return _contract_to_detail(contract)
