from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Payment ──

class PaymentInput(BaseModel):
    amount: float = Field(ge=0)
    paidAt: Optional[datetime] = None  # None 이면 현재 시각
    method: str = "bank_transfer"
    memo: str = ""


class PaymentResponse(BaseModel):
    id: int
    amount: float
    paidAt: str
    method: str
    memo: str


# ── Contract ──

class ContractInput(BaseModel):
    title: str = ""
    contractAmount: float = Field(ge=0)
    contractDate: str = ""  # YYYY-MM-DD
    estimateId: Optional[int] = None
    state: str = "active"
    memo: str = ""


class ContractDetail(BaseModel):
    id: int
    customerId: int
    estimateId: Optional[int]
    title: str
    contractAmount: float
    contractDate: str
    state: str
    memo: str
    paidAmount: float       # 입금 합계
    remainingAmount: float  # 미수금 = 계약금액 - 입금합계
    createdAt: str
    updatedAt: str
    payments: List[PaymentResponse] = []
