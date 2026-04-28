from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Contact ──

class ContactInput(BaseModel):
    sequence: Optional[int] = None  # None 이면 자동으로 다음 차수
    contactedAt: Optional[datetime] = None  # None 이면 현재 시간
    content: str = ""
    handler: str = ""  # 컨택 담당자


class ContactResponse(BaseModel):
    id: int
    sequence: int
    contactedAt: str
    content: str
    handler: str = ""


# ── Customer ──

class CustomerInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    companyName: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    manager: str = ""
    memo: str = ""
    inquirySource: str = "other"
    contractStatus: str = "pre_consultation"


class CustomerListItem(BaseModel):
    id: int
    name: str
    companyName: str
    phone: str
    email: str
    memo: str
    inquirySource: str
    contractStatus: str
    contactCount: int
    # 재무 집계
    contractCount: int = 0
    contractTotal: float = 0
    paidTotal: float = 0
    outstandingTotal: float = 0
    taxInvoicePending: int = 0  # 미발행 세금계산서 수
    createdAt: str
    updatedAt: str


class CustomerDetail(BaseModel):
    id: int
    name: str
    companyName: str
    phone: str
    email: str
    address: str
    manager: str
    memo: str
    inquirySource: str
    contractStatus: str
    createdAt: str
    updatedAt: str
    contacts: List[ContactResponse] = []
