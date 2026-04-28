import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models.customer import (
    Customer,
    Contact,
    INQUIRY_SOURCES,
    CONTRACT_STATUSES,
)
from models.customer_schemas import (
    ContactInput,
    ContactResponse,
    CustomerInput,
    CustomerListItem,
    CustomerDetail,
)

router = APIRouter(prefix="/api/customers", tags=["customers"])


# ── 변환 헬퍼 ──

def _contact_to_response(c: Contact) -> ContactResponse:
    return ContactResponse(
        id=c.id,
        sequence=c.sequence,
        contactedAt=c.contacted_at.isoformat() if c.contacted_at else "",
        content=c.content or "",
    )


def _customer_to_detail(c: Customer) -> CustomerDetail:
    return CustomerDetail(
        id=c.id,
        name=c.name,
        companyName=c.company_name or "",
        phone=c.phone or "",
        email=c.email or "",
        address=c.address or "",
        manager=c.manager or "",
        memo=c.memo or "",
        inquirySource=c.inquiry_source or "other",
        contractStatus=c.contract_status or "pre_consultation",
        createdAt=c.created_at.isoformat() if c.created_at else "",
        updatedAt=c.updated_at.isoformat() if c.updated_at else "",
        contacts=[_contact_to_response(ct) for ct in (c.contacts or [])],
    )


def _customer_to_list_item(c: Customer, contact_count: int) -> CustomerListItem:
    return CustomerListItem(
        id=c.id,
        name=c.name,
        companyName=c.company_name or "",
        phone=c.phone or "",
        email=c.email or "",
        inquirySource=c.inquiry_source or "other",
        contractStatus=c.contract_status or "pre_consultation",
        contactCount=contact_count,
        createdAt=c.created_at.isoformat() if c.created_at else "",
        updatedAt=c.updated_at.isoformat() if c.updated_at else "",
    )


def _validate_enums(payload: CustomerInput) -> None:
    if payload.inquirySource not in INQUIRY_SOURCES:
        raise HTTPException(status_code=400, detail=f"잘못된 문의 경로: {payload.inquirySource}")
    if payload.contractStatus not in CONTRACT_STATUSES:
        raise HTTPException(status_code=400, detail=f"잘못된 계약 상태: {payload.contractStatus}")


# ── Customer CRUD ──

@router.post("", response_model=CustomerDetail)
async def create_customer(payload: CustomerInput, db: Session = Depends(get_db)):
    _validate_enums(payload)
    row = Customer(
        name=payload.name,
        company_name=payload.companyName,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        manager=payload.manager,
        memo=payload.memo,
        inquiry_source=payload.inquirySource,
        contract_status=payload.contractStatus,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _customer_to_detail(row)


@router.get("", response_model=List[CustomerListItem])
async def list_customers(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="이름/회사/연락처/이메일 검색"),
    contractStatus: Optional[str] = Query(None),
    inquirySource: Optional[str] = Query(None),
):
    q = db.query(Customer)
    if contractStatus:
        q = q.filter(Customer.contract_status == contractStatus)
    if inquirySource:
        q = q.filter(Customer.inquiry_source == inquirySource)
    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                Customer.name.ilike(like),
                Customer.company_name.ilike(like),
                Customer.phone.ilike(like),
                Customer.email.ilike(like),
            )
        )
    rows = q.order_by(Customer.updated_at.desc()).all()

    # 컨택 개수 일괄 조회
    counts = dict(
        db.query(Contact.customer_id, func.count(Contact.id))
        .group_by(Contact.customer_id)
        .all()
    )
    return [_customer_to_list_item(r, counts.get(r.id, 0)) for r in rows]


@router.get("/{customer_id}", response_model=CustomerDetail)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Customer)
        .options(selectinload(Customer.contacts))
        .filter(Customer.id == customer_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    return _customer_to_detail(row)


@router.put("/{customer_id}", response_model=CustomerDetail)
async def update_customer(
    customer_id: int, payload: CustomerInput, db: Session = Depends(get_db)
):
    _validate_enums(payload)
    row = db.query(Customer).filter(Customer.id == customer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    row.name = payload.name
    row.company_name = payload.companyName
    row.phone = payload.phone
    row.email = payload.email
    row.address = payload.address
    row.manager = payload.manager
    row.memo = payload.memo
    row.inquiry_source = payload.inquirySource
    row.contract_status = payload.contractStatus
    db.commit()
    db.refresh(row)
    return _customer_to_detail(row)


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    row = db.query(Customer).filter(Customer.id == customer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ── Contact (컨택 이력) CRUD ──

@router.post("/{customer_id}/contacts", response_model=CustomerDetail)
async def add_contact(
    customer_id: int, payload: ContactInput, db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")

    # 자동 차수 계산
    if payload.sequence is None:
        max_seq = (
            db.query(func.max(Contact.sequence))
            .filter(Contact.customer_id == customer_id)
            .scalar()
            or 0
        )
        sequence = max_seq + 1
    else:
        sequence = payload.sequence

    contact = Contact(
        customer_id=customer_id,
        sequence=sequence,
        contacted_at=payload.contactedAt or datetime.utcnow(),
        content=payload.content,
    )
    db.add(contact)
    db.commit()
    db.refresh(customer)
    return _customer_to_detail(customer)


@router.put("/{customer_id}/contacts/{contact_id}", response_model=CustomerDetail)
async def update_contact(
    customer_id: int,
    contact_id: int,
    payload: ContactInput,
    db: Session = Depends(get_db),
):
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.customer_id == customer_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="컨택 기록을 찾을 수 없습니다")
    if payload.sequence is not None:
        contact.sequence = payload.sequence
    if payload.contactedAt is not None:
        contact.contacted_at = payload.contactedAt
    contact.content = payload.content
    db.commit()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    return _customer_to_detail(customer)


@router.delete("/{customer_id}/contacts/{contact_id}", response_model=CustomerDetail)
async def delete_contact(
    customer_id: int, contact_id: int, db: Session = Depends(get_db)
):
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.customer_id == customer_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="컨택 기록을 찾을 수 없습니다")
    db.delete(contact)
    db.commit()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    return _customer_to_detail(customer)


# ── 외부 폼(구글 폼 등) 자동 등록 Webhook ──

class IntakePayload(BaseModel):
    """구글 폼 / 외부 시스템에서 보내는 고객 등록 페이로드."""
    name: str = Field(min_length=1, max_length=200)
    companyName: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    manager: str = ""
    inquirySource: str = "other"
    memo: str = ""              # 1차 컨택 내용으로 자동 기록
    rawData: Optional[Dict[str, Any]] = None  # 원본 폼 응답 (참고용)


@router.post("/intake", response_model=CustomerDetail)
async def intake_from_webhook(
    payload: IntakePayload,
    request: Request,
    db: Session = Depends(get_db),
):
    """공개 웹훅 — 구글 폼 등에서 호출해서 고객 자동 등록.
    환경변수 WEBHOOK_TOKEN 이 설정된 경우 X-Webhook-Token 헤더 일치해야 함."""
    expected = os.getenv("WEBHOOK_TOKEN")
    if expected:
        provided = request.headers.get("X-Webhook-Token") or request.headers.get("x-webhook-token") or ""
        if provided != expected:
            raise HTTPException(status_code=401, detail="Invalid webhook token")

    src = payload.inquirySource if payload.inquirySource in INQUIRY_SOURCES else "other"

    customer = Customer(
        name=payload.name,
        company_name=payload.companyName,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        manager=payload.manager,
        memo="",
        inquiry_source=src,
        contract_status="pre_consultation",
    )
    db.add(customer)
    db.flush()

    # 1차 컨택 자동 기록 (정리된 memo 만 사용 — rawData 는 디버깅용으로만 받고 저장 안 함)
    if payload.memo:
        contact = Contact(
            customer_id=customer.id,
            sequence=1,
            contacted_at=datetime.utcnow(),
            content=f"📨 폼 문의:\n{payload.memo}",
        )
        db.add(contact)

    db.commit()
    db.refresh(customer)
    return _customer_to_detail(customer)
